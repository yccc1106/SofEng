package com.meetu.backend.user.service;

import com.meetu.backend.user.dto.UserDtos;
import com.meetu.backend.user.entity.UserEntity;

import java.util.Optional;

public interface UserService {
    UserEntity register(UserDtos.Registration request);
    UserEntity login(UserDtos.Login request);
    UserEntity profile(String id);
    UserEntity update(String id, UserDtos.ProfileUpdate request);
    Optional<UserEntity> findActiveSessionUser(String id);
}
