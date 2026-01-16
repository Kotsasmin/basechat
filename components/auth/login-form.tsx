'use client';

import { useActionState } from 'react';
import { login } from '@/actions/login';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function LoginForm() {
    const [state, formAction, isPending] = useActionState(login, null);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-4xl font-bold mb-8">Login</h1>

            <form action={formAction} className="flex flex-col gap-4 w-full max-w-sm">
                <input
                    name="username"
                    placeholder="Email or Username"
                    required
                    className="p-3 rounded bg-gray-800 text-white border border-gray-700 focus:border-purple-500 focus:outline-none"
                />

                <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    required
                    className="p-3 rounded bg-gray-800 text-white border border-gray-700 focus:border-purple-500 focus:outline-none"
                />

                {state?.error && (
                    <p className="text-red-500 text-center">{state.error}</p>
                )}

                <button
                    type="submit"
                    disabled={isPending}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded transition"
                >
                    {isPending ? 'Logging in...' : 'Login'}
                </button>

                <p className="text-center text-gray-400">
                    Don't have an account? <Link href="/register" className="text-purple-400 hover:underline">Register</Link>
                </p>
            </form>
        </div>
    );
}
