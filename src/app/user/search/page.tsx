'use client';
import { useLanguage } from '@/lib/language';
import React, { useCallback, useState, useEffect } from 'react';
import { Input, List, Card, Tabs, Avatar, Tag, Button, Spin, Empty, App, Image } from 'antd';
import { UserOutlined, FileTextOutlined, TeamOutlined } from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import PostCard from '@/components/User/PostCard';
import { javaRequest } from '@/lib/java-client';
import type { SearchResults } from '@/types/social';

const { Search } = Input;

/** 将一次搜索结果按帖子、用户和招募队伍分栏展示。 */
const SearchContent = () => {
    const { t } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    const [results, setResults] = useState<SearchResults>({ users: [], posts: [], teams: [] });
    const [loading, setLoading] = useState(false);
    const { message } = App.useApp();

    const addFriend = async (receiverId: string) => {
        try {
            await javaRequest('/friends/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId }),
            });
            message.success(t('Friend request sent'));
        } catch (error) {
            message.error(error instanceof Error ? error.message : t('Failed to send request'));
        }
    };

    const handleSearch = useCallback(async (value: string) => {
        if (!value.trim()) return;
        setLoading(true);
        // 保留关键词在地址栏，便于刷新页面后恢复搜索。
        router.push(`/user/search?q=${encodeURIComponent(value)}`);

        try {
            setResults(await javaRequest<SearchResults>(`/search?q=${encodeURIComponent(value)}`));
        } catch {
            message.error(t('Search failed'));
        } finally {
            setLoading(false);
        }
    }, [message, router, t]);

    useEffect(() => {
        if (initialQuery) {
            handleSearch(initialQuery);
        }
    }, [initialQuery, handleSearch]);

    const items = [
        {
            key: '1',
            label: `${t('Posts')} (${results.posts.length})`,
            icon: <FileTextOutlined />,
            children: (
                <div className="space-y-4">
                    {results.posts.map(post => <PostCard key={post.id} post={post} />)}
                    {results.posts.length === 0 && <Empty description={t("No posts found")} />}
                </div>
            )
        },
        {
            key: '2',
            label: `${t('Users')} (${results.users.length})`,
            icon: <UserOutlined />,
            children: (
                <List
                    grid={{ gutter: 16, column: 2 }}
                    dataSource={results.users}
                    renderItem={(user: SearchResults['users'][number]) => (
                        <List.Item>
                            <Card className="hover:shadow-md transition-shadow">
                                <Card.Meta
                                    avatar={<Avatar src={user.image} size="large" />}
                                    title={user.name}
                                    description={
                                        <div>
                                            <div className="text-xs text-blue-500 mb-1">{user.personalityType}</div>
                                            <div className="truncate text-gray-400" title={user.bio ?? undefined}>{user.bio || t('No bio')}</div>
                                            <Button type="link" size="small" className="p-0 mt-2" onClick={() => addFriend(user.id)}>{t("Add Friend")}</Button>
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
            label: `${t('Teams')} (${results.teams.length})`,
            icon: <TeamOutlined />,
            children: (
                <List
                    grid={{ gutter: 16, column: 2 }}
                    dataSource={results.teams}
                    renderItem={(team: SearchResults['teams'][number]) => (
                        <List.Item>
                            <Card
                                title={team.name}
                                extra={<Tag>{team.type || t('General')}</Tag>}
                                cover={team.image ? (
                                    <Image
                                        src={team.image}
                                        alt={team.name}
                                        width="100%"
                                        height={140}
                                        style={{ objectFit: 'cover' }}
                                    />
                                ) : undefined}
                            >
                                <p className="text-gray-500 truncate">{team.description}</p>
                                <div className="flex justify-between text-xs text-gray-400 mt-4">
                                    <span>{t('Members:')} {team._count.members}</span>
                                    <span>{t('Creator:')} {team.creator.name}</span>
                                </div>
                                <Button className="mt-2 w-full">{t("View Team")}</Button>
                            </Card>
                        </List.Item>
                    )}
                />
            )
        }
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">{t("Search")}</h1>
            <Search
                placeholder={t("Search for people, posts, or teams...")}
                allowClear
                enterButton={t("Search")}
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
