'use client';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, message } from 'antd';
import React, { useRef } from 'react';

type ReportItem = {
    id: string;
    reporter: string;
    reportedUser: string;
    reason: string;
    status: string;
    date: string;
};

const mockData: ReportItem[] = Array.from({ length: 15 }).map((_, i) => ({
    id: `${i + 1}`,
    reporter: `User A${i}`,
    reportedUser: `User B${i}`,
    reason: ['骚扰辱骂', '发布广告', '不当言论'][i % 3],
    status: i % 2 === 0 ? 'pending' : 'resolved',
    date: `2024-05-${12 + i}`,
}));

const Reports: React.FC = () => {
    const actionRef = useRef<ActionType | null>(null);

    const columns: ProColumns<ReportItem>[] = [
        {
            title: 'ID',
            dataIndex: 'id',
            width: 48,
        },
        {
            title: '举报人',
            dataIndex: 'reporter',
        },
        {
            title: '被举报人',
            dataIndex: 'reportedUser',
        },
        {
            title: '举报原因',
            dataIndex: 'reason',
        },
        {
            title: '状态',
            dataIndex: 'status',
            valueEnum: {
                pending: { text: '待处理', status: 'Processing' },
                resolved: { text: '已处理', status: 'Success' },
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
                <a key="audit" onClick={() => message.info('进入审核流程')}>
                    审核
                </a>,
            ],
        },
    ];

    return (
        <PageContainer>
            <ProTable<ReportItem>
                headerTitle="用户举报列表"
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

export default Reports;
