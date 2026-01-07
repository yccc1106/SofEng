'use client';

import React, { useState, useEffect } from 'react';
import { Card, Avatar, Button, Typography, Tabs, Tag, Spin, App, Descriptions, Grid } from 'antd';
import {
    UserOutlined,
    MessageOutlined,
    UserAddOutlined,
    CheckOutlined,
    CloseOutlined,
    BankOutlined,
    IdcardOutlined,
    BulbOutlined
} from '@ant-design/icons';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

interface UserProfile {
    id: string;
    name: string | null;
    image: string | null;
    bio: string | null;
    school: string | null;
    major: string | null;
    grade: number | null;
    personalityType: string | null;
    personalityTags: string[] | null;
    role: string;
}

interface RelationshipStatus {
    isFriend: boolean;
    isSelf: boolean;
    hasPendingRequest: boolean;
    requestStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    pendingRequestId?: string;
}

const ProfilePage = () => {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const { message } = App.useApp();
    const screens = useBreakpoint();

    const [user, setUser] = useState<UserProfile | null>(null);
    const [relationship, setRelationship] = useState<RelationshipStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const targetId = params.id as string;

    useEffect(() => {
        if (!targetId || !session?.user) return;
        fetchUserData();
    }, [targetId, session]);

    const fetchUserData = async () => {
        setLoading(true);
        try {
            // 获取目标用户信息
            const userRes = await fetch(`/api/users/${targetId}`);
            const userData = await userRes.json();
            if (userData.success) {
                setUser(userData.data);
            }

            // 获取关系状态
            const relRes = await fetch(`/api/friends/check?userId=${targetId}`);
            const relData = await relRes.json();
            if (relData.success) {
                setRelationship(relData.data);
            }
        } catch (error) {
            message.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSendFriendRequest = async () => {
        setActionLoading(true);
        try {
            const res = await fetch('/api/friends/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: targetId, message: 'Add me as a friend!' }),
            });
            const data = await res.json();
            if (data.success) {
                message.success('Friend request sent!');
                fetchUserData(); // 刷新状态
            } else {
                message.error(data.message || 'Failed to send request');
            }
        } catch (error) {
            message.error('Failed to send request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelRequest = async () => {
        if (!relationship?.pendingRequestId) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/friends/requests/${relationship.pendingRequestId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                message.success('Request cancelled');
                fetchUserData();
            } else {
                message.error(data.message || 'Failed to cancel request');
            }
        } catch (error) {
            message.error('Failed to cancel request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveFriend = async () => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/friends/${targetId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                message.success('Friend removed');
                fetchUserData();
            } else {
                message.error(data.message || 'Failed to remove friend');
            }
        } catch (error) {
            message.error('Failed to remove friend');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendMessage = () => {
        router.push(`/user/chat?targetId=${targetId}`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spin size="large" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Text>User not found</Text>
            </div>
        );
    }

    const isSelf = session?.user?.id === targetId;

    return (
        <div className="max-w-4xl mx-auto p-4 pb-20">
            {/* Profile Header */}
            <Card className="mb-4">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <Avatar
                        src={user.image}
                        icon={<UserOutlined />}
                        size={screens.md ? 120 : 80}
                        className="bg-gradient-to-br from-blue-400 to-blue-600"
                    />
                    <div className="flex-1 text-center md:text-left">
                        <Title level={2} className="!mb-1">{user.name || 'Unknown User'}</Title>
                        {user.personalityType && (
                            <Tag color="blue" className="mb-2">{user.personalityType}</Tag>
                        )}
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
                            {user.school && (
                                <Text type="secondary">
                                    <BankOutlined className="mr-1" />
                                    {user.school}
                                </Text>
                            )}
                            {user.major && (
                                <Text type="secondary">
                                    <IdcardOutlined className="mr-1" />
                                    {user.major} {user.grade && `· ${user.grade}级`}
                                </Text>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        {isSelf ? (
                            <Button type="primary" onClick={() => router.push('/user/profile/edit')}>
                                Edit Profile
                            </Button>
                        ) : relationship?.isFriend ? (
                            <>
                                <Button type="primary" icon={<MessageOutlined />} onClick={handleSendMessage}>
                                    Send Message
                                </Button>
                                <Button danger onClick={handleRemoveFriend} loading={actionLoading}>
                                    Remove Friend
                                </Button>
                            </>
                        ) : relationship?.hasPendingRequest ? (
                            <Button onClick={handleCancelRequest} loading={actionLoading}>
                                Cancel Request
                            </Button>
                        ) : (
                            <Button type="primary" icon={<UserAddOutlined />} onClick={handleSendFriendRequest} loading={actionLoading}>
                                Add Friend
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Profile Content */}
            <Tabs
                defaultActiveKey="about"
                items={[
                    {
                        key: 'about',
                        label: 'About',
                        children: (
                            <Card>
                                <Descriptions column={screens.md ? 2 : 1}>
                                    <Descriptions.Item label="School">{user.school || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="Major">{user.major || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="Grade">{user.grade ? `${user.grade}级` : '-'}</Descriptions.Item>
                                    <Descriptions.Item label="MBTI">{user.personalityType || '-'}</Descriptions.Item>
                                </Descriptions>
                                <div className="mt-4">
                                    <Text strong>Bio</Text>
                                    <Paragraph className="mt-2">{user.bio || 'No bio yet'}</Paragraph>
                                </div>
                                {user.personalityTags && user.personalityTags.length > 0 && (
                                    <div className="mt-4">
                                        <Text strong className="mb-2 block">
                                            <BulbOutlined className="mr-1" />
                                            Personality Tags
                                        </Text>
                                        <div className="flex flex-wrap gap-2">
                                            {user.personalityTags.map((tag: string, index: number) => (
                                                <Tag key={index}>{tag}</Tag>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ),
                    },
                    {
                        key: 'posts',
                        label: 'Posts',
                        children: (
                            <Card>
                                <div className="text-center py-10 text-gray-400">
                                    Posts coming soon...
                                </div>
                            </Card>
                        ),
                    },
                ]}
            />
        </div>
    );
};

export default ProfilePage;
