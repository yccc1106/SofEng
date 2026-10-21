'use client';
import { useLanguage } from '@/lib/language';
import React, { useCallback, useEffect, useState } from 'react';
import { Card, Button, Avatar, Tag, Spin, Modal, Form, Input, InputNumber, Select, App, Tabs, List, Space, Divider, Image } from 'antd';
import { PlusOutlined, UsergroupAddOutlined, CheckOutlined, CloseOutlined, TeamOutlined, GlobalOutlined, BellOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { javaRequest } from '@/lib/java-client';
import type { CreateTeamValues, TeamJoinRequest, TeamSummary } from '@/types/social';
import ImageUploadField from '@/components/Upload/ImageUploadField';

const { Meta } = Card;

/** 分别展示招募队伍、已加入队伍及队长待审批申请。 */
const TeamsPage = () => {
    const { t } = useLanguage();
    const { message } = App.useApp();
    const router = useRouter();
    const [teams, setTeams] = useState<TeamSummary[]>([]);
    const [myTeams, setMyTeams] = useState<TeamSummary[]>([]);
    const [requests, setRequests] = useState<TeamJoinRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [joining, setJoining] = useState(false);
    const [creatingTeam, setCreatingTeam] = useState(false);
    const [uploadingTeamImage, setUploadingTeamImage] = useState(false);

    const [createForm] = Form.useForm();
    const [joinForm] = Form.useForm();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            setTeams(await javaRequest<TeamSummary[]>('/teams'));

            setMyTeams(await javaRequest<TeamSummary[]>('/teams?mine=true'));

            setRequests(await javaRequest<TeamJoinRequest[]>('/teams/requests'));

        } catch {
            message.error(t('Failed to load data'));
        } finally {
            setLoading(false);
        }
    }, [message, t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateTeam = async (values: CreateTeamValues) => {
        setCreatingTeam(true);
        try {
            await javaRequest('/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            message.success(t('Team created'));
            setIsCreateModalOpen(false);
            createForm.resetFields();
            fetchData();
        } catch {
            message.error(t('Error creating team'));
        } finally {
            setCreatingTeam(false);
        }
    };

    const handleJoinRequest = async (values: { message: string }) => {
        if (!selectedTeamId) return;
        setJoining(true);
        try {
            const data = await javaRequest<{ status: string }>('/teams/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId: selectedTeamId, message: values.message }),
            });
            message.success(data.status === 'PENDING' ? t('Application sent') : t('Joined team successfully'));
            setIsJoinModalOpen(false);
            joinForm.resetFields();
            fetchData();
        } catch {
            message.error(t('Error joining team'));
        } finally {
            setJoining(false);
        }
    };

    const handleManageRequest = async (memberId: string, status: 'JOINED' | 'REJECTED') => {
        try {
            await javaRequest('/teams/requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId, status }),
            });
            message.success(status === 'JOINED' ? t('Approved') : t('Rejected'));
            fetchData();
        } catch {
            message.error(t('Error managing request'));
        }
    };

    const LobbyTab = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map(team => {
                const isMember = myTeams.some(mt => mt.id === team.id);
                const isFull = team._count?.members >= team.maxMembers;

                return (
                    <Card key={team.id} className="shadow-sm rounded-lg hover:shadow-md transition-shadow overflow-hidden">
                        {team.image && (
                            <Image
                                src={team.image}
                                alt={team.name}
                                width="100%"
                                height={150}
                                style={{ objectFit: 'cover', display: 'block' }}
                            />
                        )}
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-4">
                                <Space>
                                    <Avatar src={team.creator?.image} size="large" />
                                    <div>
                                        <div className="font-bold text-lg text-gray-800 leading-tight">{team.name}</div>
                                        <div className="text-xs text-gray-400">{t('By')} {team.creator?.name}</div>
                                    </div>
                                </Space>
                                <Tag color={team.type === 'GAME' ? 'blue' : 'green'} className="m-0">{t(team.type || 'General')}</Tag>
                            </div>
                            <div className="text-gray-500 mb-4 h-12 line-clamp-2 text-sm">{team.description || t('No description')}</div>
                            <div className="flex justify-between items-center text-xs text-gray-400 mb-4">
                                <Space><TeamOutlined /> {team._count?.members}/{team.maxMembers} {t('Members')}</Space>
                                <span>{team.creator?.school}</span>
                            </div>
                            {isMember ? (
                                <Button block disabled type="dashed">{t("Already Joined")}</Button>
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
                                    {isFull ? t('Team Full') : t('Join Team')}
                                </Button>
                            )}
                        </div>
                    </Card>
                );
            })}
            {teams.length === 0 && <div className="col-span-full py-10 text-center text-gray-400">{t("No recruiting teams found.")}</div>}
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
                        avatar={<Avatar shape="square" size={56} src={team.image || team.creator?.image} />}
                        title={team.name}
                        description={
                            <div>
                                <Tag color="blue" className="mt-2">{t(team.type || 'General')}</Tag>
                                <div className="mt-2 text-xs">{t('Members:')} {team._count?.members}/{team.maxMembers}</div>
                                <div className="mt-4 text-blue-500 text-xs font-semibold">{t("Click to Chat →")}</div>
                            </div>
                        }
                    />
                </Card>
            ))}
            {myTeams.length === 0 && <div className="col-span-full py-10 text-center text-gray-400">{t("You haven't joined any teams yet.")}</div>}
        </div>
    );

    const RequestsTab = () => (
        <div className="bg-white rounded-lg shadow-sm">
            <List
                itemLayout="horizontal"
                dataSource={requests}
                className="p-4"
                renderItem={(item: TeamJoinRequest) => (
                    <List.Item
                        actions={[
                            <Button key="approve" type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleManageRequest(item.id, 'JOINED')}>{t("Approve")}</Button>,
                            <Button key="reject" danger size="small" icon={<CloseOutlined />} onClick={() => handleManageRequest(item.id, 'REJECTED')}>{t("Reject")}</Button>
                        ]}
                    >
                        <List.Item.Meta
                            avatar={<Avatar src={item.user.image} />}
                            title={<span><b>{item.user.name}</b> {t("applied for")} <b>{item.team.name}</b></span>}
                            description={
                                <div>
                                    <div className="text-gray-600 italic">&quot;{item.joinMessage || t('No application message')}&quot;</div>
                                    <div className="text-xs text-gray-400 mt-1">{item.user.school}</div>
                                </div>
                            }
                        />
                    </List.Item>
                )}
                locale={{ emptyText: <div className="py-10 text-gray-400">{t("No pending requests.")}</div> }}
            />
        </div>
    );

    const items = [
        { key: 'lobby', label: <Space><GlobalOutlined />{t("Lobby")}</Space>, children: <LobbyTab /> },
        { key: 'mine', label: <Space><TeamOutlined />{t("My Teams")}</Space>, children: <MyTeamsTab /> },
        ...(requests.length > 0 ? [{ key: 'requests', label: <Space><BellOutlined />{t("Requests")} <Tag color="red" className="ml-1 m-0">{requests.length}</Tag></Space>, children: <RequestsTab /> }] : []),
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 m-0">{t("Team Center")}</h1>
                        <p className="text-gray-500 mt-1">{t("Find your perfect squad for games, study, or sports.")}</p>
                    </div>
                    <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsCreateModalOpen(true)} className="rounded-full shadow-lg h-12 px-6">
                        {t("Create Team")}
                    </Button>
                </div>

                {loading ? <div className="flex justify-center py-20"><Spin size="large" /></div> : (
                    <Tabs defaultActiveKey="lobby" items={items} className="custom-tabs" />
                )}

                {/* Create Team Modal */}
                <Modal title={t("Create New Team")} open={isCreateModalOpen} onCancel={() => setIsCreateModalOpen(false)} footer={null}>
                    <Form form={createForm} layout="vertical" onFinish={handleCreateTeam}>
                        <Form.Item name="name" label={t("Team Name")} rules={[{ required: true }]}>
                            <Input placeholder={t("Enter a catchy name")} />
                        </Form.Item>
                        <Form.Item name="description" label={t("Description")}>
                            <Input.TextArea placeholder={t("What is this team about?")} />
                        </Form.Item>
                        <Form.Item name="image" label={t('Team image')}>
                            <ImageUploadField
                                scope="team"
                                buttonText="Upload team image"
                                onUploadingChange={setUploadingTeamImage}
                            />
                        </Form.Item>
                        <Form.Item name="type" label={t("Type")} initialValue="GAME">
                            <Select options={[
                                { label: t('🎮 Game'), value: 'GAME' },
                                { label: t('📚 Study'), value: 'STUDY' },
                                { label: t('⚽ Sport'), value: 'SPORT' },
                            ]} />
                        </Form.Item>
                        <Form.Item name="maxMembers" label={t("Max Members")} initialValue={5}>
                            <InputNumber min={2} max={20} className="w-full" />
                        </Form.Item>
                        <Divider />
                        <Form.Item>
                            <Button type="primary" htmlType="submit" block size="large" loading={creatingTeam} disabled={uploadingTeamImage}>
                                {t("Create Team")}
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Join Team Modal */}
                <Modal title={t("Join Team")} open={isJoinModalOpen} onCancel={() => setIsJoinModalOpen(false)} footer={null}>
                    <Form form={joinForm} layout="vertical" onFinish={handleJoinRequest}>
                        <Form.Item name="message" label={t("Application Message")} rules={[{ required: true, message: t('Please introduce yourself') }]}>
                            <Input.TextArea placeholder={t("Tell the leader why you want to join...")} rows={4} />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" block size="large" loading={joining}>{t("Send Request")}</Button>
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
