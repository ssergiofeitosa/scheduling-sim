import { Cpu, ChevronDown, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';

const algorithms = [
  { value: 'fifo', label: 'FIFO (Primeiro a Entrar, Primeiro a Sair)' },
  { value: 'roundRobin', label: 'Round Robin' },
  { value: 'priority', label: 'Escalonamento por Prioridade' },
];

export default function Header({
  algorithm,
  onAlgorithmChange,
  timeQuantum,
  onTimeQuantumChange,
  tick,
  isProjectionMode,
  onToggleProjection,
}) {
  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="glass-strong sticky top-0 z-50 rounded-b-2xl border-b border-slate-200/50 bg-white/95"
    >
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-4">
        {/* ── Brand ──────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md shadow-indigo-600/10">
            <Cpu className="h-5 w-5 text-white" />
          </div>

          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight text-slate-800">
              Escalonador de Processos
            </h1>
            <p className="text-xs font-semibold text-slate-400">
              Visualizador Interativo de Algoritmos
            </p>
          </div>
        </div>

        {/* ── Tick Counter ──────────────────────── */}
        <motion.div
          key={tick}
          initial={{ scale: 1.15, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="flex items-center gap-2 rounded-xl border border-slate-200/60 bg-slate-50 px-4 py-1.5 shadow-sm"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Ciclo
          </span>
          <span className="font-mono text-base font-extrabold text-indigo-600">
            {tick}
          </span>
        </motion.div>

        {/* ── Controls ───────────────────────────── */}
        <div className="flex items-center gap-4">
          {/* Projection Mode Toggle */}
          <button
            onClick={onToggleProjection}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-bold transition-all active:scale-95 cursor-pointer ${
              isProjectionMode
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700'
                : 'bg-slate-700 border-slate-700 text-white shadow-md shadow-slate-700/15 hover:bg-slate-800'
            }`}
            title={isProjectionMode ? "Desativar Modo Projeção" : "Ativar Modo Projeção (Datashow)"}
          >
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isProjectionMode ? "Modo Projeção: ON" : "Modo Projeção"}
            </span>
            <span className="sm:hidden">Projeção</span>
          </button>

          {/* Algorithm selector */}
          <div className="relative">
            <select
              value={algorithm}
              onChange={(e) => onAlgorithmChange(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2 pr-10 text-sm font-semibold text-slate-700 transition-all hover:border-indigo-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            >
              {algorithms.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Time quantum (Round Robin only) */}
          {algorithm === 'roundRobin' && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <label className="whitespace-nowrap text-xs font-bold text-slate-500">
                Quantum
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={timeQuantum}
                onChange={(e) =>
                  onTimeQuantumChange(
                    Math.max(1, Math.min(10, Number(e.target.value)))
                  )
                }
                className="w-16 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm font-bold text-indigo-600 transition-all hover:border-indigo-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
