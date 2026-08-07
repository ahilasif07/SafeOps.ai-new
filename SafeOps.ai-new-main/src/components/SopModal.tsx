import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  HardHat, 
  ShieldCheck, 
  FileCode, 
  Sparkles,
  X,
  Edit3
} from 'lucide-react';
import { Procedure, ProcedureStep } from '../types';

interface SopModalProps {
  isOpen: boolean;
  onClose: () => void;
  procedureToEdit: Procedure | null;
  onSaveSuccess: () => void;
}

export function SopModal({
  isOpen,
  onClose,
  procedureToEdit,
  onSaveSuccess
}: SopModalProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'upload'>('form');

  // SOP Form State
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ELECTRICAL');
  const [version, setVersion] = useState('1.0');
  const [clearanceLevel, setClearanceLevel] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<Array<Omit<ProcedureStep, 'id'> & { id?: number }>>([
    {
      step_number: 1,
      title: 'Initial Isolation & Lockout',
      instruction: 'Verify zero voltage potential and attach lockout tagout locks.',
      hazard_level: 'HIGH',
      requires_supervisor_signoff: true,
      required_ppe: 'Insulated Gloves 10kV, Face Shield, Arc Flash Suit'
    }
  ]);

  // Upload/Import state
  const [rawText, setRawText] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (procedureToEdit) {
      setCode(procedureToEdit.procedure_code);
      setTitle(procedureToEdit.title);
      setCategory(procedureToEdit.category || 'ELECTRICAL');
      setVersion(procedureToEdit.version || '1.0');
      setClearanceLevel(procedureToEdit.required_clearance_level || 1);
      setDescription(procedureToEdit.description || '');
      if (procedureToEdit.steps && procedureToEdit.steps.length > 0) {
        setSteps(procedureToEdit.steps.map(s => ({
          step_number: s.step_number,
          title: s.title,
          instruction: s.instruction,
          hazard_level: s.hazard_level,
          requires_supervisor_signoff: s.requires_supervisor_signoff,
          required_ppe: s.required_ppe || 'Safety Glasses'
        })));
      } else {
        setSteps([]);
      }
    } else {
      // Reset for new SOP
      setCode(`SOP-${Math.floor(100 + Math.random() * 900)}`);
      setTitle('');
      setCategory('ELECTRICAL');
      setVersion('1.0');
      setClearanceLevel(1);
      setDescription('');
      setSteps([
        {
          step_number: 1,
          title: 'Initial Isolation & Verification',
          instruction: 'De-energize machine and attach LOTO locks.',
          hazard_level: 'HIGH',
          requires_supervisor_signoff: true,
          required_ppe: 'Insulated Gloves, Eye Protection'
        }
      ]);
    }
    setErrorMessage(null);
    setImportMessage(null);
  }, [procedureToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddStep = () => {
    setSteps(prev => [
      ...prev,
      {
        step_number: prev.length + 1,
        title: '',
        instruction: '',
        hazard_level: 'LOW',
        requires_supervisor_signoff: false,
        required_ppe: 'Standard Safety Glasses & Boots'
      }
    ]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((s, idx) => ({ ...s, step_number: idx + 1 }));
    });
  };

  const handleStepChange = (index: number, field: string, value: any) => {
    setSteps(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Text/JSON Importer Logic
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseSopContent(content);
    };
    reader.readAsText(file);
  };

  const parseSopContent = (content: string) => {
    try {
      // Try JSON first
      const data = JSON.parse(content);
      if (data.title) setTitle(data.title);
      if (data.procedure_code || data.code) setCode(data.procedure_code || data.code);
      if (data.category) setCategory(data.category);
      if (data.version) setVersion(data.version);
      if (data.required_clearance_level) setClearanceLevel(Number(data.required_clearance_level));
      if (data.description) setDescription(data.description);
      if (Array.isArray(data.steps)) {
        setSteps(data.steps.map((s: any, idx: number) => ({
          step_number: idx + 1,
          title: s.title || `Step ${idx + 1}`,
          instruction: s.instruction || s.description || '',
          hazard_level: s.hazard_level || 'MEDIUM',
          requires_supervisor_signoff: Boolean(s.requires_supervisor_signoff),
          required_ppe: s.required_ppe || 'Safety Glasses'
        })));
      }
      setImportMessage("Successfully imported JSON SOP structure!");
      setActiveTab('form');
    } catch {
      // Parse plain text / markdown lines into steps
      const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        if (!title) setTitle(lines[0].replace(/^[#\d.\-\s]+/, ''));
        const newSteps: any[] = [];
        let stepNum = 1;
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (line.match(/^(step|\d+\.|\-)/i)) {
            newSteps.push({
              step_number: stepNum++,
              title: `Step ${stepNum - 1}: ${line.substring(0, 30)}`,
              instruction: line,
              hazard_level: line.toLowerCase().includes('high') || line.toLowerCase().includes('danger') ? 'HIGH' : 'LOW',
              requires_supervisor_signoff: line.toLowerCase().includes('supervisor') || line.toLowerCase().includes('sign'),
              required_ppe: 'Standard Safety Glasses'
            });
          }
        }
        if (newSteps.length > 0) {
          setSteps(newSteps);
          setImportMessage(`Parsed ${newSteps.length} procedure steps from document text!`);
        } else {
          setDescription(content);
          setImportMessage("Loaded document text into SOP description.");
        }
        setActiveTab('form');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !code) {
      setErrorMessage("Please specify an SOP title and code.");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      procedure_code: code,
      title,
      description: description || `Standard Operating Procedure for ${title}`,
      category,
      required_clearance_level: clearanceLevel,
      version,
      is_approved: true,
      steps: steps.map((s, idx) => ({
        step_number: idx + 1,
        title: s.title || `Step ${idx + 1}`,
        instruction: s.instruction || s.title || 'Follow standard procedure and safety protocol.',
        hazard_level: s.hazard_level || 'LOW',
        requires_supervisor_signoff: Boolean(s.requires_supervisor_signoff),
        required_ppe: s.required_ppe || 'Safety Glasses, Steel Toe Boots'
      }))
    };

    try {
      const isEdit = Boolean(procedureToEdit);
      const url = isEdit ? `/api/v1/procedures/${procedureToEdit?.id}` : '/api/v1/procedures/';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Failed to save SOP' }));
        throw new Error(errData.detail || 'Failed to save SOP');
      }

      const savedProc = await res.json();

      // Trigger explicit vector indexing confirmation endpoint
      if (savedProc && savedProc.id) {
        await fetch(`/api/v1/sop-ai/index/${savedProc.id}`, { method: 'POST' }).catch(() => {});
      }

      onSaveSuccess();
      onClose();
    } catch (err: any) {
      console.error("Save SOP error:", err);
      setErrorMessage(err.message || 'Error saving procedure to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 text-amber-400 p-2 rounded-xl border border-amber-500/30">
              {procedureToEdit ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {procedureToEdit ? `Edit Procedure: ${procedureToEdit.procedure_code}` : 'Upload & Create New SOP'}
              </h2>
              <p className="text-xs text-slate-400">
                {procedureToEdit ? 'Modify step instructions, clearance, PPE requirements, or hazard levels.' : 'Define procedure details, safety steps, or upload SOP file directly.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-4 py-2.5 border-b-2 transition ${
              activeTab === 'form' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Interactive SOP Editor</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2.5 border-b-2 transition ${
              activeTab === 'upload' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span>Import / Upload File</span>
            </span>
          </button>
        </div>

        {importMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-xl flex items-center justify-between">
            <span>{importMessage}</span>
            <button onClick={() => setImportMessage(null)} className="text-emerald-300 underline">Dismiss</button>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-300 underline">Dismiss</button>
          </div>
        )}

        {/* TAB 1: FORM EDITOR */}
        {activeTab === 'form' ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Top General Attributes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Procedure Code *</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. SOP-ELEC-05"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="ELECTRICAL">ELECTRICAL</option>
                  <option value="HYDRAULIC">HYDRAULIC</option>
                  <option value="MECHANICAL">MECHANICAL</option>
                  <option value="CHEMICAL">CHEMICAL</option>
                  <option value="SAFETY">SAFETY</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Required Clearance Level</label>
                <select
                  value={clearanceLevel}
                  onChange={(e) => setClearanceLevel(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value={1}>Level 1 (General Technician)</option>
                  <option value={2}>Level 2 (Certified Specialist)</option>
                  <option value={3}>Level 3 (Master Engineer)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-medium mb-1">SOP Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. High-Voltage Feeder Bus Isolation & LOTO"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-bold focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Version tag</label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.0"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-slate-400 font-medium mb-1">Description & Overview</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of what this procedure covers..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 h-16"
              />
            </div>

            {/* Steps Builder Section */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Sequential Steps & Safety Guards ({steps.length})</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/20 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Add Step</span>
                </button>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {steps.map((step, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3 relative text-xs">
                    <div className="flex items-center justify-between">
                      <span className="bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded text-[11px]">
                        Step {idx + 1}
                      </span>
                      {steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(idx)}
                          className="text-slate-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Step Short Title</label>
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                          placeholder="e.g. Visual Disconnect Check"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Hazard Level</label>
                        <select
                          value={step.hazard_level}
                          onChange={(e) => handleStepChange(idx, 'hazard_level', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                        >
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                          <option value="CRITICAL">CRITICAL</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Step Instruction & Safety Action</label>
                      <input
                        type="text"
                        value={step.instruction}
                        onChange={(e) => handleStepChange(idx, 'instruction', e.target.value)}
                        placeholder="Detailed action required..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1 flex items-center gap-1">
                          <HardHat className="w-3 h-3 text-amber-400" />
                          <span>Required PPE</span>
                        </label>
                        <input
                          type="text"
                          value={step.required_ppe}
                          onChange={(e) => handleStepChange(idx, 'required_ppe', e.target.value)}
                          placeholder="Insulated Gloves, Face Shield"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="flex items-center pt-5">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-slate-300">
                          <input
                            type="checkbox"
                            checked={step.requires_supervisor_signoff}
                            onChange={(e) => handleStepChange(idx, 'requires_supervisor_signoff', e.target.checked)}
                            className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                          />
                          <span>Requires Supervisor Sign-off</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
              >
                {isSubmitting ? <span className="animate-pulse">Saving & Indexing...</span> : (
                  <>
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>{procedureToEdit ? 'Save SOP Changes' : 'Publish & Vector Index SOP'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* TAB 2: IMPORT / UPLOAD FILE */
          <div className="space-y-5 text-xs">
            <div className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl p-8 text-center space-y-3 bg-slate-950 transition">
              <Upload className="w-8 h-8 text-amber-400 mx-auto" />
              <div>
                <h4 className="font-bold text-slate-200 text-sm">Upload SOP Document (.json, .txt, .md)</h4>
                <p className="text-slate-400 text-xs mt-1">Select an existing SOP file to parse steps and attributes automatically.</p>
              </div>
              <input
                type="file"
                accept=".json,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
                id="sop-file-input"
              />
              <label
                htmlFor="sop-file-input"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl cursor-pointer transition shadow-md"
              >
                <FileCode className="w-4 h-4" />
                <span>Choose SOP File</span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-slate-400 font-medium">Or Paste SOP Document Text / Markdown / JSON directly:</label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste procedure text or JSON here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono focus:outline-none focus:border-amber-500 h-40"
              />
              <button
                type="button"
                onClick={() => parseSopContent(rawText)}
                disabled={!rawText.trim()}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Parse Text into Editor</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
