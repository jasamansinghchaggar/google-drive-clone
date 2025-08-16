'use client'

import React from 'react';
import { Button } from './ui/button';
import { logoutUser } from '@/client/auth';
import { useRouter } from 'next/navigation';

const Dashboard: React.FC = () => {
    const router = useRouter();

    const handleLogout = async () => {
        const result = await logoutUser();
        if (result.success) {
            router.push('/signin');
            router.refresh();
        }
    };

    return (
        <>
            <h1>Dashboard</h1>
            <Button onClick={handleLogout}>
                Logout
            </Button>
        </>
    );
};

export default Dashboard;