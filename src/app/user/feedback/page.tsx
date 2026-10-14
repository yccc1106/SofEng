'use client';
import { useLanguage } from '@/lib/language';
import React, { useState } from 'react';
import { Form, Input, Button, Select, App, Card } from 'antd';
import { useRouter } from 'next/navigation';

const { TextArea } = Input;
const { Option } = Select;

/** 提交建议或举报；举报需将目标类型和 ID 映射到对应接口字段。 */
const FeedbackPage = () => {
    const { t } = useLanguage();
    const { message } = App.useApp();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const onFinish = async (values: {
        type: 'SUGGESTION' | 'REPORT' | 'OTHER';
        content: string;
        reportType?: 'USER' | 'POST' | 'MESSAGE';
        targetId?: string;
        contact?: string;
    }) => {
        setLoading(true);
        try {
            const res = await fetch('/java/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...values,
                    ...(values.type === 'REPORT' ? {
                        [values.reportType === 'USER' ? 'reportedUserId' : values.reportType === 'POST' ? 'reportedPostId' : 'reportedMessageId']: values.targetId,
                    } : {}),
                    targetId: undefined,
                }),
            });
            const data = await res.json();
            if (data.success) {
                message.success(t('Feedback submitted successfully'));
                router.push('/user/profile');
            } else {
                message.error(data.message || t('Submission failed'));
            }
        } catch {
            message.error(t('Error submitting feedback'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">{t("Feedback & Support")}</h1>
            <Card>
                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item name="type" label={t("Feedback Type")} initialValue="SUGGESTION" rules={[{ required: true }]}>
                        <Select>
                            <Option value="SUGGESTION">{t("Suggestion")}</Option>
                            <Option value="REPORT">{t("Report Issue")}</Option>
                            <Option value="OTHER">{t("Other")}</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item name="content" label={t("Description")} rules={[{ required: true, message: t('Please describe your feedback') }]}>
                        <TextArea rows={6} placeholder={t("Please describe your suggestion or issue...")} />
                    </Form.Item>

                    <Form.Item noStyle shouldUpdate={(previous, current) => previous.type !== current.type}>
                        {({ getFieldValue }) => getFieldValue('type') === 'REPORT' && <>
                            <Form.Item name="reportType" label={t('Report target type')} rules={[{ required: true, message: t('Select a report target type') }]}>
                                <Select options={[{ label: t('User'), value: 'USER' }, { label: t('Post'), value: 'POST' }, { label: t('Message'), value: 'MESSAGE' }]} />
                            </Form.Item>
                            <Form.Item name="targetId" label={t('Report target ID')} rules={[{ required: true, message: t('Enter a report target ID') }]}>
                                <Input placeholder={t('Enter a user, post or message ID')} />
                            </Form.Item>
                        </>}
                    </Form.Item>

                    <Form.Item name="contact" label={t("Contact (Optional)")}>
                        <Input placeholder={t("Email or Phone for follow-up")} />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block size="large">
                            {t("Submit Feedback")}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default FeedbackPage;
