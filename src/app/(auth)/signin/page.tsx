import { Suspense } from 'react';
import SigninPage from '@/components/SigninPage';

function SigninPageWithSuspense() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-lg font-semibold">Loading...</h2>
                </div>
            </div>
        }>
            <SigninPage />
        </Suspense>
    );
}

export default function page() {
    return (
        <SigninPageWithSuspense />
    );
}
