import React, { useState } from 'react';
import { X, ArrowRightLeft, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { Worker, Machine } from '../types';

interface HandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  workers: Worker[];
  machines: Machine[];
  currentWorkerId?: number;
}

const URGENCY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'bg-slate-800 text-slate-300 border-slate-700' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  { value: 'HIGH', label: 'High', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
];

export function HandoverModal({ isOpen, onClose, onSaveSuccess, workers, machines, currentWorkerId }: HandoverModalProps) {
  const [title, setTitle] = useState('');
  const [machineId, setMachineId] = useState<number | ''>('');
  const [department, setDepartment] = useState('MECHANICAL');
  const [urgency, setUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [currentStatus, setCurrentStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [toShift, setToShift] = useState<'MORNING' | 'AFTERNOON' | 'NIGHT'>('MORNING');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const reset = () => {
    setTitle(''); setMachineId(''); setDepartment('MECHANICAL');
    setUrgency('MEDIUM'); setCurrentStatus(''); setNotes('');
    setToShift('MORNING'); setErrorMsg(null); setSuccessMsg(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentStatus.trim()) {
      setErrorMsg('Title and current status are required.');
      return;
    }
    setIsSubmitting(true); setErrorMsg(null);
    try {
      const res = await fetch('/api/v1/handovers/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          machine_id: machineId || null,
          department,
          urgency,
          current_status: currentStatus.trim(),
          notes: notes.trim(),
          to_shift: toShift,
          reporter_id: currentWorkerId || null,
          status: 'NEW',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data?.detail || 'Failed to submit handover report.');
        return;
      }

      setSuccessMsg('Handover report submitted successfully.');
      onSaveSuccess();
      setTimeout(() => handleClose(), 1500);
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">

        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">Submit Shift Handover Report</h2>
          </div>
          <button type="button" onClick={handleClose} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" /><span>{successMsg}</span>
            </div>
          )}

          {/* Issue Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Issue Title <span className="text-rose-400">*</span></label>
            <input type="text" placeholder="e.g. Machine 2 overheating near motor"
              value={title} onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500" required />
          </div>

          {/* Machine + Department */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Machine</label>
              <select value={machineId} onChange={e => setMachineId(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500">
                <option value="">— General / No Machine —</option>
                {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Department</label>
              <select value={department} onChange={e => setDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500">
                <option value="MECHANICAL">MECHANICAL</option>
                <option value="ELECTRICAL">ELECTRICAL</option>
                <option value="PLANT_OPS">PLANT_OPS</option>
                <option value="SAFETY_DEPT">SAFETY_DEPT</option>
                <option value="CHEMICAL">CHEMICAL</option>
              </select>
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Urgency Level</label>
            <div className="flex gap-2">
              {URGENCY_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setUrgency(opt.value as any)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                    urgency === opt.value ? opt.color : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hand to shift */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Hand Over To</label>
            <div className="flex gap-2">
              {(['MORNING', 'AFTERNOON', 'NIGHT'] as const).map(s => (
                <button key={s} type="button" onClick={() => setToShift(s)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                    toShift === s
                      ? s === 'MORNING' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : s === 'AFTERNOON' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700'
                  }`}>
                  {s === 'MORNING' ? '🌅' : s === 'AFTERNOON' ? '🌤' : '🌙'} {s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Current Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Current Status <span className="text-rose-400">*</span></label>
            <input type="text" placeholder="e.g. Unresolved — motor still overheating, power not cut"
              value={currentStatus} onChange={e => setCurrentStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500" required />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Additional Notes</label>
            <textarea placeholder="Any extra info for the next shift..."
              value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none" />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button type="button" onClick={handleClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition">Cancel</button>
            <button type="submit" disabled={isSubmitting || !!successMsg}
              className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition flex items-center gap-1.5 disabled:opacity-60">
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Handover'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
