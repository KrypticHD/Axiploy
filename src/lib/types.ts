export type UserRole = "client_admin" | "client_manager" | "client_viewer" | "axiploy_admin";

export interface AskResponse {
  text: string;
  bullets?: string[];
  metrics?: { label: string; value: string }[];
  actions?: { label: string; href: string }[];
  followUp?: string;
  confidence?: number;          // 0–100
  sources?: string[];           // e.g. ["Onboarding records", "Activity log"]
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: AskResponse;
  timestamp: Date;
}

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  clientId: string;
  clientName: string;
}

export type EmployeeStatus =
  | "New"
  | "Welcome Sent"
  | "In Progress"
  | "Missing Documents"
  | "At Risk"
  | "Ready for Review"
  | "Complete"
  | "Paused"
  | "Cancelled";

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export interface Document {
  id: string;
  name: string;
  required: boolean;
  received: boolean;
  receivedAt?: string;
}

export interface CommunicationEntry {
  id: string;
  type: "email" | "sms" | "system";
  direction: "sent" | "received";
  subject: string;
  body: string;
  timestamp: string;
}

export interface OnboardingRecord {
  id: string;
  clientId: string;
  employeeName: string;
  role: string;
  department: string;
  startDate: string;
  manager: string;
  status: EmployeeStatus;
  riskLevel: RiskLevel;
  email: string;
  phone: string;
  missingDocuments: number;
  lastContacted: string;
  nextAction: string;
  documents: Document[];
  communications: CommunicationEntry[];
  notes: string;
}

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface Approval {
  id: string;
  clientId: string;
  digitalEmployee: string;
  actionType: string;
  relatedPerson: string;
  relatedBusiness?: string;
  draftContent: string;
  reason: string;
  status: ApprovalStatus;
  createdAt: string;
}

export type ActivityStatus = "success" | "warning" | "error" | "info";

export interface ActivityEntry {
  id: string;
  clientId: string;
  digitalEmployee: string;
  action: string;
  result: string;
  status: ActivityStatus;
  timestamp: string;
}

export interface Report {
  id: string;
  clientId: string;
  type: string;
  period: string;
  status: "ready" | "generating" | "scheduled";
  createdAt: string;
  summary: {
    tasksCompleted: number;
    hoursSaved: number;
    issuesFlagged: number;
    actionsTaken: number;
    outstandingItems: number;
    highlights: string[];
  };
}

export interface DigitalEmployee {
  id: string;
  clientId: string;
  type: "onboarding" | "admin" | "growth" | "social";
  name: string;
  status: "Active" | "Paused" | "Setup";
  stats: { label: string; value: string | number }[];
}

export interface DashboardMetrics {
  activeEmployees: number;
  tasksCompleted: number;
  hoursSaved: number;
  pendingApprovals: number;
  highRiskItems: number;
  reportStatus: string;
}
