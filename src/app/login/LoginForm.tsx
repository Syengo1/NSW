'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { login } from './actions';
import { ArrowRight, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

// 1. Isolated Submit Button to capture form pending state
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-foreground text-background font-bold uppercase tracking-widest py-4 hover:opacity-90 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed shadow-md rounded-sm"
    >
      {pending ? (
        <>
          Authenticating <Loader2 size={16} className="animate-spin" />
        </>
      ) : (
        <>
          Authenticate <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </>
      )}
    </button>
  );
}

// 2. The Main Interactive Form
export function LoginForm({ message }: { message?: string }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={login} className="space-y-6">
      <div className="space-y-4">
        
        {/* EMAIL INPUT */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="admin@nairobistreetwear.com"
            className="w-full bg-secondary/30 border border-border p-4 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground transition-all placeholder:text-muted-foreground/40 rounded-sm"
          />
        </div>

        {/* PASSWORD INPUT WITH TOGGLE */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full bg-secondary/30 border border-border p-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground transition-all placeholder:text-muted-foreground/40 rounded-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* ERROR STATE */}
      {message && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold tracking-wider uppercase flex items-start gap-2 rounded-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{message}</span>
        </div>
      )}

      {/* DYNAMIC SUBMIT BUTTON */}
      <SubmitButton />
    </form>
  );
}