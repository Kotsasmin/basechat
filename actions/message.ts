'use server';

import { getAdminPb } from '@/lib/server-pocketbase';
import { Filter } from 'bad-words';
import { cookies } from 'next/headers';
import PocketBase from 'pocketbase';

const filter = new Filter();

export async function sendMessage(prevState: any, formData: FormData) {
    const text = formData.get('text') as string;

    if (!text || text.trim().length === 0) {
        return { error: 'Message cannot be empty' };
    }

    try {
        const cookieStore = await cookies();
        const pbAuth = cookieStore.get('pb_auth');

        if (!pbAuth) {
            return { error: 'You must be logged in to send messages' };
        }

        const pbClient = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');
        pbClient.authStore.loadFromCookie(`pb_auth=${pbAuth.value}`);

        if (!pbClient.authStore.isValid) {
            return { error: 'Invalid session' };
        }

        const userId = pbClient.authStore.model?.id;

        const cleanedText = filter.clean(text);

        const pbAdmin = await getAdminPb();

        await pbAdmin.collection('messages').create({
            text: cleanedText,
            user: userId,
        });

        return { success: true };

    } catch (err: any) {
        console.error('Send Message error:', err);
        return { error: 'Failed to send message' };
    }
}
