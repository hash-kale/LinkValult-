import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card, Button, Input } from './ui/Kit';
import { FolderOpen, Github } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuthScreen() {
  const { loginGoogle, loginEmail, signupEmail, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        await loginEmail(email, password);
      } else {
        await signupEmail(email, password, name);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-brand-accent/30">
      {/* Precision Background Grid/Orbs */}
      <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-brand-accent/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="!p-10 border-brand-border/50 bg-brand-surface shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-accent to-transparent opacity-50" />
          
          <div className="flex flex-col items-center mb-10">
            <motion.div 
              whileHover={{ rotate: 12, scale: 1.1 }}
              className="w-16 h-16 bg-gradient-to-tr from-brand-accent to-indigo-400 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-brand-accent/30"
            >
              <FolderOpen className="text-white w-8 h-8" />
            </motion.div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">LinkVault</h1>
            <div className="flex items-center gap-2 mt-2">
               <span className="w-4 h-px bg-brand-muted" />
               <p className="text-brand-muted text-[10px] uppercase font-black tracking-[0.4em]">Resource Gateway</p>
               <span className="w-4 h-px bg-brand-muted" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 mb-10">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-widest text-brand-muted ml-1">Identity</label>
                <Input placeholder="OPERATOR NAME" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-widest text-brand-muted ml-1">Network UID</label>
              <Input type="email" placeholder="principal@linkvault.local" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-widest text-brand-muted ml-1">Secure Key</label>
              <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[10px] text-red-400 font-black uppercase tracking-widest bg-red-500/10 p-2 rounded border border-red-500/20"
              >
                FAULT: {error}
              </motion.div>
            )}

            <Button type="submit" variant="primary" className="w-full py-4 uppercase font-black tracking-[0.2em] shadow-glow h-14 mt-4" disabled={loading}>
              {loading ? 'Authorizing...' : mode === 'login' ? 'Establish Link' : 'Register Principal'}
            </Button>
          </form>
          
          <div className="relative mb-10">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-brand-border/50"></div></div>
            <div className="relative flex justify-center text-[9px] uppercase font-black tracking-[0.3em]"><span className="bg-brand-surface px-4 text-brand-muted italic">Multi-Factor Access</span></div>
          </div>

          <Button 
            className="w-full h-12 font-black uppercase tracking-widest text-[11px]" 
            variant="secondary" 
            onClick={loginGoogle}
            disabled={loading}
          >
            <Github className="w-4 h-4 mr-2 text-brand-accent" /> Google Verify
          </Button>

          <div className="mt-10 text-center">
            <button 
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-[10px] uppercase font-black tracking-widest text-brand-muted hover:text-brand-accent transition-all italic border-b border-transparent hover:border-brand-accent pb-0.5"
            >
              {mode === 'login' ? "New System Request? Initialize Account" : "Registered Principal? Return to Terminal"}
            </button>
          </div>
        </Card>
      </motion.div>
      
      {/* Version Tag */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 text-[9px] text-zinc-800 font-mono tracking-[0.4em] uppercase font-black whitespace-nowrap">
        <span>LV-OS v2.5.0</span>
        <span className="w-1 h-1 rounded-full bg-zinc-800" />
        <span>Hardware Encrypted</span>
        <span className="w-1 h-1 rounded-full bg-zinc-800" />
        <span className="animate-pulse text-zinc-700">Ready</span>
      </div>
    </div>
  );
}
