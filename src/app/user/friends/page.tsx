'use client';
import { useLanguage } from '@/lib/language';
import { useCallback, useEffect, useState } from 'react';
import { Tabs, List, Avatar, Button, App, Spin, Badge } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/auth-context';
import { javaAction, javaRequest } from '@/lib/java-client';

type Friend = { id: string; name: string; image: string | null; school: string | null };
type FriendRequest = { id: string; message: string | null; sender: Friend };

/** 展示已建立的好友关系及待处理申请，审批后刷新两类列表。 */
const FriendsPage = () => {
    const { t } = useLanguage();
    const { message } = App.useApp();
    const { data: session } = useAuth();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [friendsData, requestsData] = await Promise.all([
                javaRequest<Friend[]>('/friends'),
                javaRequest<FriendRequest[]>('/friends/requests?type=received')
            ]);
            setFriends(friendsData);
            setRequests(requestsData);

        } catch {
            message.error(t('Failed to load data'));
        } finally {
            setLoading(false);
        }
    }, [message, t]);

    useEffect(() => {
        if (session) void fetchData();
    }, [session, fetchData]);

    const handleRequestAction = async (id: string, action: 'ACCEPT' | 'REJECT') => {
        try {
            await javaAction(`/friends/requests/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            message.success(action === 'ACCEPT' ? t('Request accepted') : t('Request rejected'));
            void fetchData();
        } catch {
            message.error('Error');
        }
    };

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <h1 className="text-xl font-bold mb-4 px-2">{t("Friends")}</h1>

            {loading ? <Spin className="flex justify-center mt-10" /> : (
                <Tabs defaultActiveKey="friends" items={[
                    {
                        key: 'friends',
                        label: t('My Friends'),
                        children: (
                            <List
                                dataSource={friends}
                                renderItem={(item: Friend) => (
                                    <List.Item className="bg-white p-4 mb-2 rounded-lg shadow-sm">
                                        <List.Item.Meta
                                            avatar={<Avatar src={item.image} />}
                                            title={item.name}
                                            description={item.school || t('No school info')}
                                        />
                                        <Button href={`/user/chat?targetId=${item.id}`}>{t("Chat")}</Button>
                                    </List.Item>
                                )}
                            />
                        )
                    },
                    {
                        key: 'requests',
                        label: <Badge count={requests.length} offset={[10, 0]}>{t("Requests")}</Badge>,
                        children: (
                            <List
                                dataSource={requests}
                                renderItem={(item: FriendRequest) => (
                                    <List.Item className="bg-white p-4 mb-2 rounded-lg shadow-sm"
                                        actions={[
                                            <Button key="accept" type="primary" shape="circle" icon={<CheckOutlined />} onClick={() => handleRequestAction(item.id, 'ACCEPT')} />,
                                            <Button key="reject" danger shape="circle" icon={<CloseOutlined />} onClick={() => handleRequestAction(item.id, 'REJECT')} />
                                        ]}
                                    >
                                        <List.Item.Meta
                                            avatar={<Avatar src={item.sender.image} />}
                                            title={item.sender.name}
                                            description={item.message || t('Wants to be your friend')}
                                        />
                                    </List.Item>
                                )}
                            />
                        )
                    }
                ]} />
            )}
        </div>
    );
};

export default FriendsPage;
