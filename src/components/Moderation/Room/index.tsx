'use client';
import { useLanguage } from '@/lib/language';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { App, Avatar, Button, Descriptions, Image, Modal, Space, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { javaAction } from '@/lib/java-client';

type RoomItem = {
    id: string;
    name: string;
    owner: string;
    ownerAvatar?: string | null;
    description: string;
    image?: string | null;
    members: number;
    status: string;
};

const statusTag = (status: string, t: (text: string) => string) => {
    if (status === 'recruiting') return <Tag color="blue">{t('招募中')}</Tag>;
    if (status === 'full') return <Tag color="green">{t('已满员')}</Tag>;
    return <Tag color="red">{t('已解散')}</Tag>;
};

/** 管理员只读核对队伍信息，并关闭违规房间。 */
const RoomModeration: React.FC = () => {
    const { t } = useLanguage();
    const { message } = App.useApp();
    const actionRef = useRef<ActionType | null>(null);
    const [selected, setSelected] = useState<RoomItem | null>(null);

    const handleAction = async (id: string, action: 'close') => {
        try {
            await javaAction('/admin/moderation/rooms', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action }),
            });
            message.success(t('已解散房间'));
            setSelected(null);
            actionRef.current?.reload();
        } catch (error) {
            message.error(error instanceof Error ? error.message : t('操作异常'));
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
            title: t('团队图片'),
            dataIndex: 'image',
            width: 90,
            render: (_, record) => record.image ? (
                <Image
                    src={record.image}
                    alt={record.name}
                    width={56}
                    height={56}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                />
            ) : '-',
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
                <a key="check" onClick={() => setSelected(record)}>
                    {t("查看详情")}
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
            <Modal
                title={t('审核详情')}
                open={selected !== null}
                onCancel={() => setSelected(null)}
                width={680}
                footer={[
                    <Button key="close" onClick={() => setSelected(null)}>{t('取消')}</Button>,
                    selected?.status !== 'disbanded' && (
                        <Button key="disband" danger onClick={() => selected && handleAction(selected.id, 'close')}>
                            {t('解散')}
                        </Button>
                    ),
                ]}
            >
                {selected && (
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="ID">{selected.id}</Descriptions.Item>
                        <Descriptions.Item label={t('房间名')}>{selected.name}</Descriptions.Item>
                        <Descriptions.Item label={t('房主')}>
                            <Space>
                                <Avatar src={selected.ownerAvatar} size="small" />
                                {selected.owner}
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('成员数')}>{selected.members}</Descriptions.Item>
                        <Descriptions.Item label={t('状态')}>{statusTag(selected.status, t)}</Descriptions.Item>
                        <Descriptions.Item label={t('简介')}>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{selected.description || '-'}</div>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('团队图片')}>
                            {selected.image ? (
                                <Image
                                    src={selected.image}
                                    alt={selected.name}
                                    width={180}
                                    height={120}
                                    style={{ objectFit: 'cover', borderRadius: 6 }}
                                />
                            ) : '-'}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </PageContainer>
    );
};

export default RoomModeration;
