'use client';
import React, { useState } from 'react';
import { Form, Input, Button, Select, Upload, App, Card } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { TextArea } = Input;
const { Option } = Select;

const FeedbackPage = () => {
    const { message } = App.useApp();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState<any[]>([]);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            // Mock image upload handling - in real app upload to storage first
            // Here we just ignore files or assume URLs are handled

            const res = await fetch('/java/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...values,
                    ...(values.type === 'REPORT' ? {
                        [values.reportType === 'USER' ? 'reportedUserId' : values.reportType === 'POST' ? 'reportedPostId' : 'reportedMessageId']: values.targetId,
                    } : {}),
                    targetId: undefined,
                    images: []
                }),
            });
            const data = await res.json();
            if (data.success) {
                message.success('Feedback submitted successfully');
                router.push('/user/profile');
            } else {
                message.error(data.message || 'Submission failed');
            }
        } catch (error) {
            message.error('Error submitting feedback');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Feedback & Support</h1>
            <Card>
                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item name="type" label="Feedback Type" initialValue="SUGGESTION" rules={[{ required: true }]}>
                        <Select>
                            <Option value="SUGGESTION">Suggestion</Option>
                            <Option value="REPORT">Report Issue</Option>
                            <Option value="OTHER">Other</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item name="content" label="Description" rules={[{ required: true, message: 'Please describe your feedback' }]}>
                        <TextArea rows={6} placeholder="Please describe your suggestion or issue..." />
                    </Form.Item>

                    <Form.Item noStyle shouldUpdate={(previous, current) => previous.type !== current.type}>
                        {({ getFieldValue }) => getFieldValue('type') === 'REPORT' && <>
                            <Form.Item name="reportType" label="举报对象类型" rules={[{ required: true, message: '请选择举报对象类型' }]}>
                                <Select options={[{ label: '用户', value: 'USER' }, { label: '帖子', value: 'POST' }, { label: '消息', value: 'MESSAGE' }]} />
                            </Form.Item>
                            <Form.Item name="targetId" label="举报对象 ID" rules={[{ required: true, message: '请输入举报对象 ID' }]}>
                                <Input placeholder="输入用户、帖子或消息 ID" />
                            </Form.Item>
                        </>}
                    </Form.Item>

                    <Form.Item name="contact" label="Contact (Optional)">
                        <Input placeholder="Email or Phone for follow-up" />
                    </Form.Item>

                    {/* 
                    <Form.Item label="Screenshots (Optional)">
                        <Upload fileList={fileList} onChange={({ fileList }) => setFileList(fileList)} beforeUpload={() => false}>
                            <Button icon={<UploadOutlined />}>Upload</Button>
                        </Upload>
                    </Form.Item>
                    */}

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block size="large">
                            Submit Feedback
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default FeedbackPage;
