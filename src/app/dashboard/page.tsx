'use client';
import Analysis from "@/components/Dashboard/Analysis/Analysis";

export default function DashboardPage() {
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Analysis Dashboard</h1>
            {/* 
        The original component defined props but didn't use them directly for initial data, 
        relying on useRequest internal fetch. We can safely pass mocked/empty props here.
      */}
            <Analysis dashboardAndanalysis={{} as any} loading={false} />
        </div>
    );
}
