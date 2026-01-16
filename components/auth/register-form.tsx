'use client';

import { useActionState } from 'react';
import { registerUser } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function RegisterForm() {
    const [state, formAction, isPending] = useActionState(registerUser, {});

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-4xl font-bold mb-8">Sign Up</h1>

            <form action={formAction} className="flex flex-col gap-4 w-full max-w-sm">
                <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    required
                    className="p-3 rounded bg-gray-800 text-white border border-gray-700 focus:border-purple-500 focus:outline-none"
                />

                <input
                    name="username"
                    placeholder="Username"
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

                <input
                    name="passwordConfirm"
                    type="password"
                    placeholder="Confirm Password"
                    required
                    className="p-3 rounded bg-gray-800 text-white border border-gray-700 focus:border-purple-500 focus:outline-none"
                />

                {state.error && (
                    <p className="text-red-500 text-center">{state.error}</p>
                )}
                {state.success && (
                    <p className="text-green-500 text-center">
                        Account created! <Link href="/login" className="underline">Log in.</Link>
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isPending || state?.success}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded transition"
                >
                    {isPending ? 'Creating...' : 'Create Account'}
                </button>

                <p className="text-center text-gray-400">
                    Already have an account? <Link href="/login" className="text-purple-400 hover:underline">Login</Link>
                </p>
            </form>
        </div>
    );
}
