import PocketBase from 'pocketbase';
import 'server-only';

let adminPb: PocketBase | undefined;

export async function getAdminPb() {
    if (adminPb && adminPb.authStore.isValid) {
        return adminPb;
    }

    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

    const email = process.env.POCKETBASE_ADMIN_EMAIL;
    const password = process.env.POCKETBASE_ADMIN_PASSWORD;

    if (!email || !password) {
        throw new Error('PocketBase Admin credentials not set in environment variables');
    }

    try {
        // PocketBase v0.23+ uses _superusers collection for admin authentication
        await pb.collection('_superusers').authWithPassword(email, password);
        adminPb = pb;
    } catch {
        try {
            // Fallback for older PocketBase versions (< v0.23)
            await pb.admins.authWithPassword(email, password);
            adminPb = pb;
        } catch (error) {
            throw new Error('PocketBase Admin Authentication Failed');
        }
    }

    return pb;
}
