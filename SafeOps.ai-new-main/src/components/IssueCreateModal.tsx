import React, { useState, useEffect } from 'react';
import { Bug, X, Plus, AlertTriangle, Search, ShieldAlert, Cpu, CheckCircle2 } from 'lucide-react';
import { Machine, Worker } from '../types';

interface DuplicateMatch {
  issue_id: number;
  issue_code: string;
  title: string;
  description: string;
  machine_id?: number;
  machine_name?: string;
  status: string;
  priority: string;
  created_at: string;
  similarity_score: number;
  similarity_percentage: number;
}

interface DuplicateCheckResult {
  is_possible_duplicate: boolean;
  threshold_used: number;
  existing_issue_id?: number;
  existing_issue_code?: string;
  similarity_score: number;
  similarity_percentage: number;
  top_match?: DuplicateMatch;
  all_matches: DuplicateMatch[];
}

interface IssueCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  machines: Machine[];
  workers: Worker[];
  currentWorkerId?: number;
}

const DEPARTMENTS = ['PLANT_OPS', 'ELECTRICAL', 'MECHANICAL', 'SAFETY_DEPT', 'CHEMICAL'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const STATUSES = ['Open', 'In Progress', 'Waiting', 'Resolved', 'Closed'] as const;

async function safeParseError(res: Response): Promise<string> {
  const ct = res.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) {
      const json = await res.json();
      if (typeof json.detail === 'string') return json.detail;
      if (Array.isArray(json.detail)) return json.detail.map((e: any) => e.msg || JSON.stringify(e)).join('; ');
    }
    const text = await res.text();
    return text.length < 300 ? text : `Server error (${res.status})`;
  } catch {
    return `Server error (${res.status})`;
  }
}

function generateCode() {
  return `ISS-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function IssueCreateModal({
  isOpen, onClose, onSaveSuccess, machines, workers, currentWorkerId
}: IssueCreateModalProps) {
  const [issueCode, setIssueCode] = useState(generateCode);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [machineId, setMachineId] = useState<number | undefined>(undefined);
  const [department, setDepartment] = useState('PLANT_OPS');
  const [priority, setPriority] = useState<typeof PRIORITIES[number]>('MEDIUM');
  const [status, setStatus] = useState<typeof STATUSES[number]>('Open');
  const [reporterId, setReporterId] = useState<number | undefined>(currentWorkerId);
  const [assignedWorkerId, setAssignedWorkerId] = useState<number | undefined>(undefined);
  const [assignedSupervisorId, setAssignedSupervisorId] = useState<number | undefined>(undefined);
  const [dueDate, setDueDate] = useState('');

  const [threshold, setThreshold] = useState(0.55);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [bypassWarning, setBypassWarning] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Debounced duplicate detection
  useEffect(() => {
    if (!title.trim() || title.length < 3) { setDuplicateResult(null); return; }
    const timer = setTimeout(async () => {
      setIsCheckingDuplicates(true);
      try {
        const res = await fetch('/api/v1/issues/check-duplicates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            machine_id: machineId ? Number(machineId) : undefined,
            threshold: Number(threshold),
          }),
        });
        if (res.ok) {
          const data: DuplicateCheckResult = await res.json();
          setDuplicateResult(data);
          if (data.is_possible_duplicate) setBypassWarning(false);
        }
      } catch { /* silent — non-critical */ }
      finally { setIsCheckingDuplicates(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [title, description, machineId, threshold]);

  if (!isOpen) return null;

  const resetForm = () => {
    setIssueCode(generateCode());
    setTitle(''); setDescription('');
    setMachineId(undefined); setDepartment('PLANT_OPS');
    setPriority('MEDIUM'); setStatus('Open');
    setReporterId(currentWorkerId); setAssignedWorkerId(undefined);
    setAssignedSupervisorId(undefined); setDueDate('');
    setDuplicateResult(null); setBypassWarning(false);
    setErrorMsg(null); setSuccessMsg(null);
  };

  const handleClose = () => { if (isSubmitting) return; resetForm(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!title.trim()) { setErrorMsg('Issue title is required.'); return; }
    if (!description.trim()) { setErrorMsg('Description is required.'); return; }
    if (!machineId) { setErrorMsg('Machine is required.'); return; }
    if (!reporterId) { setErrorMsg('Reporter is required.'); return; }
    if ((priority === 'HIGH' || priority === 'CRITICAL') && !assignedSupervisorId) {
      setErrorMsg('Supervisor is required for HIGH or CRITICAL priority issues.'); return;
    }
    if (dueDate && new Date(dueDate) < new Date(new Date().toDateString())) {
      setErrorMsg('Due date cannot be in the past.'); return;
    }
    if (status === 'Closed' && !description.trim()) {
      setErrorMsg('A resolution note is required when closing an issue.'); return;
    }

    if (duplicateResult?.is_possible_duplicate && !bypassWarning) {
      setBypassWarning(true);
      setErrorMsg('Possible duplicate detected. Review the warning above and click "Create Issue" again to proceed.');
      return;
    }

    setIsSubmitting(true); setErrorMsg(null);

    try {
      const payload: Record<string, any> = {
        issue_code: issueCode.trim(),
        title: title.trim(),
        description: description.trim(),
        department,
        priority,
        status,
      };
      if (machineId) payload.machine_id = Number(machineId);
      if (reporterId) payload.reporter_id = Number(reporterId);
      if (assignedWorkerId) payload.assigned_worker_id = Number(assignedWorkerId);
      if (assignedSupervisorId) payload.assigned_supervisor_id = Number(assignedSupervisorId);
      if (dueDate) payload.due_date = new Date(dueDate).toISOString();

      const res = await fetch('/api/v1/issues/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await safeParseError(res);
        setErrorMsg(msg); return;
      }

      setSuccessMsg('Issue logged successfully.');
      onSaveSuccess();
      setTimeout(() => { resetForm(); onClose(); }, 1200);
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">Log Industrial Issue</h2>
          </div>
          <button onClick={handleClose} disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition disabled:opacity-40">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
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

          {/* Duplicate Detection */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200">Duplicate Detection</span>
                <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Fuzzy String Matching</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[10px] text-slate-400">Threshold:</span>
                <input type="range" min="0.30" max="0.90" step="0.05" value={threshold}
                  onChange={e => setThreshold(parseFloat(e.target.value))}
                  className="w-20 accent-amber-500 cursor-pointer" />
                <span className="text-amber-400 font-mono font-bold text-xs">{Math.round(threshold * 100)}%</span>
              </div>
            </div>

            {isCheckingDuplicates ? (
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-400 animate-spin" />
                <span>Scanning for duplicate issues...</span>
              </div>
            ) : duplicateResult?.is_possible_duplicate ? (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/40 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Possible Duplicate Detected</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    {duplicateResult.similarity_percentage}% match
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
                  <span className="text-amber-400 font-mono font-bold text-[11px]">#{duplicateResult.existing_issue_id} — {duplicateResult.existing_issue_code}</span>
                  <p className="font-bold text-slate-100">{duplicateResult.top_match?.title}</p>
                  <p className="text-slate-400 line-clamp-2">{duplicateResult.top_match?.description}</p>
                  <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                    <span>Status: <strong className="text-amber-300">{duplicateResult.top_match?.status}</strong></span>
                    <span>{duplicateResult.top_match?.machine_name ?? 'General Facility'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 italic">You can still proceed if this is a distinct issue.</span>
                  <button type="button" onClick={() => setBypassWarning(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      bypassWarning ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                    }`}>
                    {bypassWarning ? '✓ Acknowledged' : 'Acknowledge & Continue'}
                  </button>
                </div>
              </div>
            ) : title.trim().length >= 3 ? (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                No duplicates found above {Math.round(threshold * 100)}% threshold.
              </div>
            ) : null}
          </div>

          {/* Code + Department */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Issue Code</label>
              <input type="text" value={issueCode} onChange={e => setIssueCode(e.target.value)} disabled={isSubmitting}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500 disabled:opacity-50" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Department</label>
              <select value={department} onChange={e => setDepartment(e.target.value)} disabled={isSubmitting}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-50">
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Issue Title <span className="text-rose-400">*</span></label>
            <input type="text" placeholder="e.g. Hydraulic pressure dropping below 500 PSI on Press 4"
              value={title} onChange={e => setTitle(e.target.value)} disabled={isSubmitting}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-50" required />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Description <span className="text-rose-400">*</span></label>
            <textarea rows={3} placeholder="Describe symptoms, safety hazards, equipment behavior..."
              value={description} onChange={e => setDescription(e.target.value)} disabled={isSubmitting}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none disabled:opacity-50" required />
          </div>

          {/* Machine + Priority + Status */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Target Machine</label>
              <select value={machineId ?? ''} onChange={e => setMachineId(e.target.value ? Number(e.target.value) : undefined)} disabled={isSubmitting}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-50">
                <option value="">None / Facility</option>
                {machines.map(m => <option key={m.id} value={m.id}>{m.name} ({m.machine_code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as any)} disabled={isSubmitting}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-50">
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Initial Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as any)} disabled={isSubmitting}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-50">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Reporter + Assigned Worker + Supervisor */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Reporter</label>
              <select value={reporterId ?? ''} onChange={e => setReporterId(e.target.value ? Number(e.target.value) : undefined)} disabled={isSubmitting}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-50">
                <option value="">— None —</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Assigned Worker</label>
              <select value={assignedWorkerId ?? ''} onChange={e => setAssignedWorkerId(e.target.value ? Number(e.target.value) : undefined)} disabled={isSubmitting}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-50">
                <option value="">Unassigned</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Supervisor</label>
              <select value={assignedSupervisorId ?? ''} onChange={e => setAssignedSupervisorId(e.target.value ? Number(e.target.value) : undefined)} disabled={isSubmitting}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-50">
                <option value="">None</option>
                {workers.filter(w => w.role === 'SUPERVISOR' || w.role === 'SAFETY_OFFICER').map(w => (
                  <option key={w.id} value={w.id}>{w.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Target Resolution Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} disabled={isSubmitting}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-50" />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 shrink-0">
            <button type="button" onClick={handleClose} disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition disabled:opacity-40">Cancel</button>
            <button type="submit" disabled={isSubmitting || !!successMsg}
              className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed">
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{isSubmitting ? 'Logging...' : 'Create Issue'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
