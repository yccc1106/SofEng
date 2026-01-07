'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Input, List, Card, Tabs, Avatar, Tag, Button, Spin, Empty, App, Modal, Form, message } from 'antd';
import { SearchOutlined, UserOutlined, FileTextOutlined, TeamOutlined, UserAddOutlined, MessageOutlined } from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import PostCard from '@/components/User/PostCard';
import { useSession } from 'next-auth/react';

const { Search } = Input;

interface SearchUser {
    id: string;
    name: string;
    image: string;
    personalityType: string;
    bio: string;
    school: string;
    _count?: {
        friends: number;
    };
}

interface UserRelationship {
    isFriend: boolean;
    isSelf: boolean;
    hasPendingRequest: boolean;
}

const SearchContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const { notification } = App.useApp();

    const initialQuery = searchParams.get('q') || '';

    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<{ users: SearchUser[], posts: any[], teams: any[] }>({ users: [], posts: [], teams: [] });
    const [loading, setLoading] = useState(false);
    const [relationships, setRelationships] = useState<Record<string, UserRelationship>>({});
    const [friendRequestModal, setFriendRequestModal] = useState<{ open: boolean; userId: string; userName: string } | null>(null);
    const [form] = Form.useForm();

    const handleSearch = async (value: string) => {
        if (!value.trim()) return;
        setLoading(true);
        router.push(`/user/search?q=${encodeURIComponent(value)}`);

        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
            const data = await res.json();
            if (data.success) {
                setResults(data.data);
                // 检查每个用户的关系状态
                if (data.data.users?.length > 0 && session?.user) {
                    await checkRelationships(data.data.users);
                }
            }
        } catch (error) {
            notification.error({ message: 'Search failed' });
        } finally {
            setLoading(false);
        }
    };

    const checkRelationships = async (users: SearchUser[]) => {
        try {
            const userIds = users.map(u => u.id).join(',');
            const res = await fetch(`/api/friends/batch-check?userIds=${userIds}`);
            const data = await res.json();
            if (data.success) {
                setRelationships(data.data || {});
            }
        } catch (error) {
            console.error('Failed to check relationships');
        }
    };

    useEffect(() => {
        if (initialQuery) {
            handleSearch(initialQuery);
        }
    }, [initialQuery]);

    const handleSendFriendRequest = async (values: { message: string }) => {
        if (!friendRequestModal) return;

        try {
            const res = await fetch('/api/friends/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiverId: friendRequestModal.userId,
                    message: values.message
                }),
            });
            const data = await res.json();
            if (data.success) {
                notification.success({ message: 'Friend request sent!' });
                setFriendRequestModal(null);
                form.resetFields();
                // 更新关系状态
                setRelationships(prev => ({
                    ...prev,
                    [friendRequestModal.userId]: {
                        ...prev[friendRequestModal.userId],
                        hasPendingRequest: true
                    }
                }));
            } else {
                notification.error({ message: data.message || 'Failed to send request' });
            }
        } catch (error) {
            notification.error({ message: 'Failed to send request' });
        }
    };

    const handleViewProfile = (userId: string) => {
        router.push(`/user/profile/${userId}`);
    };

    const renderUserCard = (user: SearchUser) => {
        const rel = relationships[user.id] || { isFriend: false, isSelf: false, hasPendingRequest: false };
        const isSelf = rel.isSelf;

        return (
            <List.Item>
                <Card className="hover:shadow-md transition-shadow w-full" hoverable onClick={() => handleViewProfile(user.id)}>
                    <div className="flex items-start gap-4">
                        <Avatar src={user.image} size={64} icon={<UserOutlined />} className="bg-gradient-to-br from-blue-400 to-blue-600" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-lg font-semibold">{user.name}</span>
                                    {user.personalityType && (
                                        <Tag color="blue" className="ml-2">{user.personalityType}</Tag>
                                    )}
                                </div>
                            </div>
                            {user.school && (
                                <div className="text-sm text-gray-500 mt-1">{user.school}</div>
                            )}
                            <div className="text-sm text-gray-400 truncate mt-1" title={user.bio}>
                                {user.bio || 'No bio'}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        {isSelf ? (
                            <Button onClick={(e) => { e.stopPropagation(); router.push('/user/profile'); }}>
                                View My Profile
                            </Button>
                        ) : rel.isFriend ? (
                            <Button type="primary" icon={<MessageOutlined />} onClick={(e) => { e.stopPropagation(); router.push(`/user/chat?targetId=${user.id}`); }}>
                                Send Message
                            </Button>
                        ) : rel.hasPendingRequest ? (
                            <Button onClick={(e) => { e.stopPropagation(); }}>
                                Request Pending
                            </Button>
                        ) : (
                            <Button type="primary" icon={<UserAddOutlined />} onClick={(e) => {
                                e.stopPropagation();
                                setFriendRequestModal({ open: true, userId: user.id, userName: user.name });
                            }}>
                                Add Friend
                            </Button>
                        )}
                    </div>
                </Card>
            </List.Item>
        );
    };

    const items = [
        {
            key: '1',
            label: `Posts (${results.posts.length})`,
            icon: <FileTextOutlined />,
            children: (
                <div className="space-y-4">
                    {results.posts.map(post => <PostCard key={post.id} post={post} />)}
                    {results.posts.length === 0 && <Empty description="No posts found" />}
                </div>
            )
        },
        {
            key: '2',
            label: `Users (${results.users.length})`,
            icon: <UserOutlined />,
            children: (
                <List
                    grid={{ gutter: 16, column: 1 }}
                    dataSource={results.users}
                    renderItem={renderUserCard}
                />
            )
        },
        {
            key: '3',
            label: `Teams (${results.teams.length})`,
            icon: <TeamOutlined />,
            children: (
                <List
                    grid={{ gutter: 16, column: 2 }}
                    dataSource={results.teams}
                    renderItem={(team: any) => (
                        <List.Item>
                            <Card className="hover:shadow-md transition-shadow" hoverable onClick={() => router.push(`/user/teams/${team.id}`)}>
                                <Card.Meta
                                    avatar={<Avatar src={team.image} size="large" icon={<TeamOutlined />} className="bg-gradient-to-br from-green-400 to-green-600" />}
                                    title={
                                        <div className="flex items-center gap-2">
                                            {team.name}
                                            <Tag>{team.type || 'General'}</Tag>
                                        </div>
                                    }
                                    description={
                                        <div>
                                            <div className="truncate text-gray-500" title={team.description}>{team.description}</div>
                                            <div className="flex justify-between text-xs text-gray-400 mt-2">
                                                <span>Members: {team._count?.members || 0}</span>
                                            </div>
                                        </div>
                                    }
                                />
                                <Button className="mt-2 w-full" onClick={(e) => { e.stopPropagation(); router.push(`/user/teams/${team.id}`); }}>
                                    View Team
                                </Button>
                            </Card>
                        </List.Item>
                    )}
                />
            )
        }
    ];

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <h1 className="text-2xl font-bold mb-6">Search</h1>
            <Search
                placeholder="Search for people, posts, or teams..."
                allowClear
                enterButton="Search"
                size="large"
                onSearch={handleSearch}
                defaultValue={initialQuery}
                className="mb-6"
            />

            {loading ? <div className="text-center py-10"><Spin size="large" /></div> : (
                <Tabs defaultActiveKey="2" items={items} />
            )}

            {/* Friend Request Modal */}
            <Modal
                title={`Add ${friendRequestModal?.userName || ''} as friend`}
                open={!!friendRequestModal?.open}
                onCancel={() => {
                    setFriendRequestModal(null);
                    form.resetFields();
                }}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleSendFriendRequest}>
                    <Form.Item
                        name="message"
                        label="Add a message (optional)"
                    >
                        <Input.TextArea rows={3} placeholder="Hi! I'd like to connect with you..." />
                    </Form.Item>
                    <Form.Item className="!mb-0 text-right">
                        <Button onClick={() => {
                            setFriendRequestModal(null);
                            form.resetFields();
                        }} className="mr-2">
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit">
                            Send Request
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

const SearchPage = () => {
    return (
        <React.Suspense fallback={<div className="flex justify-center py-20"><Spin size="large" /></div>}>
            <SearchContent />
        </React.Suspense>
    );
};

export default SearchPage;
