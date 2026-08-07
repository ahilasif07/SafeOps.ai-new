import React, { useState, useEffect, useRef } from 'react';
import { User, ChevronDown, Check } from 'lucide-react';

interface Worker {
  id: number;
  full_name: string;
  worker_code: string;
  role: string;
  department: string;
  clearance_level: number;
  is_active: boolean;
}

interface WorkerSwitcherProps {
  workers: Worker[];
  selectedWorkerId: number | null;
  onSelect: (id: number | null) => void;
}

export function WorkerSwitcher({ workers, selectedWorkerId, onSelect }: WorkerSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeWorkers = workers.filter(w => w.is_active);
  const current = activeWorkers.find(w => w.id === selectedWorkerId) ?? null;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSelect = (id: number) => {
    onSelect(id);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative" style={{ minWidth: '280px', maxWidth: '420px', width: '100%' }}>

      {/* Trigger card */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full bg-slate-800 border transition-colors text-left flex items-center gap-3 ${
          open ? 'border-amber-500/60' : 'border-slate-700 hover:border-slate-600'
        }`}
        style={{ borderRadius: '14px', padding: '10px 14px', minHeight: '60px' }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {/* Icon */}
        <div className="bg-slate-700 rounded-lg flex items-center justify-center shrink-0" style={{ width: '36px', height: '36px' }}>
          <User className="w-4 h-4 text-amber-400" />
        </div>

        {/* Worker info */}
        <div className="flex-1 min-w-0">
          {current ? (
            <>
              <div className="flex items-center gap-2">
                <span
                  className="text-slate-100 font-semibold text-sm"
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {current.full_name}
                </span>
                <span
                  className="bg-amber-500/15 text-amber-300 border border-amber-500/25 font-bold shrink-0"
                  style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', whiteSpace: 'nowrap' }}
                >
                  L{current.clearance_level}
                </span>
              </div>
              <p
                className="text-slate-500 mt-0.5"
                style={{ fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {current.role} · {current.department}
              </p>
            </>
          ) : (
            <span className="text-slate-500 text-sm italic">Select worker</span>
          )}
        </div>

        {/* Arrow */}
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 left-0 bg-slate-800 border border-slate-700 shadow-2xl z-50 overflow-hidden"
          style={{ borderRadius: '14px', marginTop: '6px', maxHeight: '320px', overflowY: 'auto' }}
          role="listbox"
        >
          {activeWorkers.length === 0 ? (
            <div className="px-4 py-4 text-xs text-slate-400 text-center leading-relaxed">
              No workers available.<br />
              <span className="text-slate-500">Add a worker in Worker Management.</span>
            </div>
          ) : (
            activeWorkers.map((w, i) => {
              const isSelected = w.id === selectedWorkerId;
              return (
                <button
                  key={w.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(w.id)}
                  className={`w-full text-left flex items-center gap-3 transition-colors ${
                    isSelected
                      ? 'bg-amber-500/10 text-slate-100'
                      : 'text-slate-300 hover:bg-slate-700/60'
                  } ${i > 0 ? 'border-t border-slate-700/50' : ''}`}
                  style={{ padding: '10px 14px' }}
                >
                  {/* Avatar initial */}
                  <div
                    className={`rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                      isSelected ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-400'
                    }`}
                    style={{ width: '32px', height: '32px' }}
                  >
                    {w.full_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-semibold text-sm"
                        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {w.full_name}
                      </span>
                      <span
                        className={`font-bold shrink-0 border ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-slate-700 text-slate-400 border-slate-600'
                        }`}
                        style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', whiteSpace: 'nowrap' }}
                      >
                        L{w.clearance_level}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-0.5" style={{ fontSize: '11px' }}>
                      {w.role} · {w.department}
                    </p>
                  </div>

                  {/* Check */}
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
