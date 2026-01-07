'use client';
import React, { useEffect, useState } from 'react';
import { Button, FloatButton, Spin, Modal, App } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import PostCard from '@/components/User/PostCard';
import PostForm, { PostFormProps } from '@/components/Post/PostForm';
import type { PostResponse } from '@/types/api';

const PostsPage = () => {
    const { message } = App.useApp();
    const [posts, setPosts] = useState<PostResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/posts');
            const data = await res.json();
            if (data.success) {
                setPosts(data.data);
            }
        } catch (error) {
            message.error('Failed to load posts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleSuccess: PostFormProps['onSuccess'] = () => {
        setIsModalOpen(false);
        fetchPosts();
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
