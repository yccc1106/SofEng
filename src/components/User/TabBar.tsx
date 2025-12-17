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
        <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around py-2 pb-4 z-50">
            {tabs.map((tab) => {
                const isActive = pathname.startsWith(tab.key);
                return (
                    <div
                        key={tab.key}
                        className={`flex flex-col items-center cursor-pointer ${isActive ? 'text-blue-500' : 'text-gray-500'}`}
                        onClick={() => router.push(tab.key)}
                    >
                        <span className="text-xl mb-1">{tab.icon}</span>
                        <span className="text-xs">{tab.label}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default TabBar;
