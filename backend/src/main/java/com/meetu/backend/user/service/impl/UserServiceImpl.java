package com.meetu.backend.user.service.impl;

import com.meetu.backend.user.dto.UserDtos;
import com.meetu.backend.user.entity.UserEntity;
import com.meetu.backend.user.mapper.UserMapper;
import com.meetu.backend.user.service.UserService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

/** 负责账号注册、密码校验和个人资料更新。 */
@Service
public class UserServiceImpl implements UserService {
    private final UserMapper users;
    private final PasswordEncoder encoder;

    public UserServiceImpl(UserMapper users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public UserEntity register(UserDtos.Registration request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (users.findByEmail(email).isPresent()) throw new DuplicateEmailException();
        String id = UUID.randomUUID().toString();
        try {
            users.insert(id, request.name().trim(), email, encoder.encode(request.password()),
                    request.studentId(), request.school());
        // 数据库唯一约束兜底处理并发注册，其他完整性错误继续抛出。
        } catch (DataIntegrityViolationException exception) {
            Throwable cause = exception;
            while (cause != null) {
                if (cause instanceof java.sql.SQLException sql && "23505".equals(sql.getSQLState()))
                    throw new DuplicateEmailException();
                cause = cause.getCause();
            }
            throw exception;
        }
        return users.findById(id).orElseThrow();
    }

    @Override
    public UserEntity login(UserDtos.Login request) {
        var user = users.findByEmail(request.email().trim()).orElse(null);
        if (user == null || user.password() == null || !encoder.matches(request.password(), user.password()))
            throw new InvalidCredentialsException();
        if (!"ACTIVE".equals(user.status())) throw new RestrictedAccountException();
        return user;
    }

    @Override
    public UserEntity profile(String id) { return users.findById(id).orElseThrow(); }

    @Override
    @Transactional
    public UserEntity update(String id, UserDtos.ProfileUpdate request) {
        if (users.updateProfile(id, request.name().trim(), request.school(), request.major(),
                request.grade(), request.bio()) != 1) throw new IllegalStateException("User disappeared");
        return profile(id);
    }

    /** 每次会话请求从数据库确认账号仍为 ACTIVE。 */
    @Override
    public Optional<UserEntity> findActiveSessionUser(String id) {
        return users.findById(id).filter(user -> "ACTIVE".equals(user.status()));
    }

    public static class DuplicateEmailException extends RuntimeException {}
    public static class InvalidCredentialsException extends RuntimeException {}
    public static class RestrictedAccountException extends RuntimeException {}
}
