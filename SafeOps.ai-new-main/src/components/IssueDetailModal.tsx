import React, { useState, useEffect } from 'react';
import { 
  X, AlertTriangle, Bug, CheckCircle2, Clock, User, Cog as MachineIcon, 
  MessageSquare, Paperclip, Send, History, Building2, Calendar, FileText, ArrowRight,
  ShieldCheck, UserCheck, ArrowRightLeft, TrendingUp, Lock, RefreshCw, Layers, Play
} from 'lucide-react';
import { Issue, Worker } from '../types';

interface IssueDetailModalProps {
  issue: Issue | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  currentWorker?: Worker;
}

export function IssueDetailModal({
  issue,
  isOpen,
  onClose,
  onRefresh,
  currentWorker
}: IssueDetailModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'comments' | 'history' | 'ownership'>('ownership');
  
  // Available Workers List
  const [workersList, setWorkersList] = useState<Worker[]>([]);

  // Status Change State
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [resolutionText, setResolutionText] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // New Comment State
  const [commentText, setCommentText] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  // New Attachment State
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('document');
  const [isAddingAttachment, setIsAddingAttachment] = useState(false);
  const [showAttachForm, setShowAttachForm] = useState(false);

  // Ownership Management Action States
  const [activeAction, setActiveAction] = useState<'assign' | 'transfer' | 'reassign' | 'escalate' | 'close' | null>(null);
  const [targetWorkerId, setTargetWorkerId] = useState<string>('');
  const [targetSupervisorId, setTargetSupervisorId] = useState<string>('');
  const [targetDept, setTargetDept] = useState<string>('PLANT_OPS');
  const [actionReason, setActionReason] = useState<string>('');
  const [newPriority, setNewPriority] = useState<string>('');
  const [closeResolution, setCloseResolution] = useState<string>('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/v1/workers')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setWorkersList(data);
        })
        .catch(err => console.error('Failed to load workers:', err));
    }
  }, [isOpen]);

  if (!isOpen || !issue) return null;

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/v1/issues/${issue.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          notes: statusNotes || undefined,
          changed_by_id: currentWorker?.id || issue.assigned_worker_id,
          resolution: resolutionText || undefined
        })
      });
      if (res.ok) {
        setStatusNotes('');
        setResolutionText('');
        setNewStatus('');
        onRefresh();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsAddingComment(true);
    try {
      const res = await fetch(`/api/v1/issues/${issue.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment_text: commentText,
          author_name: currentWorker?.full_name || 'System User',
          author_id: currentWorker?.id
        })
      });
      if (res.ok) {
        setCommentText('');
        onRefresh();
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || !fileUrl) return;
    setIsAddingAttachment(true);
    try {
      const res = await fetch(`/api/v1/issues/${issue.id}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_name: fileName,
          file_url: fileUrl,
          file_type: fileType
        })
      });
      if (res.ok) {
        setFileName('');
        setFileUrl('');
        setShowAttachForm(false);
        onRefresh();
      }
    } catch (err) {
      console.error('Error adding attachment:', err);
    } finally {
      setIsAddingAttachment(false);
    }
  };

  // Ownership Module API Dispatchers
  const handleAssignOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWorkerId) {
      setActionError('Please select a worker to assign.');
      return;
    }
    setIsSubmittingAction(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/issues/${issue.id}/assign-owner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_worker_id: Number(targetWorkerId),
          changed_by_id: currentWorker?.id,
          notes: actionReason || 'Owner assigned via Ownership Module'
        })
      });
      if (res.ok) {
        setActiveAction(null);
        setActionReason('');
        setTargetWorkerId('');
        onRefresh();
      } else {
        setActionError('Failed to assign owner.');
      }
    } catch (err) {
      setActionError('Network error while assigning owner.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleTransferOwnership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWorkerId || !actionReason.trim()) {
      setActionError('Please select a new owner and state the reason.');
      return;
    }
    setIsSubmittingAction(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/issues/${issue.id}/transfer-ownership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_owner_id: Number(targetWorkerId),
          changed_by_id: currentWorker?.id,
          reason: actionReason
        })
      });
      if (res.ok) {
        setActiveAction(null);
        setActionReason('');
        setTargetWorkerId('');
        onRefresh();
      } else {
        setActionError('Failed to transfer ownership.');
      }
    } catch (err) {
      setActionError('Network error while transferring ownership.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleReassignDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDept || !actionReason.trim()) {
      setActionError('Please select target department and enter reason.');
      return;
    }
    setIsSubmittingAction(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/issues/${issue.id}/reassign-department`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_department: targetDept,
          new_owner_id: targetWorkerId ? Number(targetWorkerId) : undefined,
          new_supervisor_id: targetSupervisorId ? Number(targetSupervisorId) : undefined,
          changed_by_id: currentWorker?.id,
          reason: actionReason
        })
      });
      if (res.ok) {
        setActiveAction(null);
        setActionReason('');
        setTargetWorkerId('');
        setTargetSupervisorId('');
        onRefresh();
      } else {
        setActionError('Failed to reassign department.');
      }
    } catch (err) {
      setActionError('Network error while reassigning department.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionReason.trim()) {
      setActionError('Please enter escalation justification.');
      return;
    }
    setIsSubmittingAction(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/issues/${issue.id}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_supervisor_id: targetSupervisorId ? Number(targetSupervisorId) : undefined,
          new_owner_id: targetWorkerId ? Number(targetWorkerId) : undefined,
          changed_by_id: currentWorker?.id,
          reason: actionReason,
          new_priority: newPriority || undefined
        })
      });
      if (res.ok) {
        setActiveAction(null);
        setActionReason('');
        setTargetWorkerId('');
        setTargetSupervisorId('');
        setNewPriority('');
        onRefresh();
      } else {
        setActionError('Failed to escalate issue.');
      }
    } catch (err) {
      setActionError('Network error while escalating issue.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleCloseIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closeResolution.trim()) {
      setActionError('Please provide a technical resolution summary.');
      return;
    }
    setIsSubmittingAction(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/issues/${issue.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution: closeResolution,
          changed_by_id: currentWorker?.id,
          notes: actionReason || undefined
        })
      });
      if (res.ok) {
        setActiveAction(null);
        setCloseResolution('');
        setActionReason('');
        onRefresh();
      } else {
        setActionError('Failed to close issue.');
      }
    } catch (err) {
      setActionError('Network error while closing issue.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'CRITICAL': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'Open': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'In Progress': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Waiting': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Resolved': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'Closed': return 'bg-slate-800 text-slate-400 border-slate-700';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'INITIAL_CREATION': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'ASSIGN_OWNER': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'TRANSFER_OWNERSHIP': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'REASSIGN_DEPARTMENT': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'ESCALATE': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'CLOSE_ISSUE': return 'bg-slate-800 text-slate-300 border-slate-700';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {issue.issue_code}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityBadge(issue.priority)}`}>
                {issue.priority} PRIORITY
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(issue.status)}`}>
                STATUS: {issue.status.toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">{issue.title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* OWNERSHIP MANAGEMENT MODULE: CURRENT RESPONSIBLE PERSONNEL */}
          <div className="p-4 bg-slate-950 border border-amber-500/30 rounded-2xl space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500/10 text-amber-400 font-mono text-[10px] font-bold rounded-bl-xl border-l border-b border-amber-500/20">
              OWNERSHIP MODULE
            </div>

            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Current Responsible Personnel & Escalation Matrix</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {/* Reporter */}
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Reporter</span>
                <p className="font-bold text-slate-100 truncate">{issue.reporter ? issue.reporter.full_name : 'System Reporter'}</p>
                <p className="text-[10px] text-slate-400 truncate">{issue.reporter ? issue.reporter.role : 'Worker'}</p>
              </div>

              {/* Current Owner */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block flex items-center justify-between">
                  <span>Current Owner</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </span>
                <p className="font-bold text-emerald-200 truncate">{issue.assigned_worker ? issue.assigned_worker.full_name : 'Unassigned'}</p>
                <p className="text-[10px] text-emerald-400/80 truncate">{issue.assigned_worker ? issue.assigned_worker.role : 'Awaiting Assignment'}</p>
              </div>

              {/* Department */}
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">Department</span>
                <p className="font-bold text-purple-100 truncate">{issue.department}</p>
                <p className="text-[10px] text-purple-400 truncate">Plant Sector</p>
              </div>

              {/* Supervisor */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Supervisor</span>
                <p className="font-bold text-amber-100 truncate">{issue.assigned_supervisor ? issue.assigned_supervisor.full_name : 'Unassigned'}</p>
                <p className="text-[10px] text-amber-400/80 truncate">{issue.assigned_supervisor ? issue.assigned_supervisor.role : 'Plant Manager'}</p>
              </div>
            </div>

            {/* Ownership API Action Toolbar */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Actions:</span>

              {!issue.assigned_worker ? (
                <button
                  type="button"
                  onClick={() => { setActiveAction('assign'); setActionError(null); }}
                  className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold transition flex items-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Assign Owner</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setActiveAction('transfer'); setActionError(null); }}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-bold transition flex items-center gap-1"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Transfer Ownership</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => { setActiveAction('reassign'); setActionError(null); }}
                className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg font-bold transition flex items-center gap-1"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Reassign Dept</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveAction('escalate'); setActionError(null); }}
                className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg font-bold transition flex items-center gap-1"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Escalate</span>
              </button>

              {issue.status === 'Open' && (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await fetch(`/api/v1/issues/${issue.id}/status`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'In Progress' })
                    });
                    if (res.ok) onRefresh();
                  }}
                  className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-lg font-bold transition flex items-center gap-1"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Work</span>
                </button>
              )}

              {issue.status === 'In Progress' && (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await fetch(`/api/v1/issues/${issue.id}/status`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'Resolved' })
                    });
                    if (res.ok) onRefresh();
                  }}
                  className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold transition flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Resolved</span>
                </button>
              )}

              {issue.status === 'Resolved' && (
                <button
                  type="button"
                  onClick={() => { setActiveAction('close'); setActionError(null); }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg font-bold transition flex items-center gap-1 ml-auto"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Close Issue</span>
                </button>
              )}
            </div>

            {/* DYNAMIC ACTION FORM PANEL */}
            {activeAction && (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 mt-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-amber-400 capitalize flex items-center gap-1.5">
                    {activeAction === 'assign' && <UserCheck className="w-4 h-4" />}
                    {activeAction === 'transfer' && <ArrowRightLeft className="w-4 h-4" />}
                    {activeAction === 'reassign' && <Building2 className="w-4 h-4" />}
                    {activeAction === 'escalate' && <TrendingUp className="w-4 h-4" />}
                    {activeAction === 'close' && <Lock className="w-4 h-4" />}
                    <span>
                      {activeAction === 'assign' && 'Assign Primary Owner'}
                      {activeAction === 'transfer' && 'Transfer Issue Ownership'}
                      {activeAction === 'reassign' && 'Reassign Issue Department'}
                      {activeAction === 'escalate' && 'Escalate Issue to Supervisor'}
                      {activeAction === 'close' && 'Close Issue with Resolution'}
                    </span>
                  </h4>
                  <button onClick={() => setActiveAction(null)} className="text-slate-400 hover:text-slate-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {actionError && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 p-2 rounded-lg">
                    {actionError}
                  </p>
                )}

                {/* FORM: ASSIGN OWNER */}
                {activeAction === 'assign' && (
                  <form onSubmit={handleAssignOwner} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Select Worker</label>
                        <select
                          value={targetWorkerId}
                          onChange={e => setTargetWorkerId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                          required
                        >
                          <option value="">-- Choose Worker --</option>
                          {workersList.map(w => (
                            <option key={w.id} value={w.id}>{w.full_name} ({w.role} - {w.department})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Notes / Instructions</label>
                        <input
                          type="text"
                          placeholder="Initial assignment instructions..."
                          value={actionReason}
                          onChange={e => setActionReason(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button type="button" onClick={() => setActiveAction(null)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold">Cancel</button>
                      <button type="submit" disabled={isSubmittingAction} className="px-4 py-1.5 bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-emerald-400 transition">
                        {isSubmittingAction ? 'Assigning...' : 'Confirm Assignment'}
                      </button>
                    </div>
                  </form>
                )}

                {/* FORM: TRANSFER OWNERSHIP */}
                {activeAction === 'transfer' && (
                  <form onSubmit={handleTransferOwnership} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">New Owner Worker</label>
                        <select
                          value={targetWorkerId}
                          onChange={e => setTargetWorkerId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                          required
                        >
                          <option value="">-- Choose New Owner --</option>
                          {workersList.map(w => (
                            <option key={w.id} value={w.id}>{w.full_name} ({w.role} - {w.department})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Transfer Justification Reason</label>
                        <input
                          type="text"
                          placeholder="e.g. Shift handover, specialization needed..."
                          value={actionReason}
                          onChange={e => setActionReason(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button type="button" onClick={() => setActiveAction(null)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold">Cancel</button>
                      <button type="submit" disabled={isSubmittingAction} className="px-4 py-1.5 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-amber-400 transition">
                        {isSubmittingAction ? 'Transferring...' : 'Execute Transfer'}
                      </button>
                    </div>
                  </form>
                )}

                {/* FORM: REASSIGN DEPARTMENT */}
                {activeAction === 'reassign' && (
                  <form onSubmit={handleReassignDepartment} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">New Department</label>
                        <select
                          value={targetDept}
                          onChange={e => setTargetDept(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                          required
                        >
                          <option value="PLANT_OPS">PLANT_OPS</option>
                          <option value="MAINTENANCE">MAINTENANCE</option>
                          <option value="SAFETY">SAFETY</option>
                          <option value="ELECTRICAL">ELECTRICAL</option>
                          <option value="HVAC">HVAC</option>
                          <option value="LOGISTICS">LOGISTICS</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Optional New Owner</label>
                        <select
                          value={targetWorkerId}
                          onChange={e => setTargetWorkerId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                        >
                          <option value="">Keep Existing Owner</option>
                          {workersList.map(w => (
                            <option key={w.id} value={w.id}>{w.full_name} ({w.department})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Reassignment Reason</label>
                        <input
                          type="text"
                          placeholder="Department handover reason..."
                          value={actionReason}
                          onChange={e => setActionReason(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button type="button" onClick={() => setActiveAction(null)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold">Cancel</button>
                      <button type="submit" disabled={isSubmittingAction} className="px-4 py-1.5 bg-purple-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-purple-400 transition">
                        {isSubmittingAction ? 'Reassigning...' : 'Reassign Department'}
                      </button>
                    </div>
                  </form>
                )}

                {/* FORM: ESCALATE */}
                {activeAction === 'escalate' && (
                  <form onSubmit={handleEscalate} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Escalate to Supervisor</label>
                        <select
                          value={targetSupervisorId}
                          onChange={e => setTargetSupervisorId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                        >
                          <option value="">-- Choose Supervisor --</option>
                          {workersList.filter(w => w.role === 'SUPERVISOR' || w.role === 'SAFETY_OFFICER').length === 0
                            ? <option value="" disabled>No supervisors available</option>
                            : workersList.filter(w => w.role === 'SUPERVISOR' || w.role === 'SAFETY_OFFICER').map(w => (
                            <option key={w.id} value={w.id}>{w.full_name} ({w.role})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Escalation Reason</label>
                        <input
                          type="text"
                          placeholder="Urgent safety risk, unresolved blocker..."
                          value={actionReason}
                          onChange={e => setActionReason(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">New Priority</label>
                      <select
                        value={newPriority}
                        onChange={e => setNewPriority(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      >
                        <option value="">— Keep current ({issue.priority}) —</option>
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button type="button" onClick={() => setActiveAction(null)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold">Cancel</button>
                      <button type="submit" disabled={isSubmittingAction} className="px-4 py-1.5 bg-rose-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-rose-400 transition">
                        {isSubmittingAction ? 'Escalating...' : 'Escalate Issue'}
                      </button>
                    </div>
                  </form>
                )}

                {/* FORM: CLOSE ISSUE */}
                {activeAction === 'close' && (
                  <form onSubmit={handleCloseIssue} className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Technical Resolution Summary</label>
                      <textarea
                        rows={2}
                        placeholder="Detailed explanation of repairs, parts replaced, or procedure followed..."
                        value={closeResolution}
                        onChange={e => setCloseResolution(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Closing Audit Note</label>
                      <input
                        type="text"
                        placeholder="Verified operational by supervisor..."
                        value={actionReason}
                        onChange={e => setActionReason(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button type="button" onClick={() => setActiveAction(null)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold">Cancel</button>
                      <button type="submit" disabled={isSubmittingAction} className="px-4 py-1.5 bg-slate-100 text-slate-950 rounded-lg text-xs font-bold hover:bg-white transition">
                        {isSubmittingAction ? 'Closing...' : 'Close & Archive Issue'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Issue General Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Machine</span>
              <span className="text-slate-200 font-medium flex items-center gap-1 truncate">
                <MachineIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {issue.machine ? issue.machine.name : 'General Facility'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Department</span>
              <span className="text-slate-200 font-medium flex items-center gap-1 truncate">
                <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                {issue.department}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Assigned Owner</span>
              <span className="text-slate-200 font-medium flex items-center gap-1 truncate">
                <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {issue.assigned_worker ? issue.assigned_worker.full_name : 'Unassigned'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Target Due Date</span>
              <span className="text-slate-200 font-medium flex items-center gap-1 truncate">
                <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                {issue.due_date ? new Date(issue.due_date).toLocaleDateString() : 'No Due Date'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Issue Description</span>
            </h3>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              {issue.description}
            </div>
          </div>

          {/* Resolution Card if present */}
          {issue.resolution && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Issue Resolution Logged</span>
              </div>
              <p className="text-slate-300">{issue.resolution}</p>
              {issue.resolution_time && (
                <p className="text-[10px] text-slate-400 pt-1">
                  Resolved on {new Date(issue.resolution_time).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Sub-Tabs: Ownership Audit History, Comments, Attachments, Status History */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveSubTab('ownership')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  activeSubTab === 'ownership'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Ownership Audit Trail ({issue.ownership_history?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveSubTab('comments')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  activeSubTab === 'comments'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Comments ({issue.comments.length})</span>
              </button>
              <button
                onClick={() => setActiveSubTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  activeSubTab === 'history'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Status History ({issue.status_history.length})</span>
              </button>
            </div>

            {/* TAB: OWNERSHIP AUDIT TRAIL */}
            {activeSubTab === 'ownership' && (
              <div className="space-y-3">
                {!issue.ownership_history || issue.ownership_history.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No ownership history records logged yet.</p>
                ) : (
                  issue.ownership_history.map((oh) => (
                    <div key={oh.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[11px] flex-wrap gap-2">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded border text-[10px] ${getActionBadgeColor(oh.action_type)}`}>
                          {oh.action_type}
                        </span>
                        <span className="text-slate-500">
                          {new Date(oh.changed_at).toLocaleString()}
                        </span>
                      </div>

                      {/* Owner / Dept / Supervisor transitions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                        {oh.new_owner && (
                          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                            <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="text-[10px] text-slate-400">Owner:</span>
                            {oh.previous_owner && <span className="text-slate-400 line-through">{oh.previous_owner.full_name}</span>}
                            {oh.previous_owner && <ArrowRight className="w-3 h-3 text-amber-400 shrink-0" />}
                            <span className="font-bold text-emerald-300">{oh.new_owner.full_name}</span>
                          </div>
                        )}

                        {oh.new_department && (
                          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                            <Building2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="text-[10px] text-slate-400">Dept:</span>
                            {oh.previous_department && <span className="text-slate-400 line-through">{oh.previous_department}</span>}
                            {oh.previous_department && <ArrowRight className="w-3 h-3 text-amber-400 shrink-0" />}
                            <span className="font-bold text-purple-300">{oh.new_department}</span>
                          </div>
                        )}

                        {oh.new_supervisor && (
                          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="text-[10px] text-slate-400">Supervisor:</span>
                            {oh.previous_supervisor && <span className="text-slate-400 line-through">{oh.previous_supervisor.full_name}</span>}
                            {oh.previous_supervisor && <ArrowRight className="w-3 h-3 text-amber-400 shrink-0" />}
                            <span className="font-bold text-amber-300">{oh.new_supervisor.full_name}</span>
                          </div>
                        )}

                        {/* Priority change — only show when previous and new differ */}
                        {oh.action_type === 'ESCALATE' && oh.previous_priority && oh.new_priority && oh.previous_priority !== oh.new_priority && (
                          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-rose-500/20">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span className="text-[10px] text-slate-400">Priority:</span>
                            <span className="text-slate-400 line-through text-[10px]">{oh.previous_priority}</span>
                            <ArrowRight className="w-3 h-3 text-rose-400 shrink-0" />
                            <span className={`font-bold text-[10px] ${
                              oh.new_priority === 'CRITICAL' ? 'text-rose-400' :
                              oh.new_priority === 'HIGH' ? 'text-orange-400' :
                              oh.new_priority === 'MEDIUM' ? 'text-amber-400' : 'text-slate-300'
                            }`}>{oh.new_priority}</span>
                          </div>
                        )}
                      </div>

                      {oh.reason_notes && (
                        <p className="text-xs text-slate-300 bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                          <strong className="text-amber-400">Notes:</strong> {oh.reason_notes}
                        </p>
                      )}

                      <div className="text-[10px] text-slate-500 pt-0.5 flex justify-end">
                        <span>Changed by: <strong className="text-slate-400">{oh.changed_by ? oh.changed_by.full_name : 'System Administrator'}</strong></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 1: COMMENTS */}
            {activeSubTab === 'comments' && (
              <div className="space-y-4">
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Add a comment or operational update..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={isAddingComment || !commentText.trim()}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>

                <div className="space-y-3">
                  {issue.comments.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">No comments added yet.</p>
                  ) : (
                    issue.comments.map((c) => (
                      <div key={c.id} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-amber-400">{c.author_name}</span>
                          <span className="text-slate-500">{new Date(c.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-200">{c.comment_text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: ATTACHMENTS */}
            {/* TAB 3: STATUS HISTORY */}
            {activeSubTab === 'history' && (
              <div className="space-y-3">
                {issue.status_history.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No status history logged.</p>
                ) : (
                  issue.status_history.map((h) => (
                    <div key={h.id} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 font-bold text-slate-300">
                          <span className="text-slate-400">{h.from_status}</span>
                          <ArrowRight className="w-3 h-3 text-amber-400" />
                          <span className="text-amber-300">{h.to_status}</span>
                        </div>
                        <span className="text-slate-500">{new Date(h.changed_at).toLocaleString()}</span>
                      </div>
                      {h.notes && <p className="text-xs text-slate-400">{h.notes}</p>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
