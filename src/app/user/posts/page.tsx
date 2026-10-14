'use client';
import React, { useEffect, useState } from 'react';
import { Button, Spin, Modal, App, Pagination } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import PostCard from '@/components/User/PostCard';
import PostForm, { PostFormProps } from '@/components/Post/PostForm';
import type { PostResponse } from '@/types/api';
import { javaPage } from '@/lib/java-client';

const PostsPage = () => {
    const { message } = App.useApp();
    const [posts, setPosts] = useState<PostResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchPosts = React.useCallback(async (requestedPage: number) => {
        setLoading(true);
        try {
            const result = await javaPage<PostResponse>(`/posts?page=${requestedPage}`);
            setPosts(result.data);
            setTotal(result.total);
        } catch (error) {
            message.error(error instanceof Error ? error.message : 'Failed to load posts');
        } finally {
            setLoading(false);
        }
    }, [message]);

    useEffect(() => {
        void fetchPosts(page);
    }, [fetchPosts, page]);

    const handleSuccess: PostFormProps['onSuccess'] = () => {
        setIsModalOpen(false);
        if (page === 1) void fetchPosts(1);
        else setPage(1);
    };

    return (
        <div className="">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 m-0">Community Feed</h1>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsModalOpen(true)}>
                    Create Post
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><Spin /></div>
            ) : (
                <div className="space-y-4">
                    {posts.map(post => (
                        <PostCard key={post.id} post={post} />
                    ))}
                    {posts.length === 0 && <div className="text-center text-gray-400 py-10">No posts yet. Be the first!</div>}
                    {total > 10 && <Pagination current={page} pageSize={10} total={total} onChange={setPage} />}
                </div>
            )}

            <Modal
                title="Create Post"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                destroyOnClose
            >
                <PostForm
                    onSuccess={handleSuccess}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default PostsPage;
