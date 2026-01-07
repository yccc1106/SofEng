'use client';

import React, { useState, useEffect } from 'react';
import { Badge, Typography } from 'antd';
import {
    HomeOutlined,
    MessageOutlined,
    UserOutlined,
    TeamOutlined,
    SearchOutlined
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

const { Text } = Typography;

interface NavItem {
    key: string;
    label: string;
    icon: React.ReactNode;
}

const BottomNavBar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session } = useSession();
    const [notificationCount, setNotificationCount] = useState(0);

    // 获取通知数量
    const fetchNotificationCount = async () => {
        try {
            const res = await fetch('/api/notifications/count');
            const data = await res.json();
            if (data.success) {
                setNotificationCount(data.data || 0);
            }
        } catch (error) {
            console.error('Failed to fetch notification count');
        }
    };

    useEffect(() => {
        if (session) {
            fetchNotificationCount();
        }
    }, [session]);

    const navItems: NavItem[] = [
        {
            key: '/',
            label: 'Home',
            icon: <HomeOutlined />,
        },
        {
            key: '/user/teams',
            label: 'Teams',
            icon: <TeamOutlined />,
        },
        {
            key: '/user/search',
            label: 'Search',
            icon: <SearchOutlined />,
        },
        {
            key: '/user/chat',
            label: 'Messages',
            icon: <MessageOutlined />,
        },
        {
            key: '/user/friends',
            label: 'Friends',
            icon: <Badge count={notificationCount} size="small" offset={[4, -2]}>
                <UserOutlined />
            </Badge>,
        },
    ];

    const isActive = (key: string) => {
        if (key === '/') return pathname === '/';
        return pathname.startsWith(key);
    };

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: '#fff',
                borderTop: '1px solid #f0f0f0',
                zIndex: 100,
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)',
                paddingTop: '8px',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    maxWidth: '480px',
                    margin: '0 auto',
                }}
            >
                {navItems.map((item) => {
                    const active = isActive(item.key);
                    return (
                        <div
                            key={item.key}
                            onClick={() => router.push(item.key)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                cursor: 'pointer',
                                padding: '4px 12px',
                                color: active ? '#1677ff' : '#999',
                                transition: 'color 0.2s',
                            }}
                        >
                            <span style={{ fontSize: 20, marginBottom: 2 }}>
                                {item.icon}
                            </span>
                            <Text
                                style={{
                                    fontSize: 10,
                                    color: active ? '#1677ff' : '#999',
                                }}
                            >
                                {item.label}
                            </Text>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNavBar;
