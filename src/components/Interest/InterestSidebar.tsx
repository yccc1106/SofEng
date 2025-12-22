'use client';
import React from 'react';
import { Menu, MenuProps } from 'antd';
import { useRouter, usePathname } from 'next/navigation';
import { AppstoreOutlined, TeamOutlined, MessageOutlined, ArrowLeftOutlined } from '@ant-design/icons';

interface InterestSidebarProps {
    interest: {
        id: string;
        name: string;
    };
}

const InterestSidebar: React.FC<InterestSidebarProps> = ({ interest }) => {
    const router = useRouter();
    const pathname = usePathname();
    const basePath = `/interest/${interest.id}`;

    const items: MenuProps['items'] = [
        {
            key: basePath,
            icon: <AppstoreOutlined />,
            label: 'Posts',
        },
        {
            key: `${basePath}/chat`,
            icon: <MessageOutlined />,
            label: 'Chat Lobby',
        },
        {
            key: `${basePath}/teams`,
            icon: <TeamOutlined />,
            label: 'Teams',
        },
        {
            type: 'divider',
        },
        {
            key: '/',
            icon: <ArrowLeftOutlined />,
            label: 'Switch Interest',
        },
    ];

    const handleClick = (e: any) => {
        if (e.key === '/') {
            router.push('/');
        } else {
            router.push(e.key);
        }
    };

    // Determine active key to highlight. Match exact or prefix if needed?
    // Simply check exact match for sub-tabs.
    // If pathname is /interest/[id], key is basePath.
    let selectedKey = basePath;
    if (pathname.includes('/chat')) selectedKey = `${basePath}/chat`;
    if (pathname.includes('/teams')) selectedKey = `${basePath}/teams`;

    return (
        <div className="w-64 flex-shrink-0 hidden md:block">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <h2 className="text-xl font-bold text-gray-800 mb-1">{interest.name}</h2>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Community</p>
            </div>
            <Menu
                mode="vertical"
                selectedKeys={[selectedKey]}
                onClick={handleClick}
                items={items}
                className="rounded-lg shadow-sm border-0"
                style={{ background: 'white' }}
            />
        </div>
    );
};
export default InterestSidebar;
