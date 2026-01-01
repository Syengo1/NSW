import { login } from './actions'; // You can reuse your old actions.ts!
import { ArrowRight, Hexagon } from 'lucide-react';
import Link from 'next/link';

export default async function LoginPage(props: {
  searchParams: Promise<{ message?: string }>
}) {
  const searchParams = await props.searchParams;
  const message = searchParams.message;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-md space-y-8">
        
        {/* HEADER */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <Hexagon className="w-12 h-12 text-white fill-white" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">
            Command Center
          </h1>
          <p className="text-muted-foreground tracking-widest text-xs uppercase">
            Restricted Access • Authorized Personnel Only
          </p>
        </div>

        {/* FORM */}
        <form className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="admin@nairobistreetwear.com"
                className="w-full bg-secondary border border-border p-4 text-sm focus:outline-none focus:border-white transition-colors placeholder:text-muted-foreground/50"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-secondary border border-border p-4 text-sm focus:outline-none focus:border-white transition-colors placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          {message && (
            <div className="p-4 bg-red-950/30 border border-red-900 text-red-500 text-xs font-mono uppercase">
              Error: {message}
            </div>
          )}

          <button
            formAction={login}
            className="w-full bg-white text-black font-bold uppercase tracking-widest py-4 hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 group"
          >
            Authenticate <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="text-center">
          <Link href="/" className="text-xs text-muted-foreground hover:text-white transition-colors border-b border-transparent hover:border-white pb-0.5">
            Return to Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}