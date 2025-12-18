'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Layout, List, Input, Button, Avatar, Spin, Empty, App, Card, Badge, Typography, Space } from 'antd';
import { SendOutlined, TeamOutlined, UserOutlined, SearchOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';

const { Content, Sider } = Layout;
const { Text, Title } = Typography;

interface Contact {
    id: string;
    name: string;
    image: string | null;
    type: 'USER' | 'TEAM';
    subType?: string;
}

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
    const router = useRouter();
    const searchParams = useSearchParams();
    const targetUserId = searchParams.get('targetId');
    const teamId = searchParams.get('teamId');

    const [contacts, setContacts] = useState<Contact[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchContacts = async () => {
        try {
            const res = await fetch('/api/chat/contacts');
            const data = await res.json();
            if (data.success) {
                setContacts(data.data);
            }
        } catch (error) {
            console.error("Fetch contacts error", error);
        } finally {
            setLoadingContacts(false);
        }
    };

    const fetchMessages = async () => {
        if (!targetUserId && !teamId) return;
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
        fetchContacts();
    }, []);

    useEffect(() => {
        if (targetUserId || teamId) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        } else {
            setMessages([]);
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

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeId = targetUserId || teamId;
    const activeContact = contacts.find(c => c.id === activeId);

    return (
        <Layout className="h-[calc(100vh-120px)] bg-transparent">
            {/* Sidebar / Contact List */}
            <Sider
                width={320}
                theme="light"
                className={`rounded-2xl shadow-sm mr-4 overflow-hidden flex flex-col transition-all ${activeId ? 'hidden md:flex' : 'flex w-full'}`}
                style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)' }}
            >
                <div className="p-4 border-b border-gray-100">
                    <Title level={4} className="mb-4">Messages</Title>
                    <Input
                        prefix={<SearchOutlined className="text-gray-400" />}
                        placeholder="Search contacts..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="rounded-full bg-gray-100 border-none h-10"
                    />
                </div>
                <div className="flex-1 overflow-auto">
                    {loadingContacts ? <div className="flex justify-center p-10"><Spin /></div> : (
                        <List
                            dataSource={filteredContacts}
                            renderItem={item => (
                                <List.Item
                                    className={`px-4 cursor-pointer transition-colors hover:bg-white ${activeId === item.id ? 'bg-white shadow-sm border-l-4 border-blue-500' : ''}`}
                                    onClick={() => {
                                        if (item.type === 'USER') router.push(`/user/chat?targetId=${item.id}`);
                                        else router.push(`/user/chat?teamId=${item.id}`);
                                    }}
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <Badge dot={false} offset={[-2, 32]}>
                                                <Avatar
                                                    src={item.image}
                                                    icon={item.type === 'USER' ? <UserOutlined /> : <TeamOutlined />}
                                                    size="large"
                                                    className={item.type === 'TEAM' ? 'bg-blue-100 text-blue-500' : 'bg-green-100 text-green-500'}
                                                />
                                            </Badge>
                                        }
                                        title={<Text strong>{item.name}</Text>}
                                        description={
                                            <div className="truncate text-xs text-gray-400">
                                                {item.type === 'TEAM' ? `Team · ${item.subType}` : 'Friend'}
                                            </div>
                                        }
                                    />
                                </List.Item>
                            )}
                            locale={{ emptyText: <Empty description="No contacts found" className="mt-20" /> }}
                        />
                    )}
                </div>
            </Sider>

            {/* Main Chat Area */}
            <Content className={`rounded-2xl shadow-sm flex flex-col bg-white overflow-hidden relative ${!activeId ? 'hidden md:flex' : 'flex'}`}>
                {activeId ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                            <Space size="middle">
                                <Button
                                    icon={<ArrowLeftOutlined />}
                                    className="md:hidden"
                                    type="text"
                                    onClick={() => router.push('/user/chat')}
                                />
                                <Avatar
                                    src={activeContact?.image}
                                    icon={activeContact?.type === 'USER' ? <UserOutlined /> : <TeamOutlined />}
                                    className={activeContact?.type === 'TEAM' ? 'bg-blue-100 text-blue-500' : 'bg-green-100 text-green-500'}
                                />
                                <div>
                                    <div className="font-bold text-base leading-none">{activeContact?.name}</div>
                                    <div className="text-xs text-green-500 mt-1 flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse" /> Online
                                    </div>
                                </div>
                            </Space>
                            <Button icon={<TeamOutlined />} type="text" onClick={() => activeContact?.type === 'TEAM' && router.push(`/user/teams`)} />
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-auto p-6 bg-[#f0f2f5] bg-opacity-30">
                            <List
                                dataSource={messages}
                                split={false}
                                renderItem={(msg) => {
                                    const isMe = msg.senderId === session?.user?.id;
                                    return (
                                        <div className={`flex w-full mb-6 space-x-3 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                            {!isMe && <Avatar src={msg.sender.image} className="shadow-sm" />}
                                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                {activeContact?.type === 'TEAM' && !isMe && (
                                                    <span className="text-[10px] text-gray-400 mb-1 ml-1">{msg.sender.name}</span>
                                                )}
                                                <div className={`px-4 py-3 rounded-2xl max-w-md break-words shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                                                    {msg.content}
                                                </div>
                                                <span className="text-[10px] text-gray-400 mt-1 mx-1">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }}
                            />
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-100">
                            <div className="flex gap-3 items-center">
                                <Input
                                    value={inputValue}
                                    onChange={e => setInputValue(e.target.value)}
                                    onPressEnter={handleSend}
                                    placeholder="Write a message..."
                                    size="large"
                                    className="rounded-full bg-gray-50 border-none h-12 focus:bg-white transition-all shadow-inner"
                                />
                                <Button
                                    type="primary"
                                    shape="circle"
                                    size="large"
                                    icon={<SendOutlined />}
                                    onClick={handleSend}
                                    className="h-12 w-12 flex items-center justify-center shadow-lg"
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col justify-center items-center h-full gap-6 p-10 text-center">
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                            <TeamOutlined className="text-4xl text-blue-500" />
                        </div>
                        <div>
                            <Title level={3}>Welcome to Chat</Title>
                            <Text type="secondary" className="block max-w-sm">Pick a friend or team from the sidebar to start a conversation. Your squads are waiting for you!</Text>
                        </div>
                        <div className="flex gap-4">
                            <Button size="large" type="primary" ghost onClick={() => router.push('/user/friends')}>Find Friends</Button>
                            <Button size="large" type="primary" onClick={() => router.push('/user/teams')}>Join Teams</Button>
                        </div>
                    </div>
                )}
            </Content>
        </Layout>
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
