package com.meetu.backend.trtc;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.zip.Inflater;

import static org.junit.jupiter.api.Assertions.*;

class TrtcUserSigTests {
    @Test
    void derivesShortTrtcUserIdFromUuid() {
        assertEquals("31f142585ec64466afb1cad2631dd593",
                TrtcUserSigService.toTrtcUserId("31f14258-5ec6-4466-afb1-cad2631dd593"));
    }

    @Test
    void generatesOfficialTlsPayloadAndSignature() throws Exception {
        ObjectMapper json = new ObjectMapper();
        String secret = "test-secret";
        var generated = TrtcUserSigService.generate(1400000000L, secret, 604800, "testuser", json);

        String normalized = generated.userSig()
                .replace('*', '+')
                .replace('-', '/')
                .replace('_', '=');
        JsonNode document = json.readTree(inflate(Base64.getDecoder().decode(normalized)));

        assertEquals("2.0", document.path("TLS.ver").asText());
        assertEquals("testuser", document.path("TLS.identifier").asText());
        assertEquals(1400000000L, document.path("TLS.sdkappid").asLong());
        assertEquals(604800L, document.path("TLS.expire").asLong());
        assertTrue(document.path("TLS.time").asLong() > 0);
        assertEquals(document.path("TLS.time").asLong() + 604800L, generated.expire());

        String raw = "TLS.identifier:testuser\n"
                + "TLS.sdkappid:1400000000\n"
                + "TLS.time:" + document.path("TLS.time").asLong() + "\n"
                + "TLS.expire:604800\n";
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String expected = Base64.getEncoder().encodeToString(
                mac.doFinal(raw.getBytes(StandardCharsets.UTF_8)));
        assertEquals(expected, document.path("TLS.sig").asText());
    }

    private static byte[] inflate(byte[] input) throws Exception {
        Inflater inflater = new Inflater();
        inflater.setInput(input);
        ByteArrayOutputStream output = new ByteArrayOutputStream(input.length * 2);
        byte[] buffer = new byte[1024];
        while (!inflater.finished()) {
            int count = inflater.inflate(buffer);
            if (count == 0 && inflater.needsInput()) break;
            output.write(buffer, 0, count);
        }
        inflater.end();
        return output.toByteArray();
    }
}
