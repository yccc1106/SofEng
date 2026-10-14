'use client';
import { useLanguage } from '@/lib/language';
import { ActionType, ModalForm, PageContainer, ProColumns, ProFormRadio, ProFormTextArea, ProTable } from '@ant-design/pro-components';
import { message } from 'antd';
import React, { useRef, useState } from 'react';

type SuggestionItem = {
    id: string;
    user: string;
    suggestion: string;
    status: string;
    date: string;
};



const Suggestions: React.FC = () => {
    const { t } = useLanguage();
    const actionRef = useRef<ActionType | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentRow, setCurrentRow] = useState<SuggestionItem | null>(null);

    const handleAction = async (id: string, status: string, note?: string) => {
        try {
            const res = await fetch('/java/admin/feedback', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status, note }),
            });
            const data = await res.json();
            if (data.success) {
                message.success(t('Processed successfully'));
                actionRef.current?.reload();
                return true;
            } else {
                message.error(t('Failed to process'));
                return false;
            }
        } catch {
            message.error(t('Error processing feedback'));
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
            title: t('用户'),
            dataIndex: 'user',
            width: 120,
            ellipsis: true,
        },
        {
            title: t('建议内容'),
            dataIndex: 'suggestion',
            ellipsis: true,
        },
        {
            title: t('状态'),
            dataIndex: 'status',
            width: 100,
            valueEnum: {
                PENDING: { text: t('待处理'), status: 'Processing' },
                PROCESSED: { text: t('已处理'), status: 'Success' },
                ADOPTED: { text: t('已采纳'), status: 'Success' },
                IGNORED: { text: t('已忽略'), status: 'Default' },
            },
        },
        {
            title: t('提交时间'),
            dataIndex: 'date',
            valueType: 'date',
            width: 120,
        },
        {
            title: t('操作'),
            valueType: 'option',
            width: 80,
            render: (_, record) => record.status === 'PENDING' ? [
                <a key="process" onClick={() => {
                    setCurrentRow(record);
                    setModalVisible(true);
                }}>
                    {t("处理")}
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
                headerTitle={t("User Suggestions")}
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
                    const res = await fetch('/java/admin/feedback?type=SUGGESTION');
                    return await res.json();
                }}
                columns={columns}
                className="bg-white rounded-lg shadow-sm"
            />
            <ModalForm
                title={t("处理建议")}
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
                    label={t("处理结果")}
                    options={[
                        { label: t('采纳'), value: 'ADOPTED' },
                        { label: t('暂不采纳 / 忽略'), value: 'IGNORED' },
                    ]}
                    rules={[{ required: true, message: t('请选择处理结果') }]}
                />
                <ProFormTextArea
                    name="note"
                    label={t("处理备注")}
                    placeholder={t("请输入备注信息（可选）")}
                />
            </ModalForm>
        </PageContainer>
    );
};

export default Suggestions;
