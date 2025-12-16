import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, message, Modal } from 'antd';
import React, { useRef } from 'react';
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
                <a key="edit" onClick={() => message.info('编辑分类')}>
                    编辑
                </a>,
                <a key="delete" style={{ color: 'red' }} onClick={() => message.error('删除分类')}>
                    删除
                </a>,
            ],
        },
    ];

    return (
        <PageContainer>
            <ProTable<InterestItem>
                headerTitle="兴趣分类管理"
                actionRef={actionRef}
                rowKey="id"
                search={{
                    labelWidth: 120,
                }}
                toolBarRender={() => [
                    <Button key="button" icon={<PlusOutlined />} type="primary" onClick={() => message.info('新建分类')}>
                        新建
                    </Button>,
                ]}
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

export default InterestManage;
