'use client';

import React, { useState, useEffect } from 'react';
import { List, Avatar, Typography, Tabs, Spin, Empty, Badge, Button } from 'antd';
import { UserOutlined, TeamOutlined, HeartOutlined, MessageOutlined, BellOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const { Title, Text } = Typography;

interface Notification {
    id: string;
    type: 'FRIEND_REQUEST' | 'TEAM_REQUEST' | 'LIKE' | 'COMMENT' | 'MESSAGE';
    title: string;
    message: string;
    link: string;
    isRead: boolean;
    createdAt: string;
    sender?: {
        id: string;
        name: string;
        image: string | null;
    };
}

const NotificationsPage = () => {
    const router = useRouter();
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            if (data.success) {
                setNotifications(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session) {
            fetchNotifications();
        }
    }, [session]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'FRIEND_REQUEST':
                return <UserOutlined className="text-blue-500" />;
            case 'TEAM_REQUEST':
                return <TeamOutlined className="text-green-500" />;
            case 'LIKE':
                return <HeartOutlined className="text-red-500" />;
            case 'COMMENT':
                return <MessageOutlined className="text-orange-500" />;
            default:
                return <BellOutlined className="text-gray-500" />;
        }
    };

    const groupNotifications = () => {
        const groups: Record<string, Notification[]> = {
            all: notifications,
            friend: notifications.filter(n => n.type === 'FRIEND_REQUEST'),
            team: notifications.filter(n => n.type === 'TEAM_REQUEST'),
            interaction: notifications.filter(n => ['LIKE', 'COMMENT'].includes(n.type)),
        };
        return groups;
    };

    const groups = groupNotifications();

    return (
        <div className="max-w-2xl mx-auto p-4 pb-20">
            <div className="flex items-center justify-between mb-6">
                <Title level={2} className="!mb-0">Notifications</Title>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Spin size="large" /></div>
            ) : notifications.length === 0 ? (
                <Empty description="No notifications yet" />
            ) : (
                <Tabs
                    defaultActiveKey="all"
                    items={[
                        {
                            key: 'all',
                            label: `All (${groups.all.length})`,
                            children: (
                                <List
                                    dataSource={groups.all}
                                    renderItem={(item) => (
                                        <List.Item
                                            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!item.isRead ? 'bg-blue-50/50' : ''}`}
                                            onClick={() => router.push(item.link)}
                                        >
                                            <List.Item.Meta
                                                avatar={
                                                    <Badge dot={!item.isRead} offset={[-4, 4]}>
                                                        <Avatar
                                                            src={item.sender?.image}
                                                            icon={getIcon(item.type)}
                                                            size="large"
                                                        />
                                                    </Badge>
                                                }
                                                title={
                                                    <div className="flex items-center gap-2">
                                                        <Text strong>{item.title}</Text>
                                                    </div>
                                                }
                                                description={
                                                    <div>
                                                        <Text type="secondary">{item.message}</Text>
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            {new Date(item.createdAt).toLocaleString()}
                                                        </div>
                                                    </div>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            )
                        },
                        {
                            key: 'friend',
                            label: (
                                <span>
                                    <UserOutlined /> Friends ({groups.friend.length})
                                </span>
                            ),
                            children: (
                                <List
                                    dataSource={groups.friend}
                                    renderItem={(item) => (
                                        <List.Item
                                            className={`p-4 hover:bg-gray-50 cursor-pointer ${!item.isRead ? 'bg-blue-50/50' : ''}`}
                                            onClick={() => router.push(item.link)}
                                        >
                                            <List.Item.Meta
                                                avatar={<Avatar src={item.sender?.image} icon={<UserOutlined />} />}
                                                title={item.title}
                                                description={item.message}
                                            />
                                        </List.Item>
                                    )}
                                    locale={{ emptyText: <Empty description="No friend requests" /> }}
                                />
                            )
                        },
                        {
                            key: 'team',
                            label: (
                                <span>
                                    <TeamOutlined /> Teams ({groups.team.length})
                                </span>
                            ),
                            children: (
                                <List
                                    dataSource={groups.team}
                                    renderItem={(item) => (
                                        <List.Item
                                            className={`p-4 hover:bg-gray-50 cursor-pointer ${!item.isRead ? 'bg-blue-50/50' : ''}`}
                                            onClick={() => router.push(item.link)}
                                        >
                                            <List.Item.Meta
                                                avatar={<Avatar src={item.sender?.image} icon={<TeamOutlined />} />}
                                                title={item.title}
                                                description={item.message}
                                            />
                                        </List.Item>
                                    )}
                                    locale={{ emptyText: <Empty description="No team requests" /> }}
                                />
                            )
                        }
                    ]}
                />
            )}
        </div>
    );
};

export default NotificationsPage;
