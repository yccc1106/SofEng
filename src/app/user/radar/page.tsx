'use client';
import { useLanguage } from '@/lib/language';
import React, { useCallback, useEffect, useState } from 'react';
import { Card, Avatar, Button, Typography, App, Tag } from 'antd';
import { RadarChartOutlined, UserAddOutlined } from '@ant-design/icons';
import { javaRequest } from '@/lib/java-client';
import './radar.css';

const { Paragraph } = Typography;
type Match = { id: string; name: string | null; image: string | null; bio: string | null; personalityType: string; personalityTags: string[]; score: number; scoreReason: string };

/** 展示后端返回的规则匹配结果，并提供发起好友申请入口。 */
const RadarPage = () => {
    const { t } = useLanguage();
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
                message.error(t('Radar failed'));
            }
        } catch {
            message.error(t('Radar error'));
        } finally {
            setScanning(false);
        }
    }, [message, t]);

    useEffect(() => {
        void startScan();
    }, [startScan]);

    const handleAddFriend = async (userId: string) => {
        try {
            await javaRequest('/friends/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: userId, message: t('Found you via Matching Radar!') }),
            });
            message.success(t('Friend request sent!'));
        } catch {
            message.error(t('Error sending request'));
        }
    };

    return (
        <div className="min-h-[70vh] rounded-xl bg-gray-900 p-4 pb-8 text-white sm:p-6">
            <h1 className="text-xl font-bold mb-4 text-center text-blue-400">{t("Matching Radar")}</h1>

            {scanning ? (
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <div className="radar-container">
                        <div className="radar-grid"></div>
                        <div className="radar-sweep"></div>
                        {/* 扫描动画只用于展示，匹配结果由接口返回。 */}
                        <div className="radar-blip" style={{ top: '30%', left: '72%', animationDelay: '0.2s' }}></div>
                        <div className="radar-blip" style={{ top: '55%', left: '25%', animationDelay: '0.9s' }}></div>
                        <div className="radar-blip" style={{ top: '75%', left: '60%', animationDelay: '1.7s' }}></div>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                            <RadarChartOutlined className="text-4xl text-green-400 opacity-90 drop-shadow-[0_0_10px_rgba(0,255,0,0.8)]" />
                        </div>
                    </div>
                    <p className="mt-8 text-green-400 animate-pulse text-lg">{t("Finding compatible users...")}</p>
                </div>
            ) : (
                <div className="animate-fade-in" style={{ display: 'grid', gap: 12 }}>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-400">{t('Found')} {matches.length} {t('matching users')}</span>
                        <Button type="primary" ghost size="small" onClick={startScan}>{t("Rescan")}</Button>
                    </div>

                    {matches.map((user) => (
                        <Card
                            key={user.id}
                            className="hover:border-blue-500 transition-colors"
                            style={{ backgroundColor: '#1f2937', borderColor: '#374151' }}
                            styles={{ body: { padding: '20px' } }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <Avatar size={56} src={user.image} style={{ flexShrink: 0, border: '2px solid #60a5fa' }} />
                                <div style={{ minWidth: 0, flex: 1, display: 'grid', rowGap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                                        <div style={{ minWidth: 0 }}>
                                            <h3 style={{ margin: 0, color: '#fff', fontSize: 17, fontWeight: 600, lineHeight: 1.4, overflowWrap: 'anywhere' }}>
                                                {user.name || t('Unnamed user')}
                                            </h3>
                                            <div style={{ color: '#93c5fd', fontSize: 13, lineHeight: 1.5, marginTop: 3 }}>
                                                {user.personalityType} · {user.score} {t('points')}
                                            </div>
                                        </div>
                                        <Button
                                            type="primary"
                                            shape="circle"
                                            icon={<UserAddOutlined />}
                                            onClick={() => handleAddFriend(user.id)}
                                            style={{ flexShrink: 0 }}
                                        />
                                    </div>
                                    <Paragraph ellipsis={{ rows: 2 }}
                                        style={{ color: '#d1d5db', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                                        {user.scoreReason} · {user.bio || t('No bio provided.')}
                                    </Paragraph>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 2 }}>
                                        {user.personalityTags?.slice(0, 3).map((tag: string) => (
                                            <Tag key={tag} color="blue" style={{ margin: 0, fontSize: 12 }}>
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
                            <p>{t("No matches found right now.")}</p>
                            <Button onClick={startScan}>{t("Try Again")}</Button>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

export default RadarPage;
