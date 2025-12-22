'use client';
import { ActionType, ModalForm, PageContainer, ProColumns, ProFormRadio, ProFormTextArea, ProTable } from '@ant-design/pro-components';
import { Button, message, Tag } from 'antd';
import React, { useRef, useState } from 'react';

type ReportItem = {
    id: string;
    user: string;
    suggestion: string;
    status: string;
    date: string;
    reportType: string;
    target: any;
};

const Reports: React.FC = () => {
    const actionRef = useRef<ActionType | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentRow, setCurrentRow] = useState<ReportItem | null>(null);

    const handleAction = async (id: string, status: string, action?: string, note?: string) => {
        try {
            const res = await fetch('/api/admin/feedback', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status, action, note }),
            });
            const data = await res.json();
            if (data.success) {
                message.success('Processed successfully');
                actionRef.current?.reload();
                return true;
            } else {
                message.error('Failed to process');
                return false;
            }
        } catch (error) {
            message.error('Error processing report');
            return false;
        }
    };

    const getOptions = (reportType: string) => {
        switch (reportType) {
            case 'USER':
                return [
                    { label: '封禁用户 (Ban User)', value: 'BAN_USER' },
                    { label: '警告用户 (Warn User)', value: 'WARN_USER' },
                    { label: '解决 (已处理)', value: 'RESOLVE' },
                    { label: '忽略 (Ignore)', value: 'IGNORE' },
                ];
            case 'POST':
                return [
                    { label: '删除帖子 (Delete Post)', value: 'DELETE_POST' },
                    { label: '解决 (Keep Post)', value: 'RESOLVE' },
                    { label: '忽略 (Ignore)', value: 'IGNORE' },
                ];
            case 'MESSAGE':
                return [
                    { label: '删除消息 (Delete Message)', value: 'DELETE_MESSAGE' },
                    { label: '忽略 (Ignore)', value: 'IGNORE' },
                ];
            default:
                return [
                    { label: '标记为已解决', value: 'RESOLVE' },
                    { label: '忽略', value: 'IGNORE' },
                ];
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
            title: '举报对象',
            dataIndex: 'reportType',
            valueEnum: {
                USER: { text: '用户', status: 'Error' },
                POST: { text: '帖子', status: 'Warning' },
                MESSAGE: { text: '消息', status: 'Processing' },
            },
            width: 80,
        },
        {
            title: '举报详情',
            dataIndex: 'suggestion',
            ellipsis: true,
            render: (dom, record) => (
                <div>
                    <div>{dom}</div>
                    {record.target && (
                        <div className="text-xs text-gray-500 mt-1">
                            Target: {record.reportType === 'USER' ? record.target.name :
                                record.reportType === 'POST' ? record.target.title : 'Content'}
                        </div>
                    )}
                </div>
            )
        },
        {
            title: '状态',
            dataIndex: 'status',
            valueEnum: {
                PENDING: { text: '待处理', status: 'Processing' },
                PROCESSED: { text: '已处理', status: 'Success' },
                RESOLVED: { text: '已解决', status: 'Success' },
                IGNORED: { text: '已忽略', status: 'Default' },
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
            render: (_, record) => record.status === 'PENDING' ? [
                <a key="process" onClick={() => {
                    setCurrentRow(record);
                    setModalVisible(true);
                }}>
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
            <ModalForm
                title={`处理举报 - ${currentRow?.reportType || 'General'}`}
                open={modalVisible}
                onOpenChange={setModalVisible}
                onFinish={async (values) => {
                    if (currentRow) {
                        const action = values.method;
                        const status = action === 'IGNORE' ? 'IGNORED' : 'RESOLVED';
                        const success = await handleAction(currentRow.id, status, action, values.note);
                        return success;
                    }
                    return false;
                }}
            >
                <ProFormRadio.Group
                    name="method"
                    label="处理措施"
                    options={getOptions(currentRow?.reportType || '')}
                    rules={[{ required: true, message: '请选择处理结果' }]}
                />
                <ProFormTextArea
                    name="note"
                    label="处理备注"
                    placeholder="请输入备注信息（可选）"
                />
            </ModalForm>
        </PageContainer>
    );
};

export default Reports;
