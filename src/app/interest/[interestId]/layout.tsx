import React from 'react';
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';
import NavBar from '@/components/User/NavBar';
import InterestSidebar from '@/components/Interest/InterestSidebar';

const prisma = new PrismaClient();

export default async function InterestLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ interestId: string }>;
}) {
    const { interestId } = await params;

    const interest = await prisma.category.findUnique({
        where: { id: interestId }
    });

    if (!interest) {
        redirect('/');
    }

    return (
        <div className="min-h-screen bg-[#f9fafb]">
            <NavBar />
            <div className="flex max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 gap-6">
                <InterestSidebar interest={interest} />
                <main className="flex-1 w-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
