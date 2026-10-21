"use client";

import React, { useState } from "react";
import { Alert, App, Avatar, Button, Empty, Modal, Space, Typography } from "antd";
import { PhoneOutlined, UserOutlined, VideoCameraOutlined } from "@ant-design/icons";
import { useCall, type CallMedia } from "./CallProvider";
import { useLanguage } from "@/lib/language";

const { Text } = Typography;

export type CallContact = {
    id: string;
    name: string;
    image?: string | null;
};

type CallModalProps = {
    open: boolean;
    contact: CallContact | null;
    onClose: () => void;
};

export function CallModal({ open, contact, onClose }: CallModalProps) {
    const { t } = useLanguage();
    const { message } = App.useApp();
    const { ready, initializing, error, startCall } = useCall();
    const [starting, setStarting] = useState<CallMedia | null>(null);

    const handleCall = async (mediaType: CallMedia) => {
        if (!contact) return;
        setStarting(mediaType);
        try {
            await startCall([contact.id], mediaType);
            onClose();
        } catch (reason) {
            message.error(reason instanceof Error ? reason.message : t("Call failed"));
        } finally {
            setStarting(null);
        }
    };

    return (
        <Modal
            open={open}
            onCancel={() => {
                if (!starting) onClose();
            }}
            footer={null}
            centered
            title={t("Start Call")}
        >
            {contact ? (
                <Space orientation="vertical" size="middle" className="w-full">
                    <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                        <Avatar size={48} src={contact.image} icon={<UserOutlined />} />
                        <div>
                            <Text strong>{contact.name}</Text>
                            <div className="text-xs text-gray-400">{t("Choose call type")}</div>
                        </div>
                    </div>

                    {initializing && (
                        <Alert type="info" showIcon title={t("Call service is initializing")} />
                    )}
                    {error && (
                        <Alert
                            type="warning"
                            showIcon
                            title={t("Call service unavailable")}
                            description={error}
                        />
                    )}

                    <Space wrap>
                        <Button
                            type="primary"
                            size="large"
                            icon={<PhoneOutlined />}
                            loading={starting === "audio"}
                            disabled={!ready || Boolean(starting)}
                            onClick={() => void handleCall("audio")}
                        >
                            {t("Voice Call")}
                        </Button>
                        <Button
                            size="large"
                            icon={<VideoCameraOutlined />}
                            loading={starting === "video"}
                            disabled={!ready || Boolean(starting)}
                            onClick={() => void handleCall("video")}
                        >
                            {t("Video Call")}
                        </Button>
                    </Space>

                    <div className="text-xs text-gray-400">
                        {t("Allow microphone and camera permissions for the first call. The call window floats above the page.")}
                    </div>
                </Space>
            ) : (
                <Empty description={t("Select a friend conversation")} />
            )}
        </Modal>
    );
}
