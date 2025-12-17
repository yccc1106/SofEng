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
        // Add Admin Link if role is admin
        ...(session?.user?.role === 'admin' ? [{ key: '/dashboard', label: 'Admin Panel' }] : []),
    ];

    const userMenu = {
        items: [
            {
                key: 'profile',
                icon: <UserOutlined />,
                label: <Link href="/user/profile">My Profile</Link>,
            },
            ...(session?.user?.role === 'admin' ? [{
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
        <Header className="bg-white/80 backdrop-blur-md border-b border-gray-100/50 flex items-center justify-between px-4 sticky top-0 z-50 h-16 transition-all duration-300">
            <div className="flex items-center flex-1 gap-8">
                <div className="text-2xl font-bold tracking-tight text-blue-600 cursor-pointer flex-shrink-0 select-none hover:scale-105 transition-transform" onClick={() => router.push('/user/posts')}>
                    MeetU
                </div>

                {/* Desktop Navigation - Capsule Style */}
                <div className="hidden md:flex items-center bg-gray-100/50 p-1 rounded-full border border-gray-200/50">
                    {menuItems.map((item) => {
                        const isActive = pathname.startsWith(item.key);
                        return (
                            <div
                                key={item.key}
                                onClick={() => router.push(item.key)}
                                className={`
                                    px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all duration-300 select-none
                                    ${isActive
                                        ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}
                                `}
                            >
                                {item.label}
                            </div>
                        );
                    })}
                </div>

                <div className="w-64 hidden lg:block">
                    <Input.Search
                        placeholder="Search..."
                        onSearch={value => router.push(`/user/search?q=${encodeURIComponent(value)}`)}
                        className="rounded-full [&_.ant-input-search-button]:rounded-r-full [&_.ant-input-group-addon]:bg-transparent [&_.ant-input]:rounded-l-full [&_.ant-input]:bg-gray-50 hover:[&_.ant-input]:bg-gray-100 focus:[&_.ant-input]:bg-white transition-all shadow-sm hover:shadow-md"
                        variant="borderless"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
                <Button type="text" shape="circle" icon={<BellOutlined className="text-gray-600 text-lg" />} className="hover:bg-gray-100 flex items-center justify-center w-10 h-10" />

                {session?.user ? (
                    <Dropdown menu={userMenu}>
                        <div className="flex items-center cursor-pointer hover:bg-gray-100/80 pl-2 pr-4 py-1.5 rounded-full transition-all border border-transparent hover:border-gray-200">
                            <Avatar src={session.user.image} icon={<UserOutlined />} size="default" className="mr-2 border border-gray-200 shadow-sm" />
                            <span className="font-medium text-sm text-gray-700 hidden sm:block">{session.user.name || 'User'}</span>
                        </div>
                    </Dropdown>
                ) : (
                    <Button type="primary" shape="round" href="/user/login" className="font-medium px-6 h-9">Login</Button>
                )}
            </div>
        </Header>
    );
};

export default NavBar;
