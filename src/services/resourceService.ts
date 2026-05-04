import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ResourceType, BaseResource, Environment } from '../types';
import { AuditService } from './auditService';

export const ResourceService = {
  async add(
    projectId: string, 
    type: ResourceType, 
    data: any, 
    userId: string
  ): Promise<string> {
    const collectionPath = `projects/${projectId}/${type}s`;
    const resourceData = {
      ...data,
      projectId,
      resourceType: type,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, collectionPath), resourceData);
    const userEmail = data.userEmail || 'system';
    const resourceName = data.title || data.serviceName || 'Unnamed Resource';
    await AuditService.log(projectId, userId, userEmail, 'create', type, docRef.id, resourceName);
    return docRef.id;
  },

  async update(
    projectId: string, 
    type: ResourceType, 
    resourceId: string, 
    updates: any, 
    userId: string,
    userEmail: string,
    resourceName: string
  ) {
    const docRef = doc(db, `projects/${projectId}/${type}s/${resourceId}`);
    
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    await AuditService.log(projectId, userId, userEmail, 'update', type, resourceId, resourceName);
  },

  async delete(
    projectId: string, 
    type: ResourceType, 
    resourceId: string, 
    userId: string,
    userEmail: string,
    resourceName: string
  ) {
    const docRef = doc(db, `projects/${projectId}/${type}s/${resourceId}`);
    
    await deleteDoc(docRef);
    await AuditService.log(projectId, userId, userEmail, 'delete', type, resourceId, resourceName);
  },

  /**
   * Complex searching with filters
   */
  async search(
    projectId: string,
    type: ResourceType,
    filters: {
      environment?: Environment;
      tag?: string;
      limit?: number;
    } = {}
  ) {
    const collectionPath = `projects/${projectId}/${type}s`;
    const constraints: QueryConstraint[] = [];

    if (filters.environment) {
      constraints.push(where('environment', '==', filters.environment));
    }

    if (filters.tag) {
      constraints.push(where('tags', 'array-contains', filters.tag));
    }

    constraints.push(orderBy('updatedAt', 'desc'));

    if (filters.limit) {
      constraints.push(limit(filters.limit));
    }

    const q = query(collection(db, collectionPath), ...constraints);
    const snap = await getDocs(q);
    
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
};
