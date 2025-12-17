'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Layout, List, Input, Button, Avatar, Spin, Empty, App, Card } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

const { Content, Footer } = Layout;

interface Message {
    id: string;
    content: string;
    senderId: string;
    sender: {
        name: string;
        image: string;
    };
    createdAt: string;
}

const ChatContent = () => {
    const { message } = App.useApp();
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const targetUserId = searchParams.get('targetId');
    const teamId = searchParams.get('teamId');

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async () => {
        try {
            let url = '/api/chat?';
            if (targetUserId) url += `userId=${targetUserId}`;
            if (teamId) url += `teamId=${teamId}`;

            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setMessages(data.data);
            }
        } catch (error) {
            console.error("Fetch message error", error);
        }
    };

    useEffect(() => {
        if (targetUserId || teamId) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [targetUserId, teamId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: inputValue,
                    receiverId: targetUserId,
                    teamId: teamId
                }),
            });
            const data = await res.json();
            if (data.success) {
                setInputValue('');
                fetchMessages();
            } else {
                message.error('Failed to send');
            }
        } catch (error) {
            message.error('Error sending message');
        }
    };

    if (!targetUserId && !teamId) {
        return (
            <div className="flex justify-center items-center h-[60vh] flex-col gap-4">
                <Empty description="Select a friend or team to start chatting" />
                <div className="flex gap-4">
                    <Button href="/user/friends">Go to Friends</Button>
                    <Button href="/user/teams">Go to Teams</Button>
                </div>
            </div>
        );
    }

    return (
        <Card styles={{ body: { padding: 0, height: '75vh', display: 'flex', flexDirection: 'column' } }} className="overflow-hidden shadow-md rounded-xl">
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
                <List
                    dataSource={messages}
                    split={false}
                    renderItem={(msg) => {
                        const isMe = msg.senderId === session?.user?.id;
                        return (
                            <div className={`flex w-full mb-4 space-x-3 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                <Avatar src={msg.sender.image} />
                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-4 py-2 rounded-2xl max-w-md break-words ${isMe ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 shadow-sm border border-gray-100'}`}>
                                        {msg.content}
                                    </div>
                                    <span className="text-xs text-gray-400 mt-1 mx-1">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    }}
                />
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex gap-3">
                    <Input
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onPressEnter={handleSend}
                        placeholder="Type a message..."
                        size="large"
                        className="rounded-full bg-gray-50 hover:bg-white focus:bg-white"
                    />
                    <Button
                        type="primary"
                        shape="circle"
                        size="large"
                        icon={<SendOutlined />}
                        onClick={handleSend}
                    />
                </div>
            </div>
        </Card>
    );
};

const ChatPage = () => {
    return (
        <React.Suspense fallback={<div className="flex justify-center py-20"><Spin size="large" /></div>}>
            <ChatContent />
        </React.Suspense>
    );
};

export default ChatPage;
