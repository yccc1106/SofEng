'use client';
import { useLanguage } from '@/lib/language';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, message, Image } from 'antd';
import React, { useRef } from 'react';
import { shanghaiDate } from '@/lib/shanghai-time';

type PostItem = {
    id: string;
    author: string;
    title: string;
    content: string;
    imageUrl?: string;
    status: string;
    date: string;
};

const mockData: PostItem[] = Array.from({ length: 15 }).map((_, i) => ({
    id: `${i + 1}`,
    author: `Author ${i}`,
    title: `这是帖子标题 ${i}`,
    content: `这是帖子内容详情，包含一些文字描述...`,
    imageUrl: i % 2 === 0 ? 'https://gw.alipayobjects.com/zos/rmsportal/mqaQswcyDLcXyDKnZfES.png' : undefined,
    status: 'pending',
    date: `2024-05-21`,
}));

const PostModeration: React.FC = () => {
    const { t } = useLanguage();
    const actionRef = useRef<ActionType | null>(null);

    const handleAction = async (id: string, action: 'pass' | 'reject') => {
        try {
            const res = await fetch('/java/admin/moderation/posts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action }),
            });
            const data = await res.json();
            if (data.success) {
                message.success('Success');
                actionRef.current?.reload();
            } else {
                message.error('Failed');
            }
        } catch (error) {
            message.error('Error');
        }
    };

    const columns: ProColumns<PostItem>[] = [
        {
            title: 'ID',
            dataIndex: 'id',
            width: 100,
            copyable: true,
            ellipsis: true,
        },
        {
            title: t('作者'),
            dataIndex: 'author',
            width: 120,
            ellipsis: true,
        },
        {
            title: t('标题'),
            dataIndex: 'title',
            ellipsis: true,
        },
        {
            title: t('配图'),
            dataIndex: 'imageUrl',
            width: 80,
            render: (_, record) => {
                return record.imageUrl ? <Image src={record.imageUrl} width={50} /> : '-';
            },
        },
        {
            title: t('状态'),
            dataIndex: 'status',
            width: 100,
            valueEnum: {
                pending: { text: t('待审核'), status: 'Processing' },
                approved: { text: t('已通过'), status: 'Success' },
                rejected: { text: t('已拒绝'), status: 'Error' },
            },
        },
        {
            title: t('发布时间'),
            dataIndex: 'date',
            render: (_, record) => shanghaiDate(record.date),
            width: 120,
        },
        {
            title: t('操作'),
            valueType: 'option',
            width: 150,
            render: (_, record) => [
                <a key="view" onClick={() => message.info(t('查看详情:') + ' ' + record.content)}>
                    {t("查看")}
                </a>,
                record.status === 'pending' && <a key="pass" onClick={() => handleAction(record.id, 'pass')}>
                    {t("通过")}
                </a>,
                record.status === 'pending' && <a key="reject" style={{ color: 'red' }} onClick={() => handleAction(record.id, 'reject')}>
                    {t("拒绝")}
                </a>,
            ],
        },
    ];

    return (
        <PageContainer
            header={{
                title: " ", // Hide default title
                breadcrumb: {}, // Hide breadcrumb if redundant
            }}
        >
            <ProTable<PostItem>
                headerTitle={t("Moderation Queue")}
                actionRef={actionRef}
                rowKey="id"
                scroll={{ x: 'max-content' }}
                search={{
                    labelWidth: 120,
                    filterType: 'light', // Cleaner search
                }}
                cardBordered // Adds a subtle border, matching the card aesthetic
                options={{
                    density: false,
                    fullScreen: true,
                    setting: true,
                }}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                }}
                request={async (params) => {
                    // params contains pageSize, current, and filters
                    // For simplicity, we just fetch all or filter by mapped status if we implemented server side filtering strictly
                    // Here we fetch all from our simple API
                    const res = await fetch('/java/admin/moderation/posts');
                    return await res.json();
                }}
                columns={columns}
            />
        </PageContainer>
    );
};

export default PostModeration;
