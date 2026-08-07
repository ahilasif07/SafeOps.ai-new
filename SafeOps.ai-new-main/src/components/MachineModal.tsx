import React, { useState, useCallback } from 'react';
import { Radio, X, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface MachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

function generateCode() {
  return `MCH-${Math.floor(1000 + Math.random() * 9000)}`;
}

function parseError(status: number, text: string): string {
  // Try JSON first
  try {
    const json = JSON.parse(text);
    const detail: string = typeof json.detail === 'string'
      ? json.detail
      : Array.isArray(json.detail)
        ? json.detail.map((e: any) => e.msg || JSON.stringify(e)).join('; ')
        : 'Failed to register machine.';

    const d = detail.toLowerCase();
    if (d.includes('machine_code') || d.includes('unique') || d.includes('already exists')) {
      return 'Machine code already exists. Use a different machine code.';
    }
    return detail;
  } catch {}

  // Plain text fallback
  if (status === 500) return 'Server error. Check if the machine code is unique and all fields are valid.';
  if (status === 422) return 'Validation error. Please check all fields.';
  if (status === 404) return 'Machine registration endpoint not found.';
  return 'Failed to register machine. Please try again.';
}

export function MachineModal({ isOpen, onClose, onSaveSuccess }: MachineModalProps) {
  const [machineCode, setMachineCode] = useState(generateCode);
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [location, setLocation] = useState('Sector A');
  const [status, setStatus] = useState<'OPERATIONAL' | 'MAINTENANCE' | 'HAZARDOUS' | 'OFFLINE'>('OPERATIONAL');
  const [safetyRating, setSafetyRating] = useState<number>(90);
  const [requiresLoto, setRequiresLoto] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setMachineCode(generateCode());
    setName(''); setModel('');
    setLocation('Sector A'); setStatus('OPERATIONAL');
    setSafetyRating(90); setRequiresLoto(true);
    setErrorMsg(null); setSuccessMsg(null);
  };

  const handleClose = () => {
    if (isSubmitting) return; // block close during submission
    resetForm();
    onClose();
  };

  const handleSafetyRating = (val: string) => {
    const n = Number(val);
    if (isNaN(n)) return;
    setSafetyRating(Math.min(100, Math.max(0, n)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // hard guard against double submit

    if (!name.trim()) { setErrorMsg('Machine name is required.'); return; }
    if (!model.trim()) { setErrorMsg('Model / serial is required.'); return; }
    if (!machineCode.trim()) { setErrorMsg('Machine code is required.'); return; }
    if (safetyRating < 0 || safetyRating > 100) { setErrorMsg('Safety rating must be between 0 and 100.'); return; }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/v1/machines/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machine_code: machineCode.trim(),
          name: name.trim(),
          model: model.trim(),
          location: location.trim(),
          status,
          safety_rating: Number(safetyRating),
          requires_loto: requiresLoto,
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        setErrorMsg(parseError(res.status, text));
        return;
      }

      // Success
      setSuccessMsg('Machine registered successfully.');
      onSaveSuccess();
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1200);

    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">Register New Industrial Machine</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Machine Code + Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Machine Code</label>
              <input
                type="text"
                value={machineCode}
                onChange={e => setMachineCode(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Location Sector</label>
              <input
                type="text"
                value={location}
                placeholder="e.g. Sector B - Fabrication"
                onChange={e => setLocation(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* Machine Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Machine Name</label>
            <input
              type="text"
              placeholder="e.g. CNC Automated Milling Lathe"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-50"
              required
            />
          </div>

          {/* Model + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Model / Serial</label>
              <input
                type="text"
                placeholder="e.g. Haas VF-4SS"
                value={model}
                onChange={e => setModel(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Initial Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                disabled={isSubmitting}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-50"
              >
                <option value="OPERATIONAL">OPERATIONAL</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="HAZARDOUS">HAZARDOUS</option>
                <option value="OFFLINE">OFFLINE</option>
              </select>
            </div>
          </div>

          {/* Safety Rating + LOTO */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Safety Rating (0 – 100)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={safetyRating}
                onChange={e => handleSafetyRating(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold focus:outline-none focus:border-amber-500 disabled:opacity-50"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={requiresLoto}
                  onChange={e => setRequiresLoto(e.target.checked)}
                  disabled={isSubmitting}
                  className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500 w-4 h-4 accent-amber-500"
                />
                <span>Mandatory LOTO Protocol</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!successMsg}
              className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{isSubmitting ? 'Saving...' : 'Save Machine'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
