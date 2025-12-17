'use client';
import React from 'react';
import { Card, Avatar, Typography, Space, Button, Tag, Divider } from 'antd';
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
    return (
        <Card
            className="mb-4 shadow-sm border-0 rounded-lg"
            styles={{ body: { padding: '16px' } }}
        >
            <div className="flex items-start mb-3">
                <Avatar src={post.author?.image} className="mr-3 flex-shrink-0" />
                <div className="flex-1">
                    <div className="flex justify-between">
                        <h4 className="font-bold text-gray-900 m-0">{post.author?.name}</h4>
                        <span className="text-gray-400 text-xs">{dayjs(post.createdAt).fromNow()}</span>
                    </div>
                    <div className="text-gray-500 text-xs">{post.author?.school} | {post.author?.role === 'ADMIN' ? 'Administrator' : 'Student'}</div>
                </div>
            </div>

            <Title level={5} className="mt-0 mb-2">{post.title}</Title>

            <Paragraph
                ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}
                className="text-gray-700"
            >
                {post.content}
            </Paragraph>

            {post.images && post.images.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto">
                    {/* Placeholder for images, real app would use <Image /> */}
                    {post.images.map((img: string, idx: number) => (
                        <div key={idx} className="h-24 w-24 bg-gray-200 rounded-md flex-shrink-0 flex items-center justify-center text-xs text-gray-500">
                            Image {idx + 1}
                        </div>
                    ))}
                </div>
            )}

            {post.tags && (
                <div className="mb-3">
                    {post.tags.map((tag: string) => (
                        <Tag key={tag} className="text-xs">{tag}</Tag>
                    ))}
                </div>
            )}

            {showActions && (
                <>
                    <Divider className="my-2" />
                    <div className="flex justify-around text-gray-500">
                        <Button type="text" icon={<LikeOutlined />} size="small" className="text-gray-500 text-xs">
                            {post._count?.likes || 0}
                        </Button>
                        <Button type="text" icon={<MessageOutlined />} size="small" className="text-gray-500 text-xs">
                            Comment
                        </Button>
                        <Button type="text" icon={<StarOutlined />} size="small" className="text-gray-500 text-xs">
                            {post._count?.collections || 0}
                        </Button>
                    </div>
                </>
            )}
        </Card>
    );
};

export default PostCard;
