package com.meetu.backend.upload;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Validates persisted local image URLs so request bodies cannot inject arbitrary paths. */
public final class LocalImagePath {
    private static final Pattern IMAGE_URL = Pattern.compile(
            "^/java/uploads/(chat|post|team)/"
                    + "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-"
                    + "[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\\.(jpg|jpeg|png|webp|gif)$"
    );

    private LocalImagePath() {}

    public static boolean matches(String scope, String value) {
        if (value == null) return false;
        Matcher matcher = IMAGE_URL.matcher(value);
        return matcher.matches() && matcher.group(1).equals(scope);
    }
}
