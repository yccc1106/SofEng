'use client';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, message, Tag } from 'antd';
import React, { useRef } from 'react';

type RoomItem = {
    id: string;
    name: string;
    owner: string;
    description: string;
    members: number;
    status: string;
};

const mockData: RoomItem[] = Array.from({ length: 10 }).map((_, i) => ({
    id: `${i + 1}`,
    name: `交友小窝 ${i}`,
    owner: `User Owner ${i}`,
    description: `这是一个用于交流的房间...`,
    members: 10 + i * 5,
    status: i % 4 === 0 ? 'reviewing' : 'active',
}));

const RoomModeration: React.FC = () => {
    const actionRef = useRef<ActionType | null>(null);

    const columns: ProColumns<RoomItem>[] = [
        {
            title: 'ID',
            dataIndex: 'id',
            width: 48,
        },
        {
            title: '房间名',
            dataIndex: 'name',
        },
        {
            title: '房主',
            dataIndex: 'owner',
        },
        {
            title: '简介',
            dataIndex: 'description',
        },
        {
            title: '成员数',
            dataIndex: 'members',
            sorter: true,
        },
        {
            title: '状态',
            dataIndex: 'status',
            valueEnum: {
                active: { text: '正常', status: 'Success' },
                reviewing: { text: '审核中', status: 'Processing' },
                closed: { text: '已解散', status: 'Error' },
            },
        },
        {
            title: '操作',
            valueType: 'option',
            render: (_, record) => [
                <a key="check" onClick={() => message.info('检查房间信息')}>
                    检查
                </a>,
                <a key="close" style={{ color: 'red' }} onClick={() => message.warning('解散房间')}>
                    解散
                </a>,
            ],
        },
    ];

    return (
        <PageContainer>
            <ProTable<RoomItem>
                headerTitle="房间规范审核"
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

export default RoomModeration;
