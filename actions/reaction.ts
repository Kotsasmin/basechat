'use server';

import { getAdminPb } from '@/lib/server-pocketbase';

export async function toggleReaction(messageId: string, reactionValue: string) {
    const pb = await getAdminPb();

    try {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        const pbAuth = cookieStore.get('pb_auth');

        if (!pbAuth) {
            return { error: 'Not logged in' };
        }

        let userId = '';
        try {
            let cookieVal = pbAuth.value;
            let decoded = cookieVal;
            let attempts = 0;
            while (decoded.includes('%') && attempts < 3) {
                try {
                    decoded = decodeURIComponent(decoded);
                } catch (err) {
                    break;
                }
                attempts++;
            }

            const start = decoded.indexOf('{');
            const end = decoded.lastIndexOf('}');

            if (start !== -1 && end !== -1 && end > start) {
                decoded = decoded.substring(start, end + 1);
            }

            let authData;
            try {
                authData = JSON.parse(decoded);
            } catch (e1) {
                console.error("JSON Parse failed on extracted string:", decoded);
                return { error: 'Invalid session format' };
            }

            userId = authData?.model?.id || '';

            if (!userId && authData?.token) {
                const parts = authData.token.split('.');
                if (parts.length > 1) {
                    const payload = JSON.parse(atob(parts[1]));
                    userId = payload.id;
                }
            }
        } catch (e) {
            console.error("Cookie parse error details:", e);
        }

        if (!userId) return { error: 'Invalid session (User ID not found)' };

        const existingReactions = await pb.collection('reactions').getList(1, 1, {
            filter: `user = "${userId}" && message = "${messageId}" && value = "${reactionValue}"`,
        });

        if (existingReactions.items.length > 0) {
            await pb.collection('reactions').delete(existingReactions.items[0].id);
            return { success: true, action: 'removed' };
        } else {
            await pb.collection('reactions').create({
                user: userId,
                message: messageId,
                value: reactionValue
            });
            return { success: true, action: 'added' };
        }
    } catch (err: any) {
        console.error('Reaction Action Error:', err);
        if (err?.data) {
            console.error('PB Validation Errors:', JSON.stringify(err.data, null, 2));
        }
        return { error: err.message || 'Failed to react' };
    }
}
