import Chat from '@/components/chat/chat';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import PocketBase from 'pocketbase';

export default async function Home() {
    const cookieStore = await cookies();
    const pbAuth = cookieStore.get('pb_auth');

    if (!pbAuth) {
        redirect('/login');
    }

    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');
    pb.authStore.loadFromCookie(pbAuth.value);

    const model = pb.authStore.model;
    const token = pb.authStore.token;

    if (!pb.authStore.isValid) {
        redirect('/login');
    }

    return (
        <div className="flex flex-col min-h-screen p-4 bg-gray-50 dark:bg-gray-950">
            <div className="flex-1 flex items-center justify-center">
                <Chat initialUser={model} initialToken={token} />
            </div>
        </div>
    );
}