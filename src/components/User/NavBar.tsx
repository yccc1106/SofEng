'use client';
import { useLanguage } from '@/lib/language';
import React from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Input, Flex, Typography, theme, Grid, Select } from 'antd';
import { UserOutlined, LogoutOutlined, BellOutlined, CompassOutlined } from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import type { MenuProps } from 'antd';

const { Header } = Layout;

const NavBar = () => {
    const { t, language, setLanguage } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, logout } = useAuth();
    const { token } = theme.useToken();
    const screens = Grid.useBreakpoint();

    const menuItems = [
        { key: '/user/posts', label: t('Community') },
        { key: '/user/teams', label: t('Teams') },
        { key: '/user/radar', label: t('Matching Radar') },
        { key: '/user/chat', label: t('Chat') },
        ...(session?.user?.role === 'ADMIN' ? [{ key: '/dashboard', label: t('Admin Panel') }] : []),
    ];

    const userMenu: MenuProps = {
        items: [
            {
                key: 'profile',
                icon: <UserOutlined />,
                label: <Link href="/user/profile">{t("My Profile")}</Link>,
            },
            ...(session?.user?.role === 'ADMIN' ? [{
                key: 'dashboard',
                icon: <CompassOutlined />,
                label: <Link href="/dashboard">{t("Admin Dashboard")}</Link>,
            }, { type: 'divider' as const }] : []),
            {
                type: 'divider' as const,
            },
            {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: t('Logout'),
                onClick: async () => { await logout(); router.replace('/user/login'); },
            },
        ],
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
                            placeholder={t("Search...")}
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
                <Select
                    aria-label="语言 / Language"
                    value={language}
                    onChange={setLanguage}
                    options={[{ value: 'zh-CN', label: '中文' }, { value: 'en-US', label: 'English' }]}
                    style={{ width: 100 }}
                />
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
                                    {session.user.name || t('User')}
                                </Typography.Text>
                            )}
                        </Flex>
                    </Dropdown>
                ) : (
                    <Button type="primary" shape="round" href="/user/login" style={{ fontWeight: 500 }}>{t("Login")}</Button>
                )}
            </Flex>
        </Header>
    );
};

export default NavBar;
