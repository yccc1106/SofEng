package com.meetu.backend.trtc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meetu.backend.user.entity.UserEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.zip.Deflater;

/** 生成与官方 GenerateTestUserSig 兼容的 TRTC UserSig。 */
@Service
public class TrtcUserSigService {
    private final long sdkAppID;
    private final String secretKey;
    private final long expireSeconds;
    private final ObjectMapper json;

    public TrtcUserSigService(@Value("${meetu.trtc.sdk-app-id:0}") long sdkAppID,
                              @Value("${meetu.trtc.secret-key:}") String secretKey,
                              @Value("${meetu.trtc.user-sig-expire-seconds:86400}") long expireSeconds,
                              ObjectMapper json) {
        this.sdkAppID = sdkAppID;
        this.secretKey = secretKey == null ? "" : secretKey.trim();
        this.expireSeconds = expireSeconds;
        this.json = json;
    }

    public TrtcDtos.UserSig issue(UserEntity user) {
        if (sdkAppID <= 0 || secretKey.isBlank()) {
            throw new TrtcUnavailableException();
        }
        String userID = toTrtcUserId(user.id());
        if (userID.isBlank()) throw new IllegalArgumentException("Unable to derive TRTC user ID");
        var generated = generate(sdkAppID, secretKey, expireSeconds, userID, json);
        return new TrtcDtos.UserSig(sdkAppID, userID, generated.userSig(), generated.expire(),
                user.name() == null ? userID : user.name(),
                user.image() == null ? "" : user.image());
    }

    static String toTrtcUserId(String userId) {
        String normalized = userId == null ? "" : userId.replaceAll("[^A-Za-z0-9]", "");
        return normalized.length() > 32 ? normalized.substring(0, 32) : normalized;
    }

    static Generated generate(long sdkAppID, String secretKey, long expireSeconds,
                              String userID, ObjectMapper json) {
        if (sdkAppID <= 0 || secretKey.isBlank() || userID.isBlank() || expireSeconds <= 0) {
            throw new IllegalArgumentException("Invalid TRTC configuration");
        }

        long time = Instant.now().getEpochSecond();
        long lifetime = expireSeconds;
        long expireAt = time + lifetime;
        String raw = "TLS.identifier:" + userID + "\n"
                + "TLS.sdkappid:" + sdkAppID + "\n"
                + "TLS.time:" + time + "\n"
                + "TLS.expire:" + lifetime + "\n";

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String signature = Base64.getEncoder().encodeToString(
                    mac.doFinal(raw.getBytes(StandardCharsets.UTF_8)));

            Map<String, Object> document = new LinkedHashMap<>();
            document.put("TLS.ver", "2.0");
            document.put("TLS.identifier", userID);
            document.put("TLS.sdkappid", sdkAppID);
            document.put("TLS.time", time);
            document.put("TLS.expire", lifetime);
            document.put("TLS.sig", signature);

            byte[] compressed = deflate(json.writeValueAsString(document)
                    .getBytes(StandardCharsets.UTF_8));
            String userSig = Base64.getEncoder().encodeToString(compressed)
                    .replace('+', '*')
                    .replace('/', '-')
                    .replace('=', '_');
            return new Generated(userSig, expireAt);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to generate TRTC UserSig", exception);
        }
    }

    private static byte[] deflate(byte[] input) {
        Deflater deflater = new Deflater(Deflater.DEFAULT_COMPRESSION);
        deflater.setInput(input);
        deflater.finish();
        ByteArrayOutputStream output = new ByteArrayOutputStream(input.length);
        byte[] buffer = new byte[1024];
        while (!deflater.finished()) {
            int count = deflater.deflate(buffer);
            output.write(buffer, 0, count);
        }
        deflater.end();
        return output.toByteArray();
    }

    record Generated(String userSig, long expire) {}

    public static class TrtcUnavailableException extends RuntimeException {}
}
