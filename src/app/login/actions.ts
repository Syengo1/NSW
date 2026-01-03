'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  // 1. INPUT VALIDATION (Fail Fast)
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return redirect('/login?message=Please provide both email and password');
  }

  // 2. INITIALIZE SUPABASE
  const supabase = await createClient();

  // 3. AUTHENTICATE
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Security Note: In strict environments, use generic messages ("Invalid credentials")
    // to prevent user enumeration. For internal admin tools, specific messages are okay.
    console.error("Login attempt failed:", error.message);
    return redirect('/login?message=Invalid credentials. Please try again.');
  }

  // 4. SESSION REFRESH & REDIRECT
  // Revalidate the layout to update the UI state (remove login button, show admin links)
  revalidatePath('/', 'layout');
  
  // Redirect to dashboard
  redirect('/admin');
}