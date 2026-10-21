"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Avatar, Button, Card, App, Input, Tag, Typography } from "antd";
import { CheckOutlined, RadarChartOutlined, UserAddOutlined } from "@ant-design/icons";
import { useLanguage } from "@/lib/language";
import { javaRequest } from "@/lib/java-client";
import "./radar.css";

const { Paragraph } = Typography;

type RadarMatch = {
    id: string;
    name: string | null;
    image: string | null;
    school: string | null;
    major: string | null;
    personalityType: string | null;
    personalityTags: string[];
    bio: string | null;
    score: number;
    matchReasons: string[];
};

type RadarResult = {
    matches: RadarMatch[];
    aiAssisted: boolean;
    intentSummary: string;
};

const RadarPage = () => {
    const { t } = useLanguage();
    const { message } = App.useApp();
    const [matches, setMatches] = useState<RadarMatch[]>([]);
    const [scanning, setScanning] = useState(true);
    const [query, setQuery] = useState("");
    const [intentSummary, setIntentSummary] = useState("");
    const [aiAssisted, setAiAssisted] = useState(false);
    const [requestedIds, setRequestedIds] = useState<string[]>([]);

    const startScan = useCallback(async (nextQuery = "") => {
        setScanning(true);
        setMatches([]);
        setIntentSummary("");
        setAiAssisted(false);
        try {
            const trimmed = nextQuery.trim();
            const response = await fetch(`/java/radar${trimmed ? `?q=${encodeURIComponent(trimmed)}` : ""}`, {
                cache: "no-store",
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || t("Radar failed"));
            const data = result.data as RadarResult;
            setMatches(data.matches ?? []);
            setIntentSummary(data.intentSummary ?? "");
            setAiAssisted(Boolean(data.aiAssisted));
        } catch (reason) {
            message.error(reason instanceof Error ? reason.message : t("Radar error"));
        } finally {
            setScanning(false);
        }
    }, [message, t]);

    useEffect(() => {
        void startScan("");
    }, [startScan]);

    const handleAddFriend = async (userId: string) => {
        try {
            await javaRequest("/friends/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ receiverId: userId, message: t("Found you via Matching Radar!") }),
            });
            setRequestedIds((current) => [...current, userId]);
            message.success(t("Friend request sent!"));
        } catch {
            message.error(t("Error sending request"));
        }
    };

    return (
        <div className="min-h-[70vh] rounded-xl bg-gray-900 p-4 pb-8 text-white sm:p-6">
            <h1 className="text-xl font-bold mb-1 text-center text-blue-400">{t("Matching Radar")}</h1>
            <p className="text-center text-xs text-slate-400 mb-4">
                {t("Find partners by shared interests, personality, school and major.")}
            </p>
            <div className="max-w-xl mx-auto mb-4">
                <Input.Search
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onSearch={(value) => void startScan(value)}
                    enterButton={t("Match by Need")}
                    placeholder={t("e.g. find a sporty and outgoing classmate this weekend")}
                    maxLength={160}
                    allowClear
                />
            </div>

            {scanning ? (
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <div className="radar-container">
                        <div className="radar-grid"></div>
                        <div className="radar-sweep"></div>
                        <div className="radar-blip" style={{ top: "30%", left: "72%", animationDelay: "0.2s" }}></div>
                        <div className="radar-blip" style={{ top: "55%", left: "25%", animationDelay: "0.9s" }}></div>
                        <div className="radar-blip" style={{ top: "75%", left: "60%", animationDelay: "1.7s" }}></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                            <RadarChartOutlined className="text-4xl text-green-400 opacity-90 drop-shadow-[0_0_10px_rgba(0,255,0,0.8)]" />
                        </div>
                    </div>
                    <p className="mt-8 text-green-400 animate-pulse text-lg">{t("Finding compatible users...")}</p>
                </div>
            ) : (
                <div className="space-y-3 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-400">{t("Found")} {matches.length} {t("matching users")}</span>
                        <Button type="primary" ghost size="small" onClick={() => void startScan(query)}>
                            {t("Rescan")}
                        </Button>
                    </div>

                    {intentSummary && (
                        <div className="rounded-lg border border-cyan-900 bg-cyan-950/40 px-3 py-2 text-sm text-cyan-100">
                            {aiAssisted ? t("AI matched for you") : t("Local matching")}: {intentSummary}
                        </div>
                    )}

                    {matches.map((user) => (
                        <Card
                            key={user.id}
                            className="hover:border-blue-500 transition-colors"
                            style={{ backgroundColor: "#1f2937", borderColor: "#374151" }}
                            styles={{ body: { padding: 20 } }}
                        >
                            <div className="flex items-start gap-4">
                                <Avatar size={56} src={user.image} style={{ flexShrink: 0, border: "2px solid #60a5fa" }} />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="m-0 break-words text-[17px] font-semibold leading-tight text-white">
                                                {user.name || t("Unnamed user")}
                                            </h3>
                                            <div className="mt-1 text-[13px] text-blue-300">
                                                {user.personalityType || t("Not set")} · {user.score} {t("points")}
                                            </div>
                                        </div>
                                        <Button
                                            type="primary"
                                            shape="circle"
                                            icon={requestedIds.includes(user.id) ? <CheckOutlined /> : <UserAddOutlined />}
                                            disabled={requestedIds.includes(user.id)}
                                            onClick={() => void handleAddFriend(user.id)}
                                            style={{ flexShrink: 0 }}
                                        />
                                    </div>
                                    <Paragraph ellipsis={{ rows: 2 }} style={{ color: "#d1d5db", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                                        {user.bio || t("No bio provided.")}
                                    </Paragraph>
                                    <div className="flex flex-wrap gap-1.5">
                                        {user.matchReasons?.map((reason) => (
                                            <Tag key={reason} color="cyan" style={{ margin: 0, fontSize: 12 }}>
                                                {reason}
                                            </Tag>
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {user.personalityTags?.slice(0, 3).map((tag) => (
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
                            <Button onClick={() => void startScan(query)}>{t("Try Again")}</Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RadarPage;
