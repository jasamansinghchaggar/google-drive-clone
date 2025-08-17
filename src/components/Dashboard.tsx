'use client'

import React, { useEffect } from 'react';
import { Button } from './ui/button';
import { logoutUser } from '@/client/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardSkeleton } from './ui/dashboard-skeleton';

const Dashboard: React.FC = () => {
    const router = useRouter();
    const { user, loading, refetchUser } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/signin');
        }
    }, [loading, user, router]);

    const handleLogout = async () => {
        const result = await logoutUser();
        if (result.success) {
            await refetchUser();
            router.push('/signin');
        }
    };

    if (loading) {
        return (
            <DashboardSkeleton />
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen w-screen">
            <div className="">
                <h1 className="">Dashboard</h1>
                <p className="">Welcome, {user.name || user.email}!</p>
            </div>

            <div className="mt-8">
                <Button onClick={handleLogout} variant="outline">
                    Logout
                </Button>
            </div>

        </div>
    );
};

export default Dashboard;