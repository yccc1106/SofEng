'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Layout, List, Input, Button, Avatar, Spin, Empty, App, Badge, Typography, Space, Tooltip, Dropdown } from 'antd';
import { SendOutlined, TeamOutlined, UserOutlined, SearchOutlined, ArrowLeftOutlined, MoreOutlined, DeleteOutlined, GlobalOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { useChatSocket } from '@/hooks/useChatSocket';

const { Content, Sider } = Layout;
const { Text, Title } = Typography;
const { TextArea } = Input;

interface Contact {
    id: string;
    name: string;
    image: string | null;
    type: 'USER' | 'TEAM' | 'INTEREST';
    subType?: string;
    lastMessage?: string;
    lastActive?: string;
    unreadCount?: number;
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
    isRead?: boolean;
}

const ChatContent = () => {
    const { message, modal } = App.useApp();
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const targetUserId = searchParams.get('targetId');
    const teamId = searchParams.get('teamId');
    const categoryId = searchParams.get('categoryId');

    const [contacts, setContacts] = useState<Contact[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
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

    const fetchMessages = async (showLoading = false) => {
        if (!targetUserId && !teamId && !categoryId) return;
        if (showLoading) setLoadingMessages(true);
        try {
            let url = '/api/chat?';
            if (targetUserId) url += `userId=${targetUserId}`;
            if (teamId) url += `teamId=${teamId}`;
            if (categoryId) url += `categoryId=${categoryId}`;

            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setMessages(data.data);
            }
        } catch (error) {
            console.error("Fetch message error", error);
        } finally {
            if (showLoading) setLoadingMessages(false);
        }
    };

    // 标记消息已读
    const markAsRead = async () => {
        try {
            await fetch('/api/chat/read', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: targetUserId,
                    teamId,
                    categoryId
                })
            });
        } catch (error) {
            console.error("Failed to mark messages as read");
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    useEffect(() => {
        if (targetUserId || teamId || categoryId) {
            fetchMessages(true);
            markAsRead();
        } else {
            setMessages([]);
        }
    }, [targetUserId, teamId, categoryId]);

    // WebSocket 实时消息
    const handleNewMessage = useCallback((newMessage: Message) => {
        console.log('[Chat] Received new message:', newMessage);
        setMessages(prev => {
            // 避免重复消息
            if (prev.some(m => m.id === newMessage.id)) {
                console.log('[Chat] Duplicate message, skipping:', newMessage.id);
                return prev;
            }
            console.log('[Chat] Adding new message to list:', newMessage.id);
            return [...prev, newMessage];
        });
        scrollToBottom();
    }, []);

    const roomType: 'dm' | 'team' | 'interest' = categoryId ? 'interest' : (teamId ? 'team' : 'dm');

    // 计算房间名称 - 私聊需要包含双方用户ID
    const roomName = React.useMemo(() => {
        if (roomType === 'dm' && targetUserId && session?.user?.id) {
            const sorted = [session.user.id, targetUserId].sort();
            return `dm:${sorted[0]}_${sorted[1]}`;
        } else if (roomType === 'team' && teamId) {
            return `team:${teamId}`;
        } else if (roomType === 'interest' && categoryId) {
            return `interest:${categoryId}`;
        }
        return '';
    }, [roomType, targetUserId, teamId, categoryId, session?.user?.id]);

    const { isConnected } = useChatSocket({
        room: roomName,
        roomType,
        userId: session?.user?.id || '',
        onNewMessage: handleNewMessage,
        enabled: !!roomName && !!session?.user?.id,
    });

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim() || sending) return;
        setSending(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: inputValue,
                    receiverId: targetUserId,
                    teamId,
                    categoryId
                }),
            });
            const data = await res.json();
            if (data.success) {
                setInputValue('');
                fetchMessages();
            } else {
                message.error(data.message || 'Failed to send');
            }
        } catch (error) {
            message.error('Error sending message');
        } finally {
            setSending(false);
        }
    };

    const handleDeleteMessage = async (msgId: string) => {
        modal.confirm({
            title: 'Delete Message',
            content: 'Are you sure you want to delete this message?',
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    const res = await fetch(`/api/chat/messages/${msgId}`, {
                        method: 'DELETE',
                    });
                    const data = await res.json();
                    if (data.success) {
                        message.success('Message deleted');
                        fetchMessages();
                    } else {
                        message.error(data.message || 'Failed to delete');
                    }
                } catch (error) {
                    message.error('Failed to delete message');
                }
            }
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeId = targetUserId || teamId || categoryId;
    const activeContact = contacts.find(c => c.id === activeId);
    const chatType = categoryId ? 'INTEREST' : (teamId ? 'TEAM' : 'USER');

    return (
        <Layout className="h-[calc(100vh-100px)] bg-transparent p-4 md:p-6 gap-6">
            {/* Sidebar / Contact List */}
            <Sider
                width={360}
                theme="light"
                className={`!bg-white/60 !backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl overflow-hidden flex flex-col transition-all duration-300 ${activeId ? 'hidden md:flex' : 'flex w-full'}`}
            >
                <div className="p-6 border-b border-gray-100/50">
                    <div className="flex justify-between items-center mb-6">
                        <Title level={3} className="!mb-0 !font-bold text-slate-800">Chats</Title>
                        <Space>
                            <Tooltip title="Create Group">
                                <Button shape="circle" icon={<TeamOutlined />} type="text" />
                            </Tooltip>
                            {/* <Button shape="circle" icon={<MoreOutlined />} type="text" /> */}
                        </Space>
                    </div>
                    <Input
                        prefix={<SearchOutlined className="text-gray-400" />}
                        placeholder="Search contacts..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="rounded-xl bg-white/50 border-gray-200/50 h-10 hover:bg-white focus:bg-white transition-all"
                        variant="filled"
                    />
                </div>
                <div className="flex-1 overflow-auto px-2 py-2 customize-scrollbar">
                    {loadingContacts ? (
                        <div className="flex justify-center p-10"><Spin size="large" /></div>
                    ) : (
                        <List
                            dataSource={filteredContacts}
                            renderItem={item => (
                                <List.Item
                                    className={`mx-2 mb-1 p-3 rounded-2xl cursor-pointer transition-all border-0 hover:bg-white/80 ${activeId === item.id ? 'bg-white shadow-md' : ''}`}
                                    onClick={() => {
                                        if (item.type === 'USER') router.push(`/user/chat?targetId=${item.id}`);
                                        else router.push(`/user/chat?teamId=${item.id}`);
                                    }}
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <Badge dot={false} offset={[-2, 36]} color="green">
                                                <Avatar
                                                    src={item.image}
                                                    icon={item.type === 'USER' ? <UserOutlined /> : <TeamOutlined />}
                                                    size={48}
                                                    className={item.type === 'TEAM' ? 'bg-gradient-to-tr from-blue-400 to-blue-600 text-white' : 'bg-gradient-to-tr from-emerald-400 to-emerald-600 text-white'}
                                                />
                                            </Badge>
                                        }
                                        title={<div className="flex justify-between items-center">
                                            <Text strong className="text-base text-slate-700">{item.name}</Text>
                                            {/* <Text type="secondary" className="text-xs">10:30 AM</Text> */}
                                        </div>}
                                        description={
                                            <div className="flex justify-between items-center mt-1">
                                                <Text type="secondary" className="text-sm truncate pr-2">
                                                    {item.type === 'TEAM' ? `Team · ${item.subType}` : 'Click to chat'}
                                                </Text>
                                                {/* <Badge count={2} className="site-badge-count-4" color="#3b82f6" /> */}
                                            </div>
                                        }
                                    />
                                </List.Item>
                            )}
                            locale={{ emptyText: <Empty description="No contacts" className="mt-20 opacity-60" /> }}
                        />
                    )}
                </div>
            </Sider>

            {/* Main Chat Area */}
            <Content className={`rounded-3xl border border-white/50 shadow-xl flex flex-col bg-white/70 backdrop-blur-xl overflow-hidden relative transition-all duration-300 ${!activeId && 'hidden md:flex'}`}>
                {activeId ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-20 px-6 border-b border-gray-100/50 flex items-center justify-between bg-white/40 backdrop-blur-md z-10 shrink-0">
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
                                    size="large"
                                    className={activeContact?.type === 'TEAM' ? 'bg-gradient-to-tr from-blue-400 to-blue-600' : 'bg-gradient-to-tr from-emerald-400 to-emerald-600'}
                                />
                                <div className="flex flex-col">
                                    <Text strong className="text-lg leading-tight text-slate-800">{activeContact?.name}</Text>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                        <Text type="secondary" className="text-xs font-medium">{isConnected ? 'Online' : 'Connecting...'}</Text>
                                    </div>
                                </div>
                            </Space>
                            <Space>
                                <Button icon={<SearchOutlined />} type="text" shape="circle" className="text-gray-500" />
                                <Button icon={<MoreOutlined />} type="text" shape="circle" className="text-gray-500" onClick={() => activeContact?.type === 'TEAM' && router.push(`/user/teams`)} />
                            </Space>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-auto p-6 space-y-6 scroll-smooth customize-scrollbar bg-[#f8f9fa]/50">
                            {loadingMessages && <div className="text-center py-4"><Spin /></div>}

                            {messages.map((msg, index) => {
                                const isMe = msg.senderId === session?.user?.id;
                                const isSequence = index > 0 && messages[index - 1].senderId === msg.senderId;

                                return (
                                    <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                                        <div className={`flex max-w-[85%] md:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'} gap-3 group`}>
                                            {!isMe && !isSequence ? (
                                                <Avatar src={msg.sender.image} className="mt-1 shadow-sm shrink-0" />
                                            ) : !isMe ? (
                                                <div className="w-8 shrink-0" />
                                            ) : null}

                                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                {!isMe && activeContact?.type === 'TEAM' && !isSequence && (
                                                    <span className="text-[11px] text-gray-400 mb-1 ml-1 font-medium">{msg.sender.name}</span>
                                                )}

                                                <div
                                                    className={`px-5 py-3 rounded-2xl shadow-sm text-[15px] leading-relaxed break-words relative transition-all duration-200 hover:shadow-md
                                                    ${isMe
                                                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-tr-sm'
                                                            : 'bg-white text-slate-700 rounded-tl-sm border border-gray-100'
                                                        }`}
                                                >
                                                    {msg.content}
                                                </div>
                                                <span className={`text-[10px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity mx-1`}>
                                                    {dayjs(msg.createdAt).format('h:mm A')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 md:p-5 bg-white/60 backdrop-blur-md border-t border-gray-100/50 shrink-0 z-20">
                            <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-200/60 focus-within:border-blue-400/50 focus-within:ring-4 focus-within:ring-blue-50 focus-within:shadow-md transition-all duration-300">
                                <div className="flex items-end gap-2">
                                    <TextArea
                                        value={inputValue}
                                        onChange={e => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type a message..."
                                        autoSize={{ minRows: 1, maxRows: 4 }}
                                        variant="borderless"
                                        className="!mb-0 !bg-transparent text-base !resize-none py-3"
                                    />
                                    <div className="flex pb-2 pr-2 gap-2">
                                        {/* <Button type="text" shape="circle" icon={<PaperClipOutlined className="text-gray-400 text-lg" />} />
                                        <Button type="text" shape="circle" icon={<SmileOutlined className="text-gray-400 text-lg" />} /> */}
                                        <Button
                                            type="primary"
                                            shape="circle"
                                            size="large"
                                            icon={sending ? <Spin className="text-white" size="small" /> : <SendOutlined className="ml-0.5" />}
                                            onClick={handleSend}
                                            disabled={!inputValue.trim() || sending}
                                            className={`${inputValue.trim() ? 'bg-blue-600 shadow-blue-300 shadow-lg scale-100' : 'bg-gray-300 scale-90 opacity-70'} transition-all duration-300 border-none w-10 h-10 flex items-center justify-center`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col justify-center items-center h-full gap-8 p-10 text-center bg-white/40">
                        <div className="relative">
                            <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center animate-pulse">
                                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                                    <TeamOutlined className="text-5xl text-blue-500" />
                                </div>
                            </div>
                            <Badge status="processing" className="absolute bottom-2 right-2 scale-150" />
                        </div>
                        <div className="space-y-2">
                            <Title level={2} className="!mb-0 text-slate-700">Welcome to Chat</Title>
                            <Text className="text-slate-500 text-lg block max-w-md mx-auto">
                                Connect with your friends and teammates in real-time. Select a conversation to start messaging.
                            </Text>
                        </div>
                        <div className="flex gap-4 mt-4">
                            <Button size="large" className="rounded-full px-8 h-12" onClick={() => router.push('/user/friends')}>
                                Find Friends
                            </Button>
                            <Button type="primary" size="large" className="rounded-full px-8 h-12 bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-200" onClick={() => router.push('/user/teams')}>
                                Join Teams
                            </Button>
                        </div>
                    </div>
                )}
            </Content>
        </Layout>
    );
};

const ChatPage = () => {
    return (
        <React.Suspense fallback={<div className="flex justify-center items-center h-screen"><Spin size="large" /></div>}>
            <ChatContent />
        </React.Suspense>
    );
};

export default ChatPage;
