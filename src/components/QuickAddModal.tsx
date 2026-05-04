import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  X, 
  Link as LinkIcon, 
  Key, 
  StickyNote, 
  ChevronRight, 
  Lock, 
  ShieldCheck,
  Tag as TagIcon,
  Globe
} from 'lucide-react';
import { Card, Button, Input, Select } from './ui/Kit';
import { ResourceService } from '../services';
import { useAuth } from '../hooks/useAuth';
import { encryptData, cn } from '../lib/utils';
import { ResourceType, Environment, Project } from '../types';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  projects?: Project[];
}

export function QuickAddModal({ isOpen, onClose, defaultProjectId, projects = [] }: QuickAddModalProps) {
  const { user } = useAuth();
  const [type, setType] = useState<ResourceType>('link');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [loading, setLoading] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    serviceName: '',
    username: '',
    password: '',
    content: '',
    category: 'doc',
    environment: 'dev' as Environment,
    tags: [] as string[],
    tagInput: ''
  });

  const [error, setError] = useState<string | null>(null);

  // Reset form when opening or changing type
  useEffect(() => {
    if (isOpen) {
      setProjectId(defaultProjectId || (projects[0]?.id || ''));
      setError(null);
    }
  }, [isOpen, defaultProjectId, projects]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = formData.tagInput.trim().replace(',', '');
      if (tag && !formData.tags.includes(tag)) {
        setFormData({
          ...formData,
          tags: [...formData.tags, tag],
          tagInput: ''
        });
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t: string) => t !== tagToRemove)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !projectId || loading) return;

    setError(null);
    setLoading(true);
    try {
      let data: any = {
        environment: formData.environment,
        tags: formData.tags
      };

      if (type === 'link') {
        data = {
          ...data,
          title: formData.title,
          url: formData.url,
          category: formData.category
        };
      } else if (type === 'credential') {
        if (!masterPassword) {
          setError("Master Password required for encryption");
          setLoading(false);
          return;
        }
        const encrypted = await encryptData(formData.password, masterPassword);
        data = {
          ...data,
          serviceName: formData.serviceName,
          username: formData.username,
          encryptedPassword: encrypted.encrypted,
          salt: encrypted.salt,
          iv: encrypted.iv
        };
      } else if (type === 'note') {
        data = {
          ...data,
          title: formData.title,
          content: formData.content
        };
      }

      await ResourceService.add(projectId, type, { ...data, userEmail: user.email }, user.uid);
      
      // Success - Reset and close
      setFormData({
        title: '',
        url: '',
        serviceName: '',
        username: '',
        password: '',
        content: '',
        category: 'doc',
        environment: 'dev',
        tags: [],
        tagInput: ''
      });
      onClose();
    } catch (error) {
      console.error('Failed to add resource:', error);
      setError("Failed to commit asset. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            className="w-full max-w-2xl"
          >
            <Card className="!p-0 border-brand-border/50 relative overflow-hidden flex flex-col md:flex-row min-h-[500px]">
              {/* Type Sidebar */}
              <div className="w-full md:w-56 bg-zinc-950/50 border-b md:border-b-0 md:border-r border-brand-border p-6 flex flex-col gap-2">
                <div className="text-[10px] uppercase font-black tracking-[0.2em] text-brand-muted mb-4 opacity-50">Select Asset Class</div>
                <button
                  type="button"
                  onClick={() => setType('link')}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold",
                    type === 'link' ? "bg-brand-accent text-white shadow-glow" : "text-brand-secondary hover:bg-zinc-800/30 hover:text-white"
                  )}
                >
                  <LinkIcon className="w-4 h-4" />
                  Link Proxy
                </button>
                <button
                  type="button"
                  onClick={() => setType('credential')}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold",
                    type === 'credential' ? "bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "text-brand-secondary hover:bg-zinc-800/30 hover:text-white"
                  )}
                >
                  <Key className="w-4 h-4" />
                  Vault Entry
                </button>
                <button
                  type="button"
                  onClick={() => setType('note')}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold",
                    type === 'note' ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "text-brand-secondary hover:bg-zinc-800/30 hover:text-white"
                  )}
                >
                  <StickyNote className="w-4 h-4" />
                  Documentation
                </button>

                <div className="mt-8 pt-8 border-t border-brand-border/50">
                  <div className="text-[10px] uppercase font-black tracking-[0.2em] text-brand-muted mb-4 opacity-50">Target Destination</div>
                  <Select 
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    options={projects.map(p => ({ label: p.name, value: p.id }))}
                    className="!bg-zinc-900/50 !border-brand-border/30 text-xs"
                  />
                </div>
              </div>

              {/* Main Form Area */}
              <form onSubmit={handleSubmit} className="flex-1 p-10 flex flex-col">
                <div className="mb-8 relative">
                  <h3 className="text-3xl font-black text-white tracking-tighter leading-none mb-2">
                    Quick Commit
                  </h3>
                  <p className="text-brand-secondary text-xs uppercase tracking-widest font-bold">
                    Initializing {type} asset to {projects.find(p => p.id === projectId)?.name || 'Registry'}
                  </p>
                  <button 
                    type="button"
                    onClick={onClose} 
                    className="absolute top-0 right-0 text-brand-muted hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 space-y-6">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                       <ShieldCheck className="w-5 h-5 text-red-500" />
                       <span className="text-xs font-black uppercase tracking-widest text-red-500">{error}</span>
                    </div>
                  )}
                  {/* Dynamic Fields */}
                  {type === 'link' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-brand-muted ml-1">Asset ID</label>
                        <Input 
                          placeholder="e.g. Staging Dashboard" 
                          value={formData.title} 
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          required
                          autoFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-brand-muted ml-1">Network Path</label>
                        <Input 
                          placeholder="https://..." 
                          value={formData.url} 
                          onChange={(e) => setFormData({...formData, url: e.target.value})}
                          required
                        />
                      </div>
                    </>
                  )}

                  {type === 'credential' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-brand-muted ml-1">Service Origin</label>
                        <Input 
                          placeholder="e.g. AWS Core Console" 
                          value={formData.serviceName} 
                          onChange={(e) => setFormData({...formData, serviceName: e.target.value})}
                          required
                          autoFocus
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-black tracking-widest text-brand-muted ml-1">Principal</label>
                          <Input 
                            placeholder="username" 
                            value={formData.username} 
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-black tracking-widest text-brand-muted ml-1">Secret Key</label>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            value={formData.password} 
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-brand-muted ml-1 flex items-center gap-2">
                          Master Authorization
                          <ShieldCheck className="w-3 h-3 text-brand-accent animate-pulse" />
                        </label>
                        <Input 
                          type="password" 
                          placeholder="Decrypt Vault with Master Key" 
                          value={masterPassword} 
                          onChange={(e) => setMasterPassword(e.target.value)}
                          required
                          className="!border-brand-accent/20 focus:!border-brand-accent"
                        />
                      </div>
                    </>
                  )}

                  {type === 'note' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-brand-muted ml-1">Documentation Title</label>
                        <Input 
                          placeholder="Segment Title" 
                          value={formData.title} 
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          required
                          autoFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-brand-muted ml-1">Buffer Content</label>
                        <textarea 
                          className="premium-input w-full min-h-[120px] font-mono text-sm leading-relaxed"
                          placeholder="Technical specifics..."
                          value={formData.content} 
                          onChange={(e) => setFormData({...formData, content: e.target.value})}
                          required
                        />
                      </div>
                    </>
                  )}

                  {/* Shared Metadata */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-brand-muted ml-1">Tier</label>
                      <Select 
                        value={formData.environment}
                        onChange={(e) => setFormData({...formData, environment: e.target.value})}
                        options={[
                          { label: 'Production', value: 'production' },
                          { label: 'Staging', value: 'staging' },
                          { label: 'Development', value: 'dev' }
                        ]}
                      />
                    </div>
                    {type === 'link' && (
                       <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-brand-muted ml-1">Category</label>
                        <Select 
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          options={[
                            { label: 'Docs', value: 'doc' },
                            { label: 'Registry', value: 'repo' },
                            { label: 'Infra', value: 'infra' },
                            { label: 'Other', value: 'other' }
                          ]}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-brand-muted ml-1 flex items-center gap-2">
                      <TagIcon className="w-3 h-3" />
                      Classifiers
                    </label>
                    <div className="premium-input flex flex-wrap gap-2 min-h-[42px] py-1.5 focus-within:ring-2 focus-within:ring-brand-accent/20">
                      {formData.tags.map(tag => (
                        <span key={tag} className="bg-brand-accent/20 text-brand-accent text-[10px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="hover:text-white"><X className="w-2.5 h-2.5" /></button>
                        </span>
                      ))}
                      <input 
                        className="bg-transparent border-none outline-none text-sm placeholder:text-zinc-700 flex-1 min-w-[80px]"
                        placeholder={formData.tags.length === 0 ? "Add tags (Enter or comma)..." : ""}
                        value={formData.tagInput}
                        onChange={(e) => setFormData({...formData, tagInput: e.target.value})}
                        onKeyDown={handleAddTag}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={onClose}
                    className="flex-1"
                  >
                    Abort
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={loading || !projectId}
                    className={cn(
                      "flex-1 h-12 uppercase font-black tracking-widest transition-all",
                      type === 'credential' ? "bg-amber-600 hover:bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]" :
                      type === 'note' ? "bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]" :
                      "shadow-glow"
                    )}
                  >
                    {loading ? 'Committing...' : `Push ${type}`}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
