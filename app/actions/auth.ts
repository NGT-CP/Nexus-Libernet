'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData, role: 'student' | 'admin') {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Please provide valid credentials.' };
    }

    const supabase = await createClient();

    // The server handles the auth and sets the HttpOnly cookie automatically
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    // Double check RBAC if they are trying to log in as an admin
    const userRole = data.user?.user_metadata?.role;

    if (role === 'admin' && userRole !== 'admin') {
        // Destroy the session immediately if a student tries to use the admin portal
        await supabase.auth.signOut();
        return { error: 'Unauthorized: Insufficient security clearance.' };
    }

    // Server-side redirect (bypasses the infinite loop router issues)
    if (userRole === 'admin') {
        redirect('/admin');
    } else {
        redirect('/dashboard');
    }
}
// Add this to the bottom of app/actions/auth.ts

export async function logoutAction() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
}