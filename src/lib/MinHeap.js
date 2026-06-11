/**
 * @fileoverview Min-Heap (Priority Queue) implementation for OS process scheduling.
 *
 * A Min-Heap is a complete binary tree stored as an array where every parent
 * node's key is ≤ the keys of its children. This gives us O(1) access to the
 * minimum element and O(log n) insertion and extraction — perfect for a
 * priority-based scheduler that always needs the highest-priority process next.
 *
 * **Array-to-tree index mapping (0-based):**
 * ```
 *   parent(i)      = Math.floor((i - 1) / 2)
 *   leftChild(i)   = 2 * i + 1
 *   rightChild(i)  = 2 * i + 2
 * ```
 *
 * Each node stored in the heap is a wrapper object:
 * ```
 * { process: <ProcessObject>, index: <insertionOrder> }
 * ```
 *
 * The `index` field is a tie-breaker so that two processes with the same
 * priority are dequeued in FIFO (arrival) order — a common requirement in
 * real-world schedulers.
 *
 * @module MinHeap
 */

/**
 * @typedef {Object} HeapNode
 * @property {Object}  process - The process object stored in this node.
 * @property {number}  index   - Insertion-order counter used as a tie-breaker.
 */

/**
 * @typedef {Object} HeapSnapshot
 * @property {HeapNode[]}      heap           - A deep copy of the internal heap
 *                                              array at this point in time.
 * @property {[number,number]|null} swappedIndices - The two indices that were
 *                                              swapped in this step, or `null`
 *                                              if no swap occurred (initial /
 *                                              final state).
 */

/**
 * A generic Min-Heap (Priority Queue) with animation-friendly snapshots.
 *
 * The class accepts a custom comparator so it can be used for any ordering
 * strategy, but defaults to ascending numeric priority
 * (lower number → higher priority).
 */
class MinHeap {
  /**
   * Creates a new MinHeap.
   *
   * @param {function(HeapNode, HeapNode): number} [comparator] -
   *   A comparison function that returns a negative number if `a` should be
   *   closer to the root than `b`, zero if they are equal, or a positive
   *   number otherwise.  Defaults to comparing by `process.priority` first,
   *   then by `index` (insertion order) as a tie-breaker.
   *
   * @example
   * // Default — lowest priority number wins, FIFO tie-break
   * const heap = new MinHeap();
   *
   * @example
   * // Custom — shortest remaining time first
   * const heap = new MinHeap((a, b) =>
   *   a.process.remainingTime - b.process.remainingTime
   * );
   */
  constructor(comparator) {
    /** @private @type {HeapNode[]} The backing array for the complete binary tree. */
    this._heap = [];

    /** @private @type {number} Monotonically increasing counter for FIFO tie-breaking. */
    this._insertionCounter = 0;

    /**
     * @private
     * @type {function(HeapNode, HeapNode): number}
     * Comparator: negative means `a` has higher priority (closer to root).
     */
    this._compare =
      comparator ||
      ((a, b) => {
        const diff = a.process.priority - b.process.priority;
        // If priorities are equal, the node inserted first wins (FIFO).
        return diff !== 0 ? diff : a.index - b.index;
      });
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Inserts a process into the heap and restores the heap property by
   * "sifting up" the new node.
   *
   * **Algorithm – Sift-Up (a.k.a. Bubble-Up / Percolate-Up):**
   * 1. Append the new item at the end of the array (the next open leaf).
   * 2. Compare it with its parent.
   * 3. If it is smaller (higher priority), swap it with the parent.
   * 4. Repeat from step 2 until the item is at the root or its parent is
   *    smaller (lower priority value).
   *
   * **Time Complexity:** O(log n) — at most one swap per tree level.
   *
   * @param {Object} process - The process object to insert.
   * @returns {HeapSnapshot[]} An array of snapshots capturing every step of
   *   the sift-up, useful for step-by-step animation in the UI.
   */
  insert(process) {
    const node = { process, index: this._insertionCounter++ };
    this._heap.push(node);

    /** @type {HeapSnapshot[]} */
    const snapshots = [];

    // Snapshot: initial state right after appending (no swap yet).
    snapshots.push({
      heap: this._deepCopyHeap(),
      swappedIndices: null,
    });

    // Sift-up
    let i = this._heap.length - 1;

    while (i > 0) {
      const parentIdx = Math.floor((i - 1) / 2);

      // If the parent is already ≤ this node, the heap property holds.
      if (this._compare(this._heap[parentIdx], this._heap[i]) <= 0) {
        break;
      }

      // Swap child ↔ parent
      this._swap(i, parentIdx);

      // Snapshot after each swap so the UI can animate the movement.
      snapshots.push({
        heap: this._deepCopyHeap(),
        swappedIndices: [i, parentIdx],
      });

      // Move up
      i = parentIdx;
    }

    return snapshots;
  }

  /**
   * Removes and returns the minimum element (the root), then restores the
   * heap property by "sifting down".
   *
   * **Algorithm – Sift-Down (a.k.a. Bubble-Down / Percolate-Down):**
   * 1. Save the root item (the minimum).
   * 2. Move the **last** element in the array to the root position.
   * 3. Compare the new root with its children.
   * 4. Swap it with the **smaller** child if it is larger.
   * 5. Repeat from step 3 until it has no children smaller than itself.
   *
   * **Time Complexity:** O(log n).
   *
   * @returns {{ item: Object|null, snapshots: HeapSnapshot[] }}
   *   The extracted process (or `null` if the heap is empty) together with
   *   an array of snapshots for animation.
   */
  extractMin() {
    if (this._heap.length === 0) {
      return { item: null, snapshots: [] };
    }

    const minNode = this._heap[0];

    /** @type {HeapSnapshot[]} */
    const snapshots = [];

    if (this._heap.length === 1) {
      this._heap.pop();
      snapshots.push({ heap: this._deepCopyHeap(), swappedIndices: null });
      return { item: minNode.process, snapshots };
    }

    // Move the last node to the root.
    this._heap[0] = this._heap.pop();

    // Snapshot: heap state right after replacing the root (before sift-down).
    snapshots.push({ heap: this._deepCopyHeap(), swappedIndices: null });

    // Sift-down
    let i = 0;
    const length = this._heap.length;

    while (true) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let smallest = i;

      // Check left child
      if (left < length && this._compare(this._heap[left], this._heap[smallest]) < 0) {
        smallest = left;
      }

      // Check right child
      if (right < length && this._compare(this._heap[right], this._heap[smallest]) < 0) {
        smallest = right;
      }

      // If the current node is already the smallest, we're done.
      if (smallest === i) {
        break;
      }

      this._swap(i, smallest);

      // Snapshot after each swap.
      snapshots.push({
        heap: this._deepCopyHeap(),
        swappedIndices: [i, smallest],
      });

      i = smallest;
    }

    return { item: minNode.process, snapshots };
  }

  /**
   * Returns the minimum element without removing it.
   *
   * **Time Complexity:** O(1) — the min is always at index 0.
   *
   * @returns {Object|null} The process at the root, or `null` if empty.
   */
  peek() {
    return this._heap.length > 0 ? this._heap[0].process : null;
  }

  /**
   * Returns the number of elements currently in the heap.
   *
   * @returns {number}
   */
  size() {
    return this._heap.length;
  }

  /**
   * Returns a shallow copy of the internal heap array.
   *
   * Useful for rendering the heap contents in the UI without risking
   * mutation of the internal state.
   *
   * @returns {HeapNode[]}
   */
  toArray() {
    return [...this._heap];
  }

  /**
   * Checks whether the heap contains any elements.
   *
   * @returns {boolean} `true` if the heap is empty.
   */
  isEmpty() {
    return this._heap.length === 0;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Swaps two elements in the backing array by index.
   *
   * @private
   * @param {number} i - First index.
   * @param {number} j - Second index.
   */
  _swap(i, j) {
    [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
  }

  /**
   * Creates a deep copy of the heap array so that snapshots are immutable.
   *
   * We clone every node's `process` object as well, because React expects
   * immutable data when comparing state for re-renders.
   *
   * @private
   * @returns {HeapNode[]}
   */
  _deepCopyHeap() {
    return this._heap.map((node) => ({
      process: { ...node.process },
      index: node.index,
    }));
  }
}

export default MinHeap;
