'use client';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, message, Tag } from 'antd';
import React, { useRef } from 'react';

type SuggestionItem = {
    id: string;
    user: string;
    suggestion: string;
    status: string;
    date: string;
};

const mockData: SuggestionItem[] = Array.from({ length: 20 }).map((_, i) => ({
    id: `${i + 1}`,
    user: `User ${i + 1}`,
    suggestion: `这是第 ${i + 1} 条用户建议，希望平台能够改进...`,
    status: i % 3 === 0 ? 'accepted' : i % 3 === 1 ? 'pending' : 'rejected',
    date: `2024-05-${10 + i}`,
}));

const Suggestions: React.FC = () => {
    const actionRef = useRef<ActionType | null>(null);

    const columns: ProColumns<SuggestionItem>[] = [
        {
            title: 'ID',
            dataIndex: 'id',
            width: 48,
        },
        {
            title: '用户',
            dataIndex: 'user',
        },
        {
            title: '建议内容',
            dataIndex: 'suggestion',
            ellipsis: true,
        },
        {
            title: '状态',
            dataIndex: 'status',
            valueEnum: {
                pending: { text: '待处理', status: 'Processing' },
                accepted: { text: '已采纳', status: 'Success' },
                rejected: { text: '已驳回', status: 'Error' },
            },
        },
        {
            title: '提交时间',
            dataIndex: 'date',
            valueType: 'date',
        },
        {
            title: '操作',
            valueType: 'option',
            render: (_, record) => [
                <a key="process" onClick={() => message.success('处理成功')}>
                    处理
                </a>,
            ],
        },
    ];

    return (
        <PageContainer>
            <ProTable<SuggestionItem>
                headerTitle="用户建议列表"
                actionRef={actionRef}
                rowKey="id"
                search={{
                    labelWidth: 120,
                }}
                request={async (params, sort, filter) => {
                    // Mock request
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

export default Suggestions;
