'use client';
import { useLanguage } from '@/lib/language';
import { ActionType, ModalForm, PageContainer, ProColumns, ProFormRadio, ProFormTextArea, ProTable } from '@ant-design/pro-components';
import { message } from 'antd';
import React, { useRef, useState } from 'react';

type ReportItem = {
    id: string;
    user: string;
    suggestion: string;
    status: string;
    date: string;
    reportType: string;
    target: { name?: string; title?: string; content?: string } | null;
};

const Reports: React.FC = () => {
    const { t } = useLanguage();
    const actionRef = useRef<ActionType | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentRow, setCurrentRow] = useState<ReportItem | null>(null);

    const handleAction = async (id: string, status: string, action?: string, note?: string) => {
        try {
            const res = await fetch('/java/admin/feedback', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status, action, note }),
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
            message.error(t('Error processing report'));
            return false;
        }
    };

    const getOptions = (reportType: string) => {
        switch (reportType) {
            case 'USER':
                return [
                    { label: t('封禁用户'), value: 'BAN_USER' },
                    { label: t('记录警告（不会通知用户）'), value: 'WARN_USER' },
                    { label: t('解决 (已处理)'), value: 'RESOLVE' },
                    { label: t('忽略'), value: 'IGNORE' },
                ];
            case 'POST':
                return [
                    { label: t('删除帖子'), value: 'DELETE_POST' },
                    { label: t('保留帖子并解决'), value: 'RESOLVE' },
                    { label: t('忽略'), value: 'IGNORE' },
                ];
            case 'MESSAGE':
                return [
                    { label: t('屏蔽消息'), value: 'DELETE_MESSAGE' },
                    { label: t('忽略'), value: 'IGNORE' },
                ];
            default:
                return [
                    { label: t('标记为已解决'), value: 'RESOLVE' },
                    { label: t('忽略'), value: 'IGNORE' },
                ];
        }
    };

    const columns: ProColumns<ReportItem>[] = [
        {
            title: 'ID',
            dataIndex: 'id',
            width: 100,
            copyable: true,
            ellipsis: true,
        },
        {
            title: t('举报人'),
            dataIndex: 'user',
            width: 120,
            ellipsis: true,
        },
        {
            title: t('举报对象'),
            dataIndex: 'reportType',
            valueEnum: {
                USER: { text: t('用户'), status: 'Error' },
                POST: { text: t('帖子'), status: 'Warning' },
                MESSAGE: { text: t('消息'), status: 'Processing' },
            },
            width: 100,
        },
        {
            title: t('举报详情'),
            dataIndex: 'suggestion',
            ellipsis: true,
            render: (dom, record) => (
                <div>
                    <div>{dom}</div>
                    {record.target && (
                        <div className="text-xs text-gray-500 mt-1">
                            {t('目标')}: {record.reportType === 'USER' ? record.target.name :
                                record.reportType === 'POST' ? record.target.title : t('Content')}
                        </div>
                    )}
                </div>
            )
        },
        {
            title: t('状态'),
            dataIndex: 'status',
            width: 100,
            valueEnum: {
                PENDING: { text: t('待处理'), status: 'Processing' },
                PROCESSED: { text: t('已处理'), status: 'Success' },
                RESOLVED: { text: t('已解决'), status: 'Success' },
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
            <ProTable<ReportItem>
                headerTitle={t("Report Management")}
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
                    const res = await fetch('/java/admin/feedback?type=REPORT');
                    return await res.json();
                }}
                columns={columns}
                className="bg-white rounded-lg shadow-sm"
            />
            <ModalForm
                title={`${t('处理举报')} - ${currentRow?.reportType ? t(({ USER: '用户', POST: '帖子', MESSAGE: '消息' } as Record<string, string>)[currentRow.reportType] || currentRow.reportType) : t('General')}`}
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
                    label={t("处理措施")}
                    options={getOptions(currentRow?.reportType || '')}
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

export default Reports;
