import React from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('premium-card p-6 shadow-2xl', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Button({ 
  children, 
  className, 
  variant = 'primary', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)]',
    secondary: 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700 shadow-inner-glow',
    ghost: 'bg-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-white',
    danger: 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20'
  };

  return (
    <button
      className={cn(
        'px-4 py-2.5 rounded-lg font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer text-sm',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'premium-input w-full',
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { label: string, value: string }[] }) {
  return (
    <div className="relative group">
      <select
        className={cn(
          'premium-input w-full appearance-none pr-10 cursor-pointer',
          className
        )}
        {...props}
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 group-hover:text-zinc-300 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </div>
  );
}

export function Skeleton({ className, variant = 'rect' }: { className?: string, variant?: 'rect' | 'circle' | 'text' }) {
  return (
    <div 
      className={cn(
        "animate-pulse bg-zinc-800/50 border border-white/5",
        variant === 'circle' ? "rounded-full" : "rounded-xl",
        variant === 'text' ? "h-4 w-3/4" : "",
        className
      )} 
    />
  );
}

export function Toast({ message, type = 'success', onClose }: { message: string, type?: 'success' | 'error', onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1 } }}
      className={cn(
        "fixed bottom-8 right-8 z-[300] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border backdrop-blur-xl",
        type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black",
        type === 'success' ? "bg-emerald-500/20" : "bg-red-500/20"
      )}>
        {type === 'success' ? '✓' : '!'}
      </div>
      <span className="text-sm font-bold uppercase tracking-widest">{message}</span>
      <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
