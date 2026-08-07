import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: number | string;
  label: string;
  sublabel?: string;
  badge?: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: number | string;
  onChange: (value: any) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  className = "",
  icon
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-sync value if options exist but current value is invalid or desynced
  useEffect(() => {
    if (options.length > 0) {
      const match = options.find(o => String(o.value) === String(value));
      if (!match) {
        onChange(options[0].value);
      }
    }
  }, [options, value, onChange]);

  const selectedOption = options.find(o => String(o.value) === String(value)) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optValue: number | string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left w-full ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-950 border border-slate-700 hover:border-amber-500/50 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all cursor-pointer shadow-sm text-left"
      >
        <div className="flex items-center gap-2 truncate pr-2">
          {icon}
          <span className="truncate text-amber-300 font-bold">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono shrink-0 border border-slate-700">
              {selectedOption.badge}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-amber-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Menu */}
      {isOpen && (
        <div className="absolute z-[100] mt-1.5 w-full min-w-[220px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-1 space-y-0.5">
            {options.length === 0 ? (
              <div className="p-3 text-xs text-slate-400 text-center">{placeholder}</div>
            ) : (
              options.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold">{opt.label}</div>
                      {opt.sublabel && (
                        <div className="text-[10px] text-slate-400 font-normal">{opt.sublabel}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.5 rounded font-mono">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-amber-400 stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {selectedOption?.sublabel && !isOpen && (
        <p className="text-[10px] text-slate-400 mt-1 pl-1 truncate">
          {selectedOption.sublabel}
        </p>
      )}
    </div>
  );
}


