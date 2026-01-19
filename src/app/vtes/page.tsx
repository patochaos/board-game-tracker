'use client';

import { AppLayout } from '@/components/layout';
import { Card, Button, StatCard } from '@/components/ui';
import { Swords, Plus, Search, Trophy, TrendingUp, BookOpen, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function VTESDashboard() {
    return (
        <AppLayout>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-red-100">VTES Dashboard</h1>
                        <p className="mt-1 text-red-300">
                            Methuselah, welcome to your domain.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/vtes/cards">
                            <Button variant="secondary" leftIcon={<Search className="h-4 w-4" />}>
                                Card Search
                            </Button>
                        </Link>
                        <Link href="/vtes/sessions/new">
                            <Button className="bg-red-600 hover:bg-red-700 text-white" leftIcon={<Plus className="h-4 w-4" />}>
                                Log Struggle
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard
                        label="Blood Spilled"
                        value="0"
                        subValue="Pool damage dealt"
                        icon={<Swords className="h-8 w-8 text-red-500" />}
                    />
                    <StatCard
                        label="Prey Ousted"
                        value="0"
                        subValue="Successful ousts"
                        icon={<Trophy className="h-8 w-8 text-amber-500" />}
                    />
                    <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-slate-400">Favored Clan</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-slate-100">-</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Link href="/vtes/decks" className="block">
                        <Card variant="glass" className="p-4 hover:border-red-500/30 transition-colors cursor-pointer">
                            <div className="flex flex-col items-center gap-2 text-center">
                                <BookOpen className="h-8 w-8 text-red-400" />
                                <span className="font-medium text-slate-200">Decks</span>
                                <span className="text-xs text-slate-500">Browse & Import</span>
                            </div>
                        </Card>
                    </Link>
                    <Link href="/vtes/sessions" className="block">
                        <Card variant="glass" className="p-4 hover:border-red-500/30 transition-colors cursor-pointer">
                            <div className="flex flex-col items-center gap-2 text-center">
                                <Calendar className="h-8 w-8 text-red-400" />
                                <span className="font-medium text-slate-200">Sessions</span>
                                <span className="text-xs text-slate-500">Game History</span>
                            </div>
                        </Card>
                    </Link>
                    <Link href="/vtes/leaderboard" className="block">
                        <Card variant="glass" className="p-4 hover:border-red-500/30 transition-colors cursor-pointer">
                            <div className="flex flex-col items-center gap-2 text-center">
                                <TrendingUp className="h-8 w-8 text-amber-400" />
                                <span className="font-medium text-slate-200">Leaderboard</span>
                                <span className="text-xs text-slate-500">Rankings</span>
                            </div>
                        </Card>
                    </Link>
                    <Link href="/vtes/cards" className="block">
                        <Card variant="glass" className="p-4 hover:border-red-500/30 transition-colors cursor-pointer">
                            <div className="flex flex-col items-center gap-2 text-center">
                                <Search className="h-8 w-8 text-red-400" />
                                <span className="font-medium text-slate-200">Cards</span>
                                <span className="text-xs text-slate-500">Card Database</span>
                            </div>
                        </Card>
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
