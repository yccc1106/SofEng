'use client';

import { Dropdown, Spin } from 'antd';
import { LogoutOutlined, UserOutlined, DashboardOutlined, MessageOutlined, SafetyOutlined, TagsOutlined } from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import BottomNavBar from './BottomNavBar';

const ProLayout = dynamic(
    () => import('@ant-design/pro-components').then((mod) => mod.ProLayout),
    {
        ssr: false,
        loading: () => (
            <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Spin size="large" />
            </div>
        )
    }
);

// 需要显示底部导航的页面
const bottomNavRoutes = [
    '/user/teams',
    '/user/chat',
    '/user/friends',
    '/user/search',
];

export default function BasicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname() || '';
    const [isMobile, setIsMobile] = useState(false);

    // 检测屏幕尺寸
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // If user route (except login potentially, but generally all user routes), bypass Admin Layout
    const isUserRoute =
        pathname === '/' ||
        pathname?.startsWith('/user') ||
        (pathname?.startsWith('/interest') && !pathname?.startsWith('/interest/manage'));

    // 检查是否应该显示底部导航（只在移动端）
    const showBottomNav = isMobile && isUserRoute && bottomNavRoutes.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    );

    if (isUserRoute) {
        return (
            <div className="min-h-screen bg-gray-50" style={{ paddingBottom: showBottomNav ? '60px' : 0 }}>
                {children}
                {showBottomNav && <BottomNavBar />}
            </div>
        );
    }

    return (
        <ProLayout
            title="Admin Console"
            logo={null} // Minimalist: specific logo or just text. Let's use text title as primary.
            location={{
                pathname,
            }}
            layout="mix"
            siderWidth={240}
            defaultCollapsed={false}
            breakpoint="xl"

            // Minimalist tokens for ProLayout
            token={{
                header: {
                    heightLayoutHeader: 56,
                    colorBgHeader: 'rgba(255,255,255,0.8)', // Glass effect base
                },
                sider: {
                    colorMenuBackground: '#F9FAFB', // Match surface
                    colorBgMenuItemSelected: 'rgba(24, 119, 242, 0.08)',
                    colorTextMenuSelected: '#1877F2',
                },
                pageContainer: {
                    paddingBlockPageContainerContent: 24,
                    paddingInlinePageContainerContent: 40,
                }
            }}

            // Custom Header Render for Glass effect
            headerContentRender={() => <div className="text-sm text-gray-500">Welcome back</div>}

            splitMenus={false}
            menuItemRender={(item, dom) => (
                <Link href={item.path || '/'} className="flex items-center gap-2">
                    {dom}
                </Link>
            )}
            route={{
                routes: [
                    {
                        path: '/dashboard',
                        name: 'Overview', // Simpler name
                        icon: <DashboardOutlined />,
                    },
                    {
                        path: '/user-management',
                        name: '用户管理',
                        icon: <UserOutlined />,
                        routes: [
                            {
                                path: '/user-management/list',
                                name: '用户列表',
                            },
                            {
                                path: '/user-management/verification',
                                name: '学信认证',
                            },
                        ],
                    },
                    {
                        path: '/feedback',
                        name: 'Feedback',
                        icon: <MessageOutlined />,
                        routes: [
                            {
                                path: '/feedback/suggestions',
                                name: 'Suggestions',
                            },
                            {
                                path: '/feedback/reports',
                                name: 'Reports',
                            },
                        ],
                    },
                    {
                        path: '/moderation',
                        name: 'Moderation',
                        icon: <SafetyOutlined />,
                        routes: [
                            {
                                path: '/moderation/chat',
                                name: 'Chat',
                            },
                            {
                                path: '/moderation/post',
                                name: 'Posts',
                            },
                            {
                                path: '/moderation/room',
                                name: 'Rooms',
                            },
                        ],
                    },
                    {
                        path: '/interest',
                        name: 'Interests',
                        icon: <TagsOutlined />,
                        routes: [
                            {
                                path: '/interest/manage',
                                name: 'Management',
                            },
                        ],
                    },
                ],
            }}
            avatarProps={{
                src: 'https://gw.alipayobjects.com/zos/antfincdn/efFD%24IOql2/weixintupian_20170331104822.jpg',
                size: 'small',
                title: 'Admin',
                render: (props, dom) => {
                    return (
                        <Dropdown
                            menu={{
                                items: [
                                    {
                                        key: 'logout',
                                        icon: <LogoutOutlined />,
                                        label: 'Sign Out',
                                    },
                                ],
                            }}
                        >
                            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 px-2 rounded transition-colors">
                                {dom}
                            </div>
                        </Dropdown>
                    );
                },
            }}
        >
            <div className="h-full w-full overflow-auto px-4 py-4">
                {children}
            </div>
        </ProLayout>
    );
}
