'use client';
import { useLanguage } from '@/lib/language';

import React, { useEffect, useState } from 'react';
import { Form, Input, Button, App, Select } from 'antd';
import type { PostResponse } from '@/types/api';
import { javaRequest } from '@/lib/java-client';

const { TextArea } = Input;

export interface PostFormProps {
  initialCategoryId?: string;
  onSuccess?: (post: PostResponse) => void;
  onCancel?: () => void;
  showCategory?: boolean;
  showTitle?: boolean;
  loading?: boolean;
  submitText?: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

/** 统一处理不同页面的发帖表单，提交后帖子进入审核流程。 */
export const PostForm: React.FC<PostFormProps> = ({
  initialCategoryId,
  onSuccess,
  onCancel,
  showCategory = true,
  showTitle = true,
  loading = false,
  submitText = 'Publish',
}) => {
  const { t } = useLanguage();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/java/category');
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.data)) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (initialCategoryId) {
      form.setFieldValue('categoryId', initialCategoryId);
    }
  }, [initialCategoryId, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const data = await javaRequest<PostResponse>('/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      message.success(t('Post submitted for review'));
      onSuccess?.(data);
      form.resetFields();
    } catch (error) {
      message.error(error instanceof Error ? error.message : t('Network error'));
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        tags: [],
      }}
    >
      {showTitle && (
        <Form.Item
          name="title"
          label={t("Title")}
          rules={[{ max: 100, message: t('Title cannot exceed 100 characters') }]}
        >
          <Input placeholder={t("Optional title")} />
        </Form.Item>
      )}

      <Form.Item
        name="content"
        label={t("Content")}
        rules={[{ required: true, message: t('Please enter content') }]}
      >
        <TextArea rows={4} placeholder={t("What's on your mind?")} />
      </Form.Item>

      {showCategory && (
        <Form.Item name="categoryId" label={t("Category")}>
          <Select placeholder={t("Select category")} allowClear>
            {categories.map((cat) => (
              <Select.Option key={cat.id} value={cat.id}>
                {cat.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      )}

      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        {onCancel && (
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            {t("Cancel")}
          </Button>
        )}
        <Button type="primary" htmlType="submit" loading={submitting || loading}>
          {t(submitText)}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default PostForm;
