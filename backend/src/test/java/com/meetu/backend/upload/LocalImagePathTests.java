package com.meetu.backend.upload;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LocalImagePathTests {
    @Test
    void acceptsOnlyCanonicalUploadedPathsForTheExpectedScope() {
        String postImage="/java/uploads/post/11111111-1111-4111-8111-111111111111.png";
        assertTrue(LocalImagePath.matches("post",postImage));
        assertFalse(LocalImagePath.matches("team",postImage));
        assertFalse(LocalImagePath.matches("post","/java/uploads/post/../../team/image.png"));
        assertFalse(LocalImagePath.matches("post","https://example.com/image.png"));
        assertFalse(LocalImagePath.matches("post",postImage+"?download=1"));
    }
}
