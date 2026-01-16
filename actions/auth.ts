'use server';

import { getAdminPb } from '@/lib/server-pocketbase';

export interface AuthState {
    error?: string;
    success?: boolean;
}

export async function registerUser(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const passwordConfirm = formData.get('passwordConfirm') as string;

    if (!username || !email || !password || !passwordConfirm) {
        return { error: 'Please fill in all fields' };
    }

    if (password !== passwordConfirm) {
        return { error: 'Passwords do not match' };
    }

    if (password.length < 8) {
        return { error: 'Password must be at least 8 characters' };
    }

    try {
        const pb = await getAdminPb();

        await pb.collection('users').create({
            username,
            email,
            emailVisibility: true,
            password,
            passwordConfirm,
            name: username,
        });

        return { success: true };
    } catch (err: any) {
        // Return the actual error message from PocketBase for better debugging
        return { error: err?.data?.message || err.message || 'Failed to create account' };
    }
}
