"use client";

import dynamic from "next/dynamic";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { toTrtcUserId } from "@/lib/trtc-user";

const TUICallKit = dynamic(
    () => import("@trtc/calls-uikit-react").then((module) => module.TUICallKit),
    { ssr: false },
);

export type CallMedia = "audio" | "video";

type CallContextValue = {
    ready: boolean;
    initializing: boolean;
    error: string | null;
    startCall: (targetUserIds: string[], mediaType: CallMedia) => Promise<void>;
};

type TrtcTokenResponse = {
    success: boolean;
    message?: string;
    error?: string;
    data?: {
        sdkAppID: number;
        userID: string;
        userSig: string;
        expire: number;
        nickName: string;
        avatar: string;
    };
};

const CallContext = createContext<CallContextValue | null>(null);
let initializedUserId: string | null = null;
let initialization: Promise<void> | null = null;

async function ensureTrtcInitialized(userId: string) {
    if (initializedUserId === userId && initialization) return initialization;
    if (initializedUserId === userId) return;

    initialization = (async () => {
        const response = await fetch("/java/trtc/usersig", { cache: "no-store" });
        const payload = await response.json() as TrtcTokenResponse;
        if (!response.ok || !payload.success || !payload.data) {
            throw new Error(payload.message || payload.error || "获取 TRTC 通话凭证失败");
        }

        const { TUICallKitAPI } = await import("@trtc/calls-uikit-react");
        if (initializedUserId && initializedUserId !== userId) {
            try {
                await TUICallKitAPI.destroyed();
            } catch {
                // The previous call instance may already be closed.
            }
            initializedUserId = null;
        }

        await TUICallKitAPI.init({
            userID: payload.data.userID,
            userSig: payload.data.userSig,
            SDKAppID: payload.data.sdkAppID,
        });
        try {
            await TUICallKitAPI.setSelfInfo({
                nickName: payload.data.nickName || payload.data.userID,
                avatar: payload.data.avatar || "",
            });
        } catch {
            // Nickname and avatar are optional for making calls.
        }
        TUICallKitAPI.setLanguage("zh-cn");
        initializedUserId = userId;
    })();

    try {
        await initialization;
    } finally {
        if (initializedUserId !== userId) initialization = null;
    }
}

export function CallProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useAuth();
    const [ready, setReady] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [callActive, setCallActive] = useState(false);

    useEffect(() => {
        if (!session?.user?.id) {
            setReady(false);
            setError(null);
            return;
        }

        let cancelled = false;
        setInitializing(true);
        void ensureTrtcInitialized(session.user.id)
            .then(() => {
                if (!cancelled) {
                    setReady(true);
                    setError(null);
                }
            })
            .catch((reason: unknown) => {
                if (!cancelled) {
                    setReady(false);
                    setError(reason instanceof Error ? reason.message : "TRTC 初始化失败");
                }
            })
            .finally(() => {
                if (!cancelled) setInitializing(false);
            });

        return () => {
            cancelled = true;
        };
    }, [session?.user?.id]);

    useEffect(() => {
        if (!ready) {
            setCallActive(false);
            return;
        }

        let cancelled = false;
        let unwatch: (() => void) | undefined;
        void import("@trtc/calls-uikit-react").then(({ TUIStore, StoreName, NAME }) => {
            if (cancelled) return;
            const handleStatus = (status: unknown) => {
                setCallActive(status !== "idle");
            };
            const watchers = { [NAME.CALL_STATUS]: handleStatus };
            TUIStore.watch(StoreName.CALL, watchers, { notifyRangeWhenWatch: NAME.MYSELF });
            handleStatus(TUIStore.getData(StoreName.CALL, NAME.CALL_STATUS));
            unwatch = () => TUIStore.unwatch(StoreName.CALL, watchers);
        }).catch(() => {
            // The call component will still render; only the backdrop state is unavailable.
        });

        return () => {
            cancelled = true;
            unwatch?.();
        };
    }, [ready]);

    const startCall = useCallback(async (targetUserIds: string[], mediaType: CallMedia) => {
        if (!ready) throw new Error(error || "TRTC 尚未初始化完成");
        const userIDList = targetUserIds.map(toTrtcUserId).filter(Boolean);
        if (userIDList.length === 0) throw new Error("请选择被叫用户");

        const { TUICallKitAPI, CallMediaType } = await import("@trtc/calls-uikit-react");
        await TUICallKitAPI.calls({
            userIDList,
            type: mediaType === "video" ? CallMediaType.VIDEO : CallMediaType.AUDIO,
        });
    }, [error, ready]);

    const value = useMemo<CallContextValue>(() => ({
        ready,
        initializing,
        error,
        startCall,
    }), [error, initializing, ready, startCall]);

    return (
        <CallContext.Provider value={value}>
            {children}
            {ready ? (
                <div
                    className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-colors ${
                        callActive ? "bg-black/60 backdrop-blur-sm pointer-events-auto" : "pointer-events-none"
                    }`}
                    aria-hidden={!callActive}
                >
                    <div className="pointer-events-auto">
                        <TUICallKit
                            style={{
                                width: "min(960px, calc(100vw - 2rem))",
                                height: "min(630px, calc(100vh - 2rem))",
                            }}
                        />
                    </div>
                </div>
            ) : null}
        </CallContext.Provider>
    );
}

export function useCall() {
    const context = useContext(CallContext);
    if (!context) throw new Error("useCall must be used inside CallProvider");
    return context;
}
