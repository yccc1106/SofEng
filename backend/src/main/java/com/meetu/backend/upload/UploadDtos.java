package com.meetu.backend.upload;

public final class UploadDtos {
    private UploadDtos() {}

    public record Image(String url, String name, String contentType, long size) {}
}
