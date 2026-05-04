import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Project, ProjectRole } from '../types';
import { AuditService } from './auditService';

export const ProjectService = {
  async create(name: string, description: string, userId: string, userEmail: string, tags: string[] = []): Promise<string> {
    const projectData = {
      name,
      description,
      tags,
      ownerId: userId,
      members: {
        [userId]: 'admin'
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'projects'), projectData);
    await AuditService.log(docRef.id, userId, userEmail, 'create', 'project', docRef.id, name);
    return docRef.id;
  },

  async update(projectId: string, updates: Partial<Project>, userId: string, userEmail: string, name: string) {
    const docRef = doc(db, 'projects', projectId);
    await updateDoc(docRef, updates);
    await AuditService.log(projectId, userId, userEmail, 'update', 'project', projectId, name);
  },

  async addMember(projectId: string, memberUid: string, role: ProjectRole, userId: string, userEmail: string, name: string) {
    const docRef = doc(db, 'projects', projectId);
    await updateDoc(docRef, {
      [`members.${memberUid}`]: role
    });
    await AuditService.log(projectId, userId, userEmail, 'invite', 'project', projectId, name, { memberUid, role });
  },

  async removeMember(projectId: string, memberUid: string, userId: string, userEmail: string, name: string) {
    const docRef = doc(db, 'projects', projectId);
    await updateDoc(docRef, {
      [`members.${memberUid}`]: null 
    });
    await AuditService.log(projectId, userId, userEmail, 'delete', 'member', memberUid, name, { projectId });
  }
};
