'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Card, Avatar, Button, Typography, App, Tag } from 'antd';
import { RadarChartOutlined, UserAddOutlined } from '@ant-design/icons';
import { javaRequest } from '@/lib/java-client';
import './radar.css'; // Will create this css file for animation

const { Paragraph } = Typography;
type Match = { id: string; name: string | null; image: string | null; bio: string | null; personalityType: string; personalityTags: string[]; score: number; scoreReason: string };

const RadarPage = () => {
    const { message } = App.useApp();
    const [matches, setMatches] = useState<Match[]>([]);
    const [scanning, setScanning] = useState(true);

    const startScan = useCallback(async () => {
        setScanning(true);
        setMatches([]);

        try {
            const res = await fetch('/java/radar');
            const data = await res.json();
            if (data.success) {
                setMatches(data.data);
            } else {
                message.error('Radar failed');
            }
        } catch {
            message.error('Radar error');
        } finally {
            setScanning(false);
        }
    }, [message]);

    useEffect(() => {
        void startScan();
    }, [startScan]);

    const handleAddFriend = async (userId: string) => {
        try {
            await javaRequest('/friends/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: userId, message: 'Found you via Matching Radar!' }),
            });
            message.success('Friend request sent!');
        } catch {
            message.error('Error sending request');
        }
    };

    return (
        <div className="min-h-[70vh] rounded-xl bg-gray-900 p-4 pb-8 text-white sm:p-6">
            <h1 className="text-xl font-bold mb-4 text-center text-blue-400">Matching Radar</h1>

            {scanning ? (
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <div className="radar-container">
                        <div className="radar-grid"></div>
                        <div className="radar-sweep"></div>
                        {/* Simulated blips */}
                        <div className="radar-blip" style={{ top: '30%', left: '72%', animationDelay: '0.2s' }}></div>
                        <div className="radar-blip" style={{ top: '55%', left: '25%', animationDelay: '0.9s' }}></div>
                        <div className="radar-blip" style={{ top: '75%', left: '60%', animationDelay: '1.7s' }}></div>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                            <RadarChartOutlined className="text-4xl text-green-400 opacity-90 drop-shadow-[0_0_10px_rgba(0,255,0,0.8)]" />
                        </div>
                    </div>
                    <p className="mt-8 text-green-400 animate-pulse text-lg">Finding compatible users...</p>
                </div>
            ) : (
                <div className="animate-fade-in" style={{ display: 'grid', gap: 12 }}>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-400">Found {matches.length} matching users</span>
                        <Button type="primary" ghost size="small" onClick={startScan}>Rescan</Button>
                    </div>

                    {matches.map((user) => (
                        <Card
                            key={user.id}
                            className="hover:border-blue-500 transition-colors"
                            style={{ backgroundColor: '#1f2937', borderColor: '#374151' }}
                            styles={{ body: { padding: '16px' } }}
                        >
                            <div className="flex items-center">
                                <Avatar size={64} src={user.image} className="mr-4 border-2 border-blue-400" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="m-0 break-words text-lg font-bold text-white">{user.name || 'Unnamed user'}</h3>
                                            <div className="text-blue-300 text-sm mb-1">{user.personalityType} · {user.score} points</div>
                                        </div>
                                        <Button
                                            type="primary"
                                            shape="circle"
                                            icon={<UserAddOutlined />}
                                            onClick={() => handleAddFriend(user.id)}
                                        />
                                    </div>
                                    <Paragraph ellipsis={{ rows: 2 }} className="text-sm m-0 mb-2"
                                        style={{ color: '#d1d5db' }}>
                                        {user.scoreReason} · {user.bio || 'No bio provided.'}
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
