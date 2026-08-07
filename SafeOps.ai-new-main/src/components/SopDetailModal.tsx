import React from 'react';
import { 
  FileText, 
  X, 
  Edit3, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  HardHat, 
  Lock, 
  Tag,
  Clock
} from 'lucide-react';
import { Procedure } from '../types';

interface SopDetailModalProps {
  procedure: Procedure | null;
  onClose: () => void;
  onEdit: (proc: Procedure) => void;
}

export function SopDetailModal({ procedure, onClose, onEdit }: SopDetailModalProps) {
  if (!procedure) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl relative">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-amber-400 font-bold text-xs bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-md">
                {procedure.procedure_code}
              </span>
              <span className="text-xs text-slate-400 font-mono">v{procedure.version}</span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Approved SOP
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">{procedure.title}</h2>
            <p className="text-xs text-slate-400">{procedure.description || 'Standard industrial operating procedure.'}</p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div>
            <span className="text-slate-500 block">Category</span>
            <span className="font-bold text-slate-200">{procedure.category}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Required Clearance</span>
            <span className="font-bold text-amber-300">Level {procedure.required_clearance_level}+</span>
          </div>
          <div>
            <span className="text-slate-500 block">Total Safety Steps</span>
            <span className="font-bold text-slate-200">{procedure.steps?.length || 0} Steps</span>
          </div>
        </div>

        {/* Sequential Steps List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Mandatory Step-by-Step Execution Protocol</span>
          </h3>

          <div className="space-y-2.5">
            {(!procedure.steps || procedure.steps.length === 0) ? (
              <div className="p-4 text-xs text-slate-500 text-center bg-slate-950 rounded-xl">
                No specific steps recorded for this SOP. Click "Edit SOP" to add steps.
              </div>
            ) : (
              procedure.steps.map((step) => (
                <div key={step.id || step.step_number} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="bg-amber-500 text-slate-950 font-black w-6 h-6 rounded-lg flex items-center justify-center shrink-0">
                        {step.step_number}
                      </span>
                      <span className="font-bold text-slate-200 text-sm">{step.title}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        step.hazard_level === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        step.hazard_level === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {step.hazard_level} HAZARD
                      </span>
                      {step.requires_supervisor_signoff && (
                        <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[11px] font-bold">
                          Supervisor Signoff Required
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-300 leading-relaxed pl-8">{step.instruction}</p>

                  {step.required_ppe && (
                    <div className="pl-8 pt-1 flex items-center gap-2 text-amber-300 font-medium text-[11px]">
                      <HardHat className="w-3.5 h-3.5 shrink-0" />
                      <span>Required PPE: {step.required_ppe}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl transition"
          >
            Close Viewer
          </button>

          <button
            onClick={() => {
              onClose();
              onEdit(procedure);
            }}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit this SOP</span>
          </button>
        </div>
      </div>
    </div>
  );
}
