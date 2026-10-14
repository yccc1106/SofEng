'use client';
import { useLanguage } from '@/lib/language';
import React, { useState } from 'react';
import { Form, Input, Button, Tabs, App } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

/** 登录或注册后更新前端会话状态，页面权限以 Java 返回的资料为准。 */
const LoginPage = () => {
    const { t } = useLanguage();
    const { message } = App.useApp();
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { refresh } = useAuth();

    const onFinishLogin = async (values: { email: string; password: string }) => {
        setLoading(true);
        try {
            const javaResponse = await fetch('/java/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            const javaResult = await javaResponse.json();
            if (!javaResponse.ok) {
                message.error(javaResult.message || t('Login failed'));
                return;
            }
            if (!await refresh()) {
                await fetch('/java/auth/logout', { method: 'POST' }).catch(() => {});
                throw new Error(t('Profile unavailable after login'));
            }
            message.success(t('Login successful'));
            router.push('/');
        } catch {
            message.error(t('Login error'));
        } finally {
            setLoading(false);
        }
    };

    const onFinishRegister = async (values: { name: string; email: string; password: string; studentId?: string; school?: string }) => {
        setLoading(true);
        try {
            const res = await fetch('/java/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            const data = await res.json();
            if (data.success) {
                message.success(t('Registration successful, please login'));
            } else {
                message.error(data.message || t('Registration failed'));
            }
        } catch {
            message.error(t('Registration error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-gray-50">
            <h1 className="text-3xl font-bold mb-8 text-blue-600">MeetU</h1>
            <div className="w-full max-w-sm bg-white p-6 rounded-lg shadow-md">
                <Tabs
                    defaultActiveKey="login"
                    items={[
                        {
                            key: 'login',
                            label: t('Login'),
                            children: (
                                <Form
                                    name="login"
                                    onFinish={onFinishLogin}
                                    layout="vertical"
                                >
                                    <Form.Item
                                        name="email"
                                        rules={[{ required: true, message: t('Please input your Email!') }]}
                                    >
                                        <Input prefix={<MailOutlined />} placeholder={t("Email")} size="large" />
                                    </Form.Item>
                                    <Form.Item
                                        name="password"
                                        rules={[{ required: true, message: t('Please input your Password!') }]}
                                    >
                                        <Input.Password prefix={<LockOutlined />} placeholder={t("Password")} size="large" />
                                    </Form.Item>
                                    <Form.Item>
                                        <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                                            {t("Log in")}
                                        </Button>
                                    </Form.Item>
                                </Form>
                            ),
                        },
                        {
                            key: 'register',
                            label: t('Register'),
                            children: (
                                <Form
                                    name="register"
                                    onFinish={onFinishRegister}
                                    layout="vertical"
                                >
                                    <Form.Item
                                        name="name"
                                        rules={[{ required: true, message: t('Please input your Nickname!') }]}
                                    >
                                        <Input prefix={<UserOutlined />} placeholder={t("Nickname")} size="large" />
                                    </Form.Item>
                                    <Form.Item
                                        name="email"
                                        rules={[{ required: true, message: t('Please input your Email!') }]}
                                    >
                                        <Input prefix={<MailOutlined />} placeholder={t("Email")} size="large" />
                                    </Form.Item>
                                    <Form.Item
                                        name="password"
                                        rules={[{ required: true, message: t('Please input your Password!') }]}
                                    >
                                        <Input.Password prefix={<LockOutlined />} placeholder={t("Password")} size="large" />
                                    </Form.Item>
                                    <Form.Item>
                                        <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                                            {t("Register")}
                                        </Button>
                                    </Form.Item>
                                </Form>
                            ),
                        },
                    ]}
                />
            </div>
        </div>
    );
};

export default LoginPage;
