import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import ProcessForm from './components/ProcessForm';
import CpuMonitor from './components/CpuMonitor';
import QueueVisualizer from './components/QueueVisualizer';
import HeapVisualizer from './components/HeapVisualizer';
import CompletedLog from './components/CompletedLog';
import FlowDiagram from './components/FlowDiagram';
import useScheduler from './hooks/useScheduler';

const algorithmInfo = {
  fifo: {
    name: 'Algoritmo FIFO / FCFS (Primeiro a Chegar, Primeiro a Ser Servido)',
    desc: 'Os processos são executados estritamente na ordem de chegada. Não é preemptivo (um processo executa até o final). É simples, mas pode gerar atrasos elevados para processos curtos se ficarem retidos atrás de um processo longo (Efeito Comboio).',
    details: 'Mecânica: Fila Linear • Preempção: Não'
  },
  roundRobin: {
    name: 'Algoritmo Round Robin (Compartilhamento de Tempo)',
    desc: 'Os processos recebem uma fatia de tempo máxima na CPU (Quantum). Ao esgotar o Quantum, o processo em execução sofre preempção e retorna para o final da fila. Ideal para dar sensação de paralelismo em sistemas interativos.',
    details: 'Mecânica: Fila com Time Slice • Preempção: Sim'
  },
  priority: {
    name: 'Algoritmo de Escalonamento por Prioridade',
    desc: 'O processo com maior prioridade atual (menor número) é o próximo a ser executado. O simulador utiliza um Min-Heap (árvore binária) para ordenar os processos em tempo real, ilustrando os passos de subida (sift-up) e descida (sift-down).',
    details: 'Mecânica: Fila de Prioridades (Min-Heap) • Preempção: Não'
  }
};

function App() {
  const scheduler = useScheduler();
  const [isProjectionMode, setIsProjectionMode] = useState(false);
  const toggleProjection = () => setIsProjectionMode((prev) => !prev);

  const {
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
    log,
    addProcess,
    addRandomProcess,
    loadExampleProcesses,
    play,
    pause,
    step,
    reset,
    setAlgorithm,
    setTimeQuantum,
    setSpeed,
  } = scheduler;

  // Compute highlighted indices from the latest heap snapshot for animation
  const highlightedIndices = useMemo(() => {
    if (heapSnapshots.length === 0) return [];
    const latest = heapSnapshots[heapSnapshots.length - 1];
    return latest?.swappedIndices || [];
  }, [heapSnapshots]);

  return (
    <div className="h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] font-['Inter',sans-serif] flex flex-col relative">
      {/* Background grid pattern */}
      <div className="fixed inset-0 grid-background opacity-50 pointer-events-none" />

      {/* Header */}
      <Header
        algorithm={algorithm}
        onAlgorithmChange={setAlgorithm}
        timeQuantum={timeQuantum}
        onTimeQuantumChange={setTimeQuantum}
        tick={tick}
        isProjectionMode={isProjectionMode}
        onToggleProjection={toggleProjection}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 pt-2 overflow-hidden relative z-10 mx-auto max-w-screen-2xl w-full min-h-0">
        {/* Left Panel - Process Form */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="lg:w-[300px] flex-shrink-0 h-full flex flex-col min-h-0"
        >
          <ProcessForm
            onAddProcess={addProcess}
            onAddRandom={addRandomProcess}
            processes={processes}
            algorithm={algorithm}
            isRunning={isRunning}
            onPlay={play}
            onPause={pause}
            onStep={step}
            onReset={reset}
            speed={speed}
            onSpeedChange={setSpeed}
          />
        </motion.aside>

        {/* Center Panel - Visualizations & Details */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 h-full min-h-0">
          
          {/* Flow Diagram */}
          <FlowDiagram
            readyQueueCount={readyQueueDisplay.length}
            cpuActive={!!currentProcess}
            completedCount={completedProcesses.length}
            algorithm={algorithm}
          />

          {/* Main Visualizer + CPU/Completed Column */}
          <div className="flex-1 flex flex-col xl:flex-row gap-4 min-h-0">
            {/* Left Column - Queue/Heap & Info */}
            <div className="flex-1 flex flex-col gap-4 min-w-0 h-full min-h-0">
              {/* Algorithm Informational Card */}
              <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm text-xs relative overflow-hidden shrink-0">
                <div className="absolute right-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full bg-indigo-50 opacity-20" />
                <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                  {algorithmInfo[algorithm].name}
                </h3>
                <p className="text-slate-500/90 mt-1.5 font-medium leading-relaxed">
                  {algorithmInfo[algorithm].desc}
                </p>
                <div className="mt-2.5 text-[9px] font-bold text-indigo-600 bg-indigo-50/50 inline-block px-2.5 py-0.5 rounded-md border border-indigo-100/30">
                  {algorithmInfo[algorithm].details}
                </div>
              </div>

              {/* Data Structure Visualizer Box */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex-1 min-w-0 h-full flex flex-col min-h-0"
              >
                <AnimatePresence mode="wait">
                  {algorithm === 'priority' ? (
                    <HeapVisualizer
                      key="heap"
                      heap={readyQueueDisplay}
                      snapshots={heapSnapshots}
                      highlightedIndices={highlightedIndices}
                      isProjectionMode={isProjectionMode}
                    />
                  ) : (
                    <QueueVisualizer
                      key="queue"
                      queue={readyQueueDisplay}
                      algorithm={algorithm}
                      isProjectionMode={isProjectionMode}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Right Column - CPU & Completed */}
            <div className="xl:w-[320px] flex-shrink-0 flex flex-col gap-4 h-full min-h-0">
              {/* CPU Monitor */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1, type: 'spring' }}
                className="flex-shrink-0"
              >
                <CpuMonitor currentProcess={currentProcess} />
              </motion.div>

              {/* Completed Log (Compact) */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex-1 min-h-0"
              >
                <CompletedLog completedProcesses={completedProcesses} isCompact={true} />
              </motion.div>
            </div>
          </div>
        </div>
      </main>




    </div>
  );
}

export default App;
