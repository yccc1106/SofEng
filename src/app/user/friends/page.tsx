'use client';
import { useLanguage } from '@/lib/language';
import { useCallback, useEffect, useState } from 'react';
import { Tabs, List, Avatar, Button, App, Spin, Badge, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { CheckOutlined, CloseOutlined, DownOutlined, ExportOutlined, MessageOutlined, PhoneOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/auth-context';
import { javaAction, javaRequest } from '@/lib/java-client';
import { useRouter } from 'next/navigation';
import { CallModal } from '@/components/Call/CallModal';

type Friend = { id: string; name: string; image: string | null; school: string | null };
type FriendRequest = { id: string; message: string | null; sender: Friend };

/** 展示已建立的好友关系及待处理申请，审批后刷新两类列表。 */
const FriendsPage = () => {
    const { t } = useLanguage();
    const { message } = App.useApp();
    const { data: session } = useAuth();
    const router = useRouter();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [callModalOpen, setCallModalOpen] = useState(false);

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

    const handleFriendMenu = (friend: Friend, key: string) => {
        if (key === 'chat') {
            router.push(`/user/chat?targetId=${friend.id}`);
        } else if (key === 'chat-window') {
            window.open(
                `/user/chat?targetId=${friend.id}`,
                '_blank',
                'noopener,noreferrer,width=1280,height=860',
            );
        } else if (key === 'call') {
            setSelectedFriend(friend);
            setCallModalOpen(true);
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
                                renderItem={(item: Friend) => {
                                    const friendMenu: MenuProps = {
                                        items: [
                                            { key: 'chat', icon: <MessageOutlined />, label: t('Open Conversation') },
                                            { key: 'chat-window', icon: <ExportOutlined />, label: t('Open in New Window') },
                                            { key: 'call', icon: <PhoneOutlined />, label: t('Voice / Video Call') },
                                        ],
                                        onClick: ({ key }) => handleFriendMenu(item, key),
                                    };

                                    return (
                                        <List.Item className="bg-white p-4 mb-2 rounded-lg shadow-sm">
                                            <div className="flex w-full items-center gap-4">
                                                <div className="flex flex-col items-center gap-1">
                                                    <Avatar src={item.image} size={48}>{item.name?.slice(0, 1)}</Avatar>
                                                    <Dropdown menu={friendMenu} trigger={['click']}>
                                                        <Button size="small" type="text" icon={<DownOutlined />}>
                                                            {t('Actions')}
                                                        </Button>
                                                    </Dropdown>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate font-medium text-slate-800">{item.name}</div>
                                                    <div className="truncate text-xs text-gray-500">
                                                        {item.school || t('No school info')}
                                                    </div>
                                                </div>
                                                <Button href={`/user/chat?targetId=${item.id}`}>{t("Chat")}</Button>
                                            </div>
                                        </List.Item>
                                    );
                                }}
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

            <CallModal
                open={callModalOpen}
                contact={selectedFriend}
                onClose={() => setCallModalOpen(false)}
            />
        </div>
    );
};

export default FriendsPage;
