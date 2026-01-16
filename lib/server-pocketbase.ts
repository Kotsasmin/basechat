import PocketBase from 'pocketbase';
import 'server-only';

export async function getAdminPb() {
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

    const email = process.env.POCKETBASE_ADMIN_EMAIL;
    const password = process.env.POCKETBASE_ADMIN_PASSWORD;

    if (!email || !password) {
        throw new Error('PocketBase Admin credentials not set in environment variables');
    }

    try {
        await pb.admins.authWithPassword(email, password);
    } catch (error) {
        throw new Error('PocketBase Admin Authentication Failed');
    }

    return pb;
}
