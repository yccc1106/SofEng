'use client';
import React from 'react';
import { Card, Avatar, Typography, Space, Button, Tag, Divider, Flex, theme } from 'antd';
import { LikeOutlined, StarOutlined, MessageOutlined, EllipsisOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Paragraph } = Typography;

interface PostProps {
    post: any;
    showActions?: boolean;
}

const PostCard: React.FC<PostProps> = ({ post, showActions = true }) => {
    const { token } = theme.useToken();
    const actions = showActions ? [
        <Button key="like" type="text" icon={<LikeOutlined />} size="small" style={{ fontSize: 12, color: token.colorTextSecondary }}>
            {post._count?.likes || 0}
        </Button>,
        <Button key="comment" type="text" icon={<MessageOutlined />} size="small" style={{ fontSize: 12, color: token.colorTextSecondary }}>
            Comment
        </Button>,
        <Button key="collect" type="text" icon={<StarOutlined />} size="small" style={{ fontSize: 12, color: token.colorTextSecondary }}>
            {post._count?.collections || 0}
        </Button>
    ] : undefined;

    return (
        <Card
            style={{
                marginBottom: 16,
                borderRadius: token.borderRadiusLG,
                border: 'none',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
            styles={{ body: { padding: '16px' } }}
            actions={actions}
        >
            <Flex align="start" style={{ marginBottom: 12 }}>
                <Avatar src={post.author?.image} style={{ marginRight: 12, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                    <Flex justify="space-between">
                        <h4 style={{ margin: 0, fontWeight: 'bold', fontSize: 16, color: token.colorTextBase }}>{post.author?.name}</h4>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{dayjs(post.createdAt).fromNow()}</Typography.Text>
                    </Flex>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {post.author?.school} | {post.author?.role === 'ADMIN' ? 'Administrator' : 'Student'}
                    </Typography.Text>
                </div>
            </Flex>

            <Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>{post.title}</Title>

            <Paragraph
                ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}
                style={{ color: token.colorText }}
            >
                {post.content}
            </Paragraph>

            {post.images && post.images.length > 0 && (
                <Flex gap={8} style={{ marginBottom: 12, overflowX: 'auto' }}>
                    {/* Placeholder for images, real app would use <Image /> */}
                    {post.images.map((img: string, idx: number) => (
                        <div
                            key={idx}
                            style={{
                                height: 96,
                                width: 96,
                                backgroundColor: token.colorFillContent,
                                borderRadius: token.borderRadiusSM,
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                color: token.colorTextSecondary,
                            }}
                        >
                            Image {idx + 1}
                        </div>
                    ))}
                </Flex>
            )}

            {post.tags && (
                <Space style={{ marginBottom: 12 }} wrap>
                    {post.tags.map((tag: string) => (
                        <Tag key={tag} style={{ fontSize: 12 }}>{tag}</Tag>
                    ))}
                </Space>
            )}
        </Card>
    );
};

export default PostCard;
