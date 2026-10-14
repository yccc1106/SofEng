'use client';
import { useLanguage } from '@/lib/language';
import { ActionType, ModalForm, PageContainer, ProColumns, ProFormSelect, ProFormText, ProFormTextArea, ProTable } from '@ant-design/pro-components';
import { Button, message, Popconfirm } from 'antd';
import React, { useRef, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';

type InterestItem = {
    id: string;
    name: string;
    parent: string;
    parentId?: string | null;
    description: string | null;
    count: number;
};

const InterestManage: React.FC = () => {
    const { t } = useLanguage();
    const actionRef = useRef<ActionType | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentRow, setCurrentRow] = useState<InterestItem | null>(null);
    const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string }[]>([]);

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/java/admin/interest?id=${id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                message.success(t('删除成功'));
                actionRef.current?.reload();
            } else {
                message.error(t('删除失败'));
            }
        } catch {
            message.error(t('删除错误'));
        }
    };

    const handleSubmit = async (values: { name: string; parentId?: string; description?: string }) => {
        const method = currentRow ? 'PUT' : 'POST';
        const body = currentRow ? { ...values, id: currentRow.id } : values;

        try {
            const res = await fetch('/java/admin/interest', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                message.success(currentRow ? t('更新成功') : t('创建成功'));
                setModalVisible(false);
                actionRef.current?.reload();
                return true;
            } else {
                message.error(t('操作失败'));
                return false;
            }
        } catch {
            message.error(t('操作异常'));
            return false;
        }
    };

    const columns: ProColumns<InterestItem>[] = [
        {
            title: 'ID',
            dataIndex: 'id',
            width: 48,
        },
        {
            title: t('分类名称'),
            dataIndex: 'name',
        },
        {
            title: t('父分类'),
            dataIndex: 'parent',
            filters: true,
            onFilter: true,
        },
        {
            title: t('描述'),
            dataIndex: 'description',
        },
        {
            title: t('关注人数'),
            dataIndex: 'count',
            sorter: true,
        },
        {
            title: t('操作'),
            valueType: 'option',
            render: (_, record) => [
                <a key="edit" onClick={() => {
                    setCurrentRow(record);
                    setModalVisible(true);
                }}>
                    {t("编辑")}
                </a>,
                <Popconfirm key="delete" title={t("确定删除吗?")} onConfirm={() => handleDelete(record.id)}>
                    <a style={{ color: 'red' }}>
                        {t("删除")}
                    </a>
                </Popconfirm>,
            ],
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
            <ProTable<InterestItem>
                headerTitle={t("Interest Categories")}
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
                toolBarRender={() => [
                    <Button key="button" icon={<PlusOutlined />} type="primary" onClick={() => {
                        setCurrentRow(null);
                        setModalVisible(true);
                    }}>
                        {t("Add Category")}
                    </Button>,
                ]}
                request={async () => {
                    const res = await fetch('/java/admin/interest');
                    const json = await res.json() as { success: boolean; data: InterestItem[] };
                    if (json.success) {
                        setCategoryOptions(json.data.map((item) => ({ label: item.name, value: item.id })));
                    }
                    return json;
                }}
                columns={columns}
                className="bg-white rounded-lg shadow-sm"
            />
            <ModalForm
                title={currentRow ? t('编辑分类') : t('新建分类')}
                open={modalVisible}
                onOpenChange={setModalVisible}
                modalProps={{ destroyOnClose: true }}
                initialValues={currentRow || {}}
                onFinish={handleSubmit}
            >
                <ProFormText
                    name="name"
                    label={t("分类名称")}
                    placeholder={t("请输入名称")}
                    rules={[{ required: true, message: t('请输入名称') }]}
                />
                <ProFormSelect
                    name="parentId"
                    label={t("父分类")}
                    placeholder={t("选择父分类（可选）")}
                    options={categoryOptions.filter(opt => opt.value !== currentRow?.id)}
                />
                <ProFormTextArea
                    name="description"
                    label={t("描述")}
                    placeholder={t("请输入描述")}
                />
            </ModalForm>
        </PageContainer>
    );
};

export default InterestManage;
