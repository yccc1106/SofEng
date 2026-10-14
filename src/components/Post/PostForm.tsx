'use client';

import React, { useEffect, useState } from 'react';
import { Form, Input, Button, App, Select } from 'antd';
import type { PostResponse } from '@/types/api';
import { javaRequest } from '@/lib/java-client';

const { TextArea } = Input;

export interface PostFormProps {
  /** 预设分类 ID（可选） */
  initialCategoryId?: string;
  /** 提交成功回调 */
  onSuccess?: (post: PostResponse) => void;
  /** 取消回调 */
  onCancel?: () => void;
  /** 是否显示分类选择器 */
  showCategory?: boolean;
  /** 是否显示标题输入 */
  showTitle?: boolean;
  /** 加载状态 */
  loading?: boolean;
  /** 提交按钮文字 */
  submitText?: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

export const PostForm: React.FC<PostFormProps> = ({
  initialCategoryId,
  onSuccess,
  onCancel,
  showCategory = true,
  showTitle = true,
  loading = false,
  submitText = 'Post',
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  // 加载分类列表
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

  // 设置初始分类
  useEffect(() => {
    if (initialCategoryId) {
      form.setFieldValue('categoryId', initialCategoryId);
    }
  }, [initialCategoryId, form]);

  // 提交处理
  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const data = await javaRequest<PostResponse>('/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      message.success('Post submitted for review');
      onSuccess?.(data);
      form.resetFields();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Network error');
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
          label="Title"
          rules={[{ max: 100, message: 'Title cannot exceed 100 characters' }]}
        >
          <Input placeholder="Optional title" />
        </Form.Item>
      )}

      <Form.Item
        name="content"
        label="Content"
        rules={[{ required: true, message: 'Please enter content' }]}
      >
        <TextArea rows={4} placeholder="What's on your mind?" />
      </Form.Item>

      {showCategory && (
        <Form.Item name="categoryId" label="Category">
          <Select placeholder="Select category" allowClear>
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
            Cancel
          </Button>
        )}
        <Button type="primary" htmlType="submit" loading={submitting || loading}>
          {submitText}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default PostForm;
