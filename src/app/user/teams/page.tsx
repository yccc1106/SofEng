'use client';
import React, { useEffect, useState } from 'react';
import { Card, Button, Avatar, Tag, Spin, Modal, Form, Input, InputNumber, Select, App, Tabs, List, Space, Divider } from 'antd';
import { PlusOutlined, UsergroupAddOutlined, CheckOutlined, CloseOutlined, TeamOutlined, GlobalOutlined, BellOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const { Meta } = Card;

const TeamsPage = () => {
    const { message } = App.useApp();
    const { data: session } = useSession();
    const router = useRouter();
    const [teams, setTeams] = useState<any[]>([]);
    const [myTeams, setMyTeams] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [joining, setJoining] = useState(false);

    const [createForm] = Form.useForm();
    const [joinForm] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch All Recruiting Teams
            const resAll = await fetch('/api/teams');
            const dataAll = await resAll.json();
            if (dataAll.success) setTeams(dataAll.data);

            // Fetch My Teams
            const resMine = await fetch('/api/teams?mine=true');
            const dataMine = await resMine.json();
            if (dataMine.success) setMyTeams(dataMine.data);

            // Fetch Requests (if leader)
            const resReq = await fetch('/api/teams/requests');
            const dataReq = await resReq.json();
            if (dataReq.success) setRequests(dataReq.data);

        } catch (error) {
            message.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
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
                setIsCreateModalOpen(false);
                createForm.resetFields();
                fetchData();
            } else {
                message.error(data.message || 'Failed to create team');
            }
        } catch (error) {
            message.error('Error creating team');
        }
    };

    const handleJoinRequest = async (values: any) => {
        if (!selectedTeamId) return;
        setJoining(true);
        try {
            const res = await fetch('/api/teams/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId: selectedTeamId, message: values.message }),
            });
            const data = await res.json();
            if (data.success) {
                message.success(data.message || 'Joined team successfully');
                setIsJoinModalOpen(false);
                joinForm.resetFields();
                fetchData();
            } else {
                message.error(data.message || 'Failed to join team');
            }
        } catch (error) {
            message.error('Error joining team');
        } finally {
            setJoining(false);
        }
    };

    const handleManageRequest = async (memberId: string, status: 'JOINED' | 'REJECTED') => {
        try {
            const res = await fetch('/api/teams/requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId, status }),
            });
            const data = await res.json();
            if (data.success) {
                message.success(status === 'JOINED' ? 'Approved' : 'Rejected');
                fetchData();
            } else {
                message.error(data.message || 'Operation failed');
            }
        } catch (error) {
            message.error('Error managing request');
        }
    };

    const LobbyTab = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map(team => {
                const isMember = myTeams.some(mt => mt.id === team.id);
                const isFull = team._count?.members >= team.maxMembers;

                return (
                    <Card key={team.id} className="shadow-sm rounded-lg hover:shadow-md transition-shadow overflow-hidden">
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-4">
                                <Space>
                                    <Avatar src={team.creator?.image} size="large" />
                                    <div>
                                        <div className="font-bold text-lg text-gray-800 leading-tight">{team.name}</div>
                                        <div className="text-xs text-gray-400">By {team.creator?.name}</div>
                                    </div>
                                </Space>
                                <Tag color={team.type === 'GAME' ? 'blue' : 'green'} className="m-0">{team.type || 'General'}</Tag>
                            </div>
                            <div className="text-gray-500 mb-4 h-12 line-clamp-2 text-sm">{team.description || 'No description'}</div>
                            <div className="flex justify-between items-center text-xs text-gray-400 mb-4">
                                <Space><TeamOutlined /> {team._count?.members}/{team.maxMembers} Members</Space>
                                <span>{team.creator?.school}</span>
                            </div>
                            {isMember ? (
                                <Button block disabled type="dashed">Already Joined</Button>
                            ) : (
                                <Button
                                    type="primary"
                                    ghost
                                    block
                                    icon={<UsergroupAddOutlined />}
                                    disabled={isFull}
                                    onClick={() => {
                                        setSelectedTeamId(team.id);
                                        setIsJoinModalOpen(true);
                                    }}
                                >
                                    {isFull ? 'Team Full' : 'Join Team'}
                                </Button>
                            )}
                        </div>
                    </Card>
                );
            })}
            {teams.length === 0 && <div className="col-span-full py-10 text-center text-gray-400">No recruiting teams found.</div>}
        </div>
    );

    const MyTeamsTab = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTeams.map(team => (
                <Card
                    key={team.id}
                    className="shadow-sm rounded-lg border-blue-100 hover:border-blue-300 transition-colors"
                    hoverable
                    onClick={() => router.push(`/user/chat?teamId=${team.id}`)}
                >
                    <Meta
                        avatar={<Avatar src={team.creator?.image} />}
                        title={team.name}
                        description={
                            <div>
                                <Tag color="blue" className="mt-2">{team.type}</Tag>
                                <div className="mt-2 text-xs">Members: {team._count?.members}/{team.maxMembers}</div>
                                <div className="mt-4 text-blue-500 text-xs font-semibold">Click to Chat →</div>
                            </div>
                        }
                    />
                </Card>
            ))}
            {myTeams.length === 0 && <div className="col-span-full py-10 text-center text-gray-400">You haven't joined any teams yet.</div>}
        </div>
    );

    const RequestsTab = () => (
        <div className="bg-white rounded-lg shadow-sm">
            <List
                itemLayout="horizontal"
                dataSource={requests}
                className="p-4"
                renderItem={(item: any) => (
                    <List.Item
                        actions={[
                            <Button key="approve" type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleManageRequest(item.id, 'JOINED')}>Approve</Button>,
                            <Button key="reject" danger size="small" icon={<CloseOutlined />} onClick={() => handleManageRequest(item.id, 'REJECTED')}>Reject</Button>
                        ]}
                    >
                        <List.Item.Meta
                            avatar={<Avatar src={item.user.image} />}
                            title={<span><b>{item.user.name}</b> applied for <b>{item.team.name}</b></span>}
                            description={
                                <div>
                                    <div className="text-gray-600 italic">"{item.joinMessage || 'No application message'}"</div>
                                    <div className="text-xs text-gray-400 mt-1">{item.user.school}</div>
                                </div>
                            }
                        />
                    </List.Item>
                )}
                locale={{ emptyText: <div className="py-10 text-gray-400">No pending requests.</div> }}
            />
        </div>
    );

    const items = [
        { key: 'lobby', label: <Space><GlobalOutlined />Lobby</Space>, children: <LobbyTab /> },
        { key: 'mine', label: <Space><TeamOutlined />My Teams</Space>, children: <MyTeamsTab /> },
        ...(requests.length > 0 ? [{ key: 'requests', label: <Space><BellOutlined />Requests <Tag color="red" className="ml-1 m-0">{requests.length}</Tag></Space>, children: <RequestsTab /> }] : []),
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 m-0">Team Center</h1>
                        <p className="text-gray-500 mt-1">Find your perfect squad for games, study, or sports.</p>
                    </div>
                    <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsCreateModalOpen(true)} className="rounded-full shadow-lg h-12 px-6">
                        Create Team
                    </Button>
                </div>

                {loading ? <div className="flex justify-center py-20"><Spin size="large" /></div> : (
                    <Tabs defaultActiveKey="lobby" items={items} className="custom-tabs" />
                )}

                {/* Create Team Modal */}
                <Modal title="Create New Team" open={isCreateModalOpen} onCancel={() => setIsCreateModalOpen(false)} footer={null}>
                    <Form form={createForm} layout="vertical" onFinish={handleCreateTeam}>
                        <Form.Item name="name" label="Team Name" rules={[{ required: true }]}>
                            <Input placeholder="Enter a catchy name" />
                        </Form.Item>
                        <Form.Item name="description" label="Description">
                            <Input.TextArea placeholder="What is this team about?" />
                        </Form.Item>
                        <Form.Item name="type" label="Type" initialValue="GAME">
                            <Select options={[
                                { label: '🎮 Game', value: 'GAME' },
                                { label: '📚 Study', value: 'STUDY' },
                                { label: '⚽ Sport', value: 'SPORT' },
                            ]} />
                        </Form.Item>
                        <Form.Item name="maxMembers" label="Max Members" initialValue={5}>
                            <InputNumber min={2} max={20} className="w-full" />
                        </Form.Item>
                        <Divider />
                        <Form.Item>
                            <Button type="primary" htmlType="submit" block size="large">Create Team</Button>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Join Team Modal */}
                <Modal title="Join Team" open={isJoinModalOpen} onCancel={() => setIsJoinModalOpen(false)} footer={null}>
                    <Form form={joinForm} layout="vertical" onFinish={handleJoinRequest}>
                        <Form.Item name="message" label="Application Message" rules={[{ required: true, message: 'Please introduce yourself' }]}>
                            <Input.TextArea placeholder="Tell the leader why you want to join..." rows={4} />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" block size="large" loading={joining}>Send Request</Button>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
            <style jsx global>{`
                .custom-tabs .ant-tabs-nav::before { border-bottom: none; }
                .custom-tabs .ant-tabs-tab { font-size: 16px; padding: 12px 0; margin-right: 32px; }
            `}</style>
        </div>
    );
};

export default TeamsPage;
