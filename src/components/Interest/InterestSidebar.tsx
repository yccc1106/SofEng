'use client';
import { useLanguage } from '@/lib/language';
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
    const { t } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const basePath = `/interest/${interest.id}`;

    const items: MenuProps['items'] = [
        {
            key: basePath,
            icon: <AppstoreOutlined />,
            label: t('Posts'),
        },
        {
            key: `${basePath}/chat`,
            icon: <MessageOutlined />,
            label: t('Chat Lobby'),
        },
        {
            key: `${basePath}/teams`,
            icon: <TeamOutlined />,
            label: t('Teams'),
        },
        {
            type: 'divider',
        },
        {
            key: '/',
            icon: <ArrowLeftOutlined />,
            label: t('Switch Interest'),
        },
    ];

    const handleClick: MenuProps['onClick'] = (e) => {
        if (e.key === '/') {
            router.push('/');
        } else {
            router.push(e.key);
        }
    };

    // 依据当前子路由高亮帖子、聊天或队伍入口。
    let selectedKey = basePath;
    if (pathname.includes('/chat')) selectedKey = `${basePath}/chat`;
    if (pathname.includes('/teams')) selectedKey = `${basePath}/teams`;

    return (
        <div className="w-64 flex-shrink-0 hidden md:block">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <h2 className="text-xl font-bold text-gray-800 mb-1">{t(interest.name)}</h2>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{t("Community")}</p>
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
