'use client';
import Analysis from "@/components/Dashboard/Analysis/Analysis";

export default  function DashboardPage() {
    return (
        <div className="p-6">
            <div className="flex items-center gap-6 mb-8">
                <img
                    src="/images/welcome-doodle.png"
                    alt="Welcome"
                    className="w-32 h-32 object-contain opacity-90"
                />
                <div>
                    <h1 className="text-3xl font-semibold text-gray-800">Hello, Admin</h1>
                    <p className="text-gray-500 mt-1">Here is what's happening with your project today.</p>
                </div>
            </div>

            {/* 
        The original component defined props but didn't use them directly for initial data, 
        relying on useRequest internal fetch. We can safely pass mocked/empty props here.
      */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <Analysis dashboardAndanalysis={{} as any} loading={false} />
            </div>
        </div>
    );
}
