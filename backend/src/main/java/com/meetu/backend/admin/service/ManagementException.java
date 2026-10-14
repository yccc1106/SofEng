package com.meetu.backend.admin.service;

public final class ManagementException extends RuntimeException {
    public enum Kind { INVALID, NOT_FOUND, CONFLICT, FORBIDDEN }
    private final Kind kind;
    public ManagementException(Kind kind, String message) { super(message); this.kind=kind; }
    public Kind kind() { return kind; }
    public static ManagementException invalid(String message) { return new ManagementException(Kind.INVALID,message); }
    public static ManagementException missing(String message) { return new ManagementException(Kind.NOT_FOUND,message); }
    public static ManagementException conflict(String message) { return new ManagementException(Kind.CONFLICT,message); }
    public static ManagementException forbidden(String message) { return new ManagementException(Kind.FORBIDDEN,message); }
}
