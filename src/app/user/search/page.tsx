'use client';
import React, { useState, useEffect } from 'react';
import { Input, List, Card, Tabs, Avatar, Tag, Button, Spin, Empty, App } from 'antd';
import { SearchOutlined, UserOutlined, FileTextOutlined, TeamOutlined } from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import PostCard from '@/components/User/PostCard';

const { Search } = Input;

const SearchContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<{ users: any[], posts: any[], teams: any[] }>({ users: [], posts: [], teams: [] });
    const [loading, setLoading] = useState(false);
    const { message } = App.useApp();

    const handleSearch = async (value: string) => {
        if (!value.trim()) return;
        setLoading(true);
        // Update URL
        router.push(`/user/search?q=${encodeURIComponent(value)}`);

        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
            const data = await res.json();
            if (data.success) {
                setResults(data.data);
            }
        } catch (error) {
            message.error('Search failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (initialQuery) {
            handleSearch(initialQuery);
        }
    }, [initialQuery]);

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
                    grid={{ gutter: 16, column: 2 }}
                    dataSource={results.users}
                    renderItem={(user: any) => (
                        <List.Item>
                            <Card className="hover:shadow-md transition-shadow">
                                <Card.Meta
                                    avatar={<Avatar src={user.image} size="large" />}
                                    title={user.name}
                                    description={
                                        <div>
                                            <div className="text-xs text-blue-500 mb-1">{user.personalityType}</div>
                                            <div className="truncate text-gray-400" title={user.bio}>{user.bio || 'No bio'}</div>
                                            <Button type="link" size="small" className="p-0 mt-2" href={`/user/chat?targetId=${user.id}`}>Message</Button>
                                        </div>
                                    }
                                />
                            </Card>
                        </List.Item>
                    )}
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
                            <Card title={team.name} extra={<Tag>{team.type || 'General'}</Tag>}>
                                <p className="text-gray-500 truncate">{team.description}</p>
                                <div className="flex justify-between text-xs text-gray-400 mt-4">
                                    <span>Members: {team._count.members}</span>
                                    <span>Creator: {team.creator.name}</span>
                                </div>
                                <Button className="mt-2 w-full">View Team</Button>
                            </Card>
                        </List.Item>
                    )}
                />
            )
        }
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Search</h1>
            <Search
                placeholder="Search for people, posts, or teams..."
                allowClear
                enterButton="Search"
                size="large"
                onSearch={handleSearch}
                defaultValue={initialQuery}
                className="mb-8"
            />

            {loading ? <div className="text-center py-10"><Spin size="large" /></div> : (
                <Tabs defaultActiveKey="1" items={items} />
            )}
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
