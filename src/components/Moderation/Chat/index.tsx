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

const mockData: ChatItem[] = Array.from({ length: 25 }).map((_, i) => ({
    id: `${i + 1}`,
    sender: `User X${i}`,
    receiver: `User Y${i}`,
    content: `这是一条需要审核的聊天消息内容...[敏感词汇检测]`,
    riskLevel: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
    timestamp: `2024-05-20 10:0${i}`,
}));

const ChatModeration: React.FC = () => {
    const { message } = App.useApp();
    const actionRef = useRef<ActionType | null>(null);

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
                <a key="pass" onClick={() => message.success('通过')}>
                    通过
                </a>,
                <a key="block" style={{ color: 'red' }} onClick={() => message.error('已屏蔽')}>
                    屏蔽
                </a>,
            ],
        },
    ];

    return (
        <PageContainer>
            <ProTable<ChatItem>
                headerTitle="聊天内容审核"
                actionRef={actionRef}
                rowKey="id"
                search={{
                    labelWidth: 120,
                }}
                request={async () => {
                    return {
                        data: mockData,
                        success: true,
                        total: mockData.length,
                    };
                }}
                columns={columns}
            />
        </PageContainer>
    );
};

export default ChatModeration;
