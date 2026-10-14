'use client';
import { useLanguage } from '@/lib/language';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { message } from 'antd';
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
    const { t } = useLanguage();
    const actionRef = useRef<ActionType | null>(null);

    const handleAction = async (id: string, action: 'close') => {
        try {
            const res = await fetch('/java/admin/moderation/rooms', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action }),
            });
            const data = await res.json();
            if (data.success) {
                message.success(t('已解散房间'));
                actionRef.current?.reload();
            } else {
                message.error(t('操作失败'));
            }
        } catch {
            message.error(t('操作异常'));
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
            title: t('房间名'),
            dataIndex: 'name',
            width: 150,
            ellipsis: true,
        },
        {
            title: t('房主'),
            dataIndex: 'owner',
            width: 120,
            ellipsis: true,
        },
        {
            title: t('简介'),
            dataIndex: 'description',
            ellipsis: true,
        },
        {
            title: t('成员数'),
            dataIndex: 'members',
            width: 80,
            sorter: true,
        },
        {
            title: t('状态'),
            dataIndex: 'status',
            width: 100,
            valueEnum: {
                recruiting: { text: t('招募中'), status: 'Processing' },
                full: { text: t('已满员'), status: 'Success' },
                disbanded: { text: t('已解散'), status: 'Error' },
            },
        },
        {
            title: t('操作'),
            valueType: 'option',
            width: 120,
            render: (_, record) => [
                <a key="check" onClick={() => message.info(t('检查房间信息:') + ' ' + record.name)}>
                    {t("检查")}
                </a>,
                record.status !== 'disbanded' && (
                    <a key="close" style={{ color: 'red' }} onClick={() => handleAction(record.id, 'close')}>
                        {t("解散")}
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
                headerTitle={t("Room/Team Moderation")}
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
                    const res = await fetch('/java/admin/moderation/rooms');
                    return await res.json();
                }}
                columns={columns}
            />
        </PageContainer>
    );
};

export default RoomModeration;
