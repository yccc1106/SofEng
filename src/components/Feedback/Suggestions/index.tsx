'use client';
import { ActionType, ModalForm, PageContainer, ProColumns, ProFormRadio, ProFormTextArea, ProTable } from '@ant-design/pro-components';
import { Button, message, Tag } from 'antd';
import React, { useRef, useState } from 'react';

type SuggestionItem = {
    id: string;
    user: string;
    suggestion: string;
    status: string;
    date: string;
};



const Suggestions: React.FC = () => {
    const actionRef = useRef<ActionType | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentRow, setCurrentRow] = useState<SuggestionItem | null>(null);

    const handleAction = async (id: string, status: string, note?: string) => {
        try {
            const res = await fetch('/api/admin/feedback', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status, note }),
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
            message.error('Error processing feedback');
            return false;
        }
    };

    const columns: ProColumns<SuggestionItem>[] = [
        {
            title: 'ID',
            dataIndex: 'id',
            width: 100,
            copyable: true,
            ellipsis: true,
        },
        {
            title: '用户',
            dataIndex: 'user',
            width: 120,
            ellipsis: true,
        },
        {
            title: '建议内容',
            dataIndex: 'suggestion',
            ellipsis: true,
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 120,
            align: 'center',
            fixed:'right',
            valueEnum: {
                PENDING: { text: '待处理', status: 'Processing' },
                PROCESSED: { text: '已处理', status: 'Success' },
                ADOPTED: { text: '已采纳', status: 'Success' },
                IGNORED: { text: '已忽略', status: 'Default' },
            },
        },
        {
            title: '提交时间',
            dataIndex: 'date',
            valueType: 'date',
            width: 120,
        },
        {
            title: '操作',
            valueType: 'option',
            width: 80,
            fixed: 'right',
            align: 'center',
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
            <ProTable<SuggestionItem>
                headerTitle="User Suggestions"
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
                request={async (params) => {
                    const res = await fetch('/api/admin/feedback?type=SUGGESTION');
                    return await res.json();
                }}
                columns={columns}
                className="bg-white rounded-lg shadow-sm"
            />
            <ModalForm
                title="处理建议"
                open={modalVisible}
                onOpenChange={setModalVisible}
                onFinish={async (values) => {
                    if (currentRow) {
                        const success = await handleAction(currentRow.id, values.method, values.note);
                        return success;
                    }
                    return false;
                }}
            >
                <ProFormRadio.Group
                    name="method"
                    label="处理结果"
                    options={[
                        { label: '采纳', value: 'ADOPTED' },
                        { label: '暂不采纳 / 忽略', value: 'IGNORED' },
                    ]}
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

export default Suggestions;
