'use client';
import React, { useEffect, useState } from 'react';
import { Card, Button, Avatar, Tag, Spin, Modal, Form, Input, InputNumber, Select, App } from 'antd';
import { PlusOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';

const { Meta } = Card;

const TeamsPage = () => {
    const { message } = App.useApp();
    const { data: session } = useSession();
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null);
    const [form] = Form.useForm();

    const fetchTeams = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/teams');
            const data = await res.json();
            if (data.success) {
                setTeams(data.data);
            }
        } catch (error) {
            message.error('Failed to load teams');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    const handleCreateTeam = async (values: any) => {
        try {
            const res = await fetch('/api/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            const data = await res.json();
            if (data.success) {
                message.success('Team created');
                setIsModalOpen(false);
                form.resetFields();
                fetchTeams();
            } else {
                message.error(data.message || 'Failed to create team');
            }
        } catch (error) {
            message.error('Error creating team');
        }
    };

    const handleJoinTeam = async (teamId: string) => {
        setJoiningTeamId(teamId);
        try {
            const res = await fetch('/api/teams/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId }),
            });
            const data = await res.json();
            if (data.success) {
                message.success('Joined team successfully');
                fetchTeams();
            } else {
                message.error(data.message || 'Failed to join team');
            }
        } catch (error) {
            message.error('Error joining team');
        } finally {
            setJoiningTeamId(null);
        }
    };

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 m-0">Team Lobby</h1>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsModalOpen(true)}>
                    Create Team
                </Button>
            </div>

            {loading ? <Spin className="flex justify-center mt-10" /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.map(team => (
                        <Card key={team.id} className="shadow-sm rounded-lg hover:shadow-md transition-shadow">
                            <Meta
                                avatar={<Avatar src={team.creator?.image} size="large" />}
                                title={
                                    <div className="flex justify-between items-center">
                                        <span className="truncate pr-2">{team.name}</span>
                                        <Tag color={team.type === 'GAME' ? 'blue' : 'green'}>{team.type || 'General'}</Tag>
                                    </div>
                                }
                                description={
                                    <div className="mt-2">
                                        <div className="text-gray-500 mb-4 h-10 line-clamp-2">{team.description || 'No description'}</div>
                                        <div className="flex justify-between items-center text-xs text-gray-400 mb-3">
                                            <span>Members: {team._count?.members}/{team.maxMembers}</span>
                                            <span>By {team.creator?.name}</span>
                                        </div>
                                        {(() => {
                                            const isMember = team.members?.some((m: any) => m.userId === (session?.user as any)?.id);
                                            const isFull = team._count?.members >= team.maxMembers;

                                            if (isMember) {
                                                return (
                                                    <Button block disabled icon={<UsergroupAddOutlined />}>
                                                        Already Joined
                                                    </Button>
                                                );
                                            }

                                            return (
                                                <Button
                                                    type="primary"
                                                    ghost
                                                    block
                                                    icon={<UsergroupAddOutlined />}
                                                    loading={joiningTeamId === team.id}
                                                    disabled={isFull}
                                                    onClick={() => handleJoinTeam(team.id)}
                                                >
                                                    {isFull ? 'Team Full' : 'Join Team'}
                                                </Button>
                                            );
                                        })()}
                                    </div>
                                }
                            />
                        </Card>
                    ))}
                    {teams.length === 0 && <div className="col-span-full text-center text-gray-400 py-10">No active teams. Create one!</div>}
                </div>
            )}

            <Modal
                title="Create Team"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleCreateTeam}>
                    <Form.Item name="name" label="Team Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea />
                    </Form.Item>
                    <Form.Item name="type" label="Type">
                        <Select options={[
                            { label: 'Game', value: 'GAME' },
                            { label: 'Study', value: 'STUDY' },
                            { label: 'Sport', value: 'SPORT' },
                        ]} />
                    </Form.Item>
                    <Form.Item name="maxMembers" label="Max Members" initialValue={5}>
                        <InputNumber min={2} max={20} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            Create Team
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default TeamsPage;
