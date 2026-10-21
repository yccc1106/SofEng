'use client';
import { useLanguage } from '@/lib/language';
import React, { useState } from 'react';
import { Card, Avatar, Typography, Space, Button, Tag, Flex, theme, List, Input, message, Form, Image } from 'antd';
import { LikeOutlined, LikeFilled, StarOutlined, StarFilled, MessageOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { javaAction, javaRequest } from '@/lib/java-client';
import type { PostResponse, PostCommentResponse } from '@/types/api';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Paragraph, Text } = Typography;

interface PostProps {
    post: PostResponse;
    showActions?: boolean;
}

/** 展示帖子互动；点赞和收藏先更新界面，接口失败时回滚计数。 */
const PostCard: React.FC<PostProps> = ({ post, showActions = true }) => {
    const { t } = useLanguage();
    const { token } = theme.useToken();
    const [liked, setLiked] = useState(post.isLiked || false);
    const [likeCount, setLikeCount] = useState(post._count?.likes || 0);
    const [collected, setCollected] = useState(post.isCollected || false);
    const [collectionCount, setCollectionCount] = useState(post._count?.collections || 0);
    const [actionPending, setActionPending] = useState(false);

    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<PostCommentResponse[]>([]);
    const [commentCount, setCommentCount] = useState<number>(post._count?.comments || 0);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);

    // 首次展开时加载评论，此后沿用本地列表并追加刚提交的评论。
    const [commentsFetched, setCommentsFetched] = useState(false);

    const handleLike = async () => {
        if (actionPending) return;
        setActionPending(true);
        const prevLiked = liked;
        const prevCount = likeCount;

        setLiked(!prevLiked);
        setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);

        try {
            await javaAction(`/posts/${post.id}/like`, { method: 'POST' });
        } catch {
            setLiked(prevLiked);
            setLikeCount(prevCount);
            message.error(t('Failed to update like status'));
        } finally {
            setActionPending(false);
        }
    };

    const handleCollect = async () => {
        if (actionPending) return;
        setActionPending(true);
        const prevCollected = collected;
        const prevCount = collectionCount;

        setCollected(!prevCollected);
        setCollectionCount(prevCollected ? prevCount - 1 : prevCount + 1);

        try {
            await javaAction(`/posts/${post.id}/collect`, { method: 'POST' });
        } catch {
            setCollected(prevCollected);
            setCollectionCount(prevCount);
            message.error(t('Failed to update collection status'));
        } finally {
            setActionPending(false);
        }
    };

    const fetchComments = async () => {
        if (commentsFetched) return;
        setCommentsLoading(true);
        try {
            setComments(await javaRequest<PostCommentResponse[]>(`/posts/${post.id}/comments`));
            setCommentsFetched(true);
        } catch {
            message.error(t('Failed to load comments'));
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
            const comment = await javaRequest<PostCommentResponse>(`/posts/${post.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: values.content })
            });
            setComments(current => [...current, comment]);
            setCommentCount(current => current + 1);
            form.resetFields();
            message.success(t('Comment added'));
        } catch (error) {
            message.error(error instanceof Error ? error.message : t('Error sending comment'));
        } finally {
            setSubmittingComment(false);
        }
    };

    // Form instance to reset
    const [form] = Form.useForm();

    const actions = showActions && post.status === 'PUBLISHED' ? [
        <Button
            key="like"
            type="text"
            icon={liked ? <LikeFilled style={{ color: token.colorPrimary }} /> : <LikeOutlined />}
            size="small"
            style={{ fontSize: 12, color: liked ? token.colorPrimary : token.colorTextSecondary }}
            onClick={handleLike}
            disabled={actionPending}
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
            {commentCount || 'Comment'}
        </Button>,
        <Button
            key="collect"
            type="text"
            icon={collected ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
            size="small"
            style={{ fontSize: 12, color: collected ? '#faad14' : token.colorTextSecondary }}
            onClick={handleCollect}
            disabled={actionPending}
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

            {post.status === 'AUDITING' && <Tag color="orange">{t("Pending review")}</Tag>}
            {post.status === 'REJECTED' && <Tag color="red">{t("Rejected")}</Tag>}
            <Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>{post.title}</Title>

            <Paragraph
                ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}
                style={{ color: token.colorText }}
            >
                {post.content}
            </Paragraph>

            {post.images && post.images.length > 0 && (
                <Flex gap={8} style={{ marginBottom: 12, overflowX: 'auto' }}>
                    <Image.PreviewGroup>
                        {post.images.map((img: string, idx: number) => (
                            <Image
                                key={img}
                                src={img}
                                alt={`${post.title || t('Post')} ${idx + 1}`}
                                width={120}
                                height={120}
                                style={{
                                    objectFit: 'cover',
                                    borderRadius: token.borderRadiusSM,
                                    flexShrink: 0,
                                }}
                                placeholder
                            />
                        ))}
                    </Image.PreviewGroup>
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
                        renderItem={(item: PostCommentResponse) => (
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
                                void handleSubmitComment(values);
                            }}
                        >
                            <Form.Item name="content" style={{ flex: 1, marginBottom: 0 }} rules={[{ required: true, message: t('Please enter a comment') }]}>
                                <Input placeholder={t("Write a comment...")} autoComplete="off" />
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
