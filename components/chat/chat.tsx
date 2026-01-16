'use client';

import { pb } from '@/lib/pocketbase';
import { sendMessage } from '@/actions/message';
import { logout } from '@/actions/login';
import { toggleReaction } from '@/actions/reaction';
import { Message, User } from '@/lib/types';
import { useEffect, useState, useRef, useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

interface ChatProps {
    initialUser: any;
    initialToken: string;
}

export default function Chat({ initialUser, initialToken }: ChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [user, setUser] = useState<any>(initialUser);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [state, formAction, isPending] = useActionState(sendMessage, null);
    const formRef = useRef<HTMLFormElement>(null);
    const [dummyReactions] = useState(['👍', '😂', '🔥', '💩']);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            if (cooldown > 0) {
                setCooldown((prev) => prev - 1);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const topSentinelRef = useRef<HTMLDivElement>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    useEffect(() => {
        pb.authStore.save(initialToken, initialUser);
        setUser(pb.authStore.model);
        loadMessages(1, true);

        pb.collection('messages').subscribe('*', async ({ action, record }) => {
            if (action === 'create') {
                const user = await pb.collection('users').getOne(record.user);
                record.expand = { user };
                setMessages((prev) => [...prev, record as unknown as Message]);
                setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
            if (action === 'delete') {
                setMessages((prev) => prev.filter((m) => m.id !== record.id));
            }
            if (action === 'update') {
                try {
                    const updated = await pb.collection('messages').getOne(record.id, { expand: 'user,reactions(message)' });
                    setMessages((prev) => prev.map((m) => m.id === record.id ? updated as unknown as Message : m));
                } catch (e) { }
            }
        });

        pb.collection('reactions').subscribe('*', async ({ action, record }) => {
            const messageId = record.message;
            if (!messageId) return;
            try {
                const updatedMessage = await pb.collection('messages').getOne(messageId, {
                    expand: 'user,reactions(message)',
                });
                setMessages((prev) => prev.map((m) =>
                    m.id === messageId ? (updatedMessage as unknown as Message) : m
                ));
            } catch (e) { }
        });

        return () => {
            pb.collection('messages').unsubscribe();
            pb.collection('reactions').unsubscribe();
        };
    }, []);

    async function loadMessages(pageNum: number, isInitial: boolean = false) {
        try {
            if (!isInitial) setIsLoadingMore(true);

            const resultList = await pb.collection('messages').getList(pageNum, 20, {
                sort: '-created',
                expand: 'user,reactions(message)',
            });

            if (resultList.items.length < 20) {
                setHasMore(false);
            }

            const newMessages = resultList.items.reverse() as unknown as Message[];

            if (isInitial) {
                setMessages(newMessages);
                setTimeout(() => scrollRef.current?.scrollIntoView(), 100);
            } else {
                setMessages((prev) => [...newMessages, ...prev]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            if (!isInitial) setIsLoadingMore(false);
        }
    }

    const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (e.currentTarget.scrollTop < 50 && hasMore && !isLoadingMore) {
            const oldHeight = e.currentTarget.scrollHeight;
            const currentScrollTop = e.currentTarget.scrollTop;

            setIsLoadingMore(true);
            const nextPage = page + 1;
            setPage(nextPage);

            loadMessages(nextPage).then(() => {
            });
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !isLoadingMore && messages.length > 0) {
                console.log("Loading more...");
                const nextPage = page + 1;
                setPage(nextPage);
                const container = topSentinelRef.current?.parentElement;
                const oldHeight = container?.scrollHeight || 0;
                const oldTop = container?.scrollTop || 0;

                loadMessages(nextPage).then(() => {
                    if (container) {
                        setTimeout(() => {
                            const newHeight = container.scrollHeight;
                            container.scrollTop = newHeight - oldHeight + oldTop;
                        }, 0);
                    }
                });
            }
        }, { threshold: 1.0 });

        if (topSentinelRef.current) observer.observe(topSentinelRef.current);
        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, messages.length, page]);

    const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

    const scrollToBottom = () => {
        if (autoScrollEnabled) {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleSend = async (formData: FormData) => {
        if (cooldown > 0) return;
        setCooldown(5);
        await formAction(formData);
    };


    const handleReaction = async (messageId: string, emoji: string) => {
        if (!user || !user.id) return;

        const reactionMap: Record<string, string> = {
            '👍': 'like',
            '😂': 'love',
            '🔥': 'fire',
            '💩': 'poop'
        };
        const apiValue = reactionMap[emoji] || 'like';

        // Optimistic Update
        const previousMessages = [...messages];
        setMessages(prevMessages => {
            return prevMessages.map(m => {
                if (m.id !== messageId) return m;

                const reactions = m.expand?.['reactions(message)'] || [];
                const existingReactionIndex = reactions.findIndex((r: any) => r.user === user.id && r.value === apiValue);

                let newReactions = [...reactions];
                if (existingReactionIndex > -1) {
                    // Remove
                    newReactions.splice(existingReactionIndex, 1);
                } else {
                    // Add
                    newReactions.push({
                        id: 'optimistic-' + Date.now(),
                        user: user.id,
                        value: apiValue,
                        message: messageId,
                        created: new Date().toISOString(),
                        updated: new Date().toISOString(),
                        collectionId: '',
                        collectionName: 'reactions',
                        expand: {}
                    });
                }

                return {
                    ...m,
                    expand: {
                        ...m.expand,
                        'reactions(message)': newReactions
                    }
                } as unknown as Message;
            });
        });

        try {
            const result = await toggleReaction(messageId, apiValue);
            if (result?.error) {
                console.error("Reaction failed:", result.error);
                setMessages(previousMessages); // Revert
            }
        } catch (error) {
            console.error("Reaction failed:", error);
            setMessages(previousMessages); // Revert
        }
    };

    useEffect(() => {
        if (state?.success && formRef.current) {
            formRef.current.reset();
        }
    }, [state?.success]);


    if (!user) {
        return <div className="p-4 text-center">Please log in to view the chat.</div>;
    }

    return (
        <div className="flex flex-col items-center w-full max-w-xl mx-auto h-screen bg-[#202225] text-gray-200 font-sans relative overflow-hidden">
            <div className="flex flex-col items-center w-full bg-[#202225] z-10 py-4 shadow-sm border-b border-gray-900 shrink-0">
                <h1 className="text-2xl font-bold text-gray-100 mb-2">BaseChat</h1>

                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-4">
                        <p className="text-sm">Signed in as <span className="font-bold text-white">@{user.username || user.name || user.email}</span></p>
                        <form action={async () => { await logout(); }}>
                            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-1 px-3 rounded shadow transition">
                                Sign Out
                            </button>
                        </form>
                    </div>

                    <button
                        onClick={() => setAutoScrollEnabled(!autoScrollEnabled)}
                        className={`text-xs font-bold py-1 px-3 rounded shadow transition uppercase ${autoScrollEnabled ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'}`}
                    >
                        {autoScrollEnabled ? 'Autoscroll: ON' : 'Autoscroll: OFF'}
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                <div ref={topSentinelRef} className="h-1" />
                {isLoadingMore && <div className="text-center text-xs text-gray-500 py-2">Loading history...</div>}

                {messages.map((message) => {
                    const username = message.expand?.user?.username || message.expand?.user?.name || 'Unknown';
                    const avatarSeed = message.expand?.user?.username || message.user;
                    const reactions = message.expand?.['reactions(message)'] || [];
                    const reactionCounts = reactions.reduce((acc: any, r: any) => { acc[r.value] = (acc[r.value] || 0) + 1; return acc; }, {});
                    const poopCount = reactionCounts['poop'] || 0;
                    const isPoopedToDeath = poopCount > 5;

                    return (
                        <div key={message.id} className="flex gap-4 bg-[#2f3136] p-4 rounded bg-opacity-100 shadow-sm w-full group relative overflow-hidden">
                            {isPoopedToDeath && (
                                <div className="absolute inset-0 bg-[#2f3136] z-10 flex flex-col items-center justify-center text-center opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-xs text-gray-400">Message from @{username}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-xl font-bold text-gray-200">
                                        <span>💩</span>
                                        <span>pooped to death</span>
                                        <span>💀</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Hover to reveal message</p>
                                </div>
                            )}

                            <div className={`shrink-0 ${isPoopedToDeath ? 'opacity-0 group-hover:opacity-100 transition-opacity' : ''}`}>
                                <Avatar className="w-10 h-10 rounded-none bg-black">
                                    <AvatarImage className="rounded-none" src={`https://api.dicebear.com/7.x/identicon/svg?seed=${avatarSeed}&backgroundColor=transparent`} />
                                    <AvatarFallback className="bg-gray-700 text-white rounded-none font-mono">{username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </div>

                            <div className={`flex-1 min-w-0 ${isPoopedToDeath ? 'opacity-0 group-hover:opacity-100 transition-opacity' : ''}`}>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-gray-500 text-xs text-[#b9bbbe]">Sent by</span>
                                    <span className="font-bold text-gray-300 hover:underline cursor-pointer text-sm">@{username}</span>
                                </div>

                                <p className="text-gray-100 text-base mb-3 break-words leading-relaxed font-light">
                                    {message.text}
                                </p>

                                <div className="flex gap-2">
                                    {dummyReactions.map(emoji => {
                                        const reactionMap: Record<string, string> = { '👍': 'like', '😂': 'love', '🔥': 'fire', '💩': 'poop' };
                                        const type = reactionMap[emoji] || 'like';
                                        const count = reactionCounts[type] || 0;
                                        return (
                                            <button
                                                key={emoji}
                                                onClick={() => handleReaction(message.id, emoji)}
                                                className={`px-3 py-1.5 text-sm transition flex items-center gap-1.5 rounded border border-gray-700 hover:bg-gray-800 ${count > 0 ? 'border-purple-500 bg-purple-500/10' : 'text-gray-400'}`}
                                            >
                                                <span>{emoji}</span>
                                                <span className={`${count > 0 ? 'text-white' : 'text-gray-500'}`}>{count}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            <div className="w-full bg-[#202225] p-4 shrink-0 border-t border-gray-900 z-10">
                <form action={handleSend} ref={formRef} className="max-w-xl mx-auto flex gap-4">
                    <input
                        name="text"
                        placeholder="Message"
                        autoComplete="off"
                        className="flex-1 bg-[#40444b] text-gray-100 placeholder-gray-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-600 border-none"
                    />
                    <button
                        type="submit"
                        disabled={isPending || cooldown > 0}
                        className={`font-bold py-2 px-6 rounded-lg transition uppercase text-sm ${cooldown > 0
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-500 text-white shadow-lg'
                            }`}
                    >
                        {cooldown > 0 ? `THROTTLED` : '🕊️'}
                    </button>
                </form>
            </div>
        </div>
    );
}
