'use client';
import { useLanguage } from '@/lib/language';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { App, Avatar, Button, Descriptions, Image, Modal, Space, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { shanghaiDate } from '@/lib/shanghai-time';
import { javaAction } from '@/lib/java-client';

type PostItem = {
    id: string;
    author: string;
    authorAvatar?: string | null;
    title: string;
    content: string;
    images?: string[];
    category?: string | null;
    status: string;
    date: string;
};

const statusTag = (status: string, t: (text: string) => string) => {
    if (status === 'pending') return <Tag color="orange">{t('待审核')}</Tag>;
    if (status === 'approved') return <Tag color="green">{t('已通过')}</Tag>;
    return <Tag color="red">{t('已拒绝')}</Tag>;
};

/** 审核帖子；详情弹窗只用于信息回显，管理员不能改写用户内容。 */
const PostModeration: React.FC = () => {
    const { t } = useLanguage();
    const { message } = App.useApp();
    const actionRef = useRef<ActionType | null>(null);
    const [selected, setSelected] = useState<PostItem | null>(null);

    const handleAction = async (id: string, action: 'pass' | 'reject') => {
        try {
            await javaAction('/admin/moderation/posts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action }),
            });
            message.success(t('操作成功'));
            setSelected(null);
            actionRef.current?.reload();
        } catch (error) {
            message.error(error instanceof Error ? error.message : t('操作失败'));
        }
    };

    const columns: ProColumns<PostItem>[] = [
        {
            title: 'ID',
            dataIndex: 'id',
            width: 100,
            copyable: true,
            ellipsis: true,
        },
        {
            title: t('作者'),
            dataIndex: 'author',
            width: 120,
            ellipsis: true,
        },
        {
            title: t('标题'),
            dataIndex: 'title',
            ellipsis: true,
        },
        {
            title: t('配图'),
            dataIndex: 'images',
            width: 180,
            render: (_, record) => {
                const images = record.images ?? [];
                if (!images.length) return '-';
                return (
                    <Image.PreviewGroup>
                        <Space size={4}>
                            {images.slice(0, 3).map((image) => (
                                <Image
                                    key={image}
                                    src={image}
                                    alt={record.title || t('帖子图片')}
                                    width={44}
                                    height={44}
                                    style={{ objectFit: 'cover', borderRadius: 4 }}
                                />
                            ))}
                            {images.length > 3 && <Tag>+{images.length - 3}</Tag>}
                        </Space>
                    </Image.PreviewGroup>
                );
            },
        },
        {
            title: t('状态'),
            dataIndex: 'status',
            width: 100,
            valueEnum: {
                pending: { text: t('待审核'), status: 'Processing' },
                approved: { text: t('已通过'), status: 'Success' },
                rejected: { text: t('已拒绝'), status: 'Error' },
            },
        },
        {
            title: t('发布时间'),
            dataIndex: 'date',
            render: (_, record) => shanghaiDate(record.date),
            width: 120,
        },
        {
            title: t('操作'),
            valueType: 'option',
            width: 150,
            render: (_, record) => [
                <a key="view" onClick={() => setSelected(record)}>
                    {t("查看详情")}
                </a>,
                record.status === 'pending' && <a key="pass" onClick={() => handleAction(record.id, 'pass')}>
                    {t("通过")}
                </a>,
                record.status === 'pending' && <a key="reject" style={{ color: 'red' }} onClick={() => handleAction(record.id, 'reject')}>
                    {t("拒绝")}
                </a>,
            ],
        },
    ];

    return (
        <PageContainer
            header={{
                title: " ", // Hide default title
                breadcrumb: {}, // Hide breadcrumb if redundant
            }}
        >
            <ProTable<PostItem>
                headerTitle={t("Moderation Queue")}
                actionRef={actionRef}
                rowKey="id"
                scroll={{ x: 'max-content' }}
                search={{
                    labelWidth: 120,
                    filterType: 'light', // Cleaner search
                }}
                cardBordered // Adds a subtle border, matching the card aesthetic
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
                    const res = await fetch('/java/admin/moderation/posts');
                    return await res.json();
                }}
                columns={columns}
            />
            <Modal
                title={t('审核详情')}
                open={selected !== null}
                onCancel={() => setSelected(null)}
                width={720}
                footer={[
                    <Button key="close" onClick={() => setSelected(null)}>{t('取消')}</Button>,
                    selected?.status === 'pending' && (
                        <Button key="reject" danger onClick={() => selected && handleAction(selected.id, 'reject')}>
                            {t('拒绝')}
                        </Button>
                    ),
                    selected?.status === 'pending' && (
                        <Button key="pass" type="primary" onClick={() => selected && handleAction(selected.id, 'pass')}>
                            {t('通过')}
                        </Button>
                    ),
                ]}
            >
                {selected && (
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="ID">{selected.id}</Descriptions.Item>
                        <Descriptions.Item label={t('作者')}>
                            <Space>
                                <Avatar src={selected.authorAvatar} size="small" />
                                {selected.author}
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('标题')}>{selected.title || '-'}</Descriptions.Item>
                        <Descriptions.Item label={t('分类')}>{selected.category || '-'}</Descriptions.Item>
                        <Descriptions.Item label={t('状态')}>{statusTag(selected.status, t)}</Descriptions.Item>
                        <Descriptions.Item label={t('发布时间')}>{shanghaiDate(selected.date)}</Descriptions.Item>
                        <Descriptions.Item label={t('内容')}>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{selected.content}</div>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('帖子图片')}>
                            {selected.images?.length ? (
                                <Image.PreviewGroup>
                                    <Space wrap>
                                        {selected.images.map((image) => (
                                            <Image
                                                key={image}
                                                src={image}
                                                alt={selected.title || t('帖子图片')}
                                                width={120}
                                                height={120}
                                                style={{ objectFit: 'cover', borderRadius: 6 }}
                                            />
                                        ))}
                                    </Space>
                                </Image.PreviewGroup>
                            ) : '-'}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </PageContainer>
    );
};

export default PostModeration;
