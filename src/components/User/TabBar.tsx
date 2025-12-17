'use client';
import { HomeOutlined, TeamOutlined, UserOutlined, MessageOutlined, CompassOutlined } from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';

const TabBar = () => {
    const router = useRouter();
    const pathname = usePathname();

    if (pathname.startsWith('/user/login')) return null;

    const tabs = [
        { key: '/user/posts', icon: <HomeOutlined />, label: '首页' },
        { key: '/user/teams', icon: <TeamOutlined />, label: '组队' },
        { key: '/user/radar', icon: <CompassOutlined />, label: '雷达' },
        { key: '/user/chat', icon: <MessageOutlined />, label: '消息' },
        { key: '/user/profile', icon: <UserOutlined />, label: '我的' },
    ];

    return (
        <div className="fixed bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-200/50 flex justify-around pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
            {tabs.map((tab) => {
                const isActive = pathname.startsWith(tab.key);
                return (
                    <div
                        key={tab.key}
                        className={`flex flex-col items-center cursor-pointer transition-all duration-200 active:scale-90 select-none px-2 py-1 rounded-xl ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        onClick={() => router.push(tab.key)}
                    >
                        <span className={`text-2xl mb-1 transition-colors ${isActive ? 'drop-shadow-sm' : ''}`}>{tab.icon}</span>
                        <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default TabBar;
