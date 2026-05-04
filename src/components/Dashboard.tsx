import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { Card, Button, Input, Skeleton } from './ui/Kit';
import { 
  Plus, 
  Search, 
  Link as LinkIcon, 
  Key, 
  StickyNote, 
  ChevronRight,
  LogOut,
  FolderOpen,
  User as UserIcon,
  Github,
  LayoutGrid,
  Settings,
  Command
} from 'lucide-react';
import { ProjectView } from './ProjectView';
import { QuickAddModal } from './QuickAddModal';
import { CommandPalette } from './CommandPalette';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { query, collection, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

import { ProjectService } from '../services';
import { Project } from '../types';

export default function Dashboard() {
  const { user, profile, logout } = useAuth();
  const { data: projects, subscribe } = useFirestore<Project>('projects');
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isQuickAddingResource, setIsQuickAddingResource] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectTags, setNewProjectTags] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user || !profile) return;
    
    let unsub;
    if (profile.role === 'admin') {
      unsub = subscribe('projects');
    } else {
      const q = query(
        collection(db, 'projects'),
        where(`members.${user.uid}`, 'in', ['admin', 'editor', 'viewer'])
      );
      unsub = subscribe('projects', q);
    }
    
    // Simulate initial loading for UX polish
    const timer = setTimeout(() => setInitialLoading(false), 800);
    
    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, [user?.uid, profile?.role]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !user || !user.email) return;
    
    try {
      const tags = newProjectTags.split(',').map(t => t.trim()).filter(t => t !== '');
      await ProjectService.create(
        newProjectName, 
        'Internal team project', 
        user.uid,
        user.email,
        tags
      );
      setNewProjectName('');
      setNewProjectTags('');
      setIsAddingProject(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const filteredProjects = projects.filter(p => {
    const queryMatch = searchQuery.toLowerCase();
    const nameMatch = p.name.toLowerCase().includes(queryMatch);
    const tagMatch = p.tags?.some((t: string) => t.toLowerCase().includes(queryMatch));
    return nameMatch || tagMatch;
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="flex h-screen bg-brand-bg text-zinc-200 overflow-hidden font-sans selection:bg-brand-accent/30">
      {/* Sidebar - Premium Technical Style */}
      <aside className="w-68 border-r border-brand-border bg-brand-surface/80 backdrop-blur-xl flex flex-col relative z-20">
        <div className="p-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-tr from-brand-accent to-indigo-400 rounded-xl flex items-center justify-center shadow-xl shadow-brand-accent/20 rotate-3">
            <FolderOpen className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tighter text-white leading-none">LinkVault</h1>
            <p className="text-[10px] text-brand-secondary uppercase font-bold tracking-widest mt-1">Intelligence</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
          <div className="text-[10px] uppercase tracking-[0.2em] text-brand-muted font-bold mb-4 px-4">Core</div>
          
          <button
            onClick={() => setSelectedProjectId(null)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
              !selectedProjectId 
                ? "bg-zinc-800/50 text-white shadow-inner-glow border border-zinc-700/50" 
                : "text-brand-secondary hover:bg-zinc-800/30 hover:text-white"
            )}
          >
            <LayoutGrid className={cn("w-4 h-4", !selectedProjectId ? "text-brand-accent" : "")} />
            Overview
          </button>

          <div className="pt-8 pb-4 text-[10px] uppercase tracking-[0.2em] text-brand-muted font-bold px-4">Active Projects</div>
          
          <div className="space-y-1 px-1">
            {initialLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="px-3 py-2.5 flex items-center gap-3">
                  <Skeleton variant="circle" className="w-1.5 h-1.5" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))
            ) : filteredProjects.map(project => (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm group",
                  selectedProjectId === project.id 
                    ? "bg-brand-accent/10 text-white border border-brand-accent/20" 
                    : "text-brand-secondary hover:bg-zinc-800/30 hover:text-white"
                )}
              >
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-300",
                  selectedProjectId === project.id ? "bg-brand-accent scale-150 shadow-[0_0_8px_rgba(99,102,241,0.5)]" : "bg-zinc-800"
                )} />
                <span className="truncate flex-1 text-left">{project.name}</span>
                <ChevronRight className={cn(
                  "w-3 h-3 transition-all opacity-0 group-hover:opacity-100",
                  selectedProjectId === project.id ? "text-brand-accent opacity-100" : "text-zinc-500"
                )} />
              </button>
            ))}
          </div>

          <button 
            onClick={() => setIsAddingProject(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-brand-accent transition-colors mt-4 text-sm font-semibold border border-dashed border-zinc-800 hover:border-brand-accent/30 rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span>New Registry</span>
          </button>
        </nav>

        <div className="p-6 mt-auto border-t border-brand-border/50 bg-zinc-900/10">
          <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/10 mb-6 items-center justify-between hidden sm:flex">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Secure Link</span>
            </div>
            <div className="text-[10px] text-zinc-700 font-mono tracking-tighter">v2.5.0-STABLE</div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-accent/20 to-zinc-800 p-[1px] shrink-0 overflow-hidden shadow-2xl">
              <div className="w-full h-full rounded-xl bg-brand-surface flex items-center justify-center text-xs font-bold text-white uppercase italic">
                {profile?.displayName?.slice(0, 2) || 'TM'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight tracking-tight">{profile?.displayName}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1 h-1 rounded-full bg-brand-accent" />
                <p className="text-[10px] text-brand-secondary truncate uppercase font-bold tracking-widest">{profile?.role}</p>
              </div>
            </div>
            <button 
              onClick={logout} 
              className="text-brand-muted hover:text-red-400 transition-all p-2 hover:bg-red-500/10 rounded-lg group"
              title="Terminate Session"
            >
              <LogOut className="w-4 h-4 group-hover:scale-110" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative bg-zinc-950 overflow-hidden">
        {/* Superior Header */}
        <header className="h-20 border-b border-brand-border flex items-center justify-between px-10 bg-brand-bg/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-6 w-1/2 max-w-2xl">
            <div className="relative w-full group">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-accent transition-colors" />
              <input 
                type="text" 
                placeholder="Query system assets..." 
                className="w-full bg-brand-surface/50 border border-brand-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/10 focus:border-brand-accent/40 text-zinc-100 transition-all placeholder:text-zinc-700"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:flex items-center gap-3 px-4 py-2 bg-zinc-900 border border-brand-border rounded-xl text-brand-muted hover:text-white transition-all group w-64 shadow-inner-glow"
            >
              <Search className="w-4 h-4 text-brand-accent group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase font-black tracking-widest flex-1 text-left">Internal Search</span>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-950 border border-brand-border/50 text-[10px]">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            </button>
            <button 
              onClick={() => setIsQuickAddingResource(true)}
              className="text-brand-muted hover:text-white transition-all p-2 hover:bg-zinc-800/50 rounded-xl flex items-center gap-2 group border border-transparent hover:border-brand-border/50"
              title="Quick Asset Add"
            >
              <Plus className="w-4 h-4 text-brand-accent group-hover:scale-125 transition-transform" />
              <span className="text-[10px] uppercase font-black tracking-widest hidden lg:block">Quick Asset</span>
            </button>
            <div className="h-6 w-[1px] bg-brand-border mx-2" />
            <Button variant="primary" onClick={() => setIsAddingProject(true)} className="h-10 px-5 shadow-glow">
              <Plus className="w-4 h-4 mr-1" />
              Initialize Project
            </Button>
            <div className="h-6 w-[1px] bg-brand-border mx-2" />
            <button className="w-10 h-10 flex items-center justify-center text-brand-secondary hover:text-white hover:bg-zinc-800/50 rounded-xl transition-all">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <AnimatePresence mode="wait">
            {selectedProject ? (
              <motion.div
                key={selectedProject.id}
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.01 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="p-10 h-full"
              >
                <ProjectView project={selectedProject} />
              </motion.div>
            ) : (
              <div className="p-12 h-full max-w-7xl mx-auto w-full">
                <div className="mb-12 flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <span className="w-8 h-px bg-brand-accent" />
                       <span className="text-[10px] text-brand-accent uppercase font-black tracking-[0.3em]">System Core</span>
                    </div>
                    <h2 className="text-5xl font-black text-white tracking-tighter leading-tight">Project Control</h2>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest mb-1 italic">Last Resync</p>
                    <p className="text-sm font-mono text-zinc-400">04 MAY 2026 18:21 UTC</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                   <Card className="relative overflow-hidden group hover:border-brand-accent/50 transition-colors">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                       <FolderOpen className="w-12 h-12 text-brand-accent" />
                     </div>
                     <p className="text-brand-muted text-[10px] mb-2 uppercase font-black tracking-widest">Active Records</p>
                     <p className="text-5xl font-black text-white flex items-baseline gap-2">
                       {projects.length}
                       <span className="text-sm font-bold text-brand-muted italic uppercase">Registries</span>
                     </p>
                   </Card>
                   
                   <Card className="relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                       <Key className="w-12 h-12 text-emerald-500" />
                     </div>
                     <p className="text-brand-muted text-[10px] mb-2 uppercase font-black tracking-widest">Security Layer</p>
                     <p className="text-5xl font-black text-emerald-500 flex items-baseline gap-2">
                       A256
                       <span className="text-sm font-bold text-brand-muted italic uppercase">Verified</span>
                     </p>
                   </Card>

                   <Card className="relative overflow-hidden group hover:border-brand-accent/50 transition-colors">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                       <UserIcon className="w-12 h-12 text-brand-accent" />
                     </div>
                     <p className="text-brand-muted text-[10px] mb-2 uppercase font-black tracking-widest">Profile Status</p>
                     <p className="text-5xl font-black text-white flex items-baseline gap-2 capitalize">
                       {profile?.role}
                       <span className="text-sm font-bold text-brand-muted italic uppercase">Permissions</span>
                     </p>
                   </Card>
                </div>

                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-black text-zinc-500 uppercase tracking-[0.25em] flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-brand-accent" />
                    Asset Library
                  </h3>
                  <div className="h-px flex-1 bg-brand-border mx-8 opacity-20" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {initialLoading ? (
                    Array(6).fill(0).map((_, i) => (
                      <Card key={i} className="p-6 space-y-4">
                        <div className="flex items-center gap-4">
                          <Skeleton className="w-12 h-12 rounded-2xl" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-2 w-16" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                        </div>
                        <Skeleton className="h-12" />
                        <div className="flex gap-2">
                          <Skeleton className="h-4 w-12" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                      </Card>
                    ))
                  ) : filteredProjects.length > 0 ? (
                    filteredProjects.map(p => (
                      <motion.div 
                        key={p.id}
                        layout
                        whileHover={{ scale: 1.02, y: -4 }}
                        onClick={() => setSelectedProjectId(p.id)}
                        className="premium-card p-6 flex flex-col gap-5 hover:border-brand-accent/40 hover:bg-brand-accent/[0.02] cursor-pointer group shadow-2xl relative"
                      >
                        <div className="absolute top-4 right-4 flex gap-1.5">
                           <LinkIcon className="w-3 h-3 text-zinc-700 group-hover:text-brand-accent transition-colors" />
                           <Key className="w-3 h-3 text-zinc-700 group-hover:text-amber-500 transition-colors" />
                           <StickyNote className="w-3 h-3 text-zinc-700 group-hover:text-emerald-500 transition-colors" />
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-zinc-950 border border-brand-border rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner-glow">
                            <FolderOpen className="w-6 h-6 text-brand-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-[9px] text-brand-muted uppercase font-black tracking-widest mb-1">Project Registry</p>
                             <h4 className="text-lg font-black text-white truncate group-hover:text-brand-accent transition-colors leading-none">{p.name}</h4>
                          </div>
                        </div>
                        
                        <div className="h-10">
                          <p className="text-xs text-brand-secondary line-clamp-2 leading-relaxed italic">
                            {p.description || 'Secure technical definition and resource repository.'}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {p.tags?.length > 0 ? p.tags.map(tag => (
                            <span key={tag} className="text-[9px] font-bold text-brand-accent bg-brand-accent/5 border border-brand-accent/10 px-2 py-0.5 rounded-sm uppercase tracking-tighter">
                              {tag}
                            </span>
                          )) : (
                            <span className="text-[9px] font-bold text-zinc-800 uppercase tracking-tighter">No Tags Assigned</span>
                          )}
                        </div>

                        <div className="pt-5 border-t border-brand-border flex items-center justify-between mt-auto">
                           <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">
                                 Updated {p.updatedAt?.toDate() ? format(p.updatedAt.toDate(), 'HH:mm') : 'Syncing...'}
                              </span>
                           </div>
                           <ChevronRight className="w-4 h-4 text-brand-muted group-hover:text-brand-accent group-hover:translate-x-1 transition-all" />
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
                       <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center mb-8 border border-brand-border/30">
                          <FolderOpen className="w-10 h-10 text-brand-muted" />
                       </div>
                       <h4 className="text-2xl font-black text-white italic mb-2 tracking-tighter">PROJECT CACHE EMPTY</h4>
                       <p className="text-brand-secondary text-sm max-w-sm font-bold uppercase tracking-widest opacity-60">No technical registries detected in this sector. Initialise a new project to begin aggregation.</p>
                       <Button variant="primary" onClick={() => setIsAddingProject(true)} className="mt-8 px-10 h-12">
                          <Plus className="w-5 h-5 mr-2" />
                          Initialize Registry
                       </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Quick Add Resource Modal */}
      <QuickAddModal 
        isOpen={isQuickAddingResource} 
        onClose={() => setIsQuickAddingResource(false)} 
        defaultProjectId={selectedProjectId || ''}
        projects={projects}
      />

      <CommandPalette 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        projects={projects}
        onSelectProject={(id) => {
          setSelectedProjectId(id);
          setIsSearchOpen(false);
        }}
      />

      {/* Add Project Modal */}
      <AnimatePresence>
        {isAddingProject && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-lg"
            >
              <Card className="!p-10 relative overflow-hidden border-brand-accent/20">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-accent to-transparent opacity-50" />
                <h3 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center">
                     <Plus className="w-6 h-6 text-brand-accent" />
                   </div>
                   Initialise Registry
                </h3>
                <p className="text-brand-secondary text-sm mb-10">Deploy a new technical definition to the control plane.</p>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-brand-muted ml-1">Registry Descriptor</label>
                    <Input 
                      placeholder="Project Name (e.g. Project Phoenix)" 
                      value={newProjectName} 
                      onChange={e => setNewProjectName(e.target.value)} 
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-brand-muted ml-1">Classification Tags</label>
                    <Input 
                      placeholder="infra, frontend, cloud (comma separated)" 
                      value={newProjectTags} 
                      onChange={e => setNewProjectTags(e.target.value)} 
                    />
                    <p className="text-[10px] text-zinc-600 italic">Separate tags with commas for system indexing.</p>
                  </div>
                  <Button variant="primary" className="w-full !mt-10 h-14 uppercase font-black tracking-widest shadow-glow" onClick={handleCreateProject}>
                    Commit Initialisation
                  </Button>
                </div>
                <button 
                  onClick={() => setIsAddingProject(false)} 
                  className="absolute top-6 right-6 text-brand-muted hover:text-white transition-colors"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
