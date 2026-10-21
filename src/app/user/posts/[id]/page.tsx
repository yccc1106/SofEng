'use client';

import { Alert, App, Button, Spin, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import PostCard from '@/components/User/PostCard';
import { useLanguage } from '@/lib/language';
import { javaRequest } from '@/lib/java-client';
import type { CategoryResponse, PostResponse } from '@/types/api';

/** 在独立页面完整展示帖子正文、图片和互动区。 */
const PostDetailPage = () => {
  const { t } = useLanguage();
  const { message } = App.useApp();
  const router = useRouter();
  const params = useParams();
  const postId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [post, setPost] = useState<PostResponse | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!postId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setLoadFailed(false);
      try {
        const [postData, categories] = await Promise.all([
          javaRequest<PostResponse>(`/posts/${postId}`),
          fetch('/java/category').then((response) => response.json()),
        ]);
        if (!active) return;
        setPost(postData);
        const category = Array.isArray(categories?.data)
          ? (categories.data as CategoryResponse[]).find((item) => item.id === postData.categoryId)
          : undefined;
        setCategoryName(category ? t(category.name) : '');
      } catch (error) {
        if (!active) return;
        setLoadFailed(true);
        message.error(error instanceof Error ? error.message : t('Failed to load post'));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [message, postId, t]);

  return (
    <div className="min-h-[calc(100vh-64px)] w-full bg-slate-50 px-4 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-5xl">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/user/posts')}
          className="mb-4"
        >
          {t('Back to community')}
        </Button>

        {loading ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <Spin size="large" />
          </div>
        ) : loadFailed || !post ? (
          <Alert
            type="warning"
            showIcon
            message={t('Post unavailable')}
            description={t('The post may still be under review or no longer available.')}
          />
        ) : (
          <>
            {categoryName && (
              <div className="mb-3">
                <Tag color="cyan">{categoryName}</Tag>
              </div>
            )}
            <PostCard post={post} expanded openOnClick={false} />
          </>
        )}
      </div>
    </div>
  );
};

export default PostDetailPage;
