import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AuditAction, ResourceType } from '../types';

export const AuditService = {
  async log(
    projectId: string,
    userId: string,
    userEmail: string,
    action: AuditAction,
    resourceType: ResourceType | 'project' | 'member',
    resourceId: string,
    resourceName: string,
    metadata: Record<string, any> = {}
  ) {
    try {
      await addDoc(collection(db, 'audit_logs'), {
        projectId,
        userId,
        userEmail,
        action,
        resourceType,
        resourceId,
        resourceName,
        metadata,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Audit Log failed:', error);
    }
  }
};
