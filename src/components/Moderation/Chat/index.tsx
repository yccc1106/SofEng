'use client';
import { useLanguage } from '@/lib/language';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { App, Tag } from 'antd';
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

/** 管理员查看消息并屏蔽违规内容。 */
const ChatModeration: React.FC = () => {
    const { t } = useLanguage();
    const { message } = App.useApp();
    const actionRef = useRef<ActionType | null>(null);

    const handleAction = async (id: string) => {
            try {
                const res = await fetch(`/java/admin/moderation/chats?id=${id}`, {
                    method: 'DELETE',
                });
                const data = await res.json();
                if (data.success) {
                    message.success(t('消息已屏蔽'));
                    actionRef.current?.reload();
                } else {
                    message.error(t('操作失败'));
                }
            } catch {
                message.error(t('请求错误'));
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
            title: t('发送者'),
            dataIndex: 'sender',
            width: 120,
            ellipsis: true,
        },
        {
            title: t('接收者'),
            dataIndex: 'receiver',
            width: 120,
            ellipsis: true,
        },
        {
            title: t('内容摘要'),
            dataIndex: 'content',
            ellipsis: true,
        },
        {
            title: t('风险等级'),
            dataIndex: 'riskLevel',
            width: 100,
            render: (_, record) => {
                const color = record.riskLevel === 'high' ? 'red' : record.riskLevel === 'medium' ? 'orange' : 'green';
                return <Tag color={color}>{record.riskLevel.toUpperCase()}</Tag>;
            },
        },
        {
            title: t('时间'),
            dataIndex: 'timestamp',
            render: (_, record) => shanghaiDateTime(record.timestamp),
            width: 160,
        },
        {
            title: t('操作'),
            valueType: 'option',
            width: 120,
            render: (_, record) => [
                record.moderationStatus === 'VISIBLE' && <a key="block" style={{ color: 'red' }} onClick={() => handleAction(record.id)}>
                    {t('屏蔽')}
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
                headerTitle={t("Chat Moderation (Recent Messages)")}
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
