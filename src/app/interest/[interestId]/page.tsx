'use client';
import { useLanguage } from '@/lib/language';
import React, { useEffect, useState } from 'react';
import { Button, Spin, Modal, Form, Input, App, Pagination } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import PostCard from '@/components/User/PostCard';
import { useParams } from 'next/navigation';
import { javaPage, javaRequest } from '@/lib/java-client';
import type { PostResponse } from '@/types/api';

const InterestPostsPage = () => {
    const { t } = useLanguage();
    const { message } = App.useApp();
    const params = useParams();
    const interestId = params?.interestId as string;

    const [posts, setPosts] = useState<PostResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchPosts = React.useCallback(async (requestedPage: number) => {
        if (!interestId) return;
        setLoading(true);
        try {
            const result = await javaPage<PostResponse>(`/posts?categoryId=${encodeURIComponent(interestId)}&page=${requestedPage}`);
            setPosts(result.data);
            setTotal(result.total);
        } catch {
            message.error(t('Failed to load posts'));
        } finally {
            setLoading(false);
        }
    }, [interestId, message, t]);

    useEffect(() => {
        void fetchPosts(page);
    }, [fetchPosts, page]);

    const handleCreatePost = async (values: { title?: string; content: string }) => {
        setSubmitting(true);
        try {
            await javaRequest('/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...values, categoryId: interestId }),
            });
            message.success(t('Post submitted for review'));
            setIsModalOpen(false);
            form.resetFields();
            if (page === 1) void fetchPosts(1);
            else setPage(1);
        } catch (error) {
            message.error(error instanceof Error ? error.message : t('Error creating post'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 m-0">{t("Community Feed")}</h1>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsModalOpen(true)}>
                    {t("Create Post")}
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><Spin /></div>
            ) : (
                <div className="space-y-4">
                    {posts.map(post => (
                        <PostCard key={post.id} post={post} />
                    ))}
                    {posts.length === 0 && <div className="text-center text-gray-400 py-10">{t("No posts yet in this community. Be the first!")}</div>}
                    {total > 10 && <Pagination current={page} pageSize={10} total={total} onChange={setPage} />}
                </div>
            )}

            <Modal
                title={t("Create Post in Community")}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleCreatePost}>
                    <Form.Item name="title" label={t("Title")}>
                        <Input placeholder={t("Optional title")} />
                    </Form.Item>
                    <Form.Item name="content" label={t("Content")} rules={[{ required: true }]}>
                        <Input.TextArea rows={4} placeholder={t("What's on your mind?")} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={submitting}>
                            {t("Publish")}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default InterestPostsPage;
