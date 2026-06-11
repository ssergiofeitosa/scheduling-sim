import { CheckCircle, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CompletedLog({ completedProcesses = [], isCompact = false }) {
  const avgTurnaround =
    completedProcesses.length > 0
      ? (
          completedProcesses.reduce((sum, p) => sum + (p.completionTick - p.arrivalTick), 0) /
          completedProcesses.length
        ).toFixed(1)
      : '—';

  if (isCompact) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col shadow-sm h-full min-h-0">
        {/* ── Header ─────────────────────────────── */}
        <div className="mb-3 flex items-center gap-2 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50 border border-green-100">
            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
          </div>
          <h2 className="text-xs font-bold text-slate-800">
            Concluídos
          </h2>
          <span className="ml-auto rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
            {completedProcesses.length}
          </span>
        </div>

        {/* ── Badges List ────────────────────────── */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          {completedProcesses.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-6">
              <Inbox className="h-5 w-5 text-slate-300" />
              <span className="text-[10px] font-semibold text-slate-400 text-center">
                Nenhum concluído
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 py-1">
               <AnimatePresence>
                {completedProcesses.map((proc) => (
                  <motion.div
                    key={proc.id}
                    layoutId={`process-card-${proc.id}`}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.8 }}
                    transition={{ type: 'tween', duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black shadow-sm shrink-0"
                    style={{
                      backgroundColor: proc.color + '15',
                      color: proc.color,
                      borderWidth: 1,
                      borderColor: proc.color + '33',
                    }}
                    title={`${proc.name || `Processo ${proc.id}`} (Retorno: ${proc.completionTick - proc.arrivalTick}s)`}
                  >
                    {proc.id}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────── */}
        {completedProcesses.length > 0 && (
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 shrink-0">
            <span className="text-[9px] font-bold tracking-wider text-slate-400">RETORNO MÉDIO</span>
            <span className="font-mono text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-1.5 py-0.5 rounded-md">
              {avgTurnaround}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Non-compact layout
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col shadow-sm h-full">
      {/* ── Header ─────────────────────────────── */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 border border-green-100">
          <CheckCircle className="h-4 w-4 text-green-600" />
        </div>
        <h2 className="text-sm font-bold text-slate-800">
          Processos Concluídos
        </h2>
        <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
          {completedProcesses.length}
        </span>
      </div>

      {/* ── Table ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {completedProcesses.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 py-10">
            <Inbox className="h-6 w-6 text-slate-300" />
            <span className="text-xs font-semibold text-slate-400">
              Nenhum processo concluído ainda
            </span>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-2 pr-3 font-semibold">ID</th>
                <th className="pb-2 pr-3 font-semibold">Execução</th>
                <th className="pb-2 pr-3 font-semibold">Prioridade</th>
                <th className="pb-2 pr-3 font-semibold">Chegada</th>
                <th className="pb-2 pr-3 font-semibold">Conclusão</th>
                <th className="pb-2 font-semibold">Retorno</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {completedProcesses.map((proc, idx) => (
                  <motion.tr
                    key={proc.id}
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`border-b border-slate-100/60 ${
                      idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/20'
                    }`}
                  >
                    <td className="py-2 pr-3">
                      <span
                        className="font-bold"
                        style={{ color: proc.color }}
                      >
                        {proc.id}
                      </span>
                    </td>
                    <td className="py-2 pr-3 font-mono font-bold text-slate-700">
                      {proc.burstTime}
                    </td>
                    <td className="py-2 pr-3 font-mono text-slate-500">
                      {proc.priority}
                    </td>
                    <td className="py-2 pr-3 font-mono text-slate-500">
                      {proc.arrivalTick ?? '—'}
                    </td>
                    <td className="py-2 pr-3 font-mono text-slate-500">
                      {proc.completionTick ?? '—'}
                    </td>
                    <td className="py-2">
                      <span className="rounded bg-green-50 text-green-700 border border-green-100 px-1.5 py-0.5 font-mono font-bold">
                        {proc.completionTick - proc.arrivalTick}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* ── Footer ─────────────────────────────── */}
      {completedProcesses.length > 0 && (
        <div className="mt-3 flex items-center justify-end border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold text-slate-500">
            Retorno Médio:{' '}
            <span className="font-mono font-extrabold text-indigo-600">
              {avgTurnaround}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
