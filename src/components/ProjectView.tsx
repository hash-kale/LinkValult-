import { useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  query, 
  where,
  updateDoc,
  doc,
  orderBy,
  limit
} from 'firebase/firestore';
import { Card, Button, Input, Select, Skeleton, Toast } from './ui/Kit';
import { 
  Link as LinkIcon, 
  Key, 
  StickyNote, 
  Plus, 
  Copy, 
  ExternalLink, 
  Trash2, 
  Eye, 
  EyeOff,
  Lock,
  ChevronRight,
  Settings,
  ShieldCheck,
  UserPlus,
  FolderOpen
} from 'lucide-react';
import { encryptData, decryptData, cn } from '../lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { QuickAddModal } from './QuickAddModal';

import { ProjectService, ResourceService, AuditService } from '../services';
import { Project, Link, Credential, Note, AuditLog } from '../types';

export function ProjectView({ project }: { project: Project }) {
  const { user, profile } = useAuth();
  const { data: links, subscribe: subLinks } = useFirestore<Link>(`projects/${project.id}/links`);
  const { data: credentials, subscribe: subCreds } = useFirestore<Credential>(`projects/${project.id}/credentials`);
  const { data: notes, subscribe: subNotes } = useFirestore<Note>(`projects/${project.id}/notes`);

  const [initialLoading, setInitialLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [masterPassword, setMasterPassword] = useState('');
  const [isMasterPasswordSet, setIsMasterPasswordSet] = useState(false);
  const [activeTab, setActiveTab] = useState<'resources' | 'settings' | 'activity'>('resources');
  
  const [showAddForm, setShowAddForm] = useState(false);

  const userRole = project.members?.[user?.uid || ''] || 'viewer';
  const isAdmin = userRole === 'admin' || profile?.role === 'admin';
  const canEdit = isAdmin || userRole === 'editor';

  // Combine and filter resources
  const allResources = [
    ...(links || []).map(l => ({ ...l, resourceType: 'link' })),
    ...(credentials || []).map(c => ({ ...c, resourceType: 'credential' })),
    ...(notes || []).map(n => ({ ...n, resourceType: 'note' })),
  ].sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));

  const filteredResources = allResources.filter(r => {
    const envMatch = environmentFilter === 'all' || r.environment === environmentFilter;
    const typeMatch = typeFilter === 'all' || r.resourceType === typeFilter;
    return envMatch && typeMatch;
  });

  useEffect(() => {
    const u1 = subLinks(`projects/${project.id}/links`);
    const u2 = subCreds(`projects/${project.id}/credentials`);
    const u3 = subNotes(`projects/${project.id}/notes`);
    const timer = setTimeout(() => setInitialLoading(false), 600);
    return () => { 
      u1(); u2(); u3(); 
      clearTimeout(timer);
    };
  }, [project.id]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !user) return;
    setInviteStatus('searching');
    try {
      const q = query(collection(db, 'users'), where('email', '==', inviteEmail));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setInviteStatus('User not found. They must register first.');
        return;
      }
      
      const invitedUser = snap.docs[0].data();
      await ProjectService.addMember(project.id, invitedUser.uid, inviteRole, user.uid, user.email, project.name);
      
      setInviteStatus(`Success! Added ${inviteEmail} as ${inviteRole}`);
      setInviteEmail('');
    } catch (err) {
      setInviteStatus('Failed to invite member.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-32">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 animate-in slide-in-from-top-4 duration-500">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] text-brand-muted mb-1 uppercase font-black tracking-[0.2em] group cursor-default">
            <span className="hover:text-brand-accent transition-colors">Projects</span>
            <ChevronRight className="w-3 h-3 text-zinc-800" />
            <span className="text-zinc-400 group-hover:text-white transition-colors">{project.name}</span>
          </div>
          <div>
            <h2 className="text-5xl font-black text-white tracking-tighter leading-none mb-3">{project.name}</h2>
            <p className="text-brand-secondary text-sm max-w-2xl leading-relaxed">{project.description || 'Secure technical definition and resource repository.'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-zinc-900 shadow-inner-glow border border-brand-border p-1.5 rounded-2xl">
          <div className="relative group">
            <Lock className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-all duration-500", isMasterPasswordSet ? "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "text-brand-muted group-focus-within:text-brand-accent")} />
            <input 
              type="password"
              placeholder="Vault Auth" 
              className="bg-brand-bg/50 border border-transparent rounded-xl pl-11 pr-5 py-2.5 text-xs focus:outline-none w-56 text-zinc-200 placeholder:text-zinc-700 transition-all focus:border-brand-accent/30 focus:w-64"
              value={masterPassword}
              onChange={e => setMasterPassword(e.target.value)}
              onBlur={() => setIsMasterPasswordSet(!!masterPassword)}
            />
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-brand-border pb-8 mb-12">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('resources')}
            className={cn(
              "px-1 text-xs uppercase font-black tracking-[0.25em] transition-all relative flex items-center gap-3 whitespace-nowrap pb-4",
              activeTab === 'resources' ? "text-brand-accent border-b-2 border-brand-accent" : "text-brand-muted hover:text-zinc-300"
            )}
          >
            Resources
            <span className="text-[9px] px-2 py-0.5 rounded-full font-mono bg-zinc-800 text-brand-muted/50">
              {allResources.length}
            </span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('settings')}
              className={cn(
                "px-1 text-xs uppercase font-black tracking-[0.25em] transition-all relative flex items-center gap-3 whitespace-nowrap pb-4",
                activeTab === 'settings' ? "text-brand-accent border-b-2 border-brand-accent" : "text-brand-muted hover:text-zinc-300"
              )}
            >
              Settings
            </button>
          )}
          <button
            onClick={() => setActiveTab('activity')}
            className={cn(
              "px-1 text-xs uppercase font-black tracking-[0.25em] transition-all relative flex items-center gap-3 whitespace-nowrap pb-4",
              activeTab === 'activity' ? "text-brand-accent border-b-2 border-brand-accent" : "text-brand-muted hover:text-zinc-300"
            )}
          >
            Activity
          </button>
        </div>

        {activeTab === 'resources' && (
          <div className="flex flex-wrap items-center gap-4 bg-zinc-900 shadow-inner-glow border border-brand-border p-1.5 rounded-2xl">
            <div className="flex items-center gap-2 px-3 border-r border-brand-border/50">
              <span className="text-[9px] uppercase font-black text-brand-muted tracking-widest">Environment</span>
              <select 
                value={environmentFilter}
                onChange={(e) => setEnvironmentFilter(e.target.value)}
                className="bg-transparent text-[11px] font-black text-white hover:text-brand-accent transition-colors focus:outline-none cursor-pointer uppercase"
              >
                <option value="all">All</option>
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="dev">Dev</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3">
              <span className="text-[9px] uppercase font-black text-brand-muted tracking-widest">Type</span>
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent text-[11px] font-black text-white hover:text-brand-accent transition-colors focus:outline-none cursor-pointer uppercase"
              >
                <option value="all">All</option>
                <option value="link">Links</option>
                <option value="credential">Vault</option>
                <option value="note">Notes</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {toast && (
            <Toast 
              message={toast.message} 
              type={toast.type} 
              onClose={() => setToast(null)} 
            />
          )}
        </AnimatePresence>

        {activeTab === 'settings' && isAdmin && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <Card className="max-w-xl">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                Invite Team Member
              </h4>
              <p className="text-sm text-zinc-500 mb-6">Users must already have a LinkVault account to be added to projects.</p>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="teammate@company.com" 
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                  />
                  <Select 
                    className="w-32"
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as any)}
                    options={[
                      { label: 'Viewer', value: 'viewer' },
                      { label: 'Editor', value: 'editor' },
                      { label: 'Admin', value: 'admin' }
                    ]}
                  />
                </div>
                <Button variant="primary" className="w-full" onClick={handleInvite}>
                  Grant Project Access
                </Button>
                {inviteStatus && (
                  <p className="text-xs font-medium text-emerald-400 bg-emerald-500/5 p-2 rounded border border-emerald-500/10">
                    {inviteStatus}
                  </p>
                )}
              </div>
            </Card>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Current Members
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(project.members || {}).map(([uid, role]) => (
                  <div key={uid} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                        UID
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{uid === user?.uid ? 'You' : `User ${uid.slice(0, 5)}`}</div>
                        <div className="text-[10px] uppercase font-bold text-zinc-600 tracking-tighter">{role as string}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <AuditLogView projectId={project.id} />
        )}

        {activeTab === 'resources' && (
          <div className="space-y-4">
            {initialLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="premium-card p-5 flex items-center justify-between">
                  <div className="flex items-center gap-5 flex-1">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))
            ) : filteredResources.map((resource) => {
              if (resource.resourceType === 'link') {
                return (
                  <motion.div 
                    layout
                    key={resource.id} 
                    className="premium-card p-5 flex items-center justify-between hover:border-brand-accent/40 group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner-glow">
                        <LinkIcon className="w-6 h-6 text-brand-accent" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-white group-hover:text-brand-accent transition-colors">{resource.title}</h4>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "badge-base",
                            resource.environment === 'production' ? "badge-env-prod" :
                            resource.environment === 'staging' ? "badge-env-staging" :
                            "badge-env-dev"
                          )}>
                            {resource.environment}
                          </span>
                          <p className="text-xs text-brand-muted font-mono tracking-tight truncate max-w-sm">{resource.url}</p>
                        </div>
                        {resource.tags?.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {resource.tags.map((tag: string) => (
                              <span key={tag} className="text-[8px] font-black uppercase text-zinc-600 bg-zinc-800/50 px-1.5 py-0.5 rounded border border-zinc-700/30">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-widest font-black text-zinc-600 border border-brand-border px-3 py-1 rounded-lg mr-4 hidden lg:block bg-zinc-950/50">
                          {resource.category}
                        </span>
                        <div className="flex items-center gap-1 bg-zinc-900/50 rounded-xl border border-brand-border p-1">
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(resource.url);
                              setToast({ message: "Link Copied to Registry", type: "success" });
                              setTimeout(() => setToast(null), 3000);
                            }}
                            className="p-2 hover:bg-brand-accent/10 rounded-lg text-brand-muted hover:text-brand-accent transition-all"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => window.open(resource.url, '_blank')}
                            className="p-2 hover:bg-brand-accent/10 rounded-lg text-brand-muted hover:text-brand-accent transition-all"
                            title="Execute External Link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                        {canEdit && (
                          <button 
                            onClick={() => user && user.email && ResourceService.delete(project.id, 'link', resource.id, user.uid, user.email, resource.title)}
                            className="p-2.5 hover:bg-red-500/10 rounded-xl text-red-500 opacity-0 group-hover:opacity-100 transition-all font-mono hover:shadow-glow"
                            title="Purge Link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                  </motion.div>
                );
              }

              if (resource.resourceType === 'credential') {
                return (
                  <CredentialItem 
                    key={resource.id} 
                    cred={resource} 
                    projectId={project.id}
                    masterPassword={masterPassword} 
                    onDelete={() => { user && user.email && ResourceService.delete(project.id, 'credential', resource.id, user.uid, user.email, resource.serviceName); }} 
                    canEdit={canEdit}
                  />
                );
              }

              if (resource.resourceType === 'note') {
                return (
                  <motion.div 
                    layout
                    key={resource.id} 
                    className="premium-card p-6 group hover:border-emerald-500/40 relative overflow-hidden flex flex-col"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shadow-inner-glow">
                          <StickyNote className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{resource.title}</h4>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "badge-base",
                              resource.environment === 'production' ? "badge-env-prod" :
                              resource.environment === 'staging' ? "badge-env-staging" :
                              "badge-env-dev"
                            )}>
                              {resource.environment}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-emerald-500/10 rounded-lg text-emerald-500 transition-all font-black text-[10px] uppercase tracking-widest hidden md:block">Edit Document</button>
                        {canEdit && (
                          <button onClick={() => user && user.email && ResourceService.delete(project.id, 'note', resource.id, user.uid, user.email, resource.title)} className="p-2.5 hover:bg-red-500/10 rounded-xl text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-brand-secondary whitespace-pre-wrap leading-relaxed italic line-clamp-2 px-1">
                      {resource.content}
                    </p>
                    {resource.tags?.length > 0 && (
                      <div className="flex gap-2 mt-4 px-1">
                        {resource.tags.map((tag: string) => (
                          <span key={tag} className="text-[8px] font-black uppercase text-zinc-600 bg-zinc-800/50 px-1.5 py-0.5 rounded border border-zinc-700/30">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              }
              return null;
            })}

            {filteredResources.length === 0 && (
              <div className="py-32 text-center border-2 border-dashed border-brand-border rounded-3xl text-brand-muted animate-in fade-in zoom-in duration-700">
                <FolderOpen className="w-20 h-20 mx-auto mb-6 opacity-5 drop-shadow-glow text-brand-accent" />
                <p className="text-sm font-bold uppercase tracking-[0.2em]">No Resources Match Filter</p>
                <p className="text-xs mt-2 opacity-50">Try adjusting your environment or type constraints.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      {canEdit && (
        <div className="fixed bottom-8 right-8">
          <button 
            onClick={() => setShowAddForm(true)}
            className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-500/40 transition-all active:scale-90 hover:scale-110"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Add Resource Modal */}
      <QuickAddModal 
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        defaultProjectId={project.id}
        projects={[project]}
      />
    </div>
  );
}

interface CredentialItemProps {
  cred: Credential;
  projectId: string;
  masterPassword: string;
  onDelete: () => void;
  canEdit?: boolean;
  key?: string | number;
}

function CredentialItem({ cred, projectId, masterPassword, onDelete, canEdit }: CredentialItemProps) {
  const { user } = useAuth();
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDecrypt = async () => {
    if (!masterPassword) {
      setError("MASTER KEY REQUIRED");
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setIsDecrypting(true);
    try {
      const result = await decryptData(cred.encryptedPassword, masterPassword, cred.salt, cred.iv);
      setDecrypted(result);
      if (user && user.email) {
        await AuditService.log(projectId, user.uid, user.email, 'view_secret', 'credential', cred.id, cred.serviceName);
      }
    } catch (e) {
      setError("INTEGRITY FAIL");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <motion.div 
      layout
      className="premium-card p-5 flex items-center justify-between hover:border-amber-500/30 transition-all group relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center shadow-inner-glow">
          <Key className="w-6 h-6 text-amber-500" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-black text-white group-hover:text-amber-500 transition-colors uppercase tracking-tight">{cred.serviceName}</h4>
          <div className="flex items-center gap-3">
            <span className={cn(
              "badge-base",
              cred.environment === 'production' ? "badge-env-prod" :
              cred.environment === 'staging' ? "badge-env-staging" :
              "badge-env-dev"
            )}>
              {cred.environment}
            </span>
            <p className="text-[10px] text-brand-muted font-bold tracking-widest uppercase truncate max-w-[150px]">Principal: {cred.username}</p>
          </div>
          {cred.tags?.length > 0 && (
            <div className="flex gap-2 mt-2">
              {cred.tags.map((tag: string) => (
                <span key={tag} className="text-[8px] font-black uppercase text-zinc-600 bg-zinc-800/50 px-1.5 py-0.5 rounded border border-zinc-700/30">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {decrypted ? (
          <motion.code 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-zinc-950 px-4 py-2 rounded-xl border border-emerald-500/20 text-[11px] text-emerald-400 font-mono shadow-inner-glow uppercase tracking-widest"
          >
            {decrypted}
          </motion.code>
        ) : (
          <code className="bg-zinc-950/50 px-4 py-2 rounded-xl border border-brand-border text-[11px] text-zinc-700 font-mono tracking-widest">
            ••••••••••••••••
          </code>
        )}
        
        <div className="flex gap-1 items-center bg-zinc-900 shadow-inner-glow border border-brand-border p-1 rounded-xl">
          {decrypted ? (
            <button 
              onClick={() => {
                navigator.clipboard.writeText(decrypted);
                setDecrypted(null);
              }} 
              className="p-2.5 hover:bg-emerald-500/10 rounded-lg text-emerald-500 transition-all"
              title="Commit to clip & Seal"
            >
              <Copy className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleDecrypt} 
              disabled={isDecrypting}
              className="p-2.5 hover:bg-brand-accent/10 rounded-lg text-brand-muted hover:text-brand-accent transition-all disabled:opacity-50"
              title="Reveal Secret"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {canEdit && (
            <button 
              onClick={onDelete} 
              className="p-2.5 hover:bg-red-500/10 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              title="Purge Secret"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-2 right-4 text-[9px] bg-red-600 text-white px-2 py-0.5 rounded font-black uppercase tracking-[0.2em] shadow-glow z-20"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AuditLogView({ projectId }: { projectId: string }) {
  const { data: logs, subscribe } = useFirestore<AuditLog>('audit_logs');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'audit_logs'),
      where('projectId', '==', projectId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const unsub = subscribe('audit_logs', q);
    
    // Simulate trail fetching
    const timer = setTimeout(() => setLoading(false), 500);
    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, [projectId]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em] flex items-center gap-3">
          <ShieldCheck className="w-4 h-4 text-brand-accent animate-pulse" />
          Neural Audit Stream
        </h3>
        <span className="text-[9px] font-mono text-zinc-800 uppercase tracking-tighter">Isolation: {projectId.slice(0, 8)}</span>
      </div>
      
      <div className="space-y-px bg-zinc-900 shadow-2xl border border-brand-border/50 rounded-2xl overflow-hidden divide-y divide-brand-border/30">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-2 w-1/4" />
              </div>
            </div>
          ))
        ) : logs.length > 0 ? (
          logs.map((log) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={log.id} 
              className="p-4 bg-brand-surface/40 hover:bg-brand-accent/[0.03] transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-xs shadow-inner-glow border border-white/5 transition-all group-hover:scale-110",
                  log.action === 'create' ? "bg-emerald-500/10 text-emerald-500" :
                  log.action === 'delete' ? "bg-red-500/10 text-red-500" :
                  log.action === 'view_secret' ? "bg-amber-500/10 text-amber-500" :
                  "bg-indigo-500/10 text-indigo-500"
                )}>
                  {log.action === 'create' && <Plus className="w-4 h-4" />}
                  {log.action === 'delete' && <Trash2 className="w-4 h-4" />}
                  {log.action === 'view_secret' && <Eye className="w-4 h-4" />}
                  {log.action === 'update' && <Settings className="w-4 h-4" />}
                  {log.action === 'invite' && <UserPlus className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                     <p className="text-[11px] font-bold text-white uppercase tracking-tight">
                      {log.userEmail?.split('@')[0]} <span className="text-zinc-600 font-medium lowercase italic px-1">performed</span> <span className={cn(
                        "group-hover:underline decoration-brand-accent/30 underline-offset-4",
                        log.action === 'view_secret' ? "text-amber-500" : "text-brand-accent"
                      )}>{log.action.replace('_', ' ')}</span>
                    </p>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-sm bg-zinc-800 text-zinc-500 font-black uppercase tracking-tighter border border-white/5">
                      {log.resourceType}
                    </span>
                  </div>
                  <p className="text-[9px] text-brand-secondary mt-1 uppercase font-black tracking-widest opacity-40">
                     Target: {log.resourceName}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors uppercase tracking-[0.1em]">
                  {log.timestamp?.toDate() ? format(log.timestamp.toDate(), 'HH:mm:ss') : 'Live Event'}
                </p>
                <div className="text-[8px] font-mono text-zinc-800 mt-1 uppercase opacity-50">E_ID_{log.id?.slice(0, 6)}</div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-32 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-zinc-950 rounded-2xl flex items-center justify-center border border-brand-border/30 group">
                <ShieldCheck className="w-8 h-8 text-zinc-800 group-hover:text-brand-accent transition-colors" />
            </div>
            <p className="text-brand-muted italic text-[10px] uppercase tracking-[0.3em] font-black">Zero Activity Entries Logged</p>
            <p className="text-[9px] text-zinc-700 mt-2 uppercase tracking-widest">Awaiting system interaction... 100% Secure.</p>
          </div>
        )}
      </div>
    </div>
  );
}
