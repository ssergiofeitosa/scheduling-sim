import { Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CpuMonitor({ currentProcess }) {
  const isRunning = !!currentProcess;
  const progress = currentProcess
    ? ((currentProcess.burstTime - currentProcess.remainingTime) /
        currentProcess.burstTime) *
      100
    : 0;

  return (
    <div className="flex flex-col items-center w-full">
      {/* ── CPU Card ──────────────────────────── */}
      <div
        className={`relative w-full max-w-xs rounded-2xl border-2 p-6 transition-all duration-500 bg-white ${
          isRunning
            ? 'border-indigo-500/50 border-glow-active cpu-glow-active shadow-lg shadow-indigo-100/50'
            : 'border-slate-200/80 shadow-sm'
        }`}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu
              className={`h-5 w-5 transition-colors duration-300 ${
                isRunning ? 'text-indigo-600' : 'text-slate-300'
              }`}
            />
            <span className="text-sm font-bold text-slate-800">CPU</span>
          </div>

          <span
            className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border ${
              isRunning
                ? 'bg-green-50 text-green-700 border-green-100'
                : 'bg-slate-50 text-slate-400 border-slate-100'
            }`}
          >
            {isRunning ? 'Ativa' : 'Ociosa'}
          </span>
        </div>

        {/* Content */}
        <div className="relative min-h-[120px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isRunning ? (
              <motion.div
                key={currentProcess.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                {/* Process info card - flying target */}
                <motion.div
                  layoutId={`process-card-${currentProcess.id}`}
                  className="flex items-center gap-3 mb-4 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 shadow-sm animate-colors"
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: currentProcess.color,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm"
                    style={{
                      backgroundColor: currentProcess.color + '15',
                      color: currentProcess.color,
                    }}
                  >
                    {currentProcess.id}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-slate-700 truncate">
                      {currentProcess.name || `Processo ${currentProcess.id}`}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                      Total: {currentProcess.burstTime} ciclos
                    </p>
                  </div>
                </motion.div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">Progresso</span>
                    <span className="font-mono text-slate-700">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/20">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${currentProcess.color}, ${currentProcess.color}cc)`,
                        boxShadow: `0 0 8px ${currentProcess.color}40`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span>
                      Restante:{' '}
                      <span className="font-mono text-indigo-600 font-bold">
                        {currentProcess.remainingTime}
                      </span>
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <Cpu className="h-12 w-12 text-slate-200 subtle-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  Aguardando Processo
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
