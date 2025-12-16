'use client';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, message, Image } from 'antd';
import React, { useRef } from 'react';

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
    const actionRef = useRef<ActionType | null>(null);

    const columns: ProColumns<PostItem>[] = [
        {
            title: 'ID',
            dataIndex: 'id',
            width: 48,
        },
        {
            title: '作者',
            dataIndex: 'author',
        },
        {
            title: '标题',
            dataIndex: 'title',
        },
        {
            title: '配图',
            dataIndex: 'imageUrl',
            render: (_, record) => {
                return record.imageUrl ? <Image src={record.imageUrl} width={50} /> : '-';
            },
        },
        {
            title: '状态',
            dataIndex: 'status',
            valueEnum: {
                pending: { text: '待审核', status: 'Processing' },
                approved: { text: '已通过', status: 'Success' },
                rejected: { text: '已拒绝', status: 'Error' },
            },
        },
        {
            title: '发布时间',
            dataIndex: 'date',
            valueType: 'date',
        },
        {
            title: '操作',
            valueType: 'option',
            render: (_, record) => [
                <a key="view" onClick={() => message.info('查看详情')}>
                    查看
                </a>,
                <a key="pass" onClick={() => message.success('通过')}>
                    通过
                </a>,
                <a key="reject" style={{ color: 'red' }} onClick={() => message.error('拒绝')}>
                    拒绝
                </a>,
            ],
        },
    ];

    return (
        <PageContainer>
            <ProTable<PostItem>
                headerTitle="帖子内容审核"
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

export default PostModeration;
