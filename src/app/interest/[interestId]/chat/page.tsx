'use client';
import React, { useEffect, useState, useRef } from 'react';
import { List, Input, Button, Avatar, Spin, App } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { useChatRoom } from '@/hooks/useChatRoom';

const InterestChatPage = () => {
    const { message: antMessage } = App.useApp();
    const { data: session } = useSession();
    const params = useParams();
    const interestId = params?.interestId as string;
    const chat = useChatRoom(interestId ? { categoryId: interestId } : null, session?.user?.id);

    const [inputValue, setInputValue] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chat.messages]);

    const handleSend = async () => {
        if (!inputValue.trim() || sending) return;
        setSending(true);
        try {
            await chat.send(inputValue);
            setInputValue('');
        } catch (error) {
            antMessage.error('Error sending message');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-white z-10">
                <h2 className="text-xl font-bold text-gray-800">Lobby Chat</h2>
                <p className="text-xs text-green-500 flex items-center mt-1">
                    <span className={`w-2 h-2 rounded-full mr-1 ${chat.status === 'live' ? 'bg-green-500' : 'bg-amber-500'}`} />
                    {chat.status === 'live' ? 'Live' : chat.status === 'offline' ? 'Disconnected' : 'Connecting'}
                </p>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-[#f9fafb]">
                {chat.loading && <div className="flex justify-center p-10"><Spin /></div>}
                {chat.error && <div className="text-center text-red-500 text-sm">{chat.error}</div>}
                {chat.hasOlder && <div className="text-center mb-4"><Button loading={chat.loadingOlder} onClick={chat.loadOlder}>Load earlier messages</Button></div>}
                <List
                    dataSource={chat.messages}
                    split={false}
                    renderItem={(msg) => {
                        const isMe = msg.senderId === session?.user?.id;
                        return (
                            <div className={`flex w-full mb-4 space-x-3 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                {!isMe && <Avatar src={msg.sender.image} className="shadow-sm" />}
                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    {!isMe && (
                                        <span className="text-[10px] text-gray-400 mb-1 ml-1">{msg.sender.name}</span>
                                    )}
                                    <div className={`px-4 py-2 rounded-2xl break-words shadow-sm max-w-lg ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        );
                    }}
                />
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex gap-3 items-center">
                    <Input
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onPressEnter={handleSend}
                        placeholder="Say something to everyone..."
                        size="large"
                        className="rounded-full bg-gray-50 border-none h-12 focus:bg-white transition-all shadow-inner"
                    />
                    <Button
                        type="primary"
                        shape="circle"
                        size="large"
                        icon={<SendOutlined />}
                        onClick={handleSend}
                        disabled={!inputValue.trim() || sending}
                        className="h-12 w-12 flex items-center justify-center shadow-lg bg-indigo-600 hover:bg-indigo-700 border-none"
                    />
                </div>
            </div>
        </div>
    );
};

export default InterestChatPage;
