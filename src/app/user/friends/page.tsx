'use client';
import React, { useEffect, useState } from 'react';
import { Tabs, List, Avatar, Button, App, Spin, Badge } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { javaAction, javaRequest } from '@/lib/java-client';

const FriendsPage = () => {
    const { message } = App.useApp();
    const { data: session } = useSession();
    const [friends, setFriends] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [friendsData, requestsData] = await Promise.all([
                javaRequest<any[]>('/friends'),
                javaRequest<any[]>('/friends/requests?type=received')
            ]);
            setFriends(friendsData);
            setRequests(requestsData);

        } catch (error) {
            message.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session) fetchData();
    }, [session]);

    const handleRequestAction = async (id: string, action: 'ACCEPT' | 'REJECT') => {
        try {
            await javaAction(`/friends/requests/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            message.success(action === 'ACCEPT' ? 'Request accepted' : 'Request rejected');
            fetchData();
        } catch (error) {
            message.error('Error');
        }
    };

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <h1 className="text-xl font-bold mb-4 px-2">Friends</h1>

            {loading ? <Spin className="flex justify-center mt-10" /> : (
                <Tabs defaultActiveKey="friends" items={[
                    {
                        key: 'friends',
                        label: 'My Friends',
                        children: (
                            <List
                                dataSource={friends}
                                renderItem={(item: any) => (
                                    <List.Item className="bg-white p-4 mb-2 rounded-lg shadow-sm">
                                        <List.Item.Meta
                                            avatar={<Avatar src={item.image} />}
                                            title={item.name}
                                            description={item.school || 'No school info'}
                                        />
                                        <Button href={`/user/chat?targetId=${item.id}`}>Chat</Button>
                                    </List.Item>
                                )}
                            />
                        )
                    },
                    {
                        key: 'requests',
                        label: <Badge count={requests.length} offset={[10, 0]}>Requests</Badge>,
                        children: (
                            <List
                                dataSource={requests}
                                renderItem={(item: any) => (
                                    <List.Item className="bg-white p-4 mb-2 rounded-lg shadow-sm"
                                        actions={[
                                            <Button key="accept" type="primary" shape="circle" icon={<CheckOutlined />} onClick={() => handleRequestAction(item.id, 'ACCEPT')} />,
                                            <Button key="reject" danger shape="circle" icon={<CloseOutlined />} onClick={() => handleRequestAction(item.id, 'REJECT')} />
                                        ]}
                                    >
                                        <List.Item.Meta
                                            avatar={<Avatar src={item.sender.image} />}
                                            title={item.sender.name}
                                            description={item.message || 'Wants to be your friend'}
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
