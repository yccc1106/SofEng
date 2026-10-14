'use client';
import { useLanguage } from '@/lib/language';
import React, { useEffect, useState } from 'react';
import { Button, Spin, Modal, Form, Input, App, Row, Col, Card, Avatar, Tag, Select } from 'antd';
import { PlusOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useParams } from 'next/navigation';
import { javaRequest } from '@/lib/java-client';

const { Meta } = Card;
const { Option } = Select;

const InterestTeamsPage = () => {
    const { t } = useLanguage();
    const { message } = App.useApp();
    const params = useParams();
    const interestId = params?.interestId as string;

    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    const fetchTeams = async () => {
        if (!interestId) return;
        setLoading(true);
        try {
            setTeams(await javaRequest<any[]>(`/teams?categoryId=${encodeURIComponent(interestId)}`));
        } catch (error) {
            message.error(t('Failed to load teams'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, [interestId]);

    const handleCreateTeam = async (values: any) => {
        setSubmitting(true);
        try {
            await javaRequest('/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...values, categoryId: interestId }),
            });
            message.success(t('Team created'));
            setIsModalOpen(false);
            form.resetFields();
            fetchTeams();
        } catch (error) {
            message.error(t('Error creating team'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleJoin = async (teamId: string) => {
        try {
            const result = await javaRequest<{ status: string }>('/teams/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId }),
            });
            message.success(result.status === 'PENDING' ? t('Application sent') : t('Joined team'));
            fetchTeams();
        } catch (error) {
            message.error(error instanceof Error ? error.message : t('Failed to join team'));
        }
    };

    return (
        <div className="">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 m-0">{t("Team Lobby")}</h1>
                    <p className="text-gray-500">{t("Find a squad or create your own.")}</p>
                </div>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsModalOpen(true)}>
                    {t("Create Team")}
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><Spin /></div>
            ) : (
                <Row gutter={[16, 16]}>
                    {teams.map(team => (
                        <Col xs={24} sm={12} lg={8} key={team.id}>
                            <Card
                                hoverable
                                actions={[
                                    <Button type="text" key="join" onClick={() => handleJoin(team.id)}>{t("Apply / Join")}</Button>
                                ]}
                            >
                                <Meta
                                    avatar={<Avatar icon={<TeamOutlined />} size="large" className="bg-indigo-100 text-indigo-500" />}
                                    title={
                                        <div className="flex justify-between items-center">
                                            <span className="truncate max-w-[150px]">{team.name}</span>
                                            <Tag color="blue">{team.type || t('General')}</Tag>
                                        </div>
                                    }
                                    description={
                                        <div className="space-y-2">
                                            <div className="line-clamp-2 min-h-[40px]">{team.description || t('No description')}</div>
                                            <div className="flex items-center text-xs text-gray-400">
                                                <UserOutlined className="mr-1" />
                                                {team._count?.members || 1} / {team.maxMembers} {t('Members')}
                                            </div>
                                        </div>
                                    }
                                />
                            </Card>
                        </Col>
                    ))}
                    {teams.length === 0 && (
                        <div className="w-full text-center text-gray-400 py-10">{t("No teams yet. Create one!")}</div>
                    )}
                </Row>
            )}

            <Modal
                title={t("Create a Team")}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleCreateTeam}>
                    <Form.Item name="name" label={t("Team Name")} rules={[{ required: true }]}>
                        <Input placeholder={t("e.g. The Avengers")} />
                    </Form.Item>
                    <Form.Item name="type" label={t("Activity Type")} rules={[{ required: true }]}>
                        <Select placeholder={t("Select activity")}>
                            <Option value="GAME">{t("Gaming")}</Option>
                            <Option value="STUDY">{t("Study")}</Option>
                            <Option value="SPORT">{t("Sports")}</Option>
                            <Option value="PROJECT">{t("Project")}</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="maxMembers" label={t("Max Members")} initialValue={5}>
                        <Input type="number" min={2} max={20} />
                    </Form.Item>
                    <Form.Item name="description" label={t("Description")}>
                        <Input.TextArea rows={3} placeholder={t("Describe your team goals...")} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={submitting}>
                            {t("Create Team")}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default InterestTeamsPage;
