'use client';
import React, { useEffect, useState } from 'react';
import { Tabs, List, Avatar, Button, App, Spin, Badge } from 'antd';
import { UserAddOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';

const FriendsPage = () => {
    const { message } = App.useApp();
    const { data: session } = useSession();
    const [friends, setFriends] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [friendsRes, requestsRes] = await Promise.all([
                fetch('/api/friends'),
                fetch('/api/friends/requests?type=received')
            ]);

            const friendsData = await friendsRes.json();
            const requestsData = await requestsRes.json();

            if (friendsData.success) setFriends(friendsData.data);
            if (requestsData.success) setRequests(requestsData.data);

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
            const res = await fetch(`/api/friends/requests/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            const data = await res.json();
            if (data.success) {
                message.success(`Request ${action.toLowerCase()}ed`);
                fetchData();
            } else {
                message.error('Operation failed');
            }
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
