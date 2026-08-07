export interface Worker {
  id: number;
  worker_code: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  clearance_level: number;
  is_active: boolean;
  created_at?: string;
}

export interface Machine {
  id: number;
  machine_code: string;
  name: string;
  model: string;
  location: string;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'OFFLINE' | 'HAZARDOUS';
  safety_rating: number;
  requires_loto: boolean;
  last_inspected_at?: string;
}

export interface ProcedureStep {
  id: number;
  step_number: number;
  title: string;
  instruction: string;
  hazard_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requires_supervisor_signoff: boolean;
  required_ppe?: string;
}

export interface Procedure {
  id: number;
  procedure_code: string;
  title: string;
  description: string;
  category: string;
  required_clearance_level: number;
  is_approved: boolean;
  is_superseded: boolean;
  version: string;
  steps: ProcedureStep[];
  machines?: { id: number; name: string; machine_code: string }[];
}

export interface Task {
  id: number;
  task_code: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'SAFETY_EVALUATION' | 'PENDING_APPROVAL' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';
  priority: string;
  composite_risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  is_blocked: boolean;
  blocking_reasons?: string[];
  worker_id: number;
  machine_id: number;
  procedure_id: number;
  created_at: string;
  worker?: Worker;
  machine?: Machine;
  procedure?: Procedure;
}

export interface Certification {
  id: number;
  code: string;
  name: string;
  validity_months: number;
  issuing_body: string;
}

export interface TrainingRecord {
  id: number;
  worker_id: number;
  certification_id: number;
  issued_date: string;
  expiry_date: string;
  is_valid: boolean;
  certification?: Certification;
}

export interface Incident {
  id: number;
  incident_code: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  machine_id?: number;
  reported_at: string;
  resolution_status: string;
  machine?: Machine;
}

export interface SupervisorApproval {
  id: number;
  task_id: number;
  supervisor_id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requested_at: string;
  decided_at?: string;
  comments?: string;
  task?: Task;
  supervisor?: Worker;
}

export interface SensorReading {
  id: number;
  machine_id: number;
  sensor_type: string;
  value: number;
  unit: string;
  is_anomaly: boolean;
  timestamp: string;
}

export interface EvaluatedWorkerInfo {
  id: number;
  worker_code: string;
  full_name: string;
  role: string;
  department: string;
  clearance_level: number;
}

export interface RiskFactorDetail {
  category: string;
  description: string;
  impact_score: number;
  status: 'PASSED' | 'WARNING' | 'FAILED';
}

export interface SafetyEvalResponse {
  worker_id: number;
  machine_id: number;
  procedure_id: number;
  evaluated_worker?: EvaluatedWorkerInfo;
  machine_procedure_compatible: boolean;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  decision: 'ALLOW' | 'PROCEED_WITH_CAUTION' | 'SUPERVISOR_APPROVAL' | 'BLOCK';
  is_blocked: boolean;
  block_reasons: string[];
  required_certifications_missing: string[];
  expired_certifications: string[];
  sensor_anomalies_detected: string[];
  loto_status_ok: boolean;
  risk_factors: RiskFactorDetail[];
  ai_safety_briefing?: string;
}

export interface IssueComment {
  id: number;
  issue_id: number;
  author_id?: number;
  author_name: string;
  comment_text: string;
  created_at: string;
  author?: Worker;
}

export interface IssueAttachment {
  id: number;
  issue_id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
}

export interface IssueStatusHistory {
  id: number;
  issue_id: number;
  changed_by_id?: number;
  from_status: string;
  to_status: string;
  notes?: string;
  changed_at: string;
  changed_by?: Worker;
}

export interface IssueOwnershipHistory {
  id: number;
  issue_id: number;
  action_type: 'INITIAL_CREATION' | 'ASSIGN_OWNER' | 'TRANSFER_OWNERSHIP' | 'REASSIGN_DEPARTMENT' | 'ESCALATE' | 'CLOSE_ISSUE';
  previous_owner_id?: number;
  new_owner_id?: number;
  previous_supervisor_id?: number;
  new_supervisor_id?: number;
  previous_department?: string;
  new_department?: string;
  previous_priority?: string;
  new_priority?: string;
  changed_by_id?: number;
  reason_notes?: string;
  changed_at: string;
  previous_owner?: Worker;
  new_owner?: Worker;
  previous_supervisor?: Worker;
  new_supervisor?: Worker;
  changed_by?: Worker;
}

export interface Issue {
  id: number;
  issue_code: string;
  title: string;
  description: string;
  machine_id?: number;
  department: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'Open' | 'In Progress' | 'Waiting' | 'Resolved' | 'Closed';
  reporter_id?: number;
  assigned_worker_id?: number;
  assigned_supervisor_id?: number;
  due_date?: string;
  resolution?: string;
  resolution_time?: string;
  created_at: string;
  updated_at: string;
  machine?: Machine;
  reporter?: Worker;
  assigned_worker?: Worker;
  assigned_supervisor?: Worker;
  comments: IssueComment[];
  attachments: IssueAttachment[];
  status_history: IssueStatusHistory[];
  ownership_history: IssueOwnershipHistory[];
}

