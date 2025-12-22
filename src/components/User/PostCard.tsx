'use client';
import React, { useState } from 'react';
import { Card, Avatar, Typography, Space, Button, Tag, Flex, theme, List, Input, message, Form } from 'antd';
import { LikeOutlined, LikeFilled, StarOutlined, StarFilled, MessageOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Paragraph, Text } = Typography;

interface PostProps {
    post: any;
    showActions?: boolean;
}

const PostCard: React.FC<PostProps> = ({ post, showActions = true }) => {
    const { token } = theme.useToken();
    const [liked, setLiked] = useState(post.isLiked || false);
    const [likeCount, setLikeCount] = useState(post._count?.likes || 0);
    const [collected, setCollected] = useState(post.isCollected || false);
    const [collectionCount, setCollectionCount] = useState(post._count?.collections || 0);

    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);

    // Comments fetched only once or refreshed? Let's verify simply.
    const [commentsFetched, setCommentsFetched] = useState(false);

    const handleLike = async () => {
        const prevLiked = liked;
        const prevCount = likeCount;

        setLiked(!prevLiked);
        setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);

        try {
            const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to like');
        } catch (error) {
            setLiked(prevLiked);
            setLikeCount(prevCount);
            message.error('Failed to update like status');
        }
    };

    const handleCollect = async () => {
        const prevCollected = collected;
        const prevCount = collectionCount;

        setCollected(!prevCollected);
        setCollectionCount(prevCollected ? prevCount - 1 : prevCount + 1);

        try {
            const res = await fetch(`/api/posts/${post.id}/collect`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to collect');
        } catch (error) {
            setCollected(prevCollected);
            setCollectionCount(prevCount);
            message.error('Failed to update collection status');
        }
    };

    const fetchComments = async () => {
        if (commentsFetched) return;
        setCommentsLoading(true);
        try {
            const res = await fetch(`/api/posts/${post.id}/comments`);
            const data = await res.json();
            if (data.success) {
                setComments(data.data);
                setCommentsFetched(true);
            }
        } catch (error) {
            message.error('Failed to load comments');
        } finally {
            setCommentsLoading(false);
        }
    };

    const toggleComments = () => {
        const nextState = !showComments;
        setShowComments(nextState);
        if (nextState) {
            fetchComments();
        }
    };

    const handleSubmitComment = async (values: { content: string }) => {
        setSubmittingComment(true);
        try {
            const res = await fetch(`/api/posts/${post.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: values.content })
            });
            const data = await res.json();
            if (data.success) {
                setComments([...comments, data.data]);
                message.success('Comment added');
                // You might want to reset the form here, but Antd Form useForm hook is needed for that outside render.
                // Or we can just rely on the input being cleared if we controlled it, but List/Form interaction is tricky without ref.
                // Simple workaround: reload or just append. 
            } else {
                message.error(data.message || 'Failed to add comment');
            }
        } catch (error) {
            message.error('Error sending comment');
        } finally {
            setSubmittingComment(false);
        }
    };

    // Form instance to reset
    const [form] = Form.useForm();

    const actions = showActions ? [
        <Button
            key="like"
            type="text"
            icon={liked ? <LikeFilled style={{ color: token.colorPrimary }} /> : <LikeOutlined />}
            size="small"
            style={{ fontSize: 12, color: liked ? token.colorPrimary : token.colorTextSecondary }}
            onClick={handleLike}
        >
            {likeCount > 0 ? likeCount : 'Like'}
        </Button>,
        <Button
            key="comment"
            type="text"
            icon={<MessageOutlined />}
            size="small"
            style={{ fontSize: 12, color: showComments ? token.colorPrimary : token.colorTextSecondary }}
            onClick={toggleComments}
        >
            {post._count?.comments || 'Comment'}
        </Button>,
        <Button
            key="collect"
            type="text"
            icon={collected ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
            size="small"
            style={{ fontSize: 12, color: collected ? '#faad14' : token.colorTextSecondary }}
            onClick={handleCollect}
        >
            {collectionCount > 0 ? collectionCount : 'Collect'}
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
                        <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(post.createdAt).fromNow()}</Text>
                    </Flex>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {post.author?.school} | {post.author?.role === 'ADMIN' ? 'Administrator' : 'Student'}
                    </Text>
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
                            {/* In real app, render <Image src={img} ... /> */}
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

            {showComments && (
                <div style={{ marginTop: 16, borderTop: `1px solid ${token.colorBorderSecondary}`, paddingTop: 16 }}>
                    <List
                        loading={commentsLoading}
                        itemLayout="horizontal"
                        dataSource={comments}
                        renderItem={(item: any) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<Avatar src={item.user?.image} size="small" />}
                                    title={<Text strong style={{ fontSize: 12 }}>{item.user?.name}</Text>}
                                    description={
                                        <div style={{ fontSize: 13 }}>
                                            {item.content}
                                            <div style={{ fontSize: 10, color: token.colorTextTertiary, marginTop: 4 }}>
                                                {dayjs(item.createdAt).fromNow()}
                                            </div>
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />

                    <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                        <Form
                            form={form}
                            style={{ width: '100%', display: 'flex', gap: 8 }}
                            onFinish={(values) => {
                                handleSubmitComment(values);
                                form.resetFields();
                            }}
                        >
                            <Form.Item name="content" style={{ flex: 1, marginBottom: 0 }} rules={[{ required: true, message: 'Please enter a comment' }]}>
                                <Input placeholder="Write a comment..." autoComplete="off" />
                            </Form.Item>
                            <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={submittingComment} />
                        </Form>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default PostCard;
