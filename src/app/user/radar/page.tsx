'use client';
import React, { useEffect, useState } from 'react';
import { Card, Avatar, Button, Spin, Typography, App, Tag } from 'antd';
import { RadarChartOutlined, UserAddOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import './radar.css'; // Will create this css file for animation

const { Title, Paragraph } = Typography;

const RadarPage = () => {
    const { message } = App.useApp();
    const { data: session } = useSession();
    const [matches, setMatches] = useState<any[]>([]);
    const [scanning, setScanning] = useState(true);

    const startScan = async () => {
        setScanning(true);
        setMatches([]);

        try {
            // Simulate scanning delay for effect
            await new Promise(resolve => setTimeout(resolve, 2000));

            const res = await fetch('/api/radar');
            const data = await res.json();
            if (data.success) {
                setMatches(data.data);
            } else {
                message.error('Radar failed');
            }
        } catch (error) {
            message.error('Radar error');
        } finally {
            setScanning(false);
        }
    };

    useEffect(() => {
        startScan();
    }, []);

    const handleAddFriend = async (userId: string) => {
        try {
            const res = await fetch('/api/friends/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: userId, message: 'Found you via AI Radar!' }),
            });
            const data = await res.json();
            if (data.success) {
                message.success('Friend request sent!');
            } else {
                message.error(data.message);
            }
        } catch (error) {
            message.error('Error sending request');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 pb-20 overflow-hidden relative">
            <h1 className="text-xl font-bold mb-4 text-center text-blue-400">AI Radar</h1>

            {scanning ? (
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <div className="radar-scanner relative w-64 h-64 border-4 border-green-500 rounded-full flex items-center justify-center shadow-[0_0_20px_#0f0]">
                        <div className="w-full h-1 bg-green-500 absolute top-1/2 left-0 animate-scan origin-center"></div>
                        <RadarChartOutlined className="text-6xl text-green-400 opacity-80" />
                    </div>
                    <p className="mt-8 text-green-400 animate-pulse text-lg">Scanning for soulmates...</p>
                </div>
            ) : (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-400">Found {matches.length} matches near you</span>
                        <Button type="primary" ghost size="small" onClick={startScan}>Rescan</Button>
                    </div>

                    {matches.map((user, index) => (
                        <Card
                            key={user.id}
                            className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-colors"
                            styles={{ body: { padding: '16px' } }}
                        >
                            <div className="flex items-center">
                                <Avatar size={64} src={user.image} className="mr-4 border-2 border-blue-400" />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-white m-0">{user.name}</h3>
                                            <div className="text-blue-300 text-sm mb-1">{user.personalityType} · {user.score}% Match</div>
                                        </div>
                                        <Button
                                            type="primary"
                                            shape="circle"
                                            icon={<UserAddOutlined />}
                                            onClick={() => handleAddFriend(user.id)}
                                        />
                                    </div>
                                    <Paragraph ellipsis={{ rows: 2 }} className="text-gray-400 text-sm m-0 mb-2">
                                        {user.bio || 'No bio provided.'}
                                    </Paragraph>
                                    <div className="flex gap-1 flex-wrap">
                                        {user.personalityTags?.slice(0, 3).map((tag: string) => (
                                            <Tag key={tag} color="#108ee9" className="mr-0 text-xs border-none bg-blue-900 text-blue-200">
                                                {tag}
                                            </Tag>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {matches.length === 0 && (
                        <div className="text-center text-gray-500 mt-20">
                            <p>No matches found right now.</p>
                            <Button onClick={startScan}>Try Again</Button>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

export default RadarPage;
