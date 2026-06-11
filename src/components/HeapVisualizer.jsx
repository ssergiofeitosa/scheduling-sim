import { GitBranch, Inbox, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
 
function computePositions(heapSize, containerWidth, nodeW, levelGap) {
  const positions = [];
  if (heapSize === 0) return positions;
 
  for (let i = 0; i < heapSize; i++) {
    const level = Math.floor(Math.log2(i + 1));
    const indexInLevel = i - (Math.pow(2, level) - 1);
    const nodesInLevel = Math.pow(2, level);
 
    const availableWidth = Math.max(containerWidth, 300);
    const spacing = availableWidth / (nodesInLevel + 1);
 
    const x = spacing * (indexInLevel + 1) - nodeW / 2;
    const y = level * levelGap + 20;
 
    positions.push({ x, y, level });
  }
 
  return positions;
}
 
function getEdges(heapSize, positions, nodeW, nodeH) {
  const edges = [];
  for (let i = 0; i < heapSize; i++) {
    const left = 2 * i + 1;
    const right = 2 * i + 2;
 
    if (left < heapSize) {
      edges.push({
        x1: positions[i].x + nodeW / 2,
        y1: positions[i].y + nodeH,
        x2: positions[left].x + nodeW / 2,
        y2: positions[left].y,
      });
    }
    if (right < heapSize) {
      edges.push({
        x1: positions[i].x + nodeW / 2,
        y1: positions[i].y + nodeH,
        x2: positions[right].x + nodeW / 2,
        y2: positions[right].y,
      });
    }
  }
  return edges;
}
 
export default function HeapVisualizer({
  heap = [],
  highlightedIndices = [],
  isProjectionMode,
}) {
  const [zoomLevel, setZoomLevel] = useState(0); // 0 = 1.0x, 1 = 1.2x, 2 = 1.4x, 3 = 1.6x
 
  const baseNodeW = isProjectionMode ? 92 : 70;
  const baseNodeH = isProjectionMode ? 92 : 70;
  const baseLevelGap = isProjectionMode ? 105 : 85;
 
  const scale = 1 + zoomLevel * 0.2; // 1.0x, 1.2x, 1.4x, 1.6x
  const NODE_W = Math.round(baseNodeW * scale);
  const NODE_H = Math.round(baseNodeH * scale);
  const LEVEL_GAP = Math.round(baseLevelGap * (1 + zoomLevel * 0.15));
 
  const maxLevel = heap.length > 0 ? Math.floor(Math.log2(heap.length)) : 0;
  const minSpacing = NODE_W + 14; // Compact spacing that still prevents overlaps
  const requiredWidthForLevel = minSpacing * (Math.pow(2, maxLevel) + 1);
  const containerWidth = Math.max(520, requiredWidthForLevel);
 
  const positions = useMemo(
    () => computePositions(heap.length, containerWidth, NODE_W, LEVEL_GAP),
    [heap.length, containerWidth, NODE_W, LEVEL_GAP]
  );
  const edges = useMemo(
    () => getEdges(heap.length, positions, NODE_W, NODE_H),
    [heap.length, positions, NODE_W, NODE_H]
  );
 
  const svgHeight = (maxLevel + 1) * LEVEL_GAP + NODE_H + 40;
 
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-full flex flex-col">
      {/* ── Header ─────────────────────────────── */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 border border-violet-100">
          <GitBranch className="h-4 w-4 text-violet-600" />
        </div>
        <h2 className="text-sm font-bold text-slate-800">
          Fila de Prioridade{' '}
          <span className="font-normal text-slate-400">(Min-Heap)</span>
        </h2>
        
        {/* Zoom Button */}
        <button
          onClick={() => setZoomLevel((prev) => (prev + 1) % 4)}
          className={`ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all active:scale-95 cursor-pointer ${
            zoomLevel > 0
              ? 'bg-violet-600 border-violet-600 text-white shadow-sm hover:bg-violet-700'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
          title="Alterar nível de zoom dos nós"
        >
          {zoomLevel === 0 && "Zoom: 1.0x"}
          {zoomLevel === 1 && "Zoom: 1.2x"}
          {zoomLevel === 2 && "Zoom: 1.4x"}
          {zoomLevel === 3 && "Zoom: 1.6x"}
        </button>
 
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
          {heap.length} {heap.length === 1 ? 'nó' : 'nós'}
        </span>
      </div>
 
      {/* ── Tree ───────────────────────────────── */}
      <div className="overflow-auto flex-1 min-h-0">
        <AnimatePresence mode="popLayout">
          {heap.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-1.5 py-10"
            >
              <Inbox className="h-6 w-6 text-slate-300" />
              <span className="text-xs font-semibold text-slate-400">
                Heap está vazio
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="tree"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative mx-auto"
              style={{
                width: containerWidth,
                height: svgHeight,
              }}
            >
              {/* CPU Indicator next to root node */}
              {positions[0] && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute flex items-center gap-1 bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1 shadow-sm z-10 select-none"
                  style={{
                    top: positions[0].y + (NODE_H / 2) - 14,
                    left: Math.max(10, positions[0].x - 85),
                  }}
                >
                  <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">
                    CPU
                  </span>
                  <ArrowLeft className="h-3.5 w-3.5 text-indigo-600 animate-pulse shrink-0" />
                </motion.div>
              )}
              {/* SVG Edges */}
              <svg
                className="absolute inset-0 pointer-events-none"
                width={containerWidth}
                height={svgHeight}
              >
                {edges.map((e, idx) => (
                  <motion.line
                    key={idx}
                    animate={{
                      x1: e.x1,
                      y1: e.y1,
                      x2: e.x2,
                      y2: e.y2,
                      opacity: 1
                    }}
                    stroke="#6366f1"
                    strokeWidth={3.5}
                    strokeOpacity={0.65}
                    initial={{ opacity: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 80,
                      damping: 18,
                      mass: 1.1
                    }}
                  />
                ))}
              </svg>

              {/* Nodes */}
              {heap.map((proc, idx) => {
                const pos = positions[idx];
                if (!pos) return null;

                const isHighlighted = highlightedIndices.includes(idx);

                return (
                  <motion.div
                    key={proc.id}
                    layout
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0 }}
                    transition={{
                      layout: {
                        type: 'spring',
                        stiffness: 80,
                        damping: 18,
                        mass: 1.1
                      },
                      default: {
                        type: 'spring',
                        stiffness: 250,
                        damping: 22,
                        delay: idx * 0.03,
                      }
                    }}
                    className="absolute"
                    style={{
                      width: NODE_W,
                      height: NODE_H,
                      left: pos.x,
                      top: pos.y,
                    }}
                  >
                    <motion.div
                      layoutId={`process-card-${proc.id}`}
                      transition={{ type: 'tween', duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
                      className={`w-full h-full flex flex-col items-center justify-center rounded-2xl transition-all duration-300 bg-white ${
                        isHighlighted
                          ? 'border-[3px] border-amber-500 bg-amber-50/80 shadow-md shadow-amber-300/40'
                          : 'border-2 border-slate-350 shadow-sm hover:border-slate-500'
                      }`}
                    >
                      <span
                        className="font-black truncate w-full text-center"
                        style={{ 
                          color: proc.color,
                          fontSize: `${Math.round((isProjectionMode ? 13 : 11) * scale)}px`
                        }}
                      >
                        {isProjectionMode ? (proc.name || `Processo ${proc.id}`) : `P${proc.id}`}
                      </span>
                      <span 
                        className="font-bold text-slate-500 leading-tight mt-0.5"
                        style={{
                          fontSize: `${Math.round((isProjectionMode ? 10 : 9) * scale)}px`
                        }}
                      >
                        Pri: {proc.priority}
                      </span>
                      <span 
                        className="font-mono font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded mt-0.5 leading-none"
                        style={{
                          fontSize: `${Math.round((isProjectionMode ? 10 : 8) * scale)}px`,
                          padding: `${Math.max(1, Math.round(scale * 1.5))}px ${Math.max(2, Math.round(scale * 3.5))}px`
                        }}
                      >
                        T: {proc.remainingTime}s
                      </span>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
