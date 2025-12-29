'use client';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, message, Image, Space, Modal, Input, Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import React, { useRef, useState } from 'react';

type VerificationRequest = {
    id: string;
    user: {
        id: string;
        name: string;
        email: string;
        image: string;
        verificationStatus: string;
    };
    realName: string;
    studentId: string;
    school: string;
    major: string;
    grade: string;
    documents: string[];
    status: string;
    createdAt: string;
};

const VerificationPage: React.FC = () => {
    const actionRef = useRef<ActionType | null>(null);
    const [auditModalVisible, setAuditModalVisible] = useState(false);
    const [currentRequest, setCurrentRequest] = useState<VerificationRequest | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const handleAudit = async (action: 'approve' | 'reject', request: VerificationRequest, reason?: string) => {
        try {
            const res = await fetch('/api/admin/verification', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: request.id,
                    action,
                    reviewNote: reason,
                }),
            });
            const data = await res.json();

            if (data.success) {
                message.success(data.message);
                actionRef.current?.reload();
                setAuditModalVisible(false);
                setRejectReason('');
            } else {
                message.error(data.message || '操作失败');
            }
        } catch (error) {
            message.error('请求出错');
        }
    };

    const columns: ProColumns<VerificationRequest>[] = [
        {
            title: '申请用户',
            dataIndex: ['user', 'name'],
            render: (_, record) => (
                <Space>
                    <Image
                        src={record.user.image || 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png'}
                        width={32}
                        height={32}
                        className="rounded-full"
                    />
                    <div>
                        <div>{record.user.name}</div>
                        <div className="text-xs text-gray-500">{record.user.email}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: '真实姓名',
            dataIndex: 'realName',
            copyable: true,
        },
        {
            title: '学号',
            dataIndex: 'studentId',
            copyable: true,
        },
        {
            title: '学校信息',
            render: (_, record) => (
                <div>
                    <div>{record.school}</div>
                    <div className="text-xs text-gray-500">{record.major} / {record.grade}</div>
                </div>
            ),
        },
        {
            title: '认证材料',
            dataIndex: 'documents',
            hideInSearch: true,
            render: (_, record) => (
                <Image.PreviewGroup>
                    <Space>
                        {record.documents.map((url, index) => (
                            <Image key={index} src={url} width={50} height={50} className="object-cover rounded" />
                        ))}
                    </Space>
                </Image.PreviewGroup>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            valueEnum: {
                PENDING: { text: '待审核', status: 'Processing' },
                APPROVED: { text: '已通过', status: 'Success' },
                REJECTED: { text: '已拒绝', status: 'Error' },
            },
        },
        {
            title: '申请时间',
            dataIndex: 'createdAt',
            valueType: 'dateTime',
        },
        {
            title: '操作',
            valueType: 'option',
            render: (_, record) => [
                record.status === 'PENDING' && (
                    <Space key="actions">
                        <a
                            className="text-green-600"
                            onClick={() => {
                                Modal.confirm({
                                    title: '确认通过认证？',
                                    content: `确定通过用户 ${record.user.name} (${record.realName}) 的学信网认证申请吗？`,
                                    onOk: () => handleAudit('approve', record),
                                });
                            }}
                        >
                            <CheckCircleOutlined /> 通过
                        </a>
                        <a
                            className="text-red-500"
                            onClick={() => {
                                setCurrentRequest(record);
                                setAuditModalVisible(true);
                            }}
                        >
                            <CloseCircleOutlined /> 拒绝
                        </a>
                    </Space>
                )
            ],
        },
    ];

    return (
        <PageContainer>
            <ProTable<VerificationRequest>
                headerTitle="学信网认证审核"
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

                    return await fetch(`/api/admin/verification?${searchParams.toString()}`).then(res => res.json());
                }}
                columns={columns}
            />

            <Modal
                title="拒绝认证申请"
                open={auditModalVisible}
                onOk={() => {
                    if (currentRequest) {
                        handleAudit('reject', currentRequest, rejectReason);
                    }
                }}
                onCancel={() => {
                    setAuditModalVisible(false);
                    setRejectReason('');
                    setCurrentRequest(null);
                }}
            >
                <div>
                    <p className="mb-2">请填写拒绝理由：</p>
                    <Input.TextArea
                        rows={4}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="例如：认证材料模糊，无法辨识身份信息"
                    />
                </div>
            </Modal>
        </PageContainer>
    );
};

export default VerificationPage;
