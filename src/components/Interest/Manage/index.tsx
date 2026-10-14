'use client';
import { ActionType, ModalForm, PageContainer, ProColumns, ProFormSelect, ProFormText, ProFormTextArea, ProTable } from '@ant-design/pro-components';
import { Button, message, Modal, Popconfirm } from 'antd';
import React, { useRef, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';

type InterestItem = {
    id: string;
    name: string;
    parent: string;
    description: string;
    count: number;
};

const mockData: InterestItem[] = [
    { id: '1', name: '篮球', parent: '运动', description: '篮球爱好者聚集地', count: 5000 },
    { id: '2', name: '足球', parent: '运动', description: '绿茵场上的激情', count: 3200 },
    { id: '3', name: '编程', parent: '学习', description: '代码改变世界', count: 8000 },
    { id: '4', name: '摄影', parent: '艺术', description: '记录美好瞬间', count: 1500 },
    { id: '5', name: '原神', parent: '游戏', description: '开放世界冒险', count: 12000 },
];

const InterestManage: React.FC = () => {
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
                message.success('删除成功');
                actionRef.current?.reload();
            } else {
                message.error('删除失败');
            }
        } catch (error) {
            message.error('删除错误');
        }
    };

    const handleSubmit = async (values: any) => {
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
                message.success(currentRow ? '更新成功' : '创建成功');
                setModalVisible(false);
                actionRef.current?.reload();
                return true;
            } else {
                message.error('操作失败');
                return false;
            }
        } catch (error) {
            message.error('操作异常');
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
            title: '分类名称',
            dataIndex: 'name',
        },
        {
            title: '父分类',
            dataIndex: 'parent',
            filters: true,
            onFilter: true,
        },
        {
            title: '描述',
            dataIndex: 'description',
        },
        {
            title: '关注人数',
            dataIndex: 'count',
            sorter: true,
        },
        {
            title: '操作',
            valueType: 'option',
            render: (_, record) => [
                <a key="edit" onClick={() => {
                    setCurrentRow(record);
                    setModalVisible(true);
                }}>
                    编辑
                </a>,
                <Popconfirm key="delete" title="确定删除吗?" onConfirm={() => handleDelete(record.id)}>
                    <a style={{ color: 'red' }}>
                        删除
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
                headerTitle="Interest Categories"
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
                        Add Category
                    </Button>,
                ]}
                request={async () => {
                    const res = await fetch('/java/admin/interest');
                    const json = await res.json();
                    if (json.success) {
                        setCategoryOptions(json.data.map((item: any) => ({ label: item.name, value: item.id })));
                    }
                    return json;
                }}
                columns={columns}
                className="bg-white rounded-lg shadow-sm"
            />
            <ModalForm
                title={currentRow ? '编辑分类' : '新建分类'}
                open={modalVisible}
                onOpenChange={setModalVisible}
                modalProps={{ destroyOnClose: true }}
                initialValues={currentRow || {}}
                onFinish={handleSubmit}
            >
                <ProFormText
                    name="name"
                    label="分类名称"
                    placeholder="请输入名称"
                    rules={[{ required: true, message: '请输入名称' }]}
                />
                <ProFormSelect
                    name="parentId"
                    label="父分类"
                    placeholder="选择父分类（可选）"
                    options={categoryOptions.filter(opt => opt.value !== currentRow?.id)}
                />
                <ProFormTextArea
                    name="description"
                    label="描述"
                    placeholder="请输入描述"
                />
            </ModalForm>
        </PageContainer>
    );
};

export default InterestManage;
