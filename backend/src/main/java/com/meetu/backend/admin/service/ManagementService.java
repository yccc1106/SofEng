package com.meetu.backend.admin.service;
import com.meetu.backend.admin.dto.AdminDtos.*;
import java.util.List;
import java.util.Map;
public interface ManagementService {
    List<Map<String,Object>> users(String status,String verification,String keyword,int page,int size);
    long userCount(String status,String verification,String keyword);
    Map<String,Object> user(String id);
    void userAction(String admin,UserAction action);
    void deleteUser(String admin,String id);
    List<Map<String,Object>> verifications(String status,int page,int size);
    long verificationCount(String status);
    void decideVerification(String admin,VerificationDecision decision);
    List<Map<String,Object>> categories();
    Map<String,Object> createCategory(String admin,CategoryChange change);
    void updateCategory(String admin,CategoryChange change);
    void deleteCategory(String admin,String id);
}
