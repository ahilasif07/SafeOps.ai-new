import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  FileText, 
  Wrench, 
  Users, 
  CheckSquare, 
  AlertTriangle, 
  Cpu, 
  Search, 
  Play, 
  Lock, 
  Unlock, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles, 
  Plus, 
  ChevronRight,
  ShieldCheck,
  Zap,
  HardHat,
  Thermometer,
  Gauge,
  Radio,
  UserCheck,
  Award,
  Edit3,
  Eye,
  Upload,
  Bug,
  MessageSquare,
  Paperclip,
  Building2,
  Calendar,
  Filter,
  Trash2,
  Ban,
  Link2,
  Briefcase,
  Moon,
  Sun,
  Sunset,
  X,
} from 'lucide-react';
import { Worker, Machine, Procedure, Task, Incident, SupervisorApproval, SensorReading, SafetyEvalResponse, RiskFactorDetail, Issue } from './types';
import { CustomSelect } from './components/CustomSelect';
import { SopModal } from './components/SopModal';
import { SopDetailModal } from './components/SopDetailModal';
import { MachineModal } from './components/MachineModal';
import { WorkerModal } from './components/WorkerModal';
import { IssueCreateModal } from './components/IssueCreateModal';
import { IssueDetailModal } from './components/IssueDetailModal';
import { WorkerSwitcher } from './components/WorkerSwitcher';
import { SensorEditModal } from './components/SensorEditModal';
import { MachineSopModal } from './components/MachineSopModal';
import { SensorRangeModal } from './components/SensorRangeModal';


export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'machines' | 'sops' | 'workers' | 'approvals' | 'incidents' | 'issues'>('overview');
  
  // App State from API
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [approvals, setApprovals] = useState<SupervisorApproval[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Certifications State
  const [allCerts, setAllCerts] = useState<any[]>([]);
  const [workerCerts, setWorkerCerts] = useState<Record<number, any[]>>({});
  const [expandedWorkerCerts, setExpandedWorkerCerts] = useState<number | null>(null);
  const [showAddCertModal, setShowAddCertModal] = useState<number | null>(null);
  const [certForm, setCertForm] = useState({ certification_id: '', issued_date: '', expiry_date: '' });
  // Per-worker cert assignment state (moved out of conditional render)
  const [assignCertSelectedIds, setAssignCertSelectedIds] = useState<number[]>([]);
  const [assignCertError, setAssignCertError] = useState<string | null>(null);
  const [assignCertSaving, setAssignCertSaving] = useState(false);
  // Per-certificate dates: { [certId]: { issued_date: string, expiry_date: string } }
  const [assignCertDates, setAssignCertDates] = useState<Record<number, { issued_date: string; expiry_date: string }>>({});

  // Create Certification Type state
  const [showCreateCertForm, setShowCreateCertForm] = useState(false);
  const [newCert, setNewCert] = useState({ code: '', name: '', description: '', validity_months: 24, issuing_body: 'OSHA Safety Institute' });
  const [createCertError, setCreateCertError] = useState<string | null>(null);
  const [createCertSuccess, setCreateCertSuccess] = useState<string | null>(null);
  const [createCertSubmitting, setCreateCertSubmitting] = useState(false);

  // Job Roles State
  const jobRoles = [
    { id: 1, title: 'Mechanical Engineer', department: 'MECHANICAL' },
    { id: 2, title: 'Electrical Engineer', department: 'ELECTRICAL' },
    { id: 3, title: 'Plant Operator', department: 'PLANT_OPS' },
    { id: 4, title: 'Safety Officer', department: 'SAFETY_DEPT' },
    { id: 5, title: 'Chemical Engineer', department: 'CHEMICAL' },
    { id: 6, title: 'IT Support', department: 'IT' },
    { id: 7, title: 'General Worker', department: 'GENERAL' },
  ];


  // Incident state
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentResolutionForm, setIncidentResolutionForm] = useState<{ id: number; summary: string } | null>(null);
  const [viewIncident, setViewIncident] = useState<any | null>(null);
  const [incidentForm, setIncidentForm] = useState({
    incident_code: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
    title: '', description: '', severity: 'MEDIUM', machine_id: '',
    worker_id: '', task_id: '',
  });
  const [incidentSubmitting, setIncidentSubmitting] = useState(false);
  const [incidentError, setIncidentError] = useState<string | null>(null);
  const [incidentSuccess, setIncidentSuccess] = useState<string | null>(null);

  // Issue Tracker State
  const [showIssueCreateModal, setShowIssueCreateModal] = useState(false);
  const [selectedIssueForDetail, setSelectedIssueForDetail] = useState<Issue | null>(null);
  
  // Issue Filter State
  const [issueFilterMachine, setIssueFilterMachine] = useState<string>('ALL');
  const [issueFilterDepartment, setIssueFilterDepartment] = useState<string>('ALL');
  const [issueFilterPriority, setIssueFilterPriority] = useState<string>('ALL');
  const [issueFilterWorker, setIssueFilterWorker] = useState<string>('ALL');
  const [issueFilterStatus, setIssueFilterStatus] = useState<string>('ALL');
  
  // SOP Modals State
  const [showSopModal, setShowSopModal] = useState(false);
  const [sopToEdit, setSopToEdit] = useState<Procedure | null>(null);
  const [sopToView, setSopToView] = useState<Procedure | null>(null);

  // SOP action loading/message state
  const [sopActionLoading, setSopActionLoading] = useState<Record<number, string>>({}); // id -> 'delete'|'supersede'|'approve'|'link'
  const [sopActionMsg, setSopActionMsg] = useState<{ id: number; type: 'success' | 'error'; text: string } | null>(null);
  const [reindexing, setReindexing] = useState(false);
  const [reindexMsg, setReindexMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Machine & Worker Creation Modals
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [editMachine, setEditMachine] = useState<any | null>(null);
  const [editMachineSubmitting, setEditMachineSubmitting] = useState(false);
  const [editMachineError, setEditMachineError] = useState<string | null>(null);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  
  // AI SOP Search
  const [searchQuery, setSearchQuery] = useState('');
  const [sopSearchResults, setSopSearchResults] = useState<any[]>([]);
  const [searchingSop, setSearchingSop] = useState(false);

  // Safety Evaluation Modal State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskMachineId, setNewTaskMachineId] = useState<number | null>(null);
  const [newTaskProcedureId, setNewTaskProcedureId] = useState<number | null>(null);
  const [newTaskWorkerId, setNewTaskWorkerId] = useState<number | null>(null);
  const [compatibleProcedures, setCompatibleProcedures] = useState<Procedure[]>([]);
  const [loadingCompatible, setLoadingCompatible] = useState(false);

  // Machine sensor ranges — fetched from backend per machine
  const [machineRanges, setMachineRanges] = useState<Record<number, Record<string, {min: number; max: number}>>>({});

  const fetchMachineRanges = async (machineId: number) => {
    try {
      const res = await fetch(`/api/v1/sensors/machine/${machineId}/ranges/`);
      if (res.ok) {
        const data = await res.json();
        setMachineRanges(prev => ({ ...prev, [machineId]: data }));
      } else {
        console.warn(`[SafeOps] Could not load ranges for machine ${machineId}: ${res.status}`);
      }
    } catch (err) { console.error("[SafeOps] fetchMachineRanges failed:", err); }
  };

  // Manage SOPs modal state
  const [manageSopsMachine, setManageSopsMachine] = useState<any | null>(null);
  const [manageSopsLoading, setManageSopsLoading] = useState(false);
  const [manageSopsSaving, setManageSopsSaving] = useState(false);
  const [manageSopsMsg, setManageSopsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [manageSopsAssigned, setManageSopsAssigned] = useState<number[]>([]);

  // Ahil's dedicated modal state
  const [showMachineSopModal, setShowMachineSopModal] = useState(false);
  const [selectedMachineForSops, setSelectedMachineForSops] = useState<Machine | null>(null);
  const [showSensorRangeModal, setShowSensorRangeModal] = useState(false);
  const [selectedMachineForRanges, setSelectedMachineForRanges] = useState<Machine | null>(null); // assigned procedure ids for current machine
  const [evalResult, setEvalResult] = useState<SafetyEvalResponse | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  
  // Active Telemetry State
  const [activeMachineTelemetry, setActiveMachineTelemetry] = useState<Record<number, SensorReading[]>>({});
  const [simulating, setSimulating] = useState<number | null>(null);
  const [resetting, setResetting] = useState<number | null>(null);
  const [sensorEditMachine, setSensorEditMachine] = useState<Machine | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [issueFilterMachine, issueFilterDepartment, issueFilterPriority, issueFilterWorker, issueFilterStatus]);

  const fetchIssues = async () => {
    try {
      const params = new URLSearchParams();
      if (issueFilterMachine !== 'ALL') params.append('machine_id', issueFilterMachine);
      if (issueFilterDepartment !== 'ALL') params.append('department', issueFilterDepartment);
      if (issueFilterPriority !== 'ALL') params.append('priority', issueFilterPriority);
      if (issueFilterWorker !== 'ALL') params.append('worker_id', issueFilterWorker);
      if (issueFilterStatus !== 'ALL') params.append('status', issueFilterStatus);

      const res = await fetch(`/api/v1/issues/?${params.toString()}`);
      const data = await res.json();
      setIssues(Array.isArray(data) ? data : []);

      // Refresh selected issue if detail modal is open
      if (selectedIssueForDetail) {
        const updatedDetail = data.find((iss: Issue) => iss.id === selectedIssueForDetail.id);
        if (updatedDetail) {
          setSelectedIssueForDetail(updatedDetail);
        }
      }
    } catch (err) {
      console.error('Error fetching issues:', err);
    }
  };

  const fetchCerts = async () => {
    try {
      const res = await fetch('/api/v1/certifications/');
      const data = await res.json();
      setAllCerts(Array.isArray(data) ? data : []);
    } catch { setAllCerts([]); }
  };

  const fetchWorkerCerts = async (workerId: number) => {
    try {
      const res = await fetch(`/api/v1/certifications/worker/${workerId}`);
      const data = await res.json();
      setWorkerCerts(prev => ({ ...prev, [workerId]: Array.isArray(data) ? data : [] }));
    } catch { setWorkerCerts(prev => ({ ...prev, [workerId]: [] })); }
  };


  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [wRes, mRes, pRes, tRes, iRes, aRes] = await Promise.all([
        fetch('/api/v1/workers/').then(r => r.json()),
        fetch('/api/v1/machines/').then(r => r.json()),
        fetch('/api/v1/procedures/').then(r => r.json()),
        fetch('/api/v1/tasks/').then(r => r.json()),
        fetch('/api/v1/incidents/').then(r => r.json()),
        fetch('/api/v1/approvals/').then(r => r.json())
      ]);

      const machineList: Machine[] = Array.isArray(mRes) ? mRes : [];
      setWorkers(Array.isArray(wRes) ? wRes : []);
      setMachines(machineList);
      setProcedures(Array.isArray(pRes) ? pRes : []);
      setTasks(Array.isArray(tRes) ? tRes : []);
      setIncidents(Array.isArray(iRes) ? iRes : []);
      setApprovals(Array.isArray(aRes) ? aRes : []);

      // Load latest telemetry for every machine
      const telemetryResults = await Promise.all(
        machineList.map(m =>
          fetch(`/api/v1/sensors/machine/${m.id}?limit=100`)
            .then(r => r.ok ? r.json() : [])
            .then(data => ({ id: m.id, data: Array.isArray(data) ? data : [] }))
            .catch(() => ({ id: m.id, data: [] }))
        )
      );
      const telemetryMap: Record<number, SensorReading[]> = {};
      for (const { id, data } of telemetryResults) telemetryMap[id] = data;
      setActiveMachineTelemetry(telemetryMap);

      await Promise.all([fetchIssues(), fetchCerts()]);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Clear selected worker if they are deleted or deactivated
  useEffect(() => {
    if (selectedWorkerId === null) return;
    const found = workers.find(w => w.id === selectedWorkerId);
    if (!found || !found.is_active) {
      setSelectedWorkerId(null);
    }
  }, [workers]);

  const currentWorker = workers.find(w => w.id === selectedWorkerId) ?? null;

  const handleMachineChange = async (machineId: number) => {
    setNewTaskMachineId(machineId);
    setNewTaskProcedureId(null);
    setEvalResult(null);
    setCompatibleProcedures([]);
    if (!machineId) return;
    setLoadingCompatible(true);
    try {
      const res = await fetch(`/api/v1/machines/${machineId}/sops`);
      if (res.ok) {
        const data = await res.json();
        const approved = Array.isArray(data) ? data.filter((p: Procedure) => p.is_approved && !p.is_superseded) : [];
        setCompatibleProcedures(approved);
        // Auto-select if exactly one SOP is linked
        if (approved.length === 1) {
          setNewTaskProcedureId(approved[0].id);
        }
      } else {
        setCompatibleProcedures([]);
      }
    } catch {
      setCompatibleProcedures([]);
    } finally {
      setLoadingCompatible(false);
    }
  };

  const openManageSops = (machine: any) => {
    setSelectedMachineForSops(machine);
    setShowMachineSopModal(true);
  };

  const getMissingFields = (): string[] => {
    const missing: string[] = [];
    if (!newTaskTitle.trim()) missing.push('Task title');
    if (!newTaskDesc.trim()) missing.push('Description & scope');
    if (!newTaskMachineId) missing.push('Target machine');
    if (!newTaskProcedureId) missing.push('Standard operating procedure');
    if (!newTaskWorkerId) missing.push('Assigned worker / technician');
    return missing;
  };

  const handleEvaluateTask = async () => {
    // Guard: selected worker must still exist in current list
    if (newTaskWorkerId && !workers.find(w => w.id === newTaskWorkerId)) {
      setEvalResult(null);
      alert('The selected worker could not be found. Please choose another worker.');
      setNewTaskWorkerId(null);
      return;
    }
    setEvaluating(true);
    setEvalResult(null);
    try {
      const res = await fetch('/api/v1/safety/evaluate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker_id: newTaskWorkerId,
          machine_id: newTaskMachineId,
          procedure_id: newTaskProcedureId
        })
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('[SafetyEval] API error:', res.status, data);
        alert(data?.detail || 'Safety evaluation failed. Please try again.');
        return;
      }
      setEvalResult(data);
    } catch (err) {
      console.error("Evaluation error:", err);
      alert('Network error during safety evaluation. Is the backend running?');
    } finally {
      setEvaluating(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle || !newTaskWorkerId || !newTaskMachineId || !newTaskProcedureId) return;

    if (!evalResult) {
      return;
    }

    if (evalResult.decision === 'BLOCK') {
      console.warn('[SafeOps] Task creation blocked by risk engine.');
      return;
    }

    const isSupervisorApproval = evalResult.decision === 'SUPERVISOR_APPROVAL';

    try {
      const res = await fetch('/api/v1/tasks/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc,
          worker_id: newTaskWorkerId,
          machine_id: newTaskMachineId,
          procedure_id: newTaskProcedureId,
          priority: 'HIGH',
          composite_risk_score: (evalResult as any).composite_risk_score ?? evalResult.risk_score ?? 0,
          risk_level: evalResult.risk_level ?? 'LOW',
          is_blocked: isSupervisorApproval,
          blocking_reasons: (evalResult as any).blocking_reasons ?? evalResult.block_reasons ?? [],
          required_mitigations: (evalResult as any).required_mitigations ?? [],
          send_for_approval: isSupervisorApproval,
        })
      });

      if (!res.ok) {
        const msg = await safeParseError(res);
        console.error('[SafeOps] Task creation failed:', msg);
        alert(msg);
        return;
      }

      setShowTaskModal(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskMachineId(null);
      setNewTaskProcedureId(null);
      setNewTaskWorkerId(null);
      setCompatibleProcedures([]);
      setEvalResult(null);
      fetchInitialData();
    } catch (err) {
      console.error('Task creation failed:', err);
      alert('Network error during task creation. Please try again.');
    }
  };

  // Safe response parser — never throws "Unexpected token"
  const safeParseError = async (res: Response): Promise<string> => {
    const ct = res.headers.get('content-type') || '';
    try {
      if (ct.includes('application/json')) {
        const json = await res.json();
        if (typeof json.detail === 'string') return json.detail;
        if (Array.isArray(json.detail)) return json.detail.map((e: any) => e.msg || JSON.stringify(e)).join('; ');
        return JSON.stringify(json);
      }
      const text = await res.text();
      if (text.length < 200) return text;
      return `Server error (${res.status})`;
    } catch {
      return `Server error (${res.status})`;
    }
  };

  const handleSOPSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchingSop(true);
    try {
      const res = await fetch(`/api/v1/sop-ai/search?q=${encodeURIComponent(searchQuery)}&top_k=3`);
      if (!res.ok) {
        const msg = await safeParseError(res);
        console.error('SOP Search failed:', msg);
        return;
      }
      const data = await res.json();
      setSopSearchResults(data);
    } catch (err) {
      console.error('SOP Search failed:', err);
    } finally {
      setSearchingSop(false);
    }
  };

  const handleSimulateSensor = async (machineId: number, forceAnomaly: boolean) => {
    setSimulating(machineId);
    try {
      const res = await fetch(`/api/v1/sensors/simulate/${machineId}?force_anomaly=${forceAnomaly}`, { method: 'POST' });
      const data = await res.json();
      setActiveMachineTelemetry(prev => ({ ...prev, [machineId]: data }));
      fetchInitialData();
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setSimulating(null);
    }
  };

  const handleSupervisorDecision = async (approvalId: number, statusDecision: 'APPROVED' | 'REJECTED') => {
    if (!currentWorker) {
      alert('Please select an Active Worker / sign in first.');
      return;
    }
    if (currentWorker.role !== 'SUPERVISOR') {
      alert(`Only a SUPERVISOR can approve or reject work orders. You are signed in as ${currentWorker.full_name} (${currentWorker.role}).`);
      return;
    }
    try {
      const res = await fetch(`/api/v1/approvals/${approvalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusDecision,
          comments: `Decision made by ${currentWorker.full_name} (${currentWorker.role})`,
          decided_by_id: currentWorker.id,
        })
      });
      if (!res.ok) {
        const msg = await safeParseError(res);
        alert(msg);
        return;
      }
      fetchInitialData();
    } catch (err) {
      console.error('Approval update failed:', err);
      alert('Network error during approval decision. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Top Industrial Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 text-slate-950 p-2.5 rounded-xl font-black tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20">
            <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
            <span className="text-xl tracking-tight">SAFEOPS<span className="text-amber-300 font-medium">.AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400 font-medium uppercase tracking-wider">Plant Alpha • Sector 4 Operations</span>
          </div>
        </div>

        {/* Active Worker Switcher & System Indicators */}
        <div className="flex items-center gap-3 flex-wrap">

          {/* Compact worker switcher */}
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 font-bold uppercase tracking-widest hidden sm:block" style={{ fontSize: '9px' }}>
              Active Worker
            </span>
            <WorkerSwitcher
              workers={workers}
              selectedWorkerId={selectedWorkerId}
              onSelect={setSelectedWorkerId}
            />
          </div>

          {/* Risk Engine indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg">
            <Cpu className="w-4 h-4" />
            <span>Risk Engine: ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        {/* Navigation Sidebar */}
        <nav className="w-full md:w-64 flex flex-row md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'overview' ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/10' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Safety Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'tasks' ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/10' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Wrench className="w-4 h-4" />
              <span>Work Orders</span>
            </div>
            <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full">{tasks.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('machines')}
            className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'machines' ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/10' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Radio className="w-4 h-4" />
              <span>Machinery & IoT</span>
            </div>
            <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full">{machines.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('sops')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'sops' ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/10' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>SOP Library & AI</span>
          </button>

          <button
            onClick={() => setActiveTab('workers')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'workers' ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/10' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Workers & Certs</span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'approvals' ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/10' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckSquare className="w-4 h-4" />
              <span>Approvals</span>
            </div>
            {approvals.filter(a => a.status === 'PENDING').length > 0 && (
              <span className="bg-amber-500 text-slate-950 font-bold text-xs px-2 py-0.5 rounded-full animate-bounce">
                {approvals.filter(a => a.status === 'PENDING').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('incidents')}
            className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'incidents' ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/10' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4" />
              <span>Incidents Log</span>
            </div>
            <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full">{incidents.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('issues')}
            className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'issues' ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/10' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bug className="w-4 h-4" />
              <span>Issue Tracker</span>
            </div>
            <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full">{issues.length}</span>
          </button>

        </nav>

        {/* Content Area */}
        <main className="flex-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <span>Connecting to SafeOps Industrial Safety Backend...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-100">Industrial Safety Command Center</h1>
                    <p className="text-slate-400 text-sm mt-1">Real-time risk scoring, LOTO compliance monitoring, and AI safety briefings.</p>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        <span>Active Maintenance</span>
                        <Wrench className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-3xl font-black text-slate-100">{tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'PENDING_APPROVAL').length}</span>
                        <span className="text-xs text-amber-400 font-medium">{tasks.filter(t => t.status === 'PENDING_APPROVAL').length} Pending Approval</span>
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        <span>Overall Risk Level</span>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="mt-3 flex items-baseline justify-between">
                        {(() => {
                          const scores = tasks.map(t => t.composite_risk_score ?? 0).filter(s => s > 0);
                          const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
                          const avgRounded = Math.round(avg * 10) / 10;
                          // Factor in hazardous machines, open incidents, and active sensor anomalies
                          const hazardBoost = machines.filter(m => m.status === 'HAZARDOUS').length * 10;
                          const incidentBoost = incidents.filter((i: any) => i.resolution_status !== 'RESOLVED').length * 5;
                          const anomalyBoost = Object.values(activeMachineTelemetry).flat().filter((s: any) => s.is_anomaly).length * 8;
                          const composite = Math.min(100, avgRounded + hazardBoost + incidentBoost + anomalyBoost);
                          const finalLevel = composite >= 65 ? 'CRITICAL' : composite >= 40 ? 'HIGH' : composite >= 20 ? 'MEDIUM' : 'LOW';
                          const finalColor = composite >= 65 ? 'text-rose-400' : composite >= 40 ? 'text-orange-400' : composite >= 20 ? 'text-yellow-400' : 'text-emerald-400';
                          return <>
                            <span className={`text-3xl font-black ${finalColor}`}>{finalLevel}</span>
                            <span className="text-xs text-slate-400">Composite: {composite.toFixed(1)} / 100</span>
                          </>;
                        })()}
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        <span>Registered Machines</span>
                        <Radio className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-3xl font-black text-slate-100">{machines.length}</span>
                        <span className="text-xs text-rose-400 font-medium">{machines.filter(m => m.status === 'HAZARDOUS').length} Hazardous</span>
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        <span>Open Incidents</span>
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      </div>
                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-3xl font-black text-rose-400">{incidents.filter((i: any) => i.resolution_status !== 'RESOLVED').length}</span>
                        <span className="text-xs text-slate-400">{incidents.length} Total</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Copilot & Risk Engine Showcase Banner */}
                  <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-500/30">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>SafeOps AI Safety Advisor</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-100">Automated LOTO & Clearance Protection Active</h3>
                      <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                        Every work order submitted is evaluated in real-time by our deterministic Risk Engine and Gemini AI safety agent. Unqualified technicians or compromised machine telemetry automatically block task dispatch.
                      </p>
                    </div>

                    <button 
                      onClick={() => { if (!currentWorker) { alert("Please select an Active Worker / sign in first."); return; } setShowTaskModal(true); }}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 whitespace-nowrap transition-all"
                    >
                      <Plus className="w-5 h-5 stroke-[3]" />
                      <span>Evaluate & Create Task</span>
                    </button>
                  </div>

                  {/* Machine Telemetry Grid Overview */}
                  <div className="space-y-4">
                    <h3 className="text-md font-bold text-slate-200 flex items-center gap-2">
                      <Radio className="w-5 h-5 text-amber-400" />
                      <span>Live IoT Machine Status & Anomaly Monitors</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {machines.map(m => (
                        <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-amber-400 font-bold">{m.machine_code}</span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                              m.status === 'OPERATIONAL' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              m.status === 'MAINTENANCE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                            }`}>
                              {m.status}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-bold text-slate-200">{m.name}</h4>
                            <p className="text-xs text-slate-400">{m.location}</p>
                          </div>

                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                            <span className="text-slate-400">LOTO Required:</span>
                            <span className="font-semibold text-slate-200">{m.requires_loto ? 'YES (Mandatory)' : 'NO'}</span>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleSimulateSensor(m.id, false)}
                              disabled={simulating === m.id}
                              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium py-2 rounded-lg transition"
                            >
                              Normal Ping
                            </button>
                            <button
                              onClick={() => handleSimulateSensor(m.id, true)}
                              disabled={simulating === m.id}
                              className="flex-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold py-2 rounded-lg transition"
                            >
                              Simulate Anomaly
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TASKS & SAFETY EVALUATION */}
              {activeTab === 'tasks' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-100">Maintenance Work Orders</h1>
                      <p className="text-slate-400 text-sm mt-1">Review safety status, composite risk scores, and clearance permits.</p>
                    </div>

                    <button
                      onClick={() => { if (!currentWorker) { alert("Please select an Active Worker / sign in first."); return; } setShowTaskModal(true); }}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all text-sm"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>New Work Order</span>
                    </button>
                  </div>

                  {/* Task List Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                          <th className="p-4">Task Code</th>
                          <th className="p-4">Title</th>
                          <th className="p-4">Risk Level</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Assigned Worker</th>
                          <th className="p-4">Target Machine</th>
                          <th className="p-4">Re-eval</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {tasks.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-500">No maintenance tasks recorded yet. Click "New Work Order" to run a safety evaluation.</td>
                          </tr>
                        ) : (
                          tasks.map(t => (
                            <tr key={t.id} className="hover:bg-slate-800/40 transition">
                              <td className="p-4 font-mono text-amber-400 font-bold">{t.task_code}</td>
                              <td className="p-4">
                                <div className="font-semibold text-slate-200">{t.title}</div>
                                <div className="text-xs text-slate-400 truncate max-w-xs">{t.description}</div>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                  t.risk_level === 'CRITICAL' || t.is_blocked ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                  t.risk_level === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {t.is_blocked ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                  {t.risk_level} ({t.composite_risk_score}/100)
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                                  t.status === 'BLOCKED' ? 'bg-rose-500 text-white' :
                                  t.status === 'APPROVED' ? 'bg-emerald-500 text-slate-950' :
                                  'bg-slate-800 text-slate-300'
                                }`}>
                                  {t.status}
                                </span>
                              </td>
                              <td className="p-4 text-slate-300">{t.worker?.full_name || `Worker #${t.worker_id}`}</td>
                              <td className="p-4 text-slate-300 font-mono text-xs">{t.machine?.name || `Machine #${t.machine_id}`}</td>
                              <td className="p-4">
                                <button
                                  title="Re-evaluate safety with latest sensors and certifications"
                                  onClick={async () => {
                                    if (!t.worker_id || !t.machine_id || !t.procedure_id) return;
                                    try {
                                      const res = await fetch('/api/v1/safety/evaluate', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ worker_id: t.worker_id, machine_id: t.machine_id, procedure_id: t.procedure_id })
                                      });
                                      if (res.ok) {
                                        const eval_ = await res.json();
                                        // Patch task in-place
                                        t.composite_risk_score = eval_.risk_score ?? eval_.composite_risk_score ?? t.composite_risk_score;
                                        t.risk_level = eval_.risk_level ?? t.risk_level;
                                        t.is_blocked = eval_.is_blocked ?? t.is_blocked;
                                        t.blocking_reasons = eval_.block_reasons ?? t.blocking_reasons;
                                        fetchInitialData();
                                      }
                                    } catch (err) { console.error('[SafeOps] Re-evaluate failed:', err); }
                                  }}
                                  className="p-1.5 bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-slate-700 hover:border-amber-500/30 rounded-lg transition"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: MACHINERY & IOT SENSORS */}
              {activeTab === 'machines' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-100">Industrial Machinery & IoT Telemetry</h1>
                      <p className="text-slate-400 text-sm mt-1">Monitor real-time sensor readings, edit values manually, and simulate anomaly conditions.</p>
                    </div>
                    <button
                      onClick={() => setShowMachineModal(true)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all text-sm"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Register New Machine</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {machines.map(m => {
                      const telemetry = activeMachineTelemetry[m.id] || [];
                      // Only show LATEST reading per sensor type
                      const latestBySensor = telemetry.reduce((acc: Record<string, SensorReading>, s) => {
                        if (!acc[s.sensor_type] || new Date(s.timestamp) > new Date(acc[s.sensor_type].timestamp)) {
                          acc[s.sensor_type] = s;
                        }
                        return acc;
                      }, {});
                      const latestTelemetry = Object.values(latestBySensor);
                      const hasAnomaly = latestTelemetry.some(s => s.is_anomaly);
                      return (
                        <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-mono text-amber-400 font-bold">{m.machine_code}</span>
                              <h3 className="text-lg font-bold text-slate-100">{m.name}</h3>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              m.status === 'OPERATIONAL' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}>{m.status}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                            <div><span className="text-slate-500 block">Model</span><span className="text-slate-200 font-medium">{m.model}</span></div>
                            <div><span className="text-slate-500 block">Location</span><span className="text-slate-200 font-medium">{m.location}</span></div>
                            <div><span className="text-slate-500 block">Safety Score</span><span className="text-emerald-400 font-bold">{m.safety_rating} / 100</span></div>
                            <div><span className="text-slate-500 block">LOTO</span><span className="text-amber-300 font-bold">{m.requires_loto ? 'REQUIRED' : 'NONE'}</span></div>
                          </div>

                          {/* Telemetry readings */}
                          {latestTelemetry.length > 0 && (
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${hasAnomaly ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  <Radio className="w-3.5 h-3.5" />
                                  {hasAnomaly ? 'ANOMALY DETECTED' : 'Telemetry Status: NORMAL'}
                                </span>
                                <span className="text-[10px] text-slate-600">Latest per sensor</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                {latestTelemetry.map(sensor => {
                                  const savedRanges = machineRanges[m.id];
                                  const r = savedRanges?.[sensor.sensor_type] ?? {
                                    TEMPERATURE: {min: 45, max: 90},
                                    PRESSURE: {min: 20, max: 100},
                                    VIBRATION: {min: 0, max: 5},
                                    TOXIC_GAS: {min: 0, max: 25},
                                  }[sensor.sensor_type];
                                  if (!savedRanges) fetchMachineRanges(m.id);
                                  return (
                                    <div key={sensor.sensor_type} className={`p-2 rounded border ${sensor.is_anomaly ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                                      <div className="font-bold">{sensor.sensor_type}</div>
                                      <div>{sensor.value} {sensor.unit}</div>
                                      {r && <div className="text-slate-500 text-[10px]">Range: {r.min}–{r.max} {sensor.unit}</div>}
                                      {sensor.is_anomaly && <div className="text-[10px] text-rose-400 font-bold uppercase mt-0.5">⚠ ANOMALY</div>}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Assigned SOPs */}
                          {(() => {
                            const assignedSops = procedures.filter(p =>
                              p.machines?.some((pm: any) => pm.id === m.id) && p.is_approved && !p.is_superseded
                            );
                            return (
                              <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-amber-400" /> Assigned SOPs
                                  </span>
                                  <button
                                    onClick={() => openManageSops(m)}
                                    className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/20 transition"
                                  >
                                    <Plus className="w-3 h-3 stroke-[3]" /> Manage SOPs
                                  </button>
                                </div>
                                {assignedSops.length === 0 ? (
                                  <p className="text-[11px] text-slate-600 italic">No approved SOPs assigned. Click "Manage SOPs" to assign.</p>
                                ) : (
                                  <div className="space-y-1">
                                    {assignedSops.map(p => (
                                      <div key={p.id} className="flex items-center gap-2 text-xs">
                                        <span className="font-mono text-amber-400 font-bold shrink-0">{p.procedure_code}</span>
                                        <span className="text-slate-300 truncate">{p.title}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Action buttons */}
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => { setEditMachine({ ...m }); setEditMachineError(null); }}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit Machine
                            </button>
                            <button
                              onClick={() => { setSelectedMachineForRanges(m); setShowSensorRangeModal(true); }}
                              className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5"
                            >
                              <Gauge className="w-3.5 h-3.5" />
                              Sensor Ranges
                            </button>
                            <button
                              onClick={() => { setSelectedMachineForSops(m); setShowMachineSopModal(true); }}
                              className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Assigned SOPs
                            </button>
                            <button
                              onClick={() => setSensorEditMachine(m)}
                              className="flex-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit Sensor Readings
                            </button>
                            {hasAnomaly ? (
                              <button
                                disabled={resetting === m.id}
                                onClick={async () => {
                                  setResetting(m.id);
                                  try {
                                    // 1. Delete all old readings (true history reset)
                                    await fetch(`/api/v1/sensors/reset/${m.id}`, { method: 'DELETE' });
                                    // 2. Generate fresh normal readings so card stays populated
                                    await fetch(`/api/v1/sensors/simulate/${m.id}?force_anomaly=false`, { method: 'POST' });
                                    // 3. Reload latest readings
                                    const res = await fetch(`/api/v1/sensors/machine/${m.id}?limit=20`);
                                    const data = await res.json();
                                    setActiveMachineTelemetry(prev => ({ ...prev, [m.id]: Array.isArray(data) ? data : [] }));
                                  } finally {
                                    setResetting(null);
                                  }
                                }}
                                className="flex-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {resetting === m.id
                                  ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Resetting...</>
                                  : <><CheckCircle2 className="w-3.5 h-3.5" /> Reset Sensors</>
                                }
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSimulateSensor(m.id, false)}
                                disabled={simulating === m.id}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2.5 rounded-xl transition disabled:opacity-60"
                              >
                                {simulating === m.id ? 'Pinging...' : 'Ping Telemetry'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: SOP LIBRARY & AI SEARCH */}
              {activeTab === 'sops' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-100">Standard Operating Procedures (SOPs) & AI Search</h1>
                      <p className="text-slate-400 text-sm mt-1">Vector-based semantic search & interactive SOP procedure management.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Refresh AI Search Index */}
                      <div className="flex flex-col items-end gap-1">
                        <button
                          onClick={async () => {
                            if (reindexing) return;
                            setReindexing(true);
                            setReindexMsg(null);
                            try {
                              const res = await fetch('/api/v1/sop-ai/reindex/', { method: 'POST' });
                              if (res.ok) {
                                const data = await res.json().catch(() => ({}));
                                setReindexMsg({ type: 'success', text: data.message || `AI search index refreshed — ${data.indexed_count ?? ''} SOPs indexed.` });
                                fetchInitialData();
                              } else {
                                const msg = await safeParseError(res);
                                setReindexMsg({ type: 'error', text: msg });
                              }
                            } catch {
                              setReindexMsg({ type: 'error', text: 'Network error. Could not refresh AI search index.' });
                            } finally {
                              setReindexing(false);
                              setTimeout(() => setReindexMsg(null), 4000);
                            }
                          }}
                          disabled={reindexing}
                          className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-2 border border-amber-500/20 transition-all text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${reindexing ? 'animate-spin' : ''}`} />
                          <span>{reindexing ? 'Refreshing…' : 'Refresh AI Search Index'}</span>
                        </button>
                        <p className="text-[10px] text-slate-500 max-w-xs text-right leading-relaxed">
                          Updates the AI search database with the latest SOP content. Run this after creating or editing SOPs.
                        </p>
                      </div>

                      <button
                        onClick={() => { setSopToEdit(null); setShowSopModal(true); }}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all text-xs"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Upload & Create New SOP</span>
                      </button>
                    </div>
                  </div>

                  {/* Reindex message */}
                  {reindexMsg && (
                    <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      reindexMsg.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                    }`}>
                      {reindexMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                      {reindexMsg.text}
                    </div>
                  )}

                  {/* SOP action message */}
                  {sopActionMsg && (
                    <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      sopActionMsg.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                    }`}>
                      {sopActionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                      {sopActionMsg.text}
                    </div>
                  )}

                  {/* Search Bar */}
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                      <input
                        type="text"
                        placeholder="Search SOPs by keyword (e.g., High-Voltage, Hydraulic, Grounding, Bleed valve)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSOPSearch()}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <button
                      onClick={handleSOPSearch}
                      disabled={searchingSop}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl flex items-center gap-2 text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {searchingSop ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>Vector Search</span>
                    </button>
                  </div>

                  {/* AI Search Results */}
                  {sopSearchResults.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3">
                      <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span>AI Vector Search Results</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sopSearchResults.map((res: any, idx: number) => {
                          const matchedProc = procedures.find(p => p.procedure_code === res.code || p.id === res.procedure_id);
                          return (
                            <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-mono text-amber-400 font-bold">{res.code}</span>
                                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Score: {(res.similarity_score * 100).toFixed(0)}%</span>
                              </div>
                              <h4 className="font-bold text-slate-200">{res.title}</h4>
                              <p className="text-xs text-slate-400">{res.description}</p>
                              {matchedProc && (
                                <div className="pt-2 flex gap-2">
                                  <button
                                    onClick={() => setSopToView(matchedProc)}
                                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-lg font-medium transition flex items-center gap-1"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Inspect SOP</span>
                                  </button>
                                  <button
                                    onClick={() => { setSopToEdit(matchedProc); setShowSopModal(true); }}
                                    className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1 rounded-lg font-medium transition flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SOP Catalog */}
                  <div className="space-y-4">
                    {procedures.length === 0 && (
                      <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
                        No SOPs in the library. Create one using the button above.
                      </div>
                    )}
                    {procedures.map(p => (
                      <div key={p.id} className={`bg-slate-900 border rounded-2xl p-6 space-y-4 ${p.is_superseded ? 'border-slate-700 opacity-70' : 'border-slate-800'}`}>
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono text-amber-400 font-bold">{p.procedure_code} • v{p.version}</span>
                              {p.is_approved && !p.is_superseded && (
                                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">APPROVED</span>
                              )}
                              {!p.is_approved && (
                                <span className="bg-slate-700 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded">PENDING APPROVAL</span>
                              )}
                              {p.is_superseded && (
                                <span className="bg-rose-900/40 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-500/30">SUPERSEDED — No longer available for new work orders</span>
                              )}
                            </div>
                            <h3 className="text-lg font-bold text-slate-100 mt-0.5">{p.title}</h3>
                            <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                              <span>Category: <span className="text-slate-300">{p.category}</span></span>
                              <span>Clearance: <span className="text-amber-300 font-bold">L{p.required_clearance_level}+</span></span>
                            </div>
                          </div>
                        </div>

                        {/* Linked machines — disabled for superseded SOPs */}
                        <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Link2 className="w-3.5 h-3.5 text-amber-400" /> Linked Machines
                            </span>
                            {p.is_superseded && <span className="text-[10px] text-slate-600 italic">Disabled — SOP is superseded</span>}
                          </div>
                          {machines.length === 0 ? (
                            <p className="text-xs text-slate-600 italic">No machines registered yet.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {machines.map(m => {
                                const linked = p.machines?.some((pm: any) => pm.id === m.id);
                                const isLinking = sopActionLoading[p.id] === `link-${m.id}`;
                                return (
                                  <button
                                    key={m.id}
                                    disabled={p.is_superseded || isLinking}
                                    onClick={async () => {
                                      setSopActionLoading(prev => ({ ...prev, [p.id]: `link-${m.id}` }));
                                      setSopActionMsg(null);
                                      try {
                                        let res;
                                        if (linked) {
                                          // Unassign — DELETE /api/v1/machines/{id}/sops/{procedure_id}
                                          res = await fetch(`/api/v1/machines/${m.id}/sops/${p.id}`, { method: 'DELETE' });
                                        } else {
                                          // Assign — POST /api/v1/machines/{id}/sops
                                          res = await fetch(`/api/v1/machines/${m.id}/sops/`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ procedure_id: p.id }),
                                          });
                                        }
                                        if (res.ok) {
                                          fetchInitialData();
                                        } else {
                                          const msg = await safeParseError(res);
                                          setSopActionMsg({ id: p.id, type: 'error', text: `Link/unlink failed: ${msg}` });
                                        }
                                      } catch {
                                        setSopActionMsg({ id: p.id, type: 'error', text: 'Network error during machine link/unlink.' });
                                      } finally {
                                        setSopActionLoading(prev => { const n = { ...prev }; delete n[p.id]; return n; });
                                      }
                                    }}
                                    className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition flex items-center gap-1 ${
                                      p.is_superseded
                                        ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-600 border-slate-700'
                                        : linked
                                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30'
                                          : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/20'
                                    }`}
                                    title={p.is_superseded ? 'SOP is superseded' : linked ? `Unlink from ${m.name}` : `Link to ${m.name}`}
                                  >
                                    {isLinking ? <RefreshCw className="w-3 h-3 animate-spin" /> : linked ? <CheckCircle2 className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                    {m.machine_code}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          <p className="text-[10px] text-slate-600">Click a machine to link or unlink this SOP. Only linked, approved SOPs appear in the work-order form.</p>
                        </div>

                        {/* Steps */}
                        {p.steps && p.steps.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-slate-800">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Procedure Steps ({p.steps.length})</h4>
                            <div className="space-y-2">
                              {p.steps.map(step => (
                                <div key={step.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                                  <div className="flex items-start gap-3">
                                    <span className="bg-amber-500 text-slate-950 font-black w-6 h-6 rounded-lg flex items-center justify-center shrink-0">{step.step_number}</span>
                                    <div>
                                      <div className="font-bold text-slate-200">{step.title}</div>
                                      <div className="text-slate-400 mt-0.5">{step.instruction}</div>
                                      {step.required_ppe && (
                                        <div className="text-amber-300 font-medium mt-1 flex items-center gap-1">
                                          <HardHat className="w-3.5 h-3.5" /><span>PPE: {step.required_ppe}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 self-end md:self-center">
                                    <span className={`px-2 py-0.5 rounded font-bold ${
                                      step.hazard_level === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' :
                                      step.hazard_level === 'HIGH' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
                                    }`}>{step.hazard_level}</span>
                                    {step.requires_supervisor_signoff && (
                                      <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold">Sign-off Required</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* SOP action row */}
                        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-800">

                          {/* View */}
                          <button onClick={() => setSopToView(p)}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-amber-400" /> View
                          </button>

                          {/* Edit */}
                          <button onClick={() => { setSopToEdit(p); setShowSopModal(true); }}
                            className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>

                          {/* Approve */}
                          {!p.is_approved && (
                            <button
                              disabled={sopActionLoading[p.id] === 'approve'}
                              onClick={async () => {
                                setSopActionLoading(prev => ({ ...prev, [p.id]: 'approve' }));
                                setSopActionMsg(null);
                                try {
                                  const res = await fetch(`/api/v1/procedures/${p.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ ...p, is_approved: true }),
                                  });
                                  if (res.ok) {
                                    setSopActionMsg({ id: p.id, type: 'success', text: `"${p.title}" approved successfully.` });
                                    fetchInitialData();
                                  } else {
                                    const msg = await safeParseError(res);
                                    setSopActionMsg({ id: p.id, type: 'error', text: `Approve failed: ${msg}` });
                                  }
                                } catch {
                                  setSopActionMsg({ id: p.id, type: 'error', text: 'Network error during approval.' });
                                } finally {
                                  setSopActionLoading(prev => { const n = { ...prev }; delete n[p.id]; return n; });
                                  setTimeout(() => setSopActionMsg(null), 4000);
                                }
                              }}
                              className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {sopActionLoading[p.id] === 'approve' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              {sopActionLoading[p.id] === 'approve' ? 'Approving…' : 'Approve'}
                            </button>
                          )}

                          {/* Supersede */}
                          {!p.is_superseded && (
                            <div className="flex flex-col gap-1">
                              <button
                                disabled={sopActionLoading[p.id] === 'supersede'}
                                onClick={async () => {
                                  if (!confirm(`Mark "${p.title}" as superseded?\n\nThis SOP will remain in history but will no longer be available for new work orders. A newer version should replace it.`)) return;
                                  setSopActionLoading(prev => ({ ...prev, [p.id]: 'supersede' }));
                                  setSopActionMsg(null);
                                  try {
                                    const res = await fetch(`/api/v1/procedures/${p.id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ ...p, is_superseded: true }),
                                    });
                                    if (res.ok) {
                                      setSopActionMsg({ id: p.id, type: 'success', text: `"${p.title}" marked as superseded. It will remain in history but is no longer available for new work orders.` });
                                      fetchInitialData();
                                    } else {
                                      const msg = await safeParseError(res);
                                      setSopActionMsg({ id: p.id, type: 'error', text: `Supersede failed: ${msg}` });
                                    }
                                  } catch {
                                    setSopActionMsg({ id: p.id, type: 'error', text: 'Network error during supersede.' });
                                  } finally {
                                    setSopActionLoading(prev => { const n = { ...prev }; delete n[p.id]; return n; });
                                    setTimeout(() => setSopActionMsg(null), 5000);
                                  }
                                }}
                                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {sopActionLoading[p.id] === 'supersede' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                                {sopActionLoading[p.id] === 'supersede' ? 'Superseding…' : 'Supersede'}
                              </button>
                              <p className="text-[10px] text-slate-600 max-w-[200px] leading-relaxed">
                                Keeps this SOP in history but removes it from new work orders. Use when a newer version replaces it.
                              </p>
                            </div>
                          )}

                          {/* Delete */}
                          <button
                            disabled={sopActionLoading[p.id] === 'delete'}
                            onClick={async () => {
                              if (!confirm(`Permanently delete "${p.title}"?\n\nThis cannot be undone.`)) return;
                              setSopActionLoading(prev => ({ ...prev, [p.id]: 'delete' }));
                              setSopActionMsg(null);
                              try {
                                const res = await fetch(`/api/v1/procedures/${p.id}`, { method: 'DELETE' });
                                if (res.ok || res.status === 204) {
                                  setSopToView(null);
                                  setSopActionMsg({ id: p.id, type: 'success', text: `"${p.title}" deleted successfully.` });
                                  fetchInitialData();
                                  setTimeout(() => setSopActionMsg(null), 4000);
                                } else {
                                  const msg = await safeParseError(res);
                                  setSopActionMsg({ id: p.id, type: 'error', text: `Delete failed: ${msg}` });
                                  setTimeout(() => setSopActionMsg(null), 5000);
                                }
                              } catch {
                                setSopActionMsg({ id: p.id, type: 'error', text: 'Network error. Could not delete SOP.' });
                                setTimeout(() => setSopActionMsg(null), 5000);
                              } finally {
                                setSopActionLoading(prev => { const n = { ...prev }; delete n[p.id]; return n; });
                              }
                            }}
                            className="text-xs bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ml-auto disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {sopActionLoading[p.id] === 'delete' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            {sopActionLoading[p.id] === 'delete' ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: WORKERS & CERTIFICATIONS */}
              {activeTab === 'workers' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-100">Worker Registry & Safety Credentials</h1>
                      <p className="text-slate-400 text-sm mt-1">Manage worker profiles, clearance levels and certifications.</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setShowCreateCertForm(v => !v); setCreateCertError(null); setCreateCertSuccess(null); }}
                        className="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 border border-slate-700 transition-all text-sm">
                        <Award className="w-4 h-4" /><span>Create Certification</span>
                      </button>
                      <button onClick={() => setShowWorkerModal(true)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all text-sm">
                        <Plus className="w-4 h-4 stroke-[3]" /><span>Add Worker Profile</span>
                      </button>
                    </div>
                  </div>

                  {/* Create Certification Form */}
                  {showCreateCertForm && (
                    <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-5 space-y-4">
                      <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" />Create New Certification Type
                      </h3>

                      {createCertError && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl">{createCertError}</div>
                      )}
                      {createCertSuccess && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl">{createCertSuccess}</div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Code <span className="text-rose-400">*</span></label>
                          <input type="text" placeholder="e.g. CERT-LOTO-01"
                            value={newCert.code} onChange={e => setNewCert(v => ({ ...v, code: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Name <span className="text-rose-400">*</span></label>
                          <input type="text" placeholder="e.g. Lock-Out / Tag-Out"
                            value={newCert.name} onChange={e => setNewCert(v => ({ ...v, name: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                        <input type="text" placeholder="Brief description of what this certification covers"
                          value={newCert.description} onChange={e => setNewCert(v => ({ ...v, description: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Validity (months)</label>
                          <input type="number" min={1} max={120}
                            value={newCert.validity_months} onChange={e => setNewCert(v => ({ ...v, validity_months: Number(e.target.value) }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Issuing Body</label>
                          <input type="text" placeholder="e.g. OSHA Safety Institute"
                            value={newCert.issuing_body} onChange={e => setNewCert(v => ({ ...v, issuing_body: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500" />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setShowCreateCertForm(false); setNewCert({ code: '', name: '', description: '', validity_months: 24, issuing_body: 'OSHA Safety Institute' }); setCreateCertError(null); setCreateCertSuccess(null); }}
                          className="px-4 py-2 text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition">Cancel</button>
                        <button disabled={createCertSubmitting || !!createCertSuccess}
                          onClick={async () => {
                            if (!newCert.code.trim() || !newCert.name.trim()) { setCreateCertError('Code and Name are required.'); return; }
                            setCreateCertSubmitting(true); setCreateCertError(null);
                            try {
                              const res = await fetch('/api/v1/certifications/', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  code: newCert.code.trim(),
                                  name: newCert.name.trim(),
                                  description: newCert.description.trim() || null,
                                  validity_months: Number(newCert.validity_months),
                                  issuing_body: newCert.issuing_body.trim() || 'OSHA Safety Institute',
                                }),
                              });
                              const data = await res.json().catch(() => ({}));
                              if (!res.ok) { setCreateCertError(data?.detail || 'Failed to create certification.'); return; }
                              setCreateCertSuccess(`Certification "${data.name}" created successfully.`);
                              setNewCert({ code: '', name: '', description: '', validity_months: 24, issuing_body: 'OSHA Safety Institute' });
                              fetchCerts();
                              setTimeout(() => { setShowCreateCertForm(false); setCreateCertSuccess(null); }, 2000);
                            } catch { setCreateCertError('Network error. Please try again.'); }
                            finally { setCreateCertSubmitting(false); }
                          }}
                          className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition flex items-center gap-1.5 disabled:opacity-60">
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          {createCertSubmitting ? 'Saving...' : 'Create Certification'}
                        </button>
                      </div>

                      {/* Existing certs list */}
                      {allCerts.length > 0 && (
                        <div className="pt-3 border-t border-slate-800 space-y-2">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Existing Certifications ({allCerts.length})</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {allCerts.map((c: any) => (
                              <div key={c.id} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-amber-300 font-mono">{c.code}</span>
                                  <span className="text-[10px] text-slate-500">{c.validity_months}mo</span>
                                </div>
                                <p className="text-xs text-slate-300">{c.name}</p>
                                {c.description && <p className="text-[10px] text-slate-500">{c.description}</p>}
                                <p className="text-[10px] text-slate-600">{c.issuing_body}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Worker Profiles */}
                  {(
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {workers.length === 0 ? (
                        <div className="col-span-2 p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
                          <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-400 font-medium">No workers registered yet.</p>
                          <p className="text-slate-500 text-sm mt-1">Click "Add Worker Profile" to create the first worker.</p>
                        </div>
                      ) : workers.map(w => {
                        return (
                          <div key={w.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="bg-slate-800 w-10 h-10 rounded-xl flex items-center justify-center text-amber-400 font-bold text-lg">
                                  {w.full_name.charAt(0)}
                                </div>
                                <div>
                                  <h3 className="font-bold text-slate-100">{w.full_name}</h3>
                                  <span className="text-xs font-mono text-amber-400">{w.worker_code} • {w.department}</span>
                                </div>
                              </div>
                              <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs px-3 py-1 rounded-full font-bold">
                                L{w.clearance_level}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs px-2.5 py-1 rounded-full border bg-slate-800 text-slate-400 border-slate-700">{w.role}</span>
                              <span className={`text-xs px-2.5 py-1 rounded-full border ${w.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                                {w.is_active ? '● Active' : '○ Inactive'}
                              </span>
                            </div>

                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                  <Award className="w-4 h-4 text-amber-400" /><span>Safety Certifications</span>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => {
                                    setShowAddCertModal(showAddCertModal === w.id ? null : w.id);
                                    setCertForm({ certification_id: '', issued_date: '', expiry_date: '' });
                                    setAssignCertSelectedIds([]);
                                    setAssignCertDates({});
                                    setAssignCertError(null);
                                    if (allCerts.length === 0) fetchCerts();
                                    fetchWorkerCerts(w.id);
                                  }} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold">
                                    <Plus className="w-3 h-3 stroke-[3]" />Assign
                                  </button>
                                  <button onClick={() => {
                                    setExpandedWorkerCerts(expandedWorkerCerts === w.id ? null : w.id);
                                    fetchWorkerCerts(w.id);
                                  }} className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1">
                                    {expandedWorkerCerts === w.id ? 'Hide' : 'View'}
                                  </button>
                                </div>
                              </div>

                              {/* Assign cert inline form */}
                              {showAddCertModal === w.id && (
                                <div className="pt-2 space-y-2 border-t border-slate-800">
                                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Assign Certification to {w.full_name}</p>

                                  {allCerts.length === 0 ? (
                                    <p className="text-xs text-slate-600 italic">No certification types found. Create one first using the "Create Certification" button above.</p>
                                  ) : (() => {
                                    const assignedIds = (workerCerts[w.id] ?? []).filter((r: any) => r.is_valid).map((r: any) => r.certification_id);
                                    return (
                                      <>
                                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                          {allCerts.map((c: any) => {
                                            const alreadyAssigned = assignedIds.includes(c.id);
                                            const isChecked = assignCertSelectedIds.includes(c.id);
                                            return (
                                              <label key={c.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border cursor-pointer text-xs ${
                                                alreadyAssigned ? 'border-emerald-500/20 bg-emerald-500/5 opacity-60 cursor-not-allowed' :
                                                isChecked ? 'border-amber-500/40 bg-amber-500/10' : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                                              }`}>
                                                <input type="checkbox" disabled={alreadyAssigned}
                                                  checked={alreadyAssigned || isChecked}
                                                  onChange={() => {
                                                    if (alreadyAssigned) return;
                                                    if (isChecked) {
                                                      setAssignCertSelectedIds(prev => prev.filter(id => id !== c.id));
                                                      setAssignCertDates(prev => { const n = { ...prev }; delete n[c.id]; return n; });
                                                    } else {
                                                      setAssignCertSelectedIds(prev => [...prev, c.id]);
                                                      setAssignCertDates(prev => ({ ...prev, [c.id]: { issued_date: '', expiry_date: '' } }));
                                                    }
                                                  }}
                                                  className="accent-amber-500 w-3.5 h-3.5" />
                                                <span className={alreadyAssigned ? 'text-emerald-400' : 'text-slate-200'}>{c.name} <span className="text-slate-500">({c.code})</span></span>
                                                {alreadyAssigned && <span className="ml-auto text-[10px] text-emerald-400 font-bold">Already assigned</span>}
                                              </label>
                                            );
                                          })}
                                        </div>

                                        {/* Per-cert date inputs */}
                                        {assignCertSelectedIds.length > 0 && (
                                          <div className="space-y-2 pt-1 border-t border-slate-800">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Set issued date for each certificate (expiry auto-calculated)</p>
                                            {assignCertSelectedIds.map(cId => {
                                              const cert = allCerts.find((c: any) => c.id === cId);
                                              const validityMonths: number = cert?.validity_months ?? 12;
                                              const dates = assignCertDates[cId] || { issued_date: '', expiry_date: '' };

                                              // Auto-calculate expiry from issued_date + validity_months
                                              const calcExpiry = (issued: string): string => {
                                                if (!issued) return '';
                                                const d = new Date(issued);
                                                d.setMonth(d.getMonth() + validityMonths);
                                                return d.toISOString().split('T')[0];
                                              };

                                              const expiryDate = calcExpiry(dates.issued_date);

                                              return (
                                                <div key={cId} className="bg-slate-950 border border-slate-800 rounded-lg p-2 space-y-1.5">
                                                  <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-bold text-amber-400">{cert?.name} ({cert?.code})</p>
                                                    <span className="text-[10px] text-slate-500">{validityMonths} months validity</span>
                                                  </div>
                                                  <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                      <label className="text-[10px] text-slate-500 uppercase">Issued Date *</label>
                                                      <input type="date" value={dates.issued_date}
                                                        onChange={e => {
                                                          const issued = e.target.value;
                                                          const expiry = calcExpiry(issued);
                                                          setAssignCertDates(prev => ({ ...prev, [cId]: { issued_date: issued, expiry_date: expiry } }));
                                                        }}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500" />
                                                    </div>
                                                    <div>
                                                      <label className="text-[10px] text-slate-500 uppercase">Expiry Date (auto)</label>
                                                      <input type="date" value={expiryDate} readOnly
                                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-mono cursor-not-allowed opacity-80" />
                                                    </div>
                                                  </div>
                                                  {expiryDate && (
                                                    <p className="text-[10px] text-slate-600">
                                                      Issued: {new Date(dates.issued_date + 'T00:00:00').toLocaleDateString('en-GB')} →
                                                      Expires: {new Date(expiryDate + 'T00:00:00').toLocaleDateString('en-GB')}
                                                    </p>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}

                                        {assignCertError && <p className="text-[10px] text-rose-400">{assignCertError}</p>}
                                        <div className="flex gap-2">
                                          <button disabled={assignCertSaving || assignCertSelectedIds.length === 0}
                                            onClick={async () => {
                                              // Validate — only issued_date needed, expiry is auto-calculated
                                              for (const cId of assignCertSelectedIds) {
                                                const d = assignCertDates[cId];
                                                if (!d?.issued_date) {
                                                  const cert = allCerts.find((c: any) => c.id === cId);
                                                  setAssignCertError(`Please set an issued date for: ${cert?.name ?? cId}`); return;
                                                }
                                              }
                                              setAssignCertSaving(true); setAssignCertError(null);
                                              const created: any[] = [];
                                              const skipped: string[] = [];
                                              for (const cId of assignCertSelectedIds) {
                                                const d = assignCertDates[cId];
                                                const cert = allCerts.find((c: any) => c.id === cId);
                                                try {
                                                  const res = await fetch('/api/v1/certifications/worker/', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                      worker_id: w.id,
                                                      certification_id: cId,
                                                      issued_date: d.issued_date,
                                                      expiry_date: d.expiry_date,
                                                      is_valid: new Date(d.expiry_date) > new Date(),
                                                    }),
                                                  });
                                                  const data = await res.json().catch(() => ({}));
                                                  if (res.status === 409) { skipped.push(cert?.name ?? String(cId)); }
                                                  else if (res.ok) { created.push(data); }
                                                  else { setAssignCertError(data?.detail || 'Failed to assign.'); }
                                                } catch { setAssignCertError('Network error. Please try again.'); }
                                              }
                                              if (skipped.length > 0) setAssignCertError(`Already assigned (skipped): ${skipped.join(', ')}`);
                                              setShowAddCertModal(null);
                                              setAssignCertSelectedIds([]);
                                              setAssignCertDates({});
                                              setCertForm({ certification_id: '', issued_date: '', expiry_date: '' });
                                              fetchWorkerCerts(w.id);
                                              setExpandedWorkerCerts(w.id);
                                              setAssignCertSaving(false);
                                            }}
                                            className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-1.5 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed">
                                            {assignCertSaving ? 'Assigning...' : `Assign (${assignCertSelectedIds.length} selected)`}
                                          </button>
                                          <button onClick={() => { setShowAddCertModal(null); setAssignCertSelectedIds([]); setAssignCertDates({}); setAssignCertError(null); setCertForm({ certification_id: '', issued_date: '', expiry_date: '' }); }}
                                            className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs py-1.5 rounded-lg transition">
                                            Cancel
                                          </button>
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              )}

                              {/* View worker certs */}
                              {expandedWorkerCerts === w.id && (
                                <div className="space-y-1.5 pt-1">
                                  {(workerCerts[w.id] ?? []).length === 0 ? (
                                    <p className="text-xs text-slate-600 italic">No certifications assigned yet.</p>
                                  ) : (workerCerts[w.id] ?? []).map((tr: any) => (
                                    <div key={tr.id} className={`px-2 py-2 rounded-lg border text-xs space-y-0.5 ${
                                      tr.is_valid ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                                    }`}>
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold">{tr.certification?.name ?? `Cert #${tr.certification_id}`}</span>
                                        <div className="flex items-center gap-1.5">
                                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tr.is_valid ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                                            {tr.is_valid ? '✓ Valid' : '✗ Expired'}
                                          </span>
                                          <button
                                            title="Unassign this certificate"
                                            onClick={async () => {
                                              if (!confirm(`Remove "${tr.certification?.name ?? 'this cert'}" from ${w.full_name}? This will immediately affect safety checks.`)) return;
                                              try {
                                                const res = await fetch(`/api/v1/certifications/worker/${w.id}/${tr.id}`, { method: 'DELETE' });
                                                if (res.ok) { fetchWorkerCerts(w.id); }
                                                else { const d = await res.json().catch(() => ({})); alert(d.detail || 'Failed to unassign cert.'); }
                                              } catch { alert('Network error.'); }
                                            }}
                                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 p-0.5 rounded transition"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                      <div className="flex gap-3 text-[10px] opacity-80">
                                        <span>Issued: {tr.issued_date ? new Date(tr.issued_date + 'T00:00:00').toLocaleDateString('en-GB') : '—'}</span>
                                        <span>Expires: {tr.expiry_date ? new Date(tr.expiry_date + 'T00:00:00').toLocaleDateString('en-GB') : '—'}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}


                </div>
              )}

              {/* TAB 6: SUPERVISOR APPROVALS */}
              {activeTab === 'approvals' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-100">Supervisor Sign-off Queue</h1>
                    <p className="text-slate-400 text-sm mt-1">High-risk procedures requiring explicit supervisor permit overrides.</p>
                  </div>

                  <div className="space-y-4">
                    {approvals.length === 0 ? (
                      <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
                        No pending supervisor approval requests.
                      </div>
                    ) : (
                      approvals.map(app => {
                        const task = app.task;
                        return (
                          <div key={app.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-amber-400 font-bold">Approval #{app.id}</span>
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                  app.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400 animate-pulse' :
                                  app.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                }`}>{app.status}</span>
                              </div>
                              <span className="text-xs text-slate-500">Requested: {new Date(app.requested_at).toLocaleString()}</span>
                            </div>

                            {task && (
                              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                                <h3 className="text-base font-bold text-slate-100">{task.title}</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                  <div><span className="text-slate-500 block">Task Code</span><span className="text-amber-400 font-mono font-bold">{task.task_code}</span></div>
                                  <div><span className="text-slate-500 block">Worker</span><span className="text-slate-200">{task.worker?.full_name ?? `#${task.worker_id}`}</span></div>
                                  <div><span className="text-slate-500 block">Machine</span><span className="text-slate-200">{task.machine?.name ?? `#${task.machine_id}`}</span></div>
                                  <div><span className="text-slate-500 block">SOP</span><span className="text-slate-200">{task.procedure?.title ?? `#${task.procedure_id}`}</span></div>
                                  <div><span className="text-slate-500 block">Risk Score</span>
                                    <span className={`font-bold ${task.composite_risk_score >= 65 ? 'text-rose-400' : task.composite_risk_score >= 40 ? 'text-orange-400' : 'text-yellow-400'}`}>
                                      {task.composite_risk_score}/100 ({task.risk_level})
                                    </span>
                                  </div>
                                  <div><span className="text-slate-500 block">Priority</span><span className="text-slate-200">{task.priority}</span></div>
                                </div>
                                {task.blocking_reasons?.length > 0 && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">Blocking Reasons</p>
                                    <ul className="text-xs text-rose-300 space-y-0.5 list-disc list-inside">
                                      {task.blocking_reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}

                            {app.comments && (
                              <div className="text-xs text-slate-400 bg-slate-950 border border-slate-800 rounded-xl p-3">
                                <span className="font-bold text-slate-300">Supervisor Notes: </span>{app.comments}
                              </div>
                            )}
                            {app.decided_at && (
                              <p className="text-xs text-slate-500">Decision made: {new Date(app.decided_at).toLocaleString()}</p>
                            )}

                            {app.status === 'PENDING' && (
                              <div className="flex gap-2">
                                <button onClick={() => handleSupervisorDecision(app.id, 'APPROVED')}
                                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition">
                                  ✓ Approve Permit
                                </button>
                                <button onClick={() => handleSupervisorDecision(app.id, 'REJECTED')}
                                  className="flex-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold px-5 py-2.5 rounded-xl text-sm transition">
                                  ✗ Reject Task
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: INCIDENTS LOG */}
              {activeTab === 'incidents' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-100">Safety Incident & Near-Miss Logs</h1>
                      <p className="text-slate-400 text-sm mt-1">Industrial incident reports and near-miss tracking.</p>
                    </div>
                    <button onClick={() => {
                      if (!currentWorker) { alert('Please select an Active Worker / sign in first.'); return; }
                      setIncidentForm({ incident_code: `INC-${Math.floor(1000 + Math.random() * 9000)}`, title: '', description: '', severity: 'MEDIUM', machine_id: '', worker_id: '', task_id: '' });
                      setIncidentError(null); setIncidentSuccess(null);
                      setShowIncidentModal(true);
                    }}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all text-sm">
                      <Plus className="w-4 h-4 stroke-[3]" /><span>Report Incident / Near Miss</span>
                    </button>
                  </div>

                  {incidents.length === 0 ? (
                    <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
                      No incidents reported yet. Click "Report Incident / Near Miss" to log one.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {incidents.map(inc => (
                        <div key={inc.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-xs font-mono text-rose-400 font-bold">{inc.incident_code}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
                                inc.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                                inc.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                inc.severity === 'LOW' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                                'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              }`}>{inc.severity} SEVERITY</span>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                                inc.resolution_status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                'bg-slate-800 text-slate-400 border-slate-700'
                              }`}>{inc.resolution_status}</span>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-100">{inc.title}</h3>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{inc.description}</p>
                          </div>
                          <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500">
                            <span>Reported: <span className="text-slate-300">{new Date(inc.reported_at).toLocaleDateString()}</span></span>
                            {inc.machine_id && <span>Machine ID: <span className="text-slate-300">#{inc.machine_id}</span></span>}
                            <button onClick={() => setViewIncident(inc)}
                              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/20 transition">
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 8: ISSUE TRACKER */}
              {activeTab === 'issues' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-100">Industrial Issue Tracking</h1>
                      <p className="text-slate-400 text-sm mt-1">
                        Relational issue management for operational faults, machine defects, and maintenance tracking.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowIssueCreateModal(true)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all text-sm"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Log New Issue</span>
                    </button>
                  </div>

                  {/* Filter Bar */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <Filter className="w-3.5 h-3.5 text-amber-400" />
                      <span>Filter Issues By:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Machine</label>
                        <select
                          value={issueFilterMachine}
                          onChange={e => setIssueFilterMachine(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                        >
                          <option value="ALL">All Machines</option>
                          {machines.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Department</label>
                        <select
                          value={issueFilterDepartment}
                          onChange={e => setIssueFilterDepartment(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                        >
                          <option value="ALL">All Departments</option>
                          <option value="PLANT_OPS">PLANT_OPS</option>
                          <option value="ELECTRICAL">ELECTRICAL</option>
                          <option value="MECHANICAL">MECHANICAL</option>
                          <option value="SAFETY_DEPT">SAFETY_DEPT</option>
                          <option value="CHEMICAL">CHEMICAL</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Priority</label>
                        <select
                          value={issueFilterPriority}
                          onChange={e => setIssueFilterPriority(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                        >
                          <option value="ALL">All Priorities</option>
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                          <option value="CRITICAL">CRITICAL</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Worker</label>
                        <select
                          value={issueFilterWorker}
                          onChange={e => setIssueFilterWorker(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                        >
                          <option value="ALL">All Assigned Workers</option>
                          {workers.map(w => (
                            <option key={w.id} value={w.id}>{w.full_name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
                        <select
                          value={issueFilterStatus}
                          onChange={e => setIssueFilterStatus(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                        >
                          <option value="ALL">All Statuses</option>
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Waiting">Waiting</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Issues List / Cards */}
                  <div className="space-y-4">
                    {issues.length === 0 ? (
                      <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                        <Bug className="w-10 h-10 text-slate-600 mx-auto" />
                        <h3 className="text-base font-bold text-slate-300">No Issues Found</h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          No issues match the selected filter criteria. Adjust filters or click "Log New Issue" to record an issue.
                        </p>
                      </div>
                    ) : (
                      issues.map(issue => (
                        <div 
                          key={issue.id} 
                          onClick={() => setSelectedIssueForDetail(issue)}
                          className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 space-y-3 cursor-pointer transition group shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                                {issue.issue_code}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                issue.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                                issue.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                                issue.priority === 'MEDIUM' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                                'bg-slate-800 text-slate-300 border-slate-700'
                              }`}>
                                {issue.priority}
                              </span>
                            </div>

                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                              issue.status === 'Open' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                              issue.status === 'In Progress' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                              issue.status === 'Waiting' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                              issue.status === 'Resolved' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                              'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {issue.status}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-300 transition">
                              {issue.title}
                            </h3>
                            <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                              {issue.description}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-3 text-xs text-slate-400">
                            <div className="flex items-center gap-4 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>{issue.machine ? issue.machine.name : 'General Facility'}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                <span>{issue.department}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>Assigned: {issue.assigned_worker ? issue.assigned_worker.full_name : 'Unassigned'}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 text-[11px] bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                                <MessageSquare className="w-3 h-3 text-amber-400" />
                                <span>{issue.comments ? issue.comments.length : 0}</span>
                              </span>
                              <span className="flex items-center gap-1 text-[11px] bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                                <Paperclip className="w-3 h-3 text-amber-400" />
                                <span>{issue.attachments ? issue.attachments.length : 0}</span>
                              </span>
                              <span className="text-[11px] text-amber-400 font-bold group-hover:underline flex items-center gap-1">
                                <span>Details</span>
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Task Creation & Safety Evaluation Modal */}
      {showTaskModal && (() => {
        const missingFields = getMissingFields();
        const canEvaluate = missingFields.length === 0;
        const activeWorkers = workers.filter(w => w.is_active);
        const selectedWorker = workers.find(w => w.id === newTaskWorkerId);
        const selectedMachine = machines.find(m => m.id === newTaskMachineId);

        return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-amber-400">
                <ShieldAlert className="w-5 h-5" />
                <h2 className="text-lg font-bold text-slate-100">Submit Work Order & Evaluate Safety</h2>
              </div>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  setNewTaskTitle(''); setNewTaskDesc('');
                  setNewTaskMachineId(null); setNewTaskProcedureId(null);
                  setNewTaskWorkerId(null); setCompatibleProcedures([]);
                  setEvalResult(null);
                }}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold"
              >✕</button>
            </div>

            <div className="space-y-4 text-sm">

              {/* Task Title */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Task Title <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., Replace Transformer Coils"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description & Scope <span className="text-rose-400">*</span></label>
                <textarea
                  placeholder="Describe maintenance actions..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 h-20"
                />
              </div>

              {/* Assigned Worker */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Assigned Worker / Technician <span className="text-rose-400">*</span></label>
                <select
                  value={newTaskWorkerId ?? ''}
                  onChange={e => { setNewTaskWorkerId(e.target.value ? Number(e.target.value) : null); setEvalResult(null); }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                >
                  <option value="">— Select a worker —</option>
                  {activeWorkers.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.full_name} — {w.worker_code} — {w.role} — {w.department} — Clearance {w.clearance_level}
                    </option>
                  ))}
                </select>
              </div>

              {/* Machine + SOP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-400">Target Machine <span className="text-rose-400">*</span></label>
                    <button type="button" onClick={() => setShowMachineModal(true)} className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1">
                      <Plus className="w-3 h-3 stroke-[3]" /><span>Add Machine</span>
                    </button>
                  </div>
                  <CustomSelect
                    value={newTaskMachineId ?? ''}
                    onChange={(val) => handleMachineChange(Number(val))}
                    options={machines.map(m => ({
                      value: m.id,
                      label: `${m.name} — ${m.status}`,
                      sublabel: `${m.location} • Rating: ${m.safety_rating}`,
                      badge: m.machine_code
                    }))}
                    placeholder="Select machine..."
                  />
                  {newTaskMachineId && (() => {
                    const sel = machines.find(m => m.id === newTaskMachineId);
                    if (!sel) return null;
                    const statusColor = sel.status === 'OPERATIONAL' ? 'text-emerald-400' : sel.status === 'MAINTENANCE' ? 'text-amber-400' : sel.status === 'HAZARDOUS' ? 'text-rose-400' : 'text-slate-400';
                    return <p className={`text-[10px] mt-1 font-bold ${statusColor}`}>Status: {sel.status}</p>;
                  })()}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-400">
                      Standard Operating Procedure <span className="text-rose-400">*</span>
                    </label>
                  </div>
                  {!newTaskMachineId ? (
                    <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-500 italic">
                      Select a machine first to see compatible SOPs
                    </div>
                  ) : loadingCompatible ? (
                    <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-400 flex items-center gap-2">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Loading compatible SOPs...
                    </div>
                  ) : compatibleProcedures.length === 0 ? (
                    <div className="space-y-2">
                      <div className="w-full bg-rose-950/30 border border-rose-500/20 rounded-xl px-4 py-3 text-xs text-rose-300 leading-relaxed">
                        No approved SOPs are assigned to <span className="font-bold">{machines.find(m => m.id === newTaskMachineId)?.name ?? 'this machine'}</span>. Go to Machinery & IoT and use <span className="font-bold">Manage SOPs</span> to assign one.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const machine = machines.find(m => m.id === newTaskMachineId);
                          setShowTaskModal(false);
                          setActiveTab('machines');
                          if (machine) setTimeout(() => openManageSops(machine), 100);
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/20 text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        <Link2 className="w-3.5 h-3.5" /> Manage Machine SOPs
                      </button>
                    </div>
                  ) : compatibleProcedures.length === 1 ? (
                    // Exactly one SOP — show read-only auto-selected
                    <div className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-300">{compatibleProcedures[0].title}</span>
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">{compatibleProcedures[0].procedure_code}</span>
                      </div>
                      <p className="text-slate-500">{compatibleProcedures[0].category} • Req. Level {compatibleProcedures[0].required_clearance_level}+ • Auto-selected</p>
                    </div>
                  ) : (
                    // Multiple SOPs — show dropdown
                    <CustomSelect
                      value={newTaskProcedureId ?? ''}
                      onChange={(val) => { setNewTaskProcedureId(Number(val)); setEvalResult(null); }}
                      options={compatibleProcedures.map(p => ({
                        value: p.id,
                        label: p.title,
                        sublabel: `${p.category} • Req. Level ${p.required_clearance_level}+`,
                        badge: p.procedure_code
                      }))}
                      placeholder="Select compatible SOP..."
                    />
                  )}
                </div>
              </div>

              {/* Missing fields warning */}
              {!canEvaluate && (
                <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-400 space-y-1">
                  <span className="font-bold text-slate-300">Complete these fields to run safety evaluation:</span>
                  <ul className="list-disc list-inside pl-1 space-y-0.5">
                    {missingFields.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}

              {/* Evaluate Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleEvaluateTask}
                  disabled={evaluating || !canEvaluate}
                  className={`w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition border ${
                    canEvaluate
                      ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-amber-500/30'
                      : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                  }`}
                >
                  {evaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                  <span>Run Automated Safety Evaluation</span>
                </button>
              </div>

              {/* Evaluation Outcome */}
              {evalResult && (() => {
                const decisionConfig: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode; label: string }> = {
                  ALLOW: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-300', icon: <ShieldCheck className="w-5 h-5" />, label: 'PERMITTED TO DISPATCH' },
                  PROCEED_WITH_CAUTION: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-300', icon: <ShieldAlert className="w-5 h-5" />, label: 'PROCEED WITH CAUTION' },
                  SUPERVISOR_APPROVAL: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300', icon: <UserCheck className="w-5 h-5" />, label: 'SUPERVISOR APPROVAL REQUIRED' },
                  BLOCK: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-300', icon: <ShieldAlert className="w-5 h-5" />, label: 'TASK BLOCKED' },
                };
                const dc = decisionConfig[evalResult.decision] ?? decisionConfig['BLOCK'];
                const scoreColor = evalResult.risk_score >= 65 ? 'text-rose-400' : evalResult.risk_score >= 40 ? 'text-orange-400' : evalResult.risk_score >= 20 ? 'text-yellow-400' : 'text-emerald-400';
                const statusColor = (s: string) => s === 'FAILED' ? 'text-rose-400' : s === 'WARNING' ? 'text-yellow-400' : 'text-emerald-400';
                const statusDot = (s: string) => s === 'FAILED' ? 'bg-rose-500' : s === 'WARNING' ? 'bg-yellow-500' : 'bg-emerald-500';
                const ew = evalResult.evaluated_worker;
                return (
                  <div className="space-y-3">
                    {/* Decision Banner */}
                    <div className={`p-4 rounded-xl border ${dc.bg} ${dc.border} ${dc.text}`}>
                      <div className="flex items-center justify-between font-bold text-sm">
                        <div className="flex items-center gap-2">{dc.icon}<span>Safety Verdict: {dc.label}</span></div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono font-bold ${scoreColor}`}>{evalResult.risk_score}/100</span>
                          <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                            evalResult.risk_level === 'CRITICAL' ? 'bg-rose-900 text-rose-300' :
                            evalResult.risk_level === 'HIGH' ? 'bg-orange-900 text-orange-300' :
                            evalResult.risk_level === 'MEDIUM' ? 'bg-yellow-900 text-yellow-300' :
                            'bg-emerald-900 text-emerald-300'
                          }`}>{evalResult.risk_level}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${
                            evalResult.risk_score >= 65 ? 'bg-rose-500' :
                            evalResult.risk_score >= 40 ? 'bg-orange-500' :
                            evalResult.risk_score >= 20 ? 'bg-yellow-500' : 'bg-emerald-500'
                          }`} style={{ width: `${Math.min(evalResult.risk_score, 100)}%` }} />
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>0 — SAFE</span><span>20</span><span>40</span><span>65</span><span>100 — CRITICAL</span>
                        </div>
                      </div>
                    </div>

                    {/* Plain-English Explanation */}
                    {(() => {
                      const eb = (evalResult as any).evaluation_breakdown ?? {};
                      const ew2 = evalResult.evaluated_worker;
                      const proc = procedures.find(p => p.id === newTaskProcedureId);
                      const mach = machines.find(m => m.id === newTaskMachineId);
                      const missing = evalResult.required_certifications_missing ?? [];
                      const expired = (evalResult as any).expired_certifications ?? [];
                      const anomalies = (evalResult as any).sensor_anomalies_detected ?? [];
                      const parts: string[] = [];
                      if (ew2 && proc) {
                        parts.push(`${ew2.full_name} (L${ew2.clearance_level}) ${eb.clearance_check ? `meets` : `does NOT meet`} the required L${proc.required_clearance_level} clearance`);
                      }
                      if (missing.length > 0) parts.push(`missing certs: ${missing.join(', ')}`);
                      else if (expired.length > 0) parts.push(`expired certs: ${expired.join(', ')}`);
                      else parts.push(`all required certifications are valid`);
                      if (mach) parts.push(`machine is ${mach.status}`);
                      if (anomalies.length > 0) parts.push(`active sensor anomalies: ${anomalies.join(', ')}`);
                      else parts.push(`sensors are normal`);
                      const color = evalResult.decision === 'ALLOW' || evalResult.decision === 'PROCEED_WITH_CAUTION' ? 'text-emerald-300' : 'text-rose-300';
                      return (
                        <p className={`text-xs px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl ${color} leading-relaxed`}>
                          <strong>Why:</strong> {parts.join(' · ')}.
                        </p>
                      );
                    })()}

                    {/* Evaluated Worker Card */}
                    {ew && (
                      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-xs space-y-1">
                        <span className="font-bold text-slate-300 flex items-center gap-1"><HardHat className="w-3.5 h-3.5" /> Evaluated Worker</span>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-slate-400 mt-1">
                          <span>Name: <span className="text-slate-200 font-medium">{ew.full_name}</span></span>
                          <span>Code: <span className="text-amber-300 font-mono">{ew.worker_code}</span></span>
                          <span>Role: <span className="text-slate-200">{ew.role}</span></span>
                          <span>Department: <span className="text-slate-200">{ew.department}</span></span>
                          <span>Clearance: <span className="text-slate-200">Level {ew.clearance_level}</span></span>
                          <span>Training: <span className={evalResult.required_certifications_missing?.length > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                            {evalResult.required_certifications_missing?.length > 0 ? '⚠ Certs missing' : '✓ Verified'}
                          </span></span>
                        </div>
                      </div>
                    )}

                    {/* Block Reasons */}
                    {evalResult.block_reasons?.length > 0 && (
                      <div className="bg-rose-950/40 border border-rose-500/20 rounded-xl p-3 text-xs space-y-1">
                        <span className="font-bold text-rose-400 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Blocking Reasons</span>
                        <ul className="list-disc list-inside text-rose-300 pl-1 space-y-0.5">
                          {evalResult.block_reasons.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Risk Factor Breakdown */}
                    {evalResult.risk_factors?.length > 0 && (
                      <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 space-y-2">
                        <span className="text-xs font-bold text-slate-300 flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Risk Factor Breakdown</span>
                        <div className="space-y-1.5">
                          {evalResult.risk_factors.map((f, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${statusDot(f.status)}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-slate-400 truncate">{f.category}</span>
                                  {f.impact_score > 0 && <span className={`font-bold flex-shrink-0 ${statusColor(f.status)}`}>+{f.impact_score.toFixed(0)}</span>}
                                </div>
                                <p className="text-slate-500 leading-tight mt-0.5">{f.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing / Expired Certs */}
                    {(evalResult.required_certifications_missing?.length > 0 || evalResult.expired_certifications?.length > 0) && (
                      <div className="bg-orange-950/30 border border-orange-500/20 rounded-xl p-3 text-xs space-y-2">
                        {evalResult.required_certifications_missing?.length > 0 && (
                          <div>
                            <span className="font-bold text-orange-400">Missing Certifications:</span>
                            <ul className="list-disc list-inside text-orange-300 pl-1 mt-0.5 space-y-0.5">
                              {evalResult.required_certifications_missing.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                          </div>
                        )}
                        {evalResult.expired_certifications?.length > 0 && (
                          <div>
                            <span className="font-bold text-yellow-400">Expired Certifications:</span>
                            <ul className="list-disc list-inside text-yellow-300 pl-1 mt-0.5 space-y-0.5">
                              {evalResult.expired_certifications.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sensor Anomalies */}
                    {evalResult.sensor_anomalies_detected?.length > 0 && (
                      <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-3 text-xs space-y-1">
                        <span className="font-bold text-purple-400 flex items-center gap-1"><Radio className="w-3.5 h-3.5" /> Sensor Anomalies</span>
                        <ul className="list-disc list-inside text-purple-300 pl-1 space-y-0.5">
                          {evalResult.sensor_anomalies_detected.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* AI Briefing */}
                    {evalResult.ai_safety_briefing && (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                        <span className="text-amber-400 font-bold flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> AI Safety Briefing</span>
                        <p className="leading-relaxed">{evalResult.ai_safety_briefing}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowTaskModal(false);
                  setNewTaskTitle(''); setNewTaskDesc('');
                  setNewTaskMachineId(null); setNewTaskProcedureId(null);
                  setNewTaskWorkerId(null); setCompatibleProcedures([]);
                  setEvalResult(null);
                }}
                className="bg-slate-800 text-slate-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-700"
              >
                Cancel
              </button>

              {evalResult?.decision === 'SUPERVISOR_APPROVAL' ? (
                <button
                  type="button"
                  onClick={handleCreateTask}
                  className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-2 rounded-xl text-sm shadow-lg shadow-orange-500/20 flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Request Supervisor Approval
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateTask}
                  disabled={!newTaskTitle || evalResult?.is_blocked === true || !evalResult}
                  title={
                    !evalResult ? 'Run safety evaluation first' :
                    evalResult.is_blocked ? 'Task is blocked by risk engine' : ''
                  }
                  className={`font-bold px-6 py-2 rounded-xl text-sm shadow-lg transition ${
                    !evalResult || evalResult.is_blocked
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  }`}
                >
                  {!evalResult ? 'Evaluate First' : evalResult.is_blocked ? '🚫 Blocked — Cannot Submit' : 'Submit Work Order'}
                </button>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* Sensor Edit Modal */}
      <SensorEditModal
        machine={sensorEditMachine}
        isOpen={!!sensorEditMachine}
        onClose={() => setSensorEditMachine(null)}
        onSaved={async () => {
          if (sensorEditMachine) {
            const res = await fetch(`/api/v1/sensors/machine/${sensorEditMachine.id}?limit=100`);
            if (res.ok) {
              const data = await res.json();
              setActiveMachineTelemetry(prev => ({ ...prev, [sensorEditMachine.id]: Array.isArray(data) ? data : [] }));
            }
          }
        }}
      />

      {/* SOP Edit & Upload Modal */}
      <SopModal
        isOpen={showSopModal}
        onClose={() => {
          setShowSopModal(false);
          setSopToEdit(null);
        }}
        procedureToEdit={sopToEdit}
        onSaveSuccess={() => {
          fetchInitialData();
          if (searchQuery) handleSOPSearch();
        }}
      />

      {/* SOP Detail Inspector Modal */}
      <SopDetailModal
        procedure={sopToView}
        onClose={() => setSopToView(null)}
        onEdit={(proc) => {
          setSopToView(null);
          setSopToEdit(proc);
          setShowSopModal(true);
        }}
      />

      {/* Register Machine Modal */}
      <MachineModal
        isOpen={showMachineModal}
        onClose={() => setShowMachineModal(false)}
        onSaveSuccess={fetchInitialData}
      />

      {/* Report Incident Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h2 className="text-lg font-bold text-slate-100">Report Incident / Near Miss</h2>
              </div>
              <button onClick={() => { if (!incidentSubmitting) { setShowIncidentModal(false); setIncidentError(null); setIncidentSuccess(null); } }}
                disabled={incidentSubmitting}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition disabled:opacity-40">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {incidentError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{incidentError}
                </div>
              )}
              {incidentSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />{incidentSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Incident Code</label>
                  <input type="text" value={incidentForm.incident_code}
                    onChange={e => setIncidentForm(f => ({ ...f, incident_code: e.target.value }))}
                    disabled={incidentSubmitting}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-rose-300 focus:outline-none focus:border-amber-500 disabled:opacity-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Severity</label>
                  <select value={incidentForm.severity}
                    onChange={e => setIncidentForm(f => ({ ...f, severity: e.target.value }))}
                    disabled={incidentSubmitting}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-50">
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Title <span className="text-rose-400">*</span></label>
                <input type="text" placeholder="e.g. Hydraulic fluid leak near press unit"
                  value={incidentForm.title} onChange={e => setIncidentForm(f => ({ ...f, title: e.target.value }))}
                  disabled={incidentSubmitting}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-50" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Description <span className="text-rose-400">*</span></label>
                <textarea rows={3} placeholder="Describe what happened, where, and any immediate actions taken..."
                  value={incidentForm.description} onChange={e => setIncidentForm(f => ({ ...f, description: e.target.value }))}
                  disabled={incidentSubmitting}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none disabled:opacity-50" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Machine Involved <span className="text-rose-400">*</span></label>
                  <select value={incidentForm.machine_id}
                    onChange={e => setIncidentForm(f => ({ ...f, machine_id: e.target.value }))}
                    disabled={incidentSubmitting}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-50">
                    <option value="">— Select Machine —</option>
                    {machines.map(m => <option key={m.id} value={m.id}>{m.name} ({m.machine_code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Worker Involved</label>
                  <select value={incidentForm.worker_id}
                    onChange={e => setIncidentForm(f => ({ ...f, worker_id: e.target.value }))}
                    disabled={incidentSubmitting}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-50">
                    <option value="">— None —</option>
                    {workers.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button onClick={() => { if (!incidentSubmitting) { setShowIncidentModal(false); setIncidentError(null); } }}
                  disabled={incidentSubmitting}
                  className="px-4 py-2 text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition disabled:opacity-40">Cancel</button>
                <button disabled={incidentSubmitting || !!incidentSuccess}
                  onClick={async () => {
                    if (!incidentForm.title.trim()) { setIncidentError('Title is required.'); return; }
                    if (!incidentForm.description.trim()) { setIncidentError('Description is required.'); return; }
                    if (!incidentForm.machine_id) { setIncidentError('Machine is required.'); return; }
                    setIncidentSubmitting(true); setIncidentError(null);
                    try {
                      const payload: Record<string, any> = {
                        incident_code: incidentForm.incident_code.trim(),
                        title: incidentForm.title.trim(),
                        description: incidentForm.description.trim(),
                        severity: incidentForm.severity,
                        machine_id: Number(incidentForm.machine_id),
                      };
                      if (incidentForm.worker_id) payload.worker_id = Number(incidentForm.worker_id);
                      const res = await fetch('/api/v1/incidents/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                      });
                      if (!res.ok) {
                        const ct = res.headers.get('content-type') || '';
                        let msg = `Server error (${res.status})`;
                        try {
                          if (ct.includes('application/json')) { const j = await res.json(); msg = j.detail || msg; }
                          else { const t = await res.text(); if (t.length < 200) msg = t; }
                        } catch (err) { console.error("[SafeOps] Request failed:", err); }
                        setIncidentError(msg); return;
                      }
                      setIncidentSuccess('Incident reported successfully.');
                      const incRes = await fetch('/api/v1/incidents/');
                      const incData = await incRes.json();
                      setIncidents(Array.isArray(incData) ? incData : []);
                      setTimeout(() => { setShowIncidentModal(false); setIncidentSuccess(null); setIncidentError(null); }, 1500);
                    } catch { setIncidentError('Network error. Please try again.'); }
                    finally { setIncidentSubmitting(false); }
                  }}
                  className="px-5 py-2 text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white rounded-xl transition flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed">
                  <Plus className="w-4 h-4 stroke-[3]" />
                  {incidentSubmitting ? 'Reporting...' : 'Report Incident'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Incident Details Modal */}
      {viewIncident && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h2 className="text-lg font-bold text-slate-100">Incident Details</h2>
              </div>
              <button onClick={() => setViewIncident(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-mono text-rose-400 font-bold text-sm">{viewIncident.incident_code}</span>
                <div className="flex gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                    viewIncident.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                    viewIncident.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                    'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}>{viewIncident.severity}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                    viewIncident.resolution_status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>{viewIncident.resolution_status}</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-100">{viewIncident.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{viewIncident.description}</p>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-slate-500">Machine ID</span><p className="text-slate-200 font-medium">{viewIncident.machine_id ? `#${viewIncident.machine_id}` : '—'}</p></div>
                  <div><span className="text-slate-500">Worker ID</span><p className="text-slate-200 font-medium">{viewIncident.worker_id ? `#${viewIncident.worker_id}` : '—'}</p></div>
                  <div><span className="text-slate-500">Reported At</span><p className="text-slate-200 font-medium">{new Date(viewIncident.reported_at).toLocaleString()}</p></div>
                  <div><span className="text-slate-500">Created At</span><p className="text-slate-200 font-medium">{new Date(viewIncident.created_at).toLocaleString()}</p></div>
                </div>
              </div>
              {/* Resolution summary display */}
              {viewIncident.resolution && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 space-y-1">
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Resolution Summary</p>
                  <p className="text-sm text-emerald-200">{viewIncident.resolution}</p>
                  {viewIncident.resolved_at && (
                    <p className="text-[10px] text-slate-500">Resolved: {new Date(viewIncident.resolved_at).toLocaleString()}</p>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 space-y-3">
                {viewIncident.resolution_status !== 'RESOLVED' && (
                  incidentResolutionForm?.id === viewIncident.id ? (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Resolution Summary <span className="text-rose-400">*</span></label>
                      <textarea
                        rows={3}
                        placeholder="Describe how the incident was resolved, actions taken, and preventive measures..."
                        value={incidentResolutionForm.summary}
                        onChange={e => setIncidentResolutionForm({ ...incidentResolutionForm, summary: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setIncidentResolutionForm(null)}
                          className="px-3 py-1.5 text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition">Cancel</button>
                        <button
                          disabled={!incidentResolutionForm.summary.trim()}
                          onClick={async () => {
                            if (!incidentResolutionForm.summary.trim()) return;
                            try {
                              const res = await fetch(`/api/v1/incidents/${viewIncident.id}/resolve`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ resolution: incidentResolutionForm.summary })
                              });
                              if (res.ok) {
                                const updated = await res.json();
                                setViewIncident(updated);
                                setIncidentResolutionForm(null);
                                const listRes = await fetch('/api/v1/incidents/');
                                if (listRes.ok) setIncidents(await listRes.json());
                              }
                            } catch (err) { console.error('[SafeOps] Resolve incident failed:', err); }
                          }}
                          className="px-4 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Submit Resolution
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIncidentResolutionForm({ id: viewIncident.id, summary: '' })}
                      className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark Resolved
                    </button>
                  )
                )}
                <div className="flex justify-end">
                  <button onClick={() => { setViewIncident(null); setIncidentResolutionForm(null); }}
                    className="px-4 py-2 text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition">Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ahil's MachineSopModal */}
      <MachineSopModal
        isOpen={showMachineSopModal}
        onClose={() => { setShowMachineSopModal(false); fetchInitialData(); }}
        machine={selectedMachineForSops}
      />

      {/* Ahil's SensorRangeModal */}
      <SensorRangeModal
        isOpen={showSensorRangeModal}
        onClose={() => setShowSensorRangeModal(false)}
        machine={selectedMachineForRanges}
      />


      {/* Edit Machine Modal */}
      {editMachine && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-slate-100">Edit Machine — {editMachine.machine_code}</h2>
              </div>
              <button onClick={() => setEditMachine(null)} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {editMachineError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />{editMachineError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Machine Name</label>
                  <input type="text" value={editMachine.name}
                    onChange={e => setEditMachine((p: any) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Model / Serial</label>
                  <input type="text" value={editMachine.model}
                    onChange={e => setEditMachine((p: any) => ({ ...p, model: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Location</label>
                <input type="text" value={editMachine.location}
                  onChange={e => setEditMachine((p: any) => ({ ...p, location: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</label>
                  <select value={editMachine.status}
                    onChange={e => setEditMachine((p: any) => ({ ...p, status: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500">
                    <option value="OPERATIONAL">OPERATIONAL</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="HAZARDOUS">HAZARDOUS</option>
                    <option value="OFFLINE">OFFLINE</option>
                    <option value="LOCKED_OUT">LOCKED_OUT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Safety Rating (0–100)</label>
                  <input type="number" min={0} max={100} value={editMachine.safety_rating}
                    onChange={e => setEditMachine((p: any) => ({ ...p, safety_rating: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold focus:outline-none focus:border-amber-500" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="editLoto" checked={editMachine.requires_loto}
                  onChange={e => setEditMachine((p: any) => ({ ...p, requires_loto: e.target.checked }))}
                  className="w-4 h-4 accent-amber-500" />
                <label htmlFor="editLoto" className="text-xs text-slate-400">Mandatory LOTO Protocol</label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button onClick={() => setEditMachine(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition">Cancel</button>
                <button disabled={editMachineSubmitting}
                  onClick={async () => {
                    setEditMachineSubmitting(true); setEditMachineError(null);
                    try {
                      const res = await fetch(`/api/v1/machines/${editMachine.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: editMachine.name,
                          model: editMachine.model,
                          location: editMachine.location,
                          status: editMachine.status,
                          safety_rating: Number(editMachine.safety_rating),
                          requires_loto: editMachine.requires_loto,
                        }),
                      });
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        setEditMachineError(data?.detail || 'Failed to update machine.');
                        return;
                      }
                      setEditMachine(null);
                      fetchInitialData();
                    } catch { setEditMachineError('Network error. Please try again.'); }
                    finally { setEditMachineSubmitting(false); }
                  }}
                  className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition flex items-center gap-1.5 disabled:opacity-60">
                  <CheckCircle2 className="w-4 h-4" />
                  {editMachineSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Worker Modal */}
      <WorkerModal
        isOpen={showWorkerModal}
        onClose={() => setShowWorkerModal(false)}
        onSaveSuccess={fetchInitialData}
      />


      {/* Log Issue Modal */}
      <IssueCreateModal
        isOpen={showIssueCreateModal}
        onClose={() => setShowIssueCreateModal(false)}
        onSaveSuccess={fetchIssues}
        machines={machines}
        workers={workers}
        currentWorkerId={selectedWorkerId ?? undefined}
      />

      {/* Issue Detail Inspector Modal */}
      <IssueDetailModal
        issue={selectedIssueForDetail}
        isOpen={!!selectedIssueForDetail}
        onClose={() => setSelectedIssueForDetail(null)}
        onRefresh={fetchIssues}
        currentWorker={currentWorker ?? undefined}
      />
    </div>
  );
}
