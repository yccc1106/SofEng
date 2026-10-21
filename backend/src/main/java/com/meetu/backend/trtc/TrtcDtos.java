package com.meetu.backend.trtc;

public final class TrtcDtos {
    private TrtcDtos() {}

    public record UserSig(long sdkAppID, String userID, String userSig, long expire,
                          String nickName, String avatar) {}
}
