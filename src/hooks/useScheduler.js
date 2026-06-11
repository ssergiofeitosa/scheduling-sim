/**
 * @fileoverview `useScheduler` — the central state-management hook for the
 * OS Process Scheduling Simulator.
 *
 * This hook owns **all** simulation state and exposes a clean API that the UI
 * components consume.  It wires together the {@link MinHeap} and {@link Queue}
 * data structures, a tick-based clock, and three scheduling algorithms:
 *
 * | Algorithm    | Data Structure | Preemptive? |
 * |--------------|----------------|-------------|
 * | FIFO (FCFS)  | Queue          | No          |
 * | Round Robin  | Queue          | Yes (quantum) |
 * | Priority     | MinHeap        | No          |
 *
 * **Design decisions:**
 * - The Queue / MinHeap instances live in a `useRef` so they persist across
 *   renders without triggering re-render cascades.
 * - Every exposed function is wrapped in `useCallback` so child components
 *   that receive them as props don't re-render unnecessarily.
 * - A monotonically increasing *process counter* (also a ref) ensures
 *   auto-generated IDs like P1, P2, … never collide even after a reset.
 *
 * @module useScheduler
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import MinHeap from '../lib/MinHeap';
import Queue from '../lib/Queue';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A curated palette of 10 vibrant colours that cycle for each new process.
 * Using a fixed palette keeps the Gantt chart / queue visualisation readable.
 *
 * @type {string[]}
 */
const PROCESS_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
];

/**
 * Possible statuses a process can be in throughout its lifecycle.
 *
 * ```
 * new ──▶ ready ──▶ running ──▶ completed
 *                      │              ▲
 *                      └── (RR) ──────┘  (re-enqueue on quantum expiry)
 * ```
 *
 * @readonly
 * @enum {string}
 */
export const ProcessStatus = {
  NEW: 'new',
  READY: 'ready',
  RUNNING: 'running',
  COMPLETED: 'completed',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper — create a log entry
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds a timestamped log message string.
 *
 * @param {number} tick    - The current simulation tick.
 * @param {string} message - Human-readable event description.
 * @returns {{ tick: number, message: string, timestamp: number }}
 */
const createLogEntry = (tick, message, type = 'info') => ({
  tick,
  message,
  type,
  timestamp: Date.now(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Custom React hook that manages the entire scheduling simulation.
 *
 * @returns {Object} The full simulation state and control functions.
 *
 * @example
 * function App() {
 *   const scheduler = useScheduler();
 *   return (
 *     <>
 *       <button onClick={scheduler.addRandomProcess}>Add</button>
 *       <button onClick={scheduler.play}>Play</button>
 *       <button onClick={scheduler.pause}>Pause</button>
 *       <button onClick={scheduler.step}>Step</button>
 *     </>
 *   );
 * }
 */
function useScheduler() {
  // ── Core simulation state ────────────────────────────────────────────────

  /** All processes ever created. */
  const [processes, setProcesses] = useState([]);

  /** Array mirror of the ready queue/heap used solely for rendering. */
  const [readyQueueDisplay, setReadyQueueDisplay] = useState([]);

  /** Snapshots captured during the last heap insert / extract (for animation). */
  const [heapSnapshots, setHeapSnapshots] = useState([]);

  /** The process currently occupying the CPU (or null). */
  const [currentProcess, setCurrentProcess] = useState(null);

  /** Processes that have finished execution. */
  const [completedProcesses, setCompletedProcesses] = useState([]);

  /** The simulation clock (integer, starts at 0). */
  const [tick, setTick] = useState(0);

  /** Whether the simulation auto-advances. */
  const [isRunning, setIsRunning] = useState(false);

  /** The active scheduling algorithm. */
  const [algorithm, setAlgorithmState] = useState('fifo');

  /** Round Robin time quantum. */
  const [timeQuantum, setTimeQuantumState] = useState(3);

  /** Delay between ticks in milliseconds. */
  const [speed, setSpeedState] = useState(1000);

  /** Remaining quantum for the currently running process (Round Robin). */
  const [quantumRemaining, setQuantumRemaining] = useState(0);

  /** Ordered log of simulation events. */
  const [log, setLog] = useState([]);

  // ── Refs (mutable values that must not trigger re-renders) ───────────────

  /**
   * The actual Queue or MinHeap instance.  Stored in a ref because:
   * 1. We mutate it imperatively (enqueue / dequeue).
   * 2. Putting it in state would force us to clone it every tick.
   */
  const readyQueueRef = useRef(new Queue());

  /** Monotonic counter for generating unique process IDs (P1, P2, …). */
  const processCounterRef = useRef(0);

  /**
   * We keep a "ref copy" of state values that the tick callback needs.
   * This avoids stale-closure bugs inside the setInterval callback.
   */
  const stateRef = useRef({
    currentProcess: null,
    algorithm: 'fifo',
    timeQuantum: 3,
    quantumRemaining: 0,
    tick: 0,
    processes: [],
    completedProcesses: [],
  });

  // Keep the ref in sync whenever the corresponding state changes.
  useEffect(() => {
    stateRef.current.currentProcess = currentProcess;
  }, [currentProcess]);
  useEffect(() => {
    stateRef.current.algorithm = algorithm;
  }, [algorithm]);
  useEffect(() => {
    stateRef.current.timeQuantum = timeQuantum;
  }, [timeQuantum]);
  useEffect(() => {
    stateRef.current.quantumRemaining = quantumRemaining;
  }, [quantumRemaining]);
  useEffect(() => {
    stateRef.current.tick = tick;
  }, [tick]);
  useEffect(() => {
    stateRef.current.processes = processes;
  }, [processes]);
  useEffect(() => {
    stateRef.current.completedProcesses = completedProcesses;
  }, [completedProcesses]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Picks a colour from the palette, cycling when the count exceeds 10.
   *
   * @param {number} index - The zero-based process creation index.
   * @returns {string} A hex colour string.
   */
  const getProcessColor = useCallback((index) => {
    return PROCESS_COLORS[index % PROCESS_COLORS.length];
  }, []);

  /**
   * Synchronises the `readyQueueDisplay` state with the actual data
   * structure so React can render it.
   */
  const syncQueueDisplay = useCallback(() => {
    const q = readyQueueRef.current;
    if (q instanceof MinHeap) {
      // For the heap we expose the raw nodes so the UI can display indices.
      setReadyQueueDisplay(
        q.toArray().map((node) => node.process)
      );
    } else {
      setReadyQueueDisplay(q.toArray());
    }
  }, []);

  /**
   * Appends one or more entries to the simulation log.
   *
   * @param {number} t       - Current tick.
   * @param {string} message - Event description.
   */
  const appendLog = useCallback((t, message, type = 'info') => {
    setLog((prev) => [...prev, createLogEntry(t, message, type)]);
  }, []);

  // ── Public API ───────────────────────────────────────────────────────────

  /**
   * Creates a new process and adds it to the ready queue.
   *
   * For priority scheduling the process is inserted into the MinHeap and
   * the sift-up snapshots are stored for animation.
   *
   * @param {number} burstTime - Total CPU time required.
   * @param {number} priority  - Priority level (1 = highest).
   */
  const addProcess = useCallback(
    (burstTime, priority) => {
      const id = ++processCounterRef.current;
      const currentTick = stateRef.current.tick;

      /** @type {Object} */
      const process = {
        id: `P${id}`,
        name: `Processo ${id}`,
        burstTime,
        remainingTime: burstTime,
        priority,
        status: ProcessStatus.READY,
        arrivalTick: currentTick,
        startTick: null,
        completionTick: null,
        color: getProcessColor(id - 1),
      };

      // Add to the master process list.
      setProcesses((prev) => [...prev, process]);

      // Enqueue into the appropriate data structure.
      const q = readyQueueRef.current;

      if (q instanceof MinHeap) {
        const snapshots = q.insert(process);
        setHeapSnapshots(snapshots);
      } else {
        q.enqueue(process);
      }

      syncQueueDisplay();
      appendLog(currentTick, `${process.id} adicionado à fila de prontos (execução=${burstTime}, prioridade=${priority})`, 'info');
    },
    [getProcessColor, syncQueueDisplay, appendLog]
  );

  /**
   * Convenience wrapper — creates a process with random burst and priority.
   */
  const addRandomProcess = useCallback(() => {
    const burstTime = Math.floor(Math.random() * 10) + 1; // 1–10
    const priority = Math.floor(Math.random() * 5) + 1;   // 1–5
    addProcess(burstTime, priority);
  }, [addProcess]);

  // ── Tick logic ───────────────────────────────────────────────────────────

  /**
   * Advances the simulation by exactly one tick.
   *
   * This is the heart of the scheduler.  The order of operations mirrors
   * what a real OS dispatcher would do on each timer interrupt:
   *
   * 1. **Dispatch** – if the CPU is idle and the ready queue is non-empty,
   *    pick the next process and start executing it.
   * 2. **Execute** – decrement `remainingTime` of the running process.
   * 3. **Completion check** – if `remainingTime` is 0, move the process to
   *    the completed list and free the CPU.
   * 4. **Preemption check (RR only)** – if the quantum has expired and the
   *    process isn't done, re-enqueue it and free the CPU.
   * 5. **Advance clock** – increment the tick counter.
   */
  const step = useCallback(() => {
    const s = stateRef.current;
    let proc = s.currentProcess;
    let qRemaining = s.quantumRemaining;
    const currentTick = s.tick;
    const q = readyQueueRef.current;

    // ── 1. Dispatch ────────────────────────────────────────────────────
    if (!proc && !q.isEmpty()) {
      let nextProcess;

      if (q instanceof MinHeap) {
        const result = q.extractMin();
        nextProcess = result.item;
        setHeapSnapshots(result.snapshots);
      } else {
        nextProcess = q.dequeue();
      }

      if (nextProcess) {
        proc = { ...nextProcess, status: ProcessStatus.RUNNING };

        // Record the first time this process gets the CPU.
        if (proc.startTick === null) {
          proc.startTick = currentTick;
        }

        setCurrentProcess(proc);
        stateRef.current.currentProcess = proc;

        // Reset quantum counter for Round Robin.
        if (s.algorithm === 'roundRobin') {
          qRemaining = s.timeQuantum;
          setQuantumRemaining(s.timeQuantum);
          stateRef.current.quantumRemaining = s.timeQuantum;
        }

        // Update the master process list to reflect the status change.
        setProcesses((prev) =>
          prev.map((p) => (p.id === proc.id ? { ...proc } : p))
        );

        syncQueueDisplay();
        appendLog(currentTick, `${proc.id} despachado para a CPU`, 'info');
      }
    }

    // ── 2. Execute ─────────────────────────────────────────────────────
    if (proc) {
      const updatedProc = {
        ...proc,
        remainingTime: proc.remainingTime - 1,
      };

      // For Round Robin, also decrement the quantum counter.
      if (s.algorithm === 'roundRobin') {
        qRemaining = qRemaining - 1;
        setQuantumRemaining(qRemaining);
        stateRef.current.quantumRemaining = qRemaining;
      }

      // ── 3. Completion check ──────────────────────────────────────────
      if (updatedProc.remainingTime <= 0) {
        updatedProc.status = ProcessStatus.COMPLETED;
        updatedProc.completionTick = currentTick + 1;

        const turnaround = updatedProc.completionTick - updatedProc.arrivalTick;

        setCurrentProcess(null);
        stateRef.current.currentProcess = null;

        setCompletedProcesses((prev) => [...prev, updatedProc]);
        stateRef.current.completedProcesses = [
          ...stateRef.current.completedProcesses,
          updatedProc,
        ];

        setProcesses((prev) =>
          prev.map((p) => (p.id === updatedProc.id ? { ...updatedProc } : p))
        );

        appendLog(
          currentTick,
          `${updatedProc.id} concluído (retorno=${turnaround} ciclos)`,
          'success'
        );
      }
      // ── 4. Preemption check (Round Robin) ────────────────────────────
      else if (s.algorithm === 'roundRobin' && qRemaining <= 0) {
        // Time quantum expired — preempt and re-enqueue.
        const preempted = { ...updatedProc, status: ProcessStatus.READY };

        setCurrentProcess(null);
        stateRef.current.currentProcess = null;

        q.enqueue(preempted);
        syncQueueDisplay();

        setProcesses((prev) =>
          prev.map((p) => (p.id === preempted.id ? { ...preempted } : p))
        );

        appendLog(
          currentTick,
          `${preempted.id} preemptado (quantum expirou, restante=${preempted.remainingTime})`,
          'warning'
        );
      } else {
        // Process is still running — update in place.
        setCurrentProcess(updatedProc);
        stateRef.current.currentProcess = updatedProc;

        setProcesses((prev) =>
          prev.map((p) => (p.id === updatedProc.id ? { ...updatedProc } : p))
        );
      }
    }

    // ── 5. Advance clock ───────────────────────────────────────────────
    setTick((prev) => {
      const next = prev + 1;
      stateRef.current.tick = next;
      return next;
    });
  }, [syncQueueDisplay, appendLog]);

  // ── Auto-advance (play / pause) ──────────────────────────────────────────

  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      step();
    }, speed);

    return () => clearInterval(intervalId);
  }, [isRunning, speed, step]);

  // ── Control functions ────────────────────────────────────────────────────

  /** Starts auto-advancing the simulation. */
  const play = useCallback(() => setIsRunning(true), []);

  /** Pauses auto-advance. */
  const pause = useCallback(() => setIsRunning(false), []);

  /**
   * Switches the scheduling algorithm and performs a full reset.
   *
   * We reset because the underlying data structure changes (Queue ↔ MinHeap)
   * and carrying over state would be inconsistent.
   *
   * @param {'fifo'|'roundRobin'|'priority'} algo
   */
  const setAlgorithm = useCallback((algo) => {
    setIsRunning(false);
    setAlgorithmState(algo);
    stateRef.current.algorithm = algo;

    // Build the right data structure for the chosen algorithm.
    if (algo === 'priority') {
      readyQueueRef.current = new MinHeap();
    } else {
      readyQueueRef.current = new Queue();
    }

    // Full reset.
    processCounterRef.current = 0;
    setProcesses([]);
    setReadyQueueDisplay([]);
    setHeapSnapshots([]);
    setCurrentProcess(null);
    setCompletedProcesses([]);
    setTick(0);
    setQuantumRemaining(0);
    setLog([createLogEntry(0, `Algoritmo alterado para ${algo}`)]);

    // Sync refs.
    stateRef.current.currentProcess = null;
    stateRef.current.tick = 0;
    stateRef.current.quantumRemaining = 0;
    stateRef.current.processes = [];
    stateRef.current.completedProcesses = [];
  }, []);

  /**
   * Updates the Round Robin time quantum.
   *
   * @param {number} q - The new quantum value (positive integer).
   */
  const setTimeQuantum = useCallback((q) => {
    const value = Math.max(1, Math.round(q));
    setTimeQuantumState(value);
    stateRef.current.timeQuantum = value;
  }, []);

  /**
   * Updates the simulation playback speed.
   *
   * @param {number} s - Delay between ticks in milliseconds.
   */
  const setSpeed = useCallback((s) => {
    setSpeedState(Math.max(100, s));
  }, []);

  /**
   * Performs a full simulation reset, keeping the current algorithm
   * selection intact.
   */
  const reset = useCallback(() => {
    setIsRunning(false);

    // Rebuild the queue/heap.
    if (stateRef.current.algorithm === 'priority') {
      readyQueueRef.current = new MinHeap();
    } else {
      readyQueueRef.current = new Queue();
    }

    processCounterRef.current = 0;
    setProcesses([]);
    setReadyQueueDisplay([]);
    setHeapSnapshots([]);
    setCurrentProcess(null);
    setCompletedProcesses([]);
    setTick(0);
    setQuantumRemaining(0);
    setLog([createLogEntry(0, 'Simulação reiniciada')]);

    stateRef.current.currentProcess = null;
    stateRef.current.tick = 0;
    stateRef.current.quantumRemaining = 0;
    stateRef.current.processes = [];
    stateRef.current.completedProcesses = [];
  }, []);

  /**
   * Resets the simulation and loads a set of pre-configured processes.
   * Perfect for quick demonstration.
   */
  const loadExampleProcesses = useCallback(() => {
    // 1. Reset state
    setIsRunning(false);

    if (stateRef.current.algorithm === 'priority') {
      readyQueueRef.current = new MinHeap();
    } else {
      readyQueueRef.current = new Queue();
    }

    processCounterRef.current = 0;
    setProcesses([]);
    setReadyQueueDisplay([]);
    setHeapSnapshots([]);
    setCurrentProcess(null);
    setCompletedProcesses([]);
    setTick(0);
    setQuantumRemaining(0);
    setLog([
      createLogEntry(0, 'Simulação reiniciada'),
      createLogEntry(0, 'Cenário de exemplo carregado', 'success')
    ]);

    stateRef.current.currentProcess = null;
    stateRef.current.tick = 0;
    stateRef.current.quantumRemaining = 0;
    stateRef.current.processes = [];
    stateRef.current.completedProcesses = [];

    // 2. Define example dataset
    const examples = [
      { burstTime: 6, priority: 3 },
      { burstTime: 3, priority: 1 },
      { burstTime: 8, priority: 4 },
      { burstTime: 2, priority: 2 },
    ];

    const q = readyQueueRef.current;
    const allProcesses = [];

    examples.forEach((ex, idx) => {
      const id = idx + 1;
      const process = {
        id: `P${id}`,
        name: `Processo ${id}`,
        burstTime: ex.burstTime,
        remainingTime: ex.burstTime,
        priority: ex.priority,
        status: ProcessStatus.READY,
        arrivalTick: 0,
        startTick: null,
        completionTick: null,
        color: getProcessColor(idx),
      };

      allProcesses.push(process);

      if (q instanceof MinHeap) {
        const snapshots = q.insert(process);
        setHeapSnapshots(snapshots);
      } else {
        q.enqueue(process);
      }
    });

    // Update refs and states in batch
    processCounterRef.current = examples.length;
    setProcesses(allProcesses);
    setReadyQueueDisplay(q.toArray());
    stateRef.current.processes = allProcesses;
  }, [getProcessColor]);

  // ── Return public API ────────────────────────────────────────────────────

  return {
    // State
    processes,
    readyQueueDisplay,
    heapSnapshots,
    currentProcess,
    completedProcesses,
    tick,
    isRunning,
    algorithm,
    timeQuantum,
    speed,
    quantumRemaining,
    log,

    // Actions
    addProcess,
    addRandomProcess,
    loadExampleProcesses,
    play,
    pause,
    step,
    setAlgorithm,
    setTimeQuantum,
    setSpeed,
    reset,
  };
}

export default useScheduler;
