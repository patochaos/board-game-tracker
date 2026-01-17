'use client';

import { AppLayout } from '@/components/layout';
import { Card, Button, StatCard } from '@/components/ui';
import { Swords, Plus, Search, Trophy } from 'lucide-react';
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

                <Card variant="glass">
                    <div className="text-center py-12">
                        <p className="text-slate-400 mb-4">No struggles recorded yet.</p>
                        <Link href="/vtes/sessions/new">
                            <Button variant="secondary">Record your first game</Button>
                        </Link>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
