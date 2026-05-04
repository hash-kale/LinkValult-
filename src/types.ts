import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'member';
export type ProjectRole = 'admin' | 'editor' | 'viewer';
export type ResourceType = 'link' | 'credential' | 'note';
export type Environment = 'production' | 'staging' | 'dev';
export type ActivityAction = 'create' | 'update' | 'delete' | 'view';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Timestamp;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  ownerId: string;
  members: Record<string, ProjectRole>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type AuditAction = 'create' | 'update' | 'delete' | 'view_secret' | 'invite' | 'login';

export interface AuditLog {
  id?: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  resourceType: ResourceType | 'project' | 'member' | 'auth';
  resourceId: string;
  resourceName: string;
  projectId: string;
  timestamp: Timestamp;
  metadata?: Record<string, any>;
}

export interface BaseResource {
  id: string;
  projectId: string;
  title: string;
  resourceType: ResourceType;
  tags: string[];
  environment: Environment;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface Link extends BaseResource {
  url: string;
  category: string;
}

export interface Credential extends BaseResource {
  serviceName: string;
  username: string;
  encryptedPassword: string;
  salt: string;
  iv: string;
  notes?: string;
}

export interface Note extends BaseResource {
  content: string;
}

