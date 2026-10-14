'use client';
import { HomeOutlined, TeamOutlined, UserOutlined, MessageOutlined, CompassOutlined } from '@ant-design/icons';
import { Flex, theme } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';
import { useLanguage } from '@/lib/language';

const TabBar = () => {
    const { t } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const { token } = theme.useToken();

    if (pathname.startsWith('/user/login')) return null;

    const tabs = [
        { key: '/user/posts', icon: <HomeOutlined />, label: t('Home') },
        { key: '/user/teams', icon: <TeamOutlined />, label: t('Teams') },
        { key: '/user/radar', icon: <CompassOutlined />, label: t('Radar') },
        { key: '/user/chat', icon: <MessageOutlined />, label: t('Messages') },
        { key: '/user/profile', icon: <UserOutlined />, label: t('Me') },
    ];

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 0,
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                borderTop: `1px solid ${token.colorBorderSecondary}`,
                display: 'flex',
                justifyContent: 'space-around',
                paddingTop: 8,
                paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
                zIndex: 50,
                boxShadow: '0 -4px 20px rgba(0,0,0,0.02)',
            }}
        >
            {tabs.map((tab) => {
                const isActive = pathname.startsWith(tab.key);
                const color = isActive ? token.colorPrimary : token.colorTextTertiary;
                return (
                    <Flex
                        key={tab.key}
                        vertical
                        align="center"
                        style={{
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            userSelect: 'none',
                            padding: '4px 8px',
                            color: color,
                            transform: isActive ? 'scale(1)' : 'scale(1)', // Just to keep transition property valid if needed, or remove transform
                        }}
                        onClick={() => router.push(tab.key)}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <span style={{ fontSize: 24, marginBottom: 4, transition: 'color 0.2s', filter: isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' : 'none' }}>{tab.icon}</span>
                        <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.02em' }}>{tab.label}</span>
                    </Flex>
                );
            })}
        </div>
    );
};

export default TabBar;
