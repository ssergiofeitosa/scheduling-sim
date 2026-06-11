import { motion } from 'framer-motion';
import { ArrowRight, PlusCircle, HelpCircle, Layers, Cpu, CheckCircle } from 'lucide-react';

export default function FlowDiagram({ readyQueueCount, cpuActive, completedCount, algorithm }) {
  const steps = [
    {
      id: 'input',
      label: 'Novos Processos',
      icon: <PlusCircle className="h-4 w-4" />,
      active: true,
      desc: 'Criação de novos processos',
      color: 'border-slate-300 bg-white text-slate-700'
    },
    {
      id: 'queue',
      label: algorithm === 'priority' ? 'Fila de Prioridades' : 'Fila de Prontos',
      icon: <Layers className="h-4 w-4" />,
      active: readyQueueCount > 0,
      desc: `${readyQueueCount} no estado PRONTO`,
      color: readyQueueCount > 0
        ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 shadow-sm shadow-indigo-100'
        : 'border-slate-200 bg-slate-50 text-slate-400'
    },
    {
      id: 'cpu',
      label: 'CPU (Processador)',
      icon: <Cpu className="h-4 w-4" />,
      active: cpuActive,
      desc: cpuActive ? 'Executando processo...' : 'Ocioso',
      color: cpuActive
        ? 'border-green-500 bg-green-50/50 text-green-700 shadow-sm shadow-green-100 border-glow-active'
        : 'border-slate-200 bg-slate-50 text-slate-400'
    },
    {
      id: 'completed',
      label: 'Processos Concluídos',
      icon: <CheckCircle className="h-4 w-4" />,
      active: completedCount > 0,
      desc: `${completedCount} concluídos`,
      color: completedCount > 0
        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700'
        : 'border-slate-200 bg-slate-50 text-slate-400'
    }
  ];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <HelpCircle className="h-3.5 w-3.5 text-indigo-500" />
          Fluxo de Estados do Sistema
        </h3>
        <span className="text-[10px] font-semibold text-slate-400">Ciclo de vida do processo</span>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex flex-1 items-center w-full md:w-auto">
            {/* Step Card */}
            <motion.div
              layout
              className={`flex flex-1 items-center gap-3 rounded-xl border px-3 py-2 transition-all ${step.color}`}
            >
              <div className="rounded-lg p-1.5 bg-slate-100/10 shrink-0">
                {step.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate leading-tight">{step.label}</p>
                <p className="text-[10px] font-medium text-slate-500/80 mt-0.5 truncate">{step.desc}</p>
              </div>
            </motion.div>

            {/* Connecting Arrow */}
            {idx < steps.length - 1 && (
              <div className="flex justify-center items-center w-8 shrink-0 md:h-full py-1 md:py-0">
                <ArrowRight
                  className={`h-4 w-4 rotate-90 md:rotate-0 transition-colors ${
                    step.active ? 'text-indigo-500 animate-pulse' : 'text-slate-300'
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
