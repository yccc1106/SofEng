'use client';
import { useLanguage } from '@/lib/language';
import React, { useEffect, useState } from 'react';
import { Card, Avatar, Button, Descriptions, Tag, Spin, Form, Input, App, Modal } from 'antd';
import { UserOutlined, EditOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

type Profile = {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    school?: string | null;
    major?: string | null;
    grade?: string | null;
    bio?: string | null;
    personalityType?: string | null;
    personalityTags?: string[];
};

/** 加载当前用户资料，保存修改后同步前端会话并支持退出。 */
const ProfilePage = () => {
    const { t } = useLanguage();
    const { message } = App.useApp();
    const { data: session, status, logout, refresh } = useAuth();
    const router = useRouter();
    const [user, setUser] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    const fetchProfile = React.useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/java/users/profile');
            const data = await res.json();
            if (res.status === 401) {
                router.replace('/user/login');
                return;
            }
            if (data.success) {
                setUser(data.data);
            } else {
                message.error(data.message || t('Failed to load profile'));
            }
        } catch {
            message.error(t('Failed to load profile'));
        } finally {
            setLoading(false);
        }
    }, [message, router, t]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/user/login');
        } else if (session) {
            void fetchProfile();
        }
    }, [session, status, fetchProfile, router]);

    const handleEdit = () => {
        form.setFieldsValue(user);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            const res = await fetch('/java/users/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            const data = await res.json();
            if (res.status === 401) {
                router.replace('/user/login');
                return;
            }
            if (data.success) {
                message.success(t('Profile updated'));
                setUser(data.data);
                await refresh();
                setIsModalOpen(false);
            } else {
                message.error(t('Failed to update'));
            }
        } catch {
            message.error(t('Error saving profile'));
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
    if (!user) return <div className="p-4">{t("Failed to load user data")}</div>;

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <div className="bg-white p-6 rounded-lg shadow-sm mb-4 flex flex-col items-center">
                <Avatar size={80} icon={<UserOutlined />} src={user.image} className="mb-4" />
                <h2 className="text-xl font-bold">{user.name}</h2>
                <div className="mt-2 text-gray-500">{user.email}</div>
                {user.personalityType && (
                    <Tag color="purple" className="mt-2 text-sm px-3 py-1 rounded-full">
                        {user.personalityType}
                    </Tag>
                )}
            </div>

            <Card title={t("Personal Info")} extra={<Button icon={<EditOutlined />} type="text" onClick={handleEdit} />} className="mb-4 shadow-sm">
                <Descriptions column={1}>
                    <Descriptions.Item label={t("School")}>{user.school || t('Not set')}</Descriptions.Item>
                    <Descriptions.Item label={t("Major")}>{user.major || t('Not set')}</Descriptions.Item>
                    <Descriptions.Item label={t("Grade")}>{user.grade || t('Not set')}</Descriptions.Item>
                    <Descriptions.Item label={t("Bio")}>{user.bio || t('No bio yet')}</Descriptions.Item>
                </Descriptions>
            </Card>

            <Card title={t("Personality Tags")} className="mb-4 shadow-sm">
                <div className="flex flex-wrap gap-2">
                    {user.personalityTags && user.personalityTags.length > 0 ? (
                        user.personalityTags.map((tag: string) => (
                            <Tag key={tag} color="blue">{tag}</Tag>
                        ))
                    ) : (
                        <div className="text-gray-400">{t("No tags yet. Take the test!")}</div>
                    )}
                </div>
                <div className="mt-4">
                    <Button type="primary" block href="/user/personality-test">
                        {t("Retake Personality Test")}
                    </Button>
                </div>
            </Card>

            <Button danger block icon={<LogoutOutlined />} onClick={async () => { await logout(); router.replace('/user/login'); }}>
                {t("Logout")}
            </Button>

            <Modal title={t("Edit Profile")} open={isModalOpen} onOk={handleSave} onCancel={() => setIsModalOpen(false)}>
                <Form form={form} layout="vertical">
                    <Form.Item name="name" label={t("Nickname")} rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="school" label={t("School")}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="major" label={t("Major")}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="grade" label={t("Grade")}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="bio" label={t("Bio")}>
                        <Input.TextArea />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ProfilePage;
