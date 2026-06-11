import { Terminal, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

const typeStyles = {
  info: 'text-slate-600',
  success: 'text-green-700 font-semibold',
  warning: 'text-amber-700 font-semibold',
};

const typeBadge = {
  info: 'bg-blue-50 text-blue-700 border border-blue-100/60',
  success: 'bg-green-50 text-green-700 border border-green-100/60',
  warning: 'bg-amber-50 text-amber-700 border border-amber-100/60',
};

export default function EventLog({ log = [] }) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [log.length]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col shadow-sm h-full">
      {/* ── Header ─────────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 border border-slate-200">
          <Terminal className="h-4 w-4 text-slate-500" />
        </div>
        <h2 className="text-sm font-bold text-slate-800">Registro de Eventos</h2>
        <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
          {log.length} eventos
        </span>
      </div>

      {/* ── Log Entries ────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-1 overflow-y-auto min-h-0 rounded-xl bg-slate-50/50 border border-slate-100/80 p-3"
      >
        {log.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 py-8">
            <Inbox className="h-5 w-5 text-slate-300" />
            <span className="text-xs font-semibold text-slate-400">
              Nenhum evento ainda
            </span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {log.map((entry, idx) => {
              const style = typeStyles[entry.type] || typeStyles.info;
              const badge = typeBadge[entry.type] || typeBadge.info;

              return (
                <motion.div
                  key={idx}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100/60 transition-colors"
                >
                  <span
                    className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold border ${badge}`}
                  >
                    {String(entry.tick).padStart(3, '0')}
                  </span>
                  <span className={`font-mono text-xs leading-relaxed ${style}`}>
                    {entry.message}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
