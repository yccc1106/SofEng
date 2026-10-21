/**
 * TRTC 用户 ID 只保留字母和数字，MeetU 的 UUID 去连字符后正好 32 位。
 */
export function toTrtcUserId(userId: string) {
    return userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);
}
