'use client';
import React, { useEffect, useState } from 'react';
import { Button, FloatButton, Spin, Modal, Form, Input, App } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import PostCard from '@/components/User/PostCard';
import { useSession } from 'next-auth/react';

const PostsPage = () => {
    const { message } = App.useApp();
    const { data: session } = useSession();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

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

    const handleCreatePost = async (values: any) => {
        setSubmitting(true);
        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            const data = await res.json();
            if (data.success) {
                message.success('Post created');
                setIsModalOpen(false);
                form.resetFields();
                fetchPosts(); // Refresh
            } else {
                message.error(data.message || 'Failed to create post');
            }
        } catch (error) {
            message.error('Error creating post');
        } finally {
            setSubmitting(false);
        }
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
            >
                <Form form={form} layout="vertical" onFinish={handleCreatePost}>
                    <Form.Item name="title" label="Title">
                        <Input placeholder="Optional title" />
                    </Form.Item>
                    <Form.Item name="content" label="Content" rules={[{ required: true }]}>
                        <Input.TextArea rows={4} placeholder="What's on your mind?" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={submitting}>
                            Post
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default PostsPage;
