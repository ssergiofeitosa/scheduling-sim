import { useState } from 'react';
import { Zap, Shuffle, Clock, Flag, Play, Pause, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const statusColors = {
  ready: { bg: 'bg-blue-50 text-blue-700 border border-blue-100', label: 'Pronto' },
  running: { bg: 'bg-green-50 text-green-700 border border-green-100', label: 'Executando' },
  completed: { bg: 'bg-emerald-50 text-emerald-700 border border-emerald-100', label: 'Concluído' },
  waiting: { bg: 'bg-amber-50 text-amber-700 border border-amber-100', label: 'Esperando' },
};

export default function ProcessForm({
  onAddProcess,
  onAddRandom,
  onLoadExample,
  processes,
  algorithm,
  // playback controls
  isRunning,
  onPlay,
  onPause,
  onStep,
  onReset,
  speed,
  onSpeedChange,
}) {
  const [burstTime, setBurstTime] = useState(5);
  const [priority, setPriority] = useState(1);

  const handleAdd = () => {
    onAddProcess(burstTime, priority);
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm flex flex-col h-full gap-5">
      {/* ── Title ──────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100">
          <Zap className="h-4 w-4 text-indigo-600" />
        </div>
        <h2 className="text-base font-bold text-slate-800">
          Gerador de Processos
        </h2>
      </div>

      {/* ── Inputs ─────────────────────────────── */}
      <div className="space-y-3">
        {/* Burst Time */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Tempo de Execução
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Ciclos de CPU</span>
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={burstTime}
            onChange={(e) =>
              setBurstTime(Math.max(1, Math.min(20, Number(e.target.value))))
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 transition-all hover:border-indigo-300 focus:bg-white focus:border-indigo-600"
          />
          <span className="mt-1 block text-[10px] text-slate-400 font-medium leading-normal">
            Tempo total que o processo precisa rodar na CPU para concluir.
          </span>
        </div>

        {/* Priority */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <Flag className="h-3.5 w-3.5 text-slate-400" />
              Prioridade
            </span>
            {algorithm !== 'priority' && (
              <span className="text-[10px] text-slate-400 font-medium">
                Inativo
              </span>
            )}
          </label>
          <input
            type="number"
            min={1}
            max={10}
            value={priority}
            disabled={algorithm !== 'priority'}
            onChange={(e) =>
              setPriority(Math.max(1, Math.min(10, Number(e.target.value))))
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 transition-all hover:border-indigo-300 focus:bg-white focus:border-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
          />
          <span className="mt-1 block text-[10px] text-slate-400 font-medium leading-normal">
            {algorithm === 'priority' 
              ? "Prioridade do processo. Menores números (ex: 1) rodam primeiro." 
              : "Disponível apenas no Escalonamento por Prioridade."}
          </span>
        </div>
      </div>

      {/* ── Buttons ────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAdd}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/10 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/20"
        >
          <Zap className="h-4 w-4" />
          Adicionar Processo
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAddRandom}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-700 shadow-sm"
          title="Adicionar processo com parâmetros aleatórios"
        >
          <Shuffle className="h-4 w-4" />
          Adicionar Aleatório (Random)
        </motion.button>
      </div>

      {/* ── Process List ───────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 mt-1 space-y-1.5">
        <AnimatePresence mode="popLayout">
          {processes.length === 0 && (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center text-xs font-medium text-slate-400"
            >
              Nenhum processo criado. Adicione um acima ou carregue o exemplo!
            </motion.p>
          )}

          {processes.map((proc) => {
            const status = statusColors[proc.status] || statusColors.ready;

            return (
              <motion.div
                key={proc.id}
                layout
                initial={{ x: -60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -60, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2 transition-colors hover:bg-slate-50 hover:border-slate-200"
                style={{ borderLeftWidth: 3, borderLeftColor: proc.color }}
              >
                {/* ID badge */}
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                  style={{ backgroundColor: proc.color + '15', color: proc.color }}
                >
                  {proc.id}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold leading-tight text-slate-700 truncate">
                    {proc.name || `Processo ${proc.id}`}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] font-semibold text-slate-400">
                    <span>Exec: {proc.burstTime}</span>
                    {algorithm === 'priority' && (
                      <span>Pri: {proc.priority}</span>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <span
                  className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${status.bg} ${status.text}`}
                >
                  {status.label}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Playback Controls ──────────────────── */}
      <div className="border-t border-slate-100 pt-4 mt-auto flex flex-col gap-4">
        <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 text-center">
          Controle da Simulação
        </h3>
        
        {/* Playback Buttons Group */}
        <div className="flex items-center justify-center gap-3 py-1">
          {/* Reset */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={onReset}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all shadow-md shadow-red-600/20 hover:shadow-red-600/30 border-0 cursor-pointer"
            title="Reiniciar Simulação"
          >
            <RotateCcw className="h-5 w-5" />
          </motion.button>

          {/* Play/Pause */}
          {isRunning ? (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onPause}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-all shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 border-0 cursor-pointer"
              title="Pausar"
            >
              <Pause className="h-5 w-5" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onPlay}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600 text-white hover:bg-green-700 transition-all shadow-md shadow-green-600/20 hover:shadow-green-600/30 border-0 cursor-pointer"
              title="Reproduzir"
            >
              <Play className="h-5 w-5 ml-0.5" />
            </motion.button>
          )}

          {/* Step */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={onStep}
            disabled={isRunning}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 disabled:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed border-0 cursor-pointer"
            title="Avançar 1 ciclo (Passo a Passo)"
          >
            <SkipForward className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Speed Slider & Speed Label */}
        <div className="flex flex-col gap-1.5 mt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-slate-450 shrink-0" />
              Velocidade do Relógio
            </span>
            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-md">
              {speed}ms
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={2000}
            step={50}
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-100 accent-indigo-600 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600"
          />
        </div>
      </div>
    </div>
  );
}
