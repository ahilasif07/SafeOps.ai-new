import React, { useState } from 'react';
import { User, X, Plus, AlertTriangle, CheckCircle2, Info, Briefcase } from 'lucide-react';

interface WorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

// Job roles — only GENERAL has no locked department
const JOB_ROLES = [
  {
    value: 'Mechanical Engineer',
    lockedDept: 'MECHANICAL',
    description: 'Maintains and repairs mechanical machinery and equipment.',
    defaultDept: 'MECHANICAL',
  },
  {
    value: 'Electrical Engineer',
    lockedDept: 'ELECTRICAL',
    description: 'Handles electrical systems, wiring, motors, and electrical safety.',
    defaultDept: 'ELECTRICAL',
  },
  {
    value: 'Plant Operator',
    lockedDept: 'PLANT_OPS',
    description: 'Operates production machinery and monitors plant processes.',
    defaultDept: 'PLANT_OPS',
  },
  {
    value: 'Safety Officer',
    lockedDept: 'SAFETY_DEPT',
    description: 'Monitors workplace safety, incidents, compliance, and inspections.',
    defaultDept: 'SAFETY_DEPT',
  },
  {
    value: 'Chemical Engineer',
    lockedDept: 'CHEMICAL',
    description: 'Handles chemical processes, hazardous substances, and process safety.',
    defaultDept: 'CHEMICAL',
  },
  {
    value: 'IT Support',
    lockedDept: 'IT',
    description: 'Maintains computers, networks, software, and digital systems.',
    defaultDept: 'IT',
  },
  {
    value: 'General Worker',
    lockedDept: null, // no lock — user picks freely
    description: 'Performs general operational or support tasks. Can belong to any valid department.',
    defaultDept: null,
  },
] as const;

type JobRole = typeof JOB_ROLES[number];

const DEPARTMENTS = [
  'ELECTRICAL',
  'MECHANICAL',
  'PLANT_OPS',
  'SAFETY_DEPT',
  'CHEMICAL',
  'IT',
  'MAINTENANCE',
];

const CLEARANCE_OPTIONS = [
  { value: 1, label: '1 — Basic access and low-risk work' },
  { value: 2, label: '2 — Standard maintenance work' },
  { value: 3, label: '3 — Specialised or high-risk maintenance' },
  { value: 4, label: '4 — Senior technical or safety authority' },
  { value: 5, label: '5 — Supervisor approval authority' },
];

const SYSTEM_ROLES = ['TECHNICIAN', 'SUPERVISOR', 'SAFETY_OFFICER'];

function parseApiError(status: number, data: any): string {
  if (data?.detail && typeof data.detail === 'string') {
    const d = data.detail.toLowerCase();
    if (d.includes('worker code')) return 'A worker with this worker code already exists.';
    if (d.includes('email') || d.includes('unique')) return 'A worker with this email already exists.';
    return data.detail;
  }
  if (Array.isArray(data?.detail)) return data.detail.map((e: any) => e.msg || JSON.stringify(e)).join('; ');
  if (status === 404) return 'Worker creation endpoint not found.';
  return 'Unable to create worker. Please try again.';
}

function generateWorkerCode(): string {
  return `WRK-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function WorkerModal({ isOpen, onClose, onSaveSuccess }: WorkerModalProps) {
  const [workerCode, setWorkerCode] = useState(generateWorkerCode());
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [jobRole, setJobRole] = useState<JobRole>(JOB_ROLES[0]); // Mechanical Engineer default
  const [department, setDepartment] = useState('MECHANICAL');
  const [systemRole, setSystemRole] = useState('TECHNICIAN');
  const [clearanceLevel, setClearanceLevel] = useState(1);
  const [password] = useState('SafeOpsPass2026!');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isGeneralWorker = jobRole.lockedDept === null;

  const resetForm = () => {
    setWorkerCode(generateWorkerCode());
    setFullName(''); setEmail('');
    setJobRole(JOB_ROLES[0]);
    setDepartment('MECHANICAL');
    setSystemRole('TECHNICIAN');
    setClearanceLevel(1);
    setIsActive(true);
    setErrorMsg(null); setSuccessMsg(null);
  };

  const handleClose = () => { resetForm(); onClose(); };

  // When job role changes: auto-set department for specialised roles, leave it alone for General Worker
  const handleJobRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = JOB_ROLES.find(r => r.value === e.target.value);
    if (!selected) return;
    setJobRole(selected);
    if (selected.lockedDept !== null) {
      // Specialised role — auto-set department
      setDepartment(selected.lockedDept);
    }
    // General Worker — do NOT touch department, user keeps whatever they had
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { setErrorMsg('Full name is required.'); return; }
    if (!email.trim()) { setErrorMsg('Email address is required.'); return; }
    if (!workerCode.trim()) { setErrorMsg('Worker code is required.'); return; }

    setIsSubmitting(true); setErrorMsg(null); setSuccessMsg(null);

    try {
      const res = await fetch('/api/v1/workers/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker_code: workerCode.trim(),
          full_name: fullName.trim(),
          email: email.trim(),
          department,
          role: systemRole,
          clearance_level: Number(clearanceLevel),
          is_active: isActive,
          password,
        }),
      });

      let data: any = null;
      try { data = await res.json(); } catch {}

      if (!res.ok) { setErrorMsg(parseApiError(res.status, data)); return; }

      setSuccessMsg('Worker profile created successfully.');
      onSaveSuccess();
      setTimeout(() => { handleClose(); }, 1500);
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">Add New Worker / Technician Profile</h2>
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

          {/* Worker Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Worker Code</label>
            <input type="text" value={workerCode} onChange={e => setWorkerCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500" required />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
            <input type="text" placeholder="e.g. Marcus Vance" value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500" required />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
            <input type="email" placeholder="worker@company.com" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500" required />
          </div>

          {/* Job Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" /> Job Role
            </label>
            <select value={jobRole.value} onChange={handleJobRoleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500">
              {JOB_ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.value}</option>
              ))}
            </select>
            {/* Description under job role */}
            <div className="mt-1.5 px-1 flex items-start gap-1.5 text-[11px] text-slate-500 leading-relaxed">
              <Info className="w-3 h-3 shrink-0 mt-0.5 text-slate-600" />
              <span>
                {jobRole.description}
                {jobRole.lockedDept
                  ? <span className="text-slate-600"> Default department: <span className="text-amber-500/70 font-mono">{jobRole.lockedDept}</span>.</span>
                  : <span className="text-amber-400/80"> Select department below.</span>
                }
              </span>
            </div>
          </div>

          {/* Department — always shown; locked for specialised roles, free for General Worker */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Department</label>
            {isGeneralWorker ? (
              <>
                <select value={department} onChange={e => setDepartment(e.target.value)}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500">
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <p className="text-[10px] text-amber-400/70 mt-1 px-1">General Worker — choose any department.</p>
              </>
            ) : (
              <>
                <div className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 cursor-not-allowed select-none">
                  {department}
                </div>
                <p className="text-[10px] text-slate-600 mt-1 px-1">Auto-assigned for this job role.</p>
              </>
            )}
          </div>

          {/* System Role + Clearance */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">System Role</label>
              <select value={systemRole} onChange={e => {
                const r = e.target.value;
                setSystemRole(r);
                if (r === 'SUPERVISOR') setClearanceLevel(5);
              }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500">
                {SYSTEM_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Clearance Level</label>
              {systemRole === 'SUPERVISOR' ? (
                <div className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 cursor-not-allowed">
                  L5 — Auto-assigned for Supervisor
                </div>
              ) : (
                <select value={clearanceLevel} onChange={e => setClearanceLevel(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500">
                  {CLEARANCE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-amber-500" />
            <label htmlFor="isActive" className="text-xs text-slate-400">Active worker (can be assigned tasks)</label>
          </div>

          <div className="flex items-start gap-1.5 text-xs text-slate-500">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Clearance level determines which procedures and tasks the worker is authorised to perform.</span>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button type="button" onClick={handleClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition">Cancel</button>
            <button type="submit" disabled={isSubmitting || !!successMsg}
              className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed">
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{isSubmitting ? 'Saving...' : 'Create Worker'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
