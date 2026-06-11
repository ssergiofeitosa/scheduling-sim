/**
 * @fileoverview A simple FIFO (First-In, First-Out) Queue for OS scheduling.
 *
 * In operating systems, FIFO and Round Robin schedulers both use a regular
 * queue to decide which process runs next:
 *
 * - **FIFO (First-Come, First-Served):** processes are dequeued in the exact
 *   order they arrived — no preemption.
 * - **Round Robin:** same arrival order, but a running process is preempted
 *   after a fixed *time quantum* and re-enqueued at the back of the queue.
 *
 * This implementation wraps a plain JavaScript array and exposes a clean,
 * intention-revealing API so that consuming code reads like pseudo-code from
 * an OS textbook.
 *
 * **Time Complexities:**
 * | Operation | Complexity |
 * |-----------|------------|
 * | enqueue   | O(1)*      |
 * | dequeue   | O(n)**     |
 * | peek      | O(1)       |
 * | size      | O(1)       |
 * | isEmpty   | O(1)       |
 * | toArray   | O(n)       |
 *
 * *Amortised — `Array.push` may occasionally resize.
 * **`Array.shift` is O(n) because every element is copied forward.
 *   For this educational simulator the queue is small, so this is fine.
 *   A production scheduler would use a linked list or circular buffer.
 *
 * @module Queue
 */

/**
 * A straightforward FIFO queue.
 *
 * @template T
 */
class Queue {
  /**
   * Creates an empty queue.
   *
   * @example
   * const readyQueue = new Queue();
   * readyQueue.enqueue(processA);
   * readyQueue.enqueue(processB);
   * const next = readyQueue.dequeue(); // processA
   */
  constructor() {
    /**
     * @private
     * @type {T[]}
     * Internal storage — index 0 is the front of the queue.
     */
    this._items = [];
  }

  /**
   * Adds an item to the **back** of the queue (tail-end insertion).
   *
   * Analogous to a new process entering the *ready queue* in an OS.
   *
   * @param {T} item - The item to enqueue.
   */
  enqueue(item) {
    this._items.push(item);
  }

  /**
   * Removes and returns the item at the **front** of the queue.
   *
   * Analogous to the OS scheduler picking the next process to dispatch
   * to the CPU.
   *
   * @returns {T|undefined} The front item, or `undefined` if the queue is
   *   empty.
   */
  dequeue() {
    return this._items.shift();
  }

  /**
   * Returns the item at the front **without** removing it.
   *
   * Useful when the scheduler needs to inspect the next candidate without
   * committing to a context switch.
   *
   * @returns {T|undefined} The front item, or `undefined` if empty.
   */
  peek() {
    return this._items.length > 0 ? this._items[0] : undefined;
  }

  /**
   * Returns the number of items currently in the queue.
   *
   * @returns {number}
   */
  size() {
    return this._items.length;
  }

  /**
   * Returns a shallow copy of the internal array.
   *
   * This is used to feed React state so the UI can render the queue
   * contents without risking accidental mutation of the internal store.
   *
   * @returns {T[]}
   */
  toArray() {
    return [...this._items];
  }

  /**
   * Checks whether the queue is empty.
   *
   * @returns {boolean} `true` if the queue contains no items.
   */
  isEmpty() {
    return this._items.length === 0;
  }
}

export default Queue;
