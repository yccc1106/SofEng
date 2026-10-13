'use client';
import React, { useEffect, useState } from 'react';
import { Button, Spin, Modal, Form, Input, App, Row, Col, Card, Avatar, Tag, Select } from 'antd';
import { PlusOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useParams } from 'next/navigation';
import { javaRequest } from '@/lib/java-client';

const { Meta } = Card;
const { Option } = Select;

const InterestTeamsPage = () => {
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
            message.error('Failed to load teams');
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
            message.success('Team created');
            setIsModalOpen(false);
            form.resetFields();
            fetchTeams();
        } catch (error) {
            message.error('Error creating team');
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
            message.success(result.status === 'PENDING' ? 'Application sent' : 'Joined team');
            fetchTeams();
        } catch (error) {
            message.error(error instanceof Error ? error.message : 'Failed to join team');
        }
    };

    return (
        <div className="">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 m-0">Team Lobby</h1>
                    <p className="text-gray-500">Find a squad or create your own.</p>
                </div>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsModalOpen(true)}>
                    Create Team
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
                                    <Button type="text" key="join" onClick={() => handleJoin(team.id)}>Apply / Join</Button>
                                ]}
                            >
                                <Meta
                                    avatar={<Avatar icon={<TeamOutlined />} size="large" className="bg-indigo-100 text-indigo-500" />}
                                    title={
                                        <div className="flex justify-between items-center">
                                            <span className="truncate max-w-[150px]">{team.name}</span>
                                            <Tag color="blue">{team.type || 'General'}</Tag>
                                        </div>
                                    }
                                    description={
                                        <div className="space-y-2">
                                            <div className="line-clamp-2 min-h-[40px]">{team.description || 'No description'}</div>
                                            <div className="flex items-center text-xs text-gray-400">
                                                <UserOutlined className="mr-1" />
                                                {team._count?.members || 1} / {team.maxMembers} Members
                                            </div>
                                        </div>
                                    }
                                />
                            </Card>
                        </Col>
                    ))}
                    {teams.length === 0 && (
                        <div className="w-full text-center text-gray-400 py-10">No teams yet. Create one!</div>
                    )}
                </Row>
            )}

            <Modal
                title="Create a Team"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleCreateTeam}>
                    <Form.Item name="name" label="Team Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. The Avengers" />
                    </Form.Item>
                    <Form.Item name="type" label="Activity Type" rules={[{ required: true }]}>
                        <Select placeholder="Select activity">
                            <Option value="GAME">Gaming</Option>
                            <Option value="STUDY">Study</Option>
                            <Option value="SPORT">Sports</Option>
                            <Option value="PROJECT">Project</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="maxMembers" label="Max Members" initialValue={5}>
                        <Input type="number" min={2} max={20} />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} placeholder="Describe your team goals..." />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={submitting}>
                            Create Team
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default InterestTeamsPage;
