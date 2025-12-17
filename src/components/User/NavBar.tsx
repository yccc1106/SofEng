'use client';
import React from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, App, Input, Flex, Typography, theme, Grid } from 'antd';
import { UserOutlined, LogoutOutlined, BellOutlined, CompassOutlined } from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

const { Header } = Layout;

const NavBar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session } = useSession();
    const { token } = theme.useToken();
    const screens = Grid.useBreakpoint();

    const menuItems = [
        { key: '/user/posts', label: 'Community' },
        { key: '/user/teams', label: 'Teams' },
        { key: '/user/radar', label: 'AI Radar' },
        { key: '/user/chat', label: 'Chat' },
        ...(session?.user?.role === 'ADMIN' ? [{ key: '/dashboard', label: 'Admin Panel' }] : []),
    ];

    const userMenu = {
        items: [
            {
                key: 'profile',
                icon: <UserOutlined />,
                label: <Link href="/user/profile">My Profile</Link>,
            },
            ...(session?.user?.role === 'ADMIN' ? [{
                key: 'dashboard',
                icon: <CompassOutlined />,
                label: <Link href="/dashboard">Admin Dashboard</Link>,
            }, { type: 'divider' }] : []),
            {
                type: 'divider',
            },
            {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: 'Logout',
                onClick: () => signOut({ callbackUrl: '/user/login' }),
            },
        ] as any,
    };

    return (
        <Header
            style={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(8px)',
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                position: 'sticky',
                top: 0,
                zIndex: 50,
                height: 64,
                transition: 'all 0.3s',
            }}
        >
            <Flex align="center" style={{ flex: 1, gap: 32 }}>
                <Typography.Text
                    strong
                    style={{
                        fontSize: 24,
                        color: token.colorPrimary,
                        cursor: 'pointer',
                        flexShrink: 0,
                        userSelect: 'none',
                    }}
                    onClick={() => router.push('/user/posts')}
                >
                    MeetU
                </Typography.Text>

                <Menu
                    mode="horizontal"
                    selectedKeys={[pathname]}
                    items={menuItems}
                    onClick={({ key }) => router.push(key)}
                    style={{
                        backgroundColor: 'transparent',
                        borderBottom: 'none',
                        flex: 1,
                        minWidth: 300,
                        lineHeight: '64px',
                    }}
                />

                {screens.lg && (
                    <div style={{ width: 256 }}>
                        <Input.Search
                            placeholder="Search..."
                            onSearch={value => router.push(`/user/search?q=${encodeURIComponent(value)}`)}
                            variant="borderless"
                            style={{
                                borderRadius: token.borderRadiusLG,
                                backgroundColor: token.colorFillAlter,
                            }}
                        />
                    </div>
                )}
            </Flex>

            <Flex align="center" gap={16} style={{ flexShrink: 0 }}>
                <Button
                    type="text"
                    shape="circle"
                    icon={<BellOutlined style={{ fontSize: 18, color: token.colorTextSecondary }} />}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />

                {session?.user ? (
                    <Dropdown menu={userMenu}>
                        <Flex
                            align="center"
                            style={{
                                cursor: 'pointer',
                                padding: '6px 16px 6px 8px',
                                borderRadius: 999,
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = token.colorFillTertiary}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <Avatar src={session.user.image} icon={<UserOutlined />} size="default" style={{ marginRight: 8, border: `1px solid ${token.colorBorder}` }} />
                            {screens.sm && (
                                <Typography.Text strong style={{ color: token.colorText }}>
                                    {session.user.name || 'User'}
                                </Typography.Text>
                            )}
                        </Flex>
                    </Dropdown>
                ) : (
                    <Button type="primary" shape="round" href="/user/login" style={{ fontWeight: 500 }}>Login</Button>
                )}
            </Flex>
        </Header>
    );
};

export default NavBar;
