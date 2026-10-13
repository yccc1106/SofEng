'use client';
import React, { useState } from 'react';
import { Form, Input, Button, Tabs, App } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
    const { message } = App.useApp();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

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
                message.error(javaResult.message || 'Login failed');
                return;
            }
            // Unmigrated pages still use NextAuth during the transition.
            const result = await signIn('credentials', {
                email: values.email,
                password: values.password,
                redirect: false,
            });
            if (!result?.ok || result.error) {
                await fetch('/java/auth/logout', { method: 'POST' });
                message.error('Login failed');
                return;
            }
            message.success('Login successful');
            router.push('/');
        } catch {
            await fetch('/java/auth/logout', { method: 'POST' }).catch(() => {});
            message.error('Login error');
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
                message.success('Registration successful, please login');
                // Could auto login here
            } else {
                message.error(data.message || 'Registration failed');
            }
        } catch {
            message.error('Registration error');
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
                            label: 'Login',
                            children: (
                                <Form
                                    name="login"
                                    onFinish={onFinishLogin}
                                    layout="vertical"
                                >
                                    <Form.Item
                                        name="email"
                                        rules={[{ required: true, message: 'Please input your Email!' }]}
                                    >
                                        <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
                                    </Form.Item>
                                    <Form.Item
                                        name="password"
                                        rules={[{ required: true, message: 'Please input your Password!' }]}
                                    >
                                        <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
                                    </Form.Item>
                                    <Form.Item>
                                        <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                                            Log in
                                        </Button>
                                    </Form.Item>
                                </Form>
                            ),
                        },
                        {
                            key: 'register',
                            label: 'Register',
                            children: (
                                <Form
                                    name="register"
                                    onFinish={onFinishRegister}
                                    layout="vertical"
                                >
                                    <Form.Item
                                        name="name"
                                        rules={[{ required: true, message: 'Please input your Nickname!' }]}
                                    >
                                        <Input prefix={<UserOutlined />} placeholder="Nickname" size="large" />
                                    </Form.Item>
                                    <Form.Item
                                        name="email"
                                        rules={[{ required: true, message: 'Please input your Email!' }]}
                                    >
                                        <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
                                    </Form.Item>
                                    <Form.Item
                                        name="password"
                                        rules={[{ required: true, message: 'Please input your Password!' }]}
                                    >
                                        <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
                                    </Form.Item>
                                    <Form.Item>
                                        <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                                            Register
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
