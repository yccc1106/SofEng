'use client';
import { ActionType, PageContainer, ProColumns, ProDescriptions, ProTable } from '@ant-design/pro-components';
import { Button, Drawer, Tag, message, Popconfirm, Avatar, Space, Modal } from 'antd';
import { UserOutlined, StopOutlined, SafetyCertificateOutlined, DeleteOutlined } from '@ant-design/icons';
import React, { useRef, useState } from 'react';
import { shanghaiDateTime } from '@/lib/shanghai-time';

type UserItem = {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    image: string;
    role: string;
    studentId: string;
    school: string;
    major: string;
    grade: string;
    realName: string;
    verificationStatus: string;
    status: string;
    createdAt: string;
    _count: {
        posts: number;
        teamsCreated: number;
    };
};

const UserList: React.FC = () => {
    const actionRef = useRef<ActionType | null>(null);
    const [currentRow, setCurrentRow] = useState<UserItem | null>(null);
    const [detailVisible, setDetailVisible] = useState<boolean>(false);

    // 处理用户状态变更（冻结/解冻/删除）
    const handleStatusChange = async (id: string, action: string) => {
        try {
            const method = action === 'delete' ? 'DELETE' : 'PUT';
            const url = action === 'delete'
                ? `/java/admin/users?id=${id}`
                : `/java/admin/users`;

            const body = action === 'delete' ? undefined : JSON.stringify({ id, action });

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body,
            });
            const data = await res.json();

            if (data.success) {
                message.success('操作成功');
                actionRef.current?.reload();
            } else {
                message.error(data.message || '操作失败');
            }
        } catch (error) {
            message.error('请求出错');
        }
    };

    const columns: ProColumns<UserItem>[] = [
        {
            title: '用户信息',
            dataIndex: 'name',
            render: (_, record) => (
                <Space>
                    <Avatar src={record.image} icon={<UserOutlined />} />
                    <div>
                        <div className="font-medium">{record.name || '未命名'}</div>
                        <div className="text-xs text-gray-500">{record.email}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: '真实姓名',
            dataIndex: 'realName',
            hideInSearch: true,
            render: (dom, record) => record.realName || '-',
        },
        {
            title: '学校/专业',
            dataIndex: 'school',
            hideInSearch: true,
            render: (_, record) => (
                <div className="text-sm">
                    <div>{record.school || '-'}</div>
                    <div className="text-xs text-gray-500">{record.major} {record.grade}</div>
                </div>
            ),
        },
        {
            title: '认证状态',
            dataIndex: 'verificationStatus',
            valueEnum: {
                UNVERIFIED: { text: '未认证', status: 'Default' },
                PENDING: { text: '审核中', status: 'Processing' },
                VERIFIED: { text: '已认证', status: 'Success' },
                REJECTED: { text: '已拒绝', status: 'Error' },
            },
        },
        {
            title: '账号状态',
            dataIndex: 'status',
            valueEnum: {
                ACTIVE: { text: '正常', status: 'Success' },
                BANNED: { text: '封禁', status: 'Error' },
                FROZEN: { text: '冻结', status: 'Warning' },
                DELETED: { text: '已删除', status: 'Default' },
            },
        },
        {
            title: '注册时间',
            dataIndex: 'createdAt',
            render: (_, record) => shanghaiDateTime(record.createdAt),
            hideInSearch: true,
            sorter: true,
        },
        {
            title: '操作',
            valueType: 'option',
            width: 180,
            render: (_, record) => [
                <a key="view" onClick={() => {
                    setCurrentRow(record);
                    setDetailVisible(true);
                }}>
                    详情
                </a>,
                record.role !== 'ADMIN' && (record.status === 'ACTIVE' ? (
                    <Popconfirm
                        key="freeze"
                        title="确定要冻结该用户吗？"
                        onConfirm={() => handleStatusChange(record.id, 'freeze')}
                    >
                        <a className="text-amber-500">冻结</a>
                    </Popconfirm>
                ) : (
                    record.status !== 'DELETED' && (
                        <Popconfirm
                            key="activate"
                            title="确定要恢复该用户吗？"
                            onConfirm={() => handleStatusChange(record.id, 'activate')}
                        >
                            <a className="text-green-500">恢复</a>
                        </Popconfirm>
                    )
                )),
                record.role !== 'ADMIN' && record.status !== 'DELETED' && (
                    <Popconfirm
                        key="delete"
                        title="确定要删除该用户吗？"
                        description="删除后无法恢复"
                        onConfirm={() => handleStatusChange(record.id, 'delete')}
                        okType="danger"
                    >
                        <a className="text-red-500">删除</a>
                    </Popconfirm>
                ),
            ],
        },
    ];

    return (
        <PageContainer>
            <ProTable<UserItem>
                headerTitle="用户列表"
                actionRef={actionRef}
                rowKey="id"
                search={{
                    labelWidth: 100,
                }}
                request={async (params) => {
                    const searchParams = new URLSearchParams();
                    searchParams.append('current', params.current?.toString() || '1');
                    searchParams.append('pageSize', params.pageSize?.toString() || '10');
                    if (params.status) searchParams.append('status', params.status);
                    if (params.verificationStatus) searchParams.append('verificationStatus', params.verificationStatus);
                    if (params.keyword) searchParams.append('keyword', params.keyword);
                    // ProTable 的 keyword 搜索通常是自定义的，这里假设搜索框把值传给了 name 或 email 等
                    // 我们简化处理，如果 params 中有除了分页和状态以外的字段，也可以传给 API
                    // 但标准的 ProTable 搜索栏会把每个字段传进来
                    // 这里我们假设后端支持 keyword 参数，我们在前端可以通过一个统一的搜索框或者分别的字段来传
                    // 鉴于时间，我们这里暂时只支持 status 和 verificationStatus 过滤，以及全局 keyword
                    // 实际上 ProTable 默认生成的搜索表单会把字段名传过来

                    // 如果需要在搜索栏增加一个通用的关键词搜索：
                    // 我们可以在 columns 里加一个不显示在 table 但显示在 search 的字段
                    const result = await fetch(`/java/admin/users?${searchParams.toString()}`).then(res => res.json());
                    return { ...result, total: result.pagination?.total };
                }}
                columns={[
                    ...columns,
                    // 添加一个用于搜索的隐藏字段
                    {
                        title: '关键词搜索',
                        dataIndex: 'keyword',
                        hideInTable: true,
                        tooltip: '搜索姓名、邮箱、学号或学校',
                    }
                ]}
            />

            <Drawer
                width={600}
                open={detailVisible}
                onClose={() => {
                    setDetailVisible(false);
                    setCurrentRow(null);
                }}
                closable={false}
            >
                {currentRow?.id && (
                    <ProDescriptions<UserItem>
                        column={2}
                        title="用户详细资料"
                        request={async () => {
                            const res = await fetch(`/java/admin/users/${currentRow.id}`);
                            return await res.json();
                        }}
                        params={{
                            id: currentRow.id,
                        }}
                        columns={[
                            {
                                title: '头像',
                                dataIndex: 'image',
                                render: (text) => <Avatar src={text as string} size="large" icon={<UserOutlined />} />,
                                span: 2,
                            },
                            {
                                title: '用户ID',
                                dataIndex: 'id',
                                copyable: true,
                            },
                            {
                                title: '昵称',
                                dataIndex: 'name',
                            },
                            {
                                title: '邮箱',
                                dataIndex: 'email',
                            },
                            {
                                title: '手机号',
                                dataIndex: 'phoneNumber',
                            },
                            {
                                title: '真实姓名',
                                dataIndex: 'realName',
                            },
                            {
                                title: '性别',
                                dataIndex: 'gender',
                            },
                            {
                                title: '学校',
                                dataIndex: 'school',
                            },
                            {
                                title: '专业',
                                dataIndex: 'major',
                            },
                            {
                                title: '年级',
                                dataIndex: 'grade',
                            },
                            {
                                title: '学号',
                                dataIndex: 'studentId',
                            },
                            {
                                title: 'MBTI类型',
                                dataIndex: 'personalityType',
                            },
                            {
                                title: '个人简介',
                                dataIndex: 'bio',
                                span: 2,
                            },
                            {
                                title: '发帖数',
                                dataIndex: ['_count', 'posts'],
                            },
                            {
                                title: '创建团队数',
                                dataIndex: ['_count', 'teamsCreated'],
                            },
                            {
                                title: '注册时间',
                                dataIndex: 'createdAt',
                                render: (_, record) => shanghaiDateTime(record.createdAt),
                            },
                        ]}
                    />
                )}
            </Drawer>
        </PageContainer>
    );
};

export default UserList;
