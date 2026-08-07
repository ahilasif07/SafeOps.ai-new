import React, { useEffect, useState } from 'react';
import {
  X,
  Thermometer,
  Activity,
  Wind,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Zap
} from 'lucide-react';

interface Machine {
  id: number;
  name: string;
  machine_code: string;
}

interface SensorEditModalProps {
  machine: Machine | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface SensorConfig {
  sensor_type: string;
  unit: string;
  label: string;
  icon: React.ReactNode;
}

interface SensorRange {
  min: string;
  max: string;
}

interface SensorStatus {
  isAnomaly: boolean;
  label: string;
  explanation: string;
  delta: string;
}

const SENSOR_CONFIG: SensorConfig[] = [
  {
    sensor_type: 'TEMPERATURE',
    unit: 'C',
    label: 'Temperature',
    icon: <Thermometer className="w-4 h-4" />
  },
  {
    sensor_type: 'PRESSURE',
    unit: 'PSI',
    label: 'Pressure',
    icon: <Activity className="w-4 h-4" />
  },
  {
    sensor_type: 'VIBRATION',
    unit: 'mm/s',
    label: 'Vibration',
    icon: <Zap className="w-4 h-4" />
  },
  {
    sensor_type: 'TOXIC_GAS',
    unit: 'ppm',
    label: 'Toxic Gas',
    icon: <Wind className="w-4 h-4" />
  }
];

const NORMAL_DEFAULTS: Record<string, string> = {
  TEMPERATURE: '55',
  PRESSURE: '100',
  VIBRATION: '2.5',
  TOXIC_GAS: '0'
};

const EMPTY_RANGES: Record<string, SensorRange> = {
  TEMPERATURE: {
    min: '',
    max: ''
  },
  PRESSURE: {
    min: '',
    max: ''
  },
  VIBRATION: {
    min: '',
    max: ''
  },
  TOXIC_GAS: {
    min: '',
    max: ''
  }
};

const ANOMALY_DEFAULTS: Record<string, string> = {
  TEMPERATURE: '120',
  PRESSURE: '160',
  VIBRATION: '12.5',
  TOXIC_GAS: '23'
};

function getStatus(
  sensorType: string,
  value: string,
  minValue: string,
  maxValue: string,
  unit: string
): SensorStatus {
  if (
    value.trim() === '' ||
    minValue.trim() === '' ||
    maxValue.trim() === ''
  ) {
    return {
      isAnomaly: false,
      label: 'RANGE REQUIRED',
      explanation:
        'Enter the current reading, normal minimum and normal maximum.',
      delta: ''
    };
  }

  const current = Number(value);
  const minimum = Number(minValue);
  const maximum = Number(maxValue);

  if (
    Number.isNaN(current) ||
    Number.isNaN(minimum) ||
    Number.isNaN(maximum)
  ) {
    return {
      isAnomaly: false,
      label: 'INVALID VALUE',
      explanation: 'All fields must contain valid numbers.',
      delta: ''
    };
  }

  if (minimum >= maximum) {
    return {
      isAnomaly: false,
      label: 'INVALID RANGE',
      explanation:
        'The normal minimum must be lower than the normal maximum.',
      delta: ''
    };
  }

  if (current > maximum) {
    const difference = current - maximum;

    const explanations: Record<string, string> = {
      TEMPERATURE:
        'High temperature detected. The reading is above the normal operating range.',
      PRESSURE:
        'High pressure detected. There may be a risk of seal failure or rupture.',
      VIBRATION:
        'Excessive vibration detected. Inspect for imbalance, looseness or bearing problems.',
      TOXIC_GAS:
        'High toxic gas concentration detected. Evacuate the area immediately.'
    };

    return {
      isAnomaly: true,
      label: 'ANOMALY DETECTED',
      explanation:
        `${explanations[sensorType] ?? 'High reading detected.'} ` +
        `The reading is ${difference.toFixed(2)} ${unit} above ` +
        `the normal maximum of ${maximum} ${unit}.`,
      delta: `+${difference.toFixed(2)}`
    };
  }

  if (current < minimum) {
    const difference = minimum - current;

    const explanations: Record<string, string> = {
      TEMPERATURE:
        'Low temperature detected. The machine is below its normal operating range.',
      PRESSURE:
        'Low pressure detected. Check the machine for leaks or pressure loss.',
      VIBRATION:
        'The vibration reading is below the normal range. Check whether the sensor is working.',
      TOXIC_GAS:
        'The toxic gas reading is below the normal range. Check the sensor calibration.'
    };

    return {
      isAnomaly: true,
      label: 'ANOMALY DETECTED',
      explanation:
        `${explanations[sensorType] ?? 'Low reading detected.'} ` +
        `The reading is ${difference.toFixed(2)} ${unit} below ` +
        `the normal minimum of ${minimum} ${unit}.`,
      delta: `-${difference.toFixed(2)}`
    };
  }

  return {
    isAnomaly: false,
    label: 'NORMAL',
    explanation:
      'Reading is within the saved normal operating range.',
    delta: ''
  };
}

export function SensorEditModal({
  machine,
  isOpen,
  onClose,
  onSaved
}: SensorEditModalProps) {
  const [values, setValues] = useState<Record<string, string>>({
    ...NORMAL_DEFAULTS
  });

  const [ranges, setRanges] = useState<
    Record<string, SensorRange>
  >({
    ...EMPTY_RANGES
  });

  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !machine) {
      return;
    }

    setValues({
      ...NORMAL_DEFAULTS
    });

    setRanges({
      ...EMPTY_RANGES
    });

    setError(null);

    fetch(`/api/v1/sensors/machine/${machine.id}?limit=100`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load readings.');
        }

        return response.json();
      })
      .then((data: unknown) => {
        if (!Array.isArray(data)) {
          return;
        }

        // Get latest per sensor type
        const latestByType: Record<string, any> = {};
        for (const reading of data) {
          if (reading && typeof reading === 'object' && 'sensor_type' in reading) {
            const st = reading.sensor_type as string;
            if (!latestByType[st] || new Date(reading.timestamp) > new Date(latestByType[st].timestamp)) {
              latestByType[st] = reading;
            }
          }
        }

        const latest: Record<string, string> = {};
        for (const config of SENSOR_CONFIG) {
          const reading = latestByType[config.sensor_type];
          if (reading && 'value' in reading) {
            latest[config.sensor_type] = String(reading.value);
          }
        }

        if (Object.keys(latest).length > 0) {
          setValues(previous => ({ ...previous, ...latest }));
        }
      })
      .catch(() => {
        setError('Existing readings could not be loaded. You can enter them manually.');
      });

    // Also fetch saved ranges from backend
    fetch(`/api/v1/sensors/machine/${machine.id}/ranges/`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const newRanges: Record<string, SensorRange> = { ...EMPTY_RANGES };
        for (const config of SENSOR_CONFIG) {
          const r = data[config.sensor_type];
          if (r) {
            newRanges[config.sensor_type] = {
              min: String(r.min ?? r.min_value ?? ''),
              max: String(r.max ?? r.max_value ?? '')
            };
          }
        }
        setRanges(newRanges);
      })
      .catch(() => {});
  }, [isOpen, machine]);

  if (!isOpen || !machine) {
    return null;
  }

  const rangesAreComplete = SENSOR_CONFIG.every(config => {
    const range = ranges[config.sensor_type];

    if (!range) {
      return false;
    }

    if (
      range.min.trim() === '' ||
      range.max.trim() === ''
    ) {
      return false;
    }

    const minimum = Number(range.min);
    const maximum = Number(range.max);

    return (
      !Number.isNaN(minimum) &&
      !Number.isNaN(maximum) &&
      minimum < maximum
    );
  });

  const allNormal =
    rangesAreComplete &&
    SENSOR_CONFIG.every(config => {
      const range = ranges[config.sensor_type];

      const status = getStatus(
        config.sensor_type,
        values[config.sensor_type] ?? '',
        range?.min ?? '',
        range?.max ?? '',
        config.unit
      );

      return !status.isAnomaly;
    });

  const validateInputs = (): boolean => {
    for (const config of SENSOR_CONFIG) {
      const reading = values[config.sensor_type]?.trim();
      const range = ranges[config.sensor_type];

      if (!reading) {
        setError(
          `Enter the current reading for ${config.label}.`
        );

        return false;
      }

      if (
        !range ||
        range.min.trim() === '' ||
        range.max.trim() === ''
      ) {
        setError(
          `Enter the normal minimum and maximum for ${config.label}.`
        );

        return false;
      }

      const current = Number(reading);
      const minimum = Number(range.min);
      const maximum = Number(range.max);

      if (
        Number.isNaN(current) ||
        Number.isNaN(minimum) ||
        Number.isNaN(maximum)
      ) {
        setError(
          `${config.label} contains an invalid number.`
        );

        return false;
      }

      if (minimum >= maximum) {
        setError(
          `${config.label}: normal minimum must be lower than normal maximum.`
        );

        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    setError(null);

    if (!validateInputs()) {
      return;
    }

    setSaving(true);

    try {
      // Save ranges to backend
      const rangesPayload: Record<string, { min: number; max: number }> = {};
      for (const config of SENSOR_CONFIG) {
        const r = ranges[config.sensor_type];
        rangesPayload[config.sensor_type] = { min: Number(r.min), max: Number(r.max) };
      }
      await fetch(`/api/v1/sensors/machine/${machine.id}/ranges/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rangesPayload)
      });

      const body = SENSOR_CONFIG.map(config => ({
        machine_id: machine.id,
        sensor_type: config.sensor_type,
        value: Number(values[config.sensor_type]),
        unit: config.unit
      }));

      const response = await fetch(
        `/api/v1/sensors/log/bulk`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        throw new Error('Save failed.');
      }

      onSaved();
      onClose();
    } catch {
      setError(
        'Failed to save sensor readings. Is the backend running?'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setError(null);
    setResetting(true);

    const resetValues: Record<string, string> = {};

    for (const config of SENSOR_CONFIG) {
      const range = ranges[config.sensor_type];

      if (
        !range ||
        range.min.trim() === '' ||
        range.max.trim() === ''
      ) {
        setError(
          `Enter a valid normal range for ${config.label} first.`
        );

        setResetting(false);
        return;
      }

      const minimum = Number(range.min);
      const maximum = Number(range.max);

      if (
        Number.isNaN(minimum) ||
        Number.isNaN(maximum) ||
        minimum >= maximum
      ) {
        setError(
          `Enter a valid normal range for ${config.label} first.`
        );

        setResetting(false);
        return;
      }

      const midpoint = (minimum + maximum) / 2;

      resetValues[config.sensor_type] = String(
        Number(midpoint.toFixed(2))
      );
    }

    setValues(resetValues);
    setResetting(false);
  };

  const handleSimulateAnomaly = () => {
    setError(null);

    setValues(previous => ({
      ...previous,
      ...ANOMALY_DEFAULTS
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Edit Sensor Readings
            </h2>

            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              {machine.machine_code} — {machine.name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold ${!rangesAreComplete
                ? 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                : allNormal
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}
          >
            {!rangesAreComplete ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                Telemetry Status: ENTER NORMAL RANGES
              </>
            ) : allNormal ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Telemetry Status: NORMAL
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                Telemetry Status: ANOMALY ACTIVE
              </>
            )}
          </div>

          {error && (
            <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
              {error}
            </div>
          )}

          {SENSOR_CONFIG.map(config => {
            const value =
              values[config.sensor_type] ?? '';

            const range =
              ranges[config.sensor_type] ?? {
                min: '',
                max: ''
              };

            const status = getStatus(
              config.sensor_type,
              value,
              range.min,
              range.max,
              config.unit
            );

            return (
              <div
                key={config.sensor_type}
                className={`rounded-xl border p-4 space-y-3 ${status.isAnomaly
                    ? 'bg-rose-950/20 border-rose-500/25'
                    : 'bg-slate-800/50 border-slate-700'
                  }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                    <span
                      className={
                        status.isAnomaly
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }
                    >
                      {config.icon}
                    </span>

                    {config.label}
                  </div>

                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${status.isAnomaly
                        ? 'bg-rose-500/20 text-rose-300'
                        : status.label === 'NORMAL'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="space-y-1">
                    <span className="text-xs text-slate-400">
                      Current reading
                    </span>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={value}
                        onChange={event =>
                          setValues(previous => ({
                            ...previous,
                            [config.sensor_type]:
                              event.target.value
                          }))
                        }
                        placeholder="Enter reading"
                        className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500 ${status.isAnomaly
                            ? 'border-rose-500/40'
                            : 'border-slate-700'
                          }`}
                      />

                      <span className="text-xs text-slate-400 font-mono">
                        {config.unit}
                      </span>
                    </div>
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs text-slate-400">
                      Normal minimum
                    </span>

                    <input
                      type="number"
                      step="0.1"
                      value={range.min}
                      onChange={event =>
                        setRanges(previous => ({
                          ...previous,
                          [config.sensor_type]: {
                            ...previous[config.sensor_type],
                            min: event.target.value
                          }
                        }))
                      }
                      placeholder="Enter minimum"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs text-slate-400">
                      Normal maximum
                    </span>

                    <input
                      type="number"
                      step="0.1"
                      value={range.max}
                      onChange={event =>
                        setRanges(previous => ({
                          ...previous,
                          [config.sensor_type]: {
                            ...previous[config.sensor_type],
                            max: event.target.value
                          }
                        }))
                      }
                      placeholder="Enter maximum"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </label>
                </div>

                {status.delta && (
                  <p className="text-xs font-bold text-rose-400">
                    Difference: {status.delta} {config.unit}
                  </p>
                )}

                {status.explanation && (
                  <p
                    className={`text-xs leading-relaxed ${status.isAnomaly
                        ? 'text-rose-300'
                        : 'text-slate-500'
                      }`}
                  >
                    {status.explanation}
                  </p>
                )}
              </div>
            );
          })}

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition disabled:opacity-60"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''
                  }`}
              />

              Reset to Normal
            </button>

            <button
              type="button"
              onClick={handleSimulateAnomaly}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition"
            >
              <AlertTriangle className="w-3.5 h-3.5" />

              Simulate Anomaly
            </button>

            <div className="flex-1" />

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="text-xs font-bold px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Readings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}