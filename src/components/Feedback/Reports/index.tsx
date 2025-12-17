'use client';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, message, Tag } from 'antd';
import React, { useRef } from 'react';

type ReportItem = {
    id: string;
    user: string;
    suggestion: string; // reused field name from API mapping but logically it is report content
    status: string;
    date: string;
};

const Reports: React.FC = () => {
    const actionRef = useRef<ActionType | null>(null);

    const handleAction = async (id: string, status: string) => {
        try {
            const res = await fetch('/api/admin/feedback', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status }),
            });
            const data = await res.json();
            if (data.success) {
                message.success('Processed successfully');
                actionRef.current?.reload();
            } else {
                message.error('Failed to process');
            }
        } catch (error) {
            message.error('Error processing report');
        }
    };

    const columns: ProColumns<ReportItem>[] = [
        {
            title: 'ID',
            dataIndex: 'id',
            width: 48,
        },
        {
            title: '举报人',
            dataIndex: 'user',
        },
        {
            title: '举报详情',
            dataIndex: 'suggestion',
            ellipsis: true,
        },
        {
            title: '状态',
            dataIndex: 'status',
            valueEnum: {
                pending: { text: '待处理', status: 'Processing' },
                processed: { text: '已处理', status: 'Success' },
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
            render: (_, record) => record.status === 'pending' ? [
                <a key="process" onClick={() => handleAction(record.id, 'PROCESSED')}>
                    处理
                </a>,
            ] : [],
        },
    ];

    return (
        <PageContainer
            header={{
                title: " ",
                breadcrumb: {},
            }}
            className="p-0"
        >
            <ProTable<ReportItem>
                headerTitle="Report Management"
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
                request={async (params) => {
                    const res = await fetch('/api/admin/feedback?type=REPORT');
                    return await res.json();
                }}
                columns={columns}
                className="bg-white rounded-lg shadow-sm"
            />
        </PageContainer>
    );
};

export default Reports;
