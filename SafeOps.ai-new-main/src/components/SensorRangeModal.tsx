import React, { useState, useEffect } from 'react';
import { X, Sliders, Save, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';
import { Machine } from '../types';

interface SensorRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  machine: Machine | null;
}

interface RangeVal {
  min: string;
  max: string;
}

export function SensorRangeModal({ isOpen, onClose, machine }: SensorRangeModalProps) {
  const [ranges, setRanges] = useState<Record<string, RangeVal>>({
    TEMPERATURE: { min: '45.5', max: '90.25' },
    PRESSURE: { min: '20', max: '100' },
    VIBRATION: { min: '0.5', max: '5' },
    TOXIC_GAS: { min: '0', max: '25' }
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bulkLogging, setBulkLogging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && machine) {
      fetchRanges();
    }
  }, [isOpen, machine]);

  const fetchRanges = async () => {
    if (!machine) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/v1/sensors/machine/${machine.id}/ranges/`);
      if (res.ok) {
        const data = await res.json();
        const updated: Record<string, RangeVal> = {};
        for (const [sType, vals] of Object.entries(data)) {
          const v = vals as any;
          updated[sType] = {
            min: String(v.min !== undefined ? v.min : v.min_value ?? ''),
            max: String(v.max !== undefined ? v.max : v.max_value ?? '')
          };
        }
        setRanges(prev => ({ ...prev, ...updated }));
      }
    } catch (err) {
      console.error('Error fetching sensor ranges:', err);
      setErrorMsg('Failed to load sensor ranges.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !machine) return null;

  const handleInputChange = (sensorType: string, field: 'min' | 'max', val: string) => {
    setRanges(prev => ({
      ...prev,
      [sensorType]: {
        ...prev[sensorType],
        [field]: val
      }
    }));
  };

  const handleSaveRanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate client-side first
    const payload: Record<string, { min: number; max: number }> = {};
    for (const [sType, vals] of Object.entries(ranges)) {
      const rangeVal = vals as RangeVal;
      if (rangeVal.min === '' || rangeVal.max === '') {
        setErrorMsg(`Min and Max values are required for ${sType}`);
        return;
      }
      const minNum = parseFloat(rangeVal.min);
      const maxNum = parseFloat(rangeVal.max);

      if (isNaN(minNum) || isNaN(maxNum)) {
        setErrorMsg(`Min and Max values for ${sType} must be valid numbers.`);
        return;
      }

      if (minNum >= maxNum) {
        setErrorMsg(`Min value (${minNum}) must be strictly less than Max value (${maxNum}) for ${sType}.`);
        return;
      }

      payload[sType] = { min: minNum, max: maxNum };
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/v1/sensors/machine/${machine.id}/ranges/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.detail || 'Failed to save sensor ranges');
      } else {
        setSuccessMsg('Sensor min/max ranges updated successfully!');
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (err) {
      console.error('Error saving ranges:', err);
      setErrorMsg('Network error while saving sensor ranges.');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkLogTest = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setBulkLogging(true);
    try {
      const bulkPayload = [
        { machine_id: machine.id, sensor_type: 'TEMPERATURE', value: parseFloat(ranges.TEMPERATURE?.min || '50') + 5, unit: 'C' },
        { machine_id: machine.id, sensor_type: 'PRESSURE', value: parseFloat(ranges.PRESSURE?.min || '20') + 10, unit: 'PSI' },
        { machine_id: machine.id, sensor_type: 'VIBRATION', value: parseFloat(ranges.VIBRATION?.max || '5') + 2.5, unit: 'mm/s' }
      ];

      const res = await fetch('/api/v1/sensors/log/bulk/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkPayload)
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Successfully logged ${Array.isArray(data) ? data.length : 3} telemetry readings in bulk!`);
        setTimeout(() => setSuccessMsg(null), 3500);
      } else {
        setErrorMsg(data.detail || 'Bulk sensor log failed');
      }
    } catch (err) {
      console.error('Error bulk logging sensors:', err);
      setErrorMsg('Failed to log bulk sensor readings.');
    } finally {
      setBulkLogging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Configure Sensor Min/Max Thresholds</h2>
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
        <form onSubmit={handleSaveRanges} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
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

          <div className="text-xs text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 space-y-1">
            <p className="font-semibold text-slate-300">Operational Anomaly Boundaries:</p>
            <p>Sensor values outside these min/max float thresholds trigger active telemetry anomalies in the risk engine.</p>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-400 text-xs">Loading machine sensor ranges...</div>
          ) : (
            <div className="space-y-4">
              {['TEMPERATURE', 'PRESSURE', 'VIBRATION', 'TOXIC_GAS'].map(sensorType => (
                <div key={sensorType} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>{sensorType}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {sensorType === 'TEMPERATURE' ? 'Unit: °C' : sensorType === 'PRESSURE' ? 'Unit: PSI' : sensorType === 'VIBRATION' ? 'Unit: mm/s' : 'Unit: PPM'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Min Threshold (Float)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={ranges[sensorType]?.min || ''}
                        onChange={e => handleInputChange(sensorType, 'min', e.target.value)}
                        placeholder="e.g. 45.5"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Max Threshold (Float)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={ranges[sensorType]?.max || ''}
                        onChange={e => handleInputChange(sensorType, 'max', e.target.value)}
                        placeholder="e.g. 90.25"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleBulkLogTest}
              disabled={bulkLogging || saving}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-slate-700/50"
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>{bulkLogging ? 'Logging...' : 'Bulk Log Reading Test'}</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving || loading}
                className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Sensor Ranges'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
