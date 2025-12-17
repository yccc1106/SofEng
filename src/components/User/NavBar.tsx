'use client';
import React from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, App, Input } from 'antd';
import { UserOutlined, LogoutOutlined, BellOutlined } from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

const { Header } = Layout;

const NavBar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session } = useSession();

    const menuItems = [
        { key: '/user/posts', label: 'Community' },
        { key: '/user/teams', label: 'Teams' },
        { key: '/user/radar', label: 'AI Radar' },
        { key: '/user/chat', label: 'Chat' },
        { key: '/user/friends', label: 'Friends' },
    ];

    const userMenu = {
        items: [
            {
                key: 'profile',
                icon: <UserOutlined />,
                label: <Link href="/user/profile">My Profile</Link>,
            },
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
        <Header className="bg-white border-b border-gray-100 flex items-center justify-between px-4 sticky top-0 z-50 shadow-sm h-16">
            <div className="flex items-center flex-1">
                <div className="text-xl font-bold text-blue-600 mr-8 cursor-pointer flex-shrink-0" onClick={() => router.push('/user/posts')}>
                    MeetU
                </div>
                <Menu
                    mode="horizontal"
                    selectedKeys={[pathname]}
                    items={menuItems.map(item => ({
                        key: item.key,
                        label: item.label,
                        onClick: () => router.push(item.key),
                    }))}
                    className="border-b-0 min-w-[400px] flex-shrink-0"
                />
                <div className="ml-8 w-64 hidden md:block">
                    <Input.Search
                        placeholder="Search..."
                        onSearch={value => router.push(`/user/search?q=${encodeURIComponent(value)}`)}
                        className="rounded-full"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
                <Button type="text" shape="circle" icon={<BellOutlined />} />

                {session?.user ? (
                    <Dropdown menu={userMenu}>
                        <div className="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-md transition-colors">
                            <Avatar src={session.user.image} icon={<UserOutlined />} className="mr-2" />
                            <span className="font-medium text-gray-700 hidden sm:block">{session.user.name || 'User'}</span>
                        </div>
                    </Dropdown>
                ) : (
                    <Button type="primary" href="/user/login">Login</Button>
                )}
            </div>
        </Header>
    );
};

export default NavBar;
