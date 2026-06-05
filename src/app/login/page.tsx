import { Hexagon } from 'lucide-react';
import Link from 'next/link';
import { LoginForm } from './LoginForm';

// 🔒 Absolute Security: Ensure the login page is never indexed by Google
export const metadata = {
  title: 'Command Center Auth',
  robots: { index: false, follow: false, nocache: true }
};

export default async function LoginPage(props: {
  searchParams: Promise<{ message?: string }>
}) {
  const searchParams = await props.searchParams;
  const message = searchParams.message;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* HEADER */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <Hexagon className="w-12 h-12 text-foreground fill-foreground drop-shadow-md" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">
            Command Center
          </h1>
          <p className="text-muted-foreground tracking-widest text-xs uppercase font-mono">
            Restricted Access • Authorized Personnel Only
          </p>
        </div>

        {/* CLIENT FORM COMPONENT */}
        <LoginForm message={message} />

        {/* FOOTER LINK */}
        <div className="text-center pt-4">
          <Link 
            href="/" 
            className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors border-b border-transparent hover:border-foreground pb-0.5 uppercase tracking-widest"
          >
            Return to Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}