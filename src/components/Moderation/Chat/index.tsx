'use client';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, App, Tag } from 'antd';
import React, { useRef } from 'react';

type ChatItem = {
    id: string;
    sender: string;
    receiver: string;
    content: string;
    riskLevel: string;
    timestamp: string;
};

const ChatModeration: React.FC = () => {
    const { message } = App.useApp();
    const actionRef = useRef<ActionType | null>(null);

    const handleAction = async (id: string, action: 'pass' | 'block') => {
        if (action === 'pass') {
            message.success('已通过 (Passed)');
            return;
        }
        if (action === 'block') {
            try {
                const res = await fetch(`/api/admin/moderation/chats?id=${id}`, {
                    method: 'DELETE',
                });
                const data = await res.json();
                if (data.success) {
                    message.success('已屏蔽并删除 (Blocked & Deleted)');
                    actionRef.current?.reload();
                } else {
                    message.error('操作失败');
                }
            } catch (error) {
                message.error('请求错误');
            }
        }
    };

    const columns: ProColumns<ChatItem>[] = [
        {
            title: 'ID',
            dataIndex: 'id',
            width: 48,
        },
        {
            title: '发送者',
            dataIndex: 'sender',
        },
        {
            title: '接收者',
            dataIndex: 'receiver',
        },
        {
            title: '内容摘要',
            dataIndex: 'content',
            width: 300,
            ellipsis: true,
        },
        {
            title: '风险等级',
            dataIndex: 'riskLevel',
            render: (_, record) => {
                const color = record.riskLevel === 'high' ? 'red' : record.riskLevel === 'medium' ? 'orange' : 'green';
                return <Tag color={color}>{record.riskLevel.toUpperCase()}</Tag>;
            },
        },
        {
            title: '时间',
            dataIndex: 'timestamp',
            valueType: 'dateTime',
        },
        {
            title: '操作',
            valueType: 'option',
            render: (_, record) => [
                <a key="pass" onClick={() => handleAction(record.id, 'pass')}>
                    通过
                </a>,
                <a key="block" style={{ color: 'red' }} onClick={() => handleAction(record.id, 'block')}>
                    屏蔽
                </a>,
            ],
        },
    ];

    return (
        <PageContainer
            header={{
                title: " ",
                breadcrumb: {},
            }}
        >
            <ProTable<ChatItem>
                headerTitle="Chat Moderation (Recent Messages)"
                actionRef={actionRef}
                rowKey="id"
                search={{
                    labelWidth: 120,
                    filterType: 'light',
                }}
                cardBordered
                options={{
                    density: false,
                    fullScreen: true,
                    setting: true,
                }}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                }}
                request={async () => {
                    const res = await fetch('/api/admin/moderation/chats');
                    return await res.json();
                }}
                columns={columns}
            />
        </PageContainer>
    );
};

export default ChatModeration;
