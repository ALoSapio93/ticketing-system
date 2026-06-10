// models/user.model.ts
export enum Role {
  ADMIN = 'ROLE_ADMIN',
  MANAGER = 'ROLE_MANAGER',
  USER = 'ROLE_USER'
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: Role;
  department?: string;
  phone?: string;
  avatarUrl?: string;
  enabled: boolean;
  createdAt: string;
  lastLogin?: string;
}

// models/ticket.model.ts
export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED'
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum TicketType {
  BUG = 'BUG',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  SUPPORT = 'SUPPORT',
  INCIDENT = 'INCIDENT',
  CHANGE_REQUEST = 'CHANGE_REQUEST',
  TASK = 'TASK'
}

export enum TicketCategory {
  IT_INFRASTRUCTURE = 'IT_INFRASTRUCTURE',
  SOFTWARE = 'SOFTWARE',
  HARDWARE = 'HARDWARE',
  NETWORK = 'NETWORK',
  SECURITY = 'SECURITY',
  HR = 'HR',
  FINANCE = 'FINANCE',
  GENERAL = 'GENERAL'
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  title: string;
  description: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  category?: TicketCategory;
  reporter: User;
  assignee?: User;
  department?: string;
  dueDate?: string;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt?: string;
  commentCount: number;
  attachmentCount: number;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  type: TicketType;
  priority: TicketPriority;
  category?: TicketCategory;
  assigneeId?: number;
  department?: string;
  dueDate?: string;
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  type?: TicketType;
  priority?: TicketPriority;
  status?: TicketStatus;
  category?: TicketCategory;
  assigneeId?: number;
  department?: string;
  dueDate?: string;
}

export interface TicketFilter {
  status?: TicketStatus;
  priority?: TicketPriority;
  type?: TicketType;
  category?: TicketCategory;
  assigneeId?: number;
  reporterId?: number;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface Comment {
  id: number;
  author: User;
  content: string;
  internal: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TicketHistory {
  id: number;
  changedBy: User;
  fieldChanged: string;
  oldValue?: string;
  newValue?: string;
  changedAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  ticketId?: number;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: User;
}

export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  criticalOpen: number;
  highOpen: number;
  totalUsers: number;
  overdueTickets: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
  trend: Array<{date: string; count: number}>;
}
