'use client';
import { useLanguage } from '@/lib/language';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Layout, List, Input, Button, Avatar, Spin, Empty, App, Badge, Typography, Space, Tooltip } from 'antd';
import { SendOutlined, TeamOutlined, UserOutlined, SearchOutlined, ArrowLeftOutlined, MoreOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/auth-context';
import { useSearchParams, useRouter } from 'next/navigation';
import { shanghaiDateTime } from '@/lib/shanghai-time';
import { useChatRoom } from '@/hooks/useChatRoom';

const { Content, Sider } = Layout;
const { Text, Title } = Typography;
const { TextArea } = Input;

interface Contact {
    id: string;
    name: string;
    image: string | null;
    type: 'USER' | 'TEAM';
    subType?: string;
    unreadCount: number;
}

/** 组合联系人列表与私聊、队聊视图，消息同步交给 useChatRoom。 */
const ChatContent = () => {
    const { t } = useLanguage();
    const { message } = App.useApp();
    const { data: session } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const targetUserId = searchParams.get('targetId');
    const teamId = searchParams.get('teamId');
    const chat = useChatRoom(targetUserId ? { userId: targetUserId } : teamId ? { teamId } : null, session?.user?.id);

    const [contacts, setContacts] = useState<Contact[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const messagesPanelRef = useRef<HTMLDivElement>(null);
    const olderAnchor = useRef<{ height: number; top: number } | null>(null);

    // 加载更早消息时保持原阅读位置；新消息到来则滚动到底部。
    const scrollToBottom = () => {
        const panel = messagesPanelRef.current;
        if (!panel) return;
        if (olderAnchor.current) {
            panel.scrollTop = panel.scrollHeight - olderAnchor.current.height + olderAnchor.current.top;
            olderAnchor.current = null;
        } else panel.scrollTop = panel.scrollHeight;
    };

    const fetchContacts = useCallback(async () => {
        try {
            const res = await fetch('/java/chat/contacts');
            const data = await res.json();
            if (data.success) {
                setContacts(data.data);
            }
        } catch (error) {
            console.error(t("Fetch contacts error"), error);
        } finally {
            setLoadingContacts(false);
        }
    }, [t]);

    useEffect(() => {
        fetchContacts();
        window.addEventListener('focus', fetchContacts);
        return () => window.removeEventListener('focus', fetchContacts);
    }, [fetchContacts]);

    useEffect(() => {
        scrollToBottom();
    }, [chat.messages]);

    const handleLoadOlder = async () => {
        const panel = messagesPanelRef.current;
        if (panel) olderAnchor.current = { height: panel.scrollHeight, top: panel.scrollTop };
        if (!await chat.loadOlder()) olderAnchor.current = null;
    };

    const handleSend = async () => {
        if (!inputValue.trim() || sending) return;
        setSending(true);

        try {
            await chat.send(inputValue);
            setInputValue('');
        } catch {
            message.error(t('Error sending message'));
        } finally {
            setSending(false);
        }
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

    const activeId = targetUserId || teamId;
    const activeContact = contacts.find(c => c.id === activeId);

    useEffect(() => {
        if (activeId && !chat.loading && !chat.error)
            setContacts(current => current.map(contact => contact.id === activeId ? { ...contact, unreadCount: 0 } : contact));
    }, [activeId, chat.loading, chat.error]);

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
                        <Title level={3} className="!mb-0 !font-bold text-slate-800">{t("Chats")}</Title>
                        <Space>
                            <Tooltip title={t("Create Group")}>
                                <Button shape="circle" icon={<TeamOutlined />} type="text" />
                            </Tooltip>
                            {/* <Button shape="circle" icon={<MoreOutlined />} type="text" /> */}
                        </Space>
                    </div>
                    <Input
                        prefix={<SearchOutlined className="text-gray-400" />}
                        placeholder={t("Search contacts...")}
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
                                                    {item.type === 'TEAM' ? `${t('Team')} · ${item.subType || t('General')}` : t('Click to chat')}
                                                </Text>
                                                <Badge count={item.unreadCount} size="small" />
                                            </div>
                                        }
                                    />
                                </List.Item>
                            )}
                            locale={{ emptyText: <Empty description={t("No contacts")} className="mt-20 opacity-60" /> }}
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
                                        <span className={`w-2 h-2 rounded-full ${chat.status === 'live' ? 'bg-green-500' : 'bg-amber-500'}`} />
                                        <Text type="secondary" className="text-xs font-medium">{chat.status === 'live' ? t('Live') : chat.status === 'offline' ? t('Disconnected') : t('Connecting')}</Text>
                                    </div>
                                </div>
                            </Space>
                            <Space>
                                <Button icon={<SearchOutlined />} type="text" shape="circle" className="text-gray-500" />
                                <Button icon={<MoreOutlined />} type="text" shape="circle" className="text-gray-500" onClick={() => activeContact?.type === 'TEAM' && router.push(`/user/teams`)} />
                            </Space>
                        </div>

                        {/* Messages List */}
                        <div ref={messagesPanelRef} className="flex-1 overflow-auto p-6 space-y-6 scroll-smooth customize-scrollbar bg-[#f8f9fa]/50">
                            {chat.loading && <div className="text-center py-4"><Spin /></div>}
                            {chat.error && <div className="text-center text-red-500 text-sm">{chat.error}</div>}
                            {chat.hasOlder && <div className="text-center"><Button loading={chat.loadingOlder} onClick={handleLoadOlder}>{t("Load earlier messages")}</Button></div>}

                            {chat.messages.map((msg, index) => {
                                const isMe = msg.senderId === session?.user?.id;
                                const isSequence = index > 0 && chat.messages[index - 1].senderId === msg.senderId;

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
                                                <span className={`text-[10px] text-gray-400 mt-1 transition-opacity mx-1 ${isMe && targetUserId && msg.isRead ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                    {shanghaiDateTime(msg.createdAt).slice(11, 16)}
                                                    {isMe && targetUserId && msg.isRead ? ' · Read' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 md:p-5 bg-white/60 backdrop-blur-md border-t border-gray-100/50 shrink-0 z-20">
                            <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-200/60 focus-within:border-blue-400/50 focus-within:ring-4 focus-within:ring-blue-50 focus-within:shadow-md transition-all duration-300">
                                <div className="flex items-end gap-2">
                                    <TextArea
                                        value={inputValue}
                                        onChange={e => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={t("Type a message...")}
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
                            <Title level={2} className="!mb-0 text-slate-700">{t("Welcome to Chat")}</Title>
                            <Text className="text-slate-500 text-lg block max-w-md mx-auto">
                                {t("Connect with your friends and teammates in real-time. Select a conversation to start messaging.")}
                            </Text>
                        </div>
                        <div className="flex gap-4 mt-4">
                            <Button size="large" className="rounded-full px-8 h-12" onClick={() => router.push('/user/friends')}>
                                {t("Find Friends")}
                            </Button>
                            <Button type="primary" size="large" className="rounded-full px-8 h-12 bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-200" onClick={() => router.push('/user/teams')}>
                                {t("Join Teams")}
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
