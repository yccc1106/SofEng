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

const RoomModeration: React.FC = () => {
    const actionRef = useRef<ActionType | null>(null);

    const handleAction = async (id: string, action: 'close') => {
        try {
            const res = await fetch('/api/admin/moderation/rooms', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action }),
            });
            const data = await res.json();
            if (data.success) {
                message.success('已解散房间');
                actionRef.current?.reload();
            } else {
                message.error('操作失败');
            }
        } catch (error) {
            message.error('操作异常');
        }
    };

    const columns: ProColumns<RoomItem>[] = [
        {
            title: 'ID',
            dataIndex: 'id',
            width: 100,
            copyable: true,
            ellipsis: true,
        },
        {
            title: '房间名',
            dataIndex: 'name',
            width: 150,
            ellipsis: true,
        },
        {
            title: '房主',
            dataIndex: 'owner',
            width: 120,
            ellipsis: true,
        },
        {
            title: '简介',
            dataIndex: 'description',
            ellipsis: true,
        },
        {
            title: '成员数',
            dataIndex: 'members',
            width: 80,
            sorter: true,
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            valueEnum: {
                recruiting: { text: '招募中', status: 'Processing' },
                full: { text: '已满员', status: 'Success' },
                disbanded: { text: '已解散', status: 'Error' },
            },
        },
        {
            title: '操作',
            valueType: 'option',
            width: 120,
            render: (_, record) => [
                <a key="check" onClick={() => message.info('检查房间信息: ' + record.name)}>
                    检查
                </a>,
                record.status !== 'disbanded' && (
                    <a key="close" style={{ color: 'red' }} onClick={() => handleAction(record.id, 'close')}>
                        解散
                    </a>
                ),
            ],
        },
    ];

    return (
        <PageContainer
            header={{
                title: " ",
                breadcrumb: {},
            }}
        >
            <ProTable<RoomItem>
                headerTitle="Room/Team Moderation"
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
                    const res = await fetch('/api/admin/moderation/rooms');
                    return await res.json();
                }}
                columns={columns}
            />
        </PageContainer>
    );
};

export default RoomModeration;
