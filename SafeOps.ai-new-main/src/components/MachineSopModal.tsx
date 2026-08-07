import React, { useState, useEffect } from 'react';
import { X, BookOpen, Plus, Trash2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Machine, Procedure } from '../types';

interface MachineSopModalProps {
  isOpen: boolean;
  onClose: () => void;
  machine: Machine | null;
}

export function MachineSopModal({ isOpen, onClose, machine }: MachineSopModalProps) {
  const [assignedSops, setAssignedSops] = useState<Procedure[]>([]);
  const [allProcedures, setAllProcedures] = useState<Procedure[]>([]);
  const [selectedProcId, setSelectedProcId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && machine) {
      loadData();
    }
  }, [isOpen, machine]);

  const loadData = async () => {
    if (!machine) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const [assignedRes, allRes] = await Promise.all([
        fetch(`/api/v1/machines/${machine.id}/sops/`),
        fetch(`/api/v1/procedures/`)
      ]);

      if (assignedRes.ok) {
        const data = await assignedRes.json();
        setAssignedSops(Array.isArray(data) ? data : []);
      }

      if (allRes.ok) {
        const data = await allRes.json();
        setAllProcedures(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching machine SOPs:', err);
      setErrorMsg('Failed to load machine SOP assignments.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !machine) return null;

  const handleAssignSop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProcId) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/v1/machines/${machine.id}/sops/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ procedure_id: parseInt(selectedProcId, 10) })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('SOP successfully assigned to machine!');
        setSelectedProcId('');
        loadData();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(data.detail || 'Failed to assign SOP to machine.');
      }
    } catch (err) {
      console.error('Error assigning SOP:', err);
      setErrorMsg('Network error assigning SOP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassignSop = async (procedureId: number) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/v1/machines/${machine.id}/sops/${procedureId}/`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setSuccessMsg('SOP unassigned from machine.');
        setAssignedSops(prev => prev.filter(p => p.id !== procedureId));
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        const data = await res.json();
        setErrorMsg(data.detail || 'Failed to unassign SOP.');
      }
    } catch (err) {
      console.error('Error unassigning SOP:', err);
      setErrorMsg('Network error unassigning SOP.');
    }
  };

  const unassignedOptions = allProcedures.filter(p => !assignedSops.some(a => a.id === p.id));

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Assigned Standard Operating Procedures (SOPs)</h2>
              <p className="text-xs text-slate-400">{machine.name} ({machine.machine_code})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-400 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Assign Form */}
          <form onSubmit={handleAssignSop} className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
            <label className="block text-xs font-bold text-slate-300">
              Assign New SOP to Machine
            </label>
            <div className="flex items-center gap-2">
              <select
                value={selectedProcId}
                onChange={e => setSelectedProcId(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Select SOP / Procedure --</option>
                {unassignedOptions.map(proc => (
                  <option key={proc.id} value={proc.id}>
                    {proc.procedure_code} - {proc.title} (Level {proc.required_clearance_level})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={submitting || !selectedProcId}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>{submitting ? 'Assigning...' : 'Assign SOP'}</span>
              </button>
            </div>
          </form>

          {/* Assigned List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Currently Assigned SOPs ({assignedSops.length})</span>
            </h3>

            {loading ? (
              <div className="text-center py-6 text-slate-400 text-xs">Loading assigned SOPs...</div>
            ) : assignedSops.length === 0 ? (
              <div className="text-center py-8 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                No SOPs currently assigned to this machine.
              </div>
            ) : (
              <div className="space-y-2">
                {assignedSops.map(sop => (
                  <div key={sop.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400">{sop.procedure_code}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-full border border-slate-700">
                          Clearance Lvl {sop.required_clearance_level}
                        </span>
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 font-semibold px-2 py-0.5 rounded-full border border-amber-500/20">
                          v{sop.version}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-200">{sop.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{sop.description}</p>
                    </div>

                    <button
                      onClick={() => handleUnassignSop(sop.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      title="Unassign SOP from machine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
