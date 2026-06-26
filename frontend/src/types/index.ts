export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  color: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  createdAt: Date;
  createdBy: number;
}

export interface Issue {
  id: number;
  projectId: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  reportedById: number | null;
  reportedByName: string | null;
  assignedToName: string | null;
  updatedByName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIssue {
  title: string;
  description: string;
  priority: string;
  status: string;
  assignedTo?: number;
}

export interface UpdateIssue {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignedTo?: number;
  clearAssignee?: boolean;
}

export interface Comment {
  id: number;
  issueId: number;
  content: string;
  authorId: number | null;
  authorName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateComment {
  content?: string;
}

export interface Invitation {
  id: number;
  projectId: number;
  projectName: string;
  invitedByUsername: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface UserSearchResult {
  id: number;
  username: string;
  email: string;
  role: string;
  color: string;
}

export interface IssueDetail extends Issue {
  comments: Comment[];
}

export interface ProjectMember {
  id: number;
  username: string;
  role: string;
  color: string;
}

export interface Notification {
  notificationId: number;
  type: 'Invitation' | 'IssueAssigned' | 'IssueComment';
  message: string;
  referenceId: number | null;
  projectId: number | null;
  isRead: boolean;
  createdAt: string;
}