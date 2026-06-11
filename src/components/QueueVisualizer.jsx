import { ListOrdered, ArrowLeft, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QueueVisualizer({ queue, algorithm, isProjectionMode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-full flex flex-col">
      {/* ── Header ─────────────────────────────── */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100">
          <ListOrdered className="h-4 w-4 text-indigo-600" />
        </div>
        <h2 className="text-sm font-bold text-slate-800">Fila de Prontos</h2>
        <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
          {algorithm === 'roundRobin' ? 'Round Robin' : 'FIFO'}
        </span>
      </div>

      {/* ── Queue Row ──────────────────────────── */}
      <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-2 min-h-0">
        {/* Flow arrow to CPU */}
        {queue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mr-2 flex shrink-0 items-center gap-1.5"
          >
            <span className="rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 text-[10px] font-bold">
              CPU
            </span>
            <ArrowLeft className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {queue.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 flex-col items-center justify-center gap-1.5 py-4"
            >
              <Inbox className="h-6 w-6 text-slate-300" />
              <span className="text-xs font-semibold text-slate-400">Fila Vazia</span>
            </motion.div>
          ) : (
            queue.map((proc, index) => (
              <motion.div
                key={proc.id}
                layoutId={`queue-${proc.id}`}
                initial={{ x: 80, opacity: 0, scale: 0.8 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: -80, scale: 0.8 }}
                transition={{ type: 'tween', duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="group relative flex shrink-0 items-center gap-2"
              >
                {/* Arrow pointing left (towards the CPU / head of the queue) */}
                {index > 0 && (
                  <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                )}

                {/* Process card */}
                <motion.div
                  layoutId={`process-card-${proc.id}`}
                  transition={{ type: 'tween', duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
                  className={`transition-all flex flex-col justify-between items-center rounded-xl border bg-white shadow-sm transition-colors ${
                    isProjectionMode
                      ? 'w-44 h-[110px] p-3.5 border-slate-300 border-2'
                      : 'w-32 h-[84px] p-2.5 border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                  style={{
                    borderTopWidth: isProjectionMode ? 5 : 3.5,
                    borderTopColor: proc.color,
                  }}
                >
                  <div className="flex flex-col justify-between h-full w-full items-center">
                    {/* Process Name */}
                    <span className={`font-extrabold text-slate-800 truncate text-center ${
                      isProjectionMode ? 'text-base' : 'text-xs'
                    }`}>
                      {proc.name || `Processo ${proc.id}`}
                    </span>

                    {/* Stats Row */}
                    <div className="flex items-center gap-1.5 justify-center w-full">
                      {/* Remaining Time */}
                      <span className={`font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md ${
                        isProjectionMode ? 'text-sm px-3 py-1 rounded-lg border-2' : 'text-[11px]'
                      }`}>
                        T: {proc.remainingTime}s
                      </span>
                      
                      {/* Priority if algorithm is priority */}
                      {algorithm === 'priority' && (
                        <span className={`font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md ${
                          isProjectionMode ? 'text-xs px-2 py-0.5' : 'text-[9px]'
                        }`}>
                          Pri: {proc.priority}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
