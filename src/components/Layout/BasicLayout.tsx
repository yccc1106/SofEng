'use client';
// import { ProLayout } from '@ant-design/pro-components'; // Removed
import { Dropdown, Spin } from 'antd';
import { LogoutOutlined, UserOutlined, DashboardOutlined, MessageOutlined, SafetyOutlined, TagsOutlined } from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import React from 'react';
import dynamic from 'next/dynamic';

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

export default function BasicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <ProLayout
            title="Next.js Admin"
            logo="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg"
            location={{
                pathname,
            }}
            layout="mix"
            splitMenus={false}
            menuItemRender={(item, dom) => (
                <Link href={item.path || '/'}>{dom}</Link>
            )}
            route={{
                routes: [
                    {
                        path: '/dashboard',
                        name: '数据统计及可视化',
                        icon: <DashboardOutlined />,
                    },
                    {
                        path: '/feedback',
                        name: '用户反馈处理',
                        icon: <MessageOutlined />,
                        routes: [
                            {
                                path: '/feedback/suggestions',
                                name: '用户建议处理',
                            },
                            {
                                path: '/feedback/reports',
                                name: '用户举报处理',
                            },
                        ],
                    },
                    {
                        path: '/moderation',
                        name: '内容审核',
                        icon: <SafetyOutlined />,
                        routes: [
                            {
                                path: '/moderation/chat',
                                name: '聊天内容审核',
                            },
                            {
                                path: '/moderation/post',
                                name: '帖子内容审核',
                            },
                            {
                                path: '/moderation/room',
                                name: '房间规范审核',
                            },
                        ],
                    },
                    {
                        path: '/interest',
                        name: '兴趣分类管理',
                        icon: <TagsOutlined />,
                        routes: [
                            {
                                path: '/interest/manage',
                                name: '增删改模块',
                            },
                        ],
                    },
                ],
            }}
            avatarProps={{
                src: 'https://gw.alipayobjects.com/zos/antfincdn/efFD%24IOql2/weixintupian_20170331104822.jpg',
                title: 'Admin User',
                render: (props, dom) => {
                    return (
                        <Dropdown
                            menu={{
                                items: [
                                    {
                                        key: 'logout',
                                        icon: <LogoutOutlined />,
                                        label: '退出登录',
                                    },
                                ],
                            }}
                        >
                            {dom}
                        </Dropdown>
                    );
                },
            }}
        >
            <div style={{ height: '100vh', overflow: 'auto' }}>
                {children}
            </div>
        </ProLayout>
    );
}
