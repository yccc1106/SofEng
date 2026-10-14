'use client';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, App, Tag } from 'antd';
import React, { useRef } from 'react';
import { shanghaiDateTime } from '@/lib/shanghai-time';

type ChatItem = {
    id: string;
    sender: string;
    receiver: string;
    content: string;
    riskLevel: string;
    moderationStatus: string;
    timestamp: string;
};

const ChatModeration: React.FC = () => {
    const { message } = App.useApp();
    const actionRef = useRef<ActionType | null>(null);

    const handleAction = async (id: string) => {
            try {
                const res = await fetch(`/java/admin/moderation/chats?id=${id}`, {
                    method: 'DELETE',
                });
                const data = await res.json();
                if (data.success) {
                    message.success('消息已屏蔽');
                    actionRef.current?.reload();
                } else {
                    message.error('操作失败');
                }
            } catch (error) {
                message.error('请求错误');
            }
    };

    const columns: ProColumns<ChatItem>[] = [
        {
            title: 'ID',
            dataIndex: 'id',
            width: 100,
            copyable: true,
            ellipsis: true,
        },
        {
            title: '发送者',
            dataIndex: 'sender',
            width: 120,
            ellipsis: true,
        },
        {
            title: '接收者',
            dataIndex: 'receiver',
            width: 120,
            ellipsis: true,
        },
        {
            title: '内容摘要',
            dataIndex: 'content',
            ellipsis: true,
        },
        {
            title: '风险等级',
            dataIndex: 'riskLevel',
            width: 100,
            render: (_, record) => {
                const color = record.riskLevel === 'high' ? 'red' : record.riskLevel === 'medium' ? 'orange' : 'green';
                return <Tag color={color}>{record.riskLevel.toUpperCase()}</Tag>;
            },
        },
        {
            title: '时间',
            dataIndex: 'timestamp',
            render: (_, record) => shanghaiDateTime(record.timestamp),
            width: 160,
        },
        {
            title: '操作',
            valueType: 'option',
            width: 120,
            render: (_, record) => [
                record.moderationStatus === 'VISIBLE' && <a key="block" style={{ color: 'red' }} onClick={() => handleAction(record.id)}>
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
                scroll={{ x: 'max-content' }}
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
                    const res = await fetch('/java/admin/moderation/chats');
                    return await res.json();
                }}
                columns={columns}
            />
        </PageContainer>
    );
};

export default ChatModeration;
