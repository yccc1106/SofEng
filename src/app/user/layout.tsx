import React from 'react';
import NavBar from '@/components/User/NavBar';

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#f9fafb]">
            <NavBar />
            <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
