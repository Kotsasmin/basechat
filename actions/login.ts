'use server';

import { pb } from '@/lib/pocketbase';
import PocketBase from 'pocketbase';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(prevState: any, formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username || !password) {
        return { error: 'Please enter username and password' };
    }

    try {
        const pbClient = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

        await pbClient.collection('users').authWithPassword(username, password);

        const cookieStore = await cookies();
        const authData = JSON.stringify({
            token: pbClient.authStore.token,
            model: pbClient.authStore.model,
        });

        cookieStore.set('pb_auth', authData, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7
        });

    } catch (err: any) {
        return { error: 'Invalid username or password' };
    }

    redirect('/');
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('pb_auth');
    redirect('/login');
}
