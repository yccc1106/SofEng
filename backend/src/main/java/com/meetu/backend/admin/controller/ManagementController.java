package com.meetu.backend.admin.controller;
import com.meetu.backend.admin.dto.AdminDtos.*;
import com.meetu.backend.admin.service.ManagementService;
import com.meetu.backend.common.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
/** 管理用户、认证与分类的入口；访问权限由统一安全配置控制。 */
@RestController
@RequestMapping("/api/admin")
public class ManagementController {
    private final ManagementService service;
    public ManagementController(ManagementService service) { this.service=service; }
    @GetMapping("/users") public ApiResponse<List<Map<String,Object>>> users(@RequestParam(required=false) String status,@RequestParam(required=false) String verificationStatus,@RequestParam(required=false) String keyword,@RequestParam(defaultValue="1") int current,@RequestParam(defaultValue="10") int pageSize) {
        var rows=service.users(status,verificationStatus,keyword,current,pageSize);
        return ApiResponse.page("Users retrieved",rows,current,pageSize,service.userCount(status,verificationStatus,keyword));
    }
    @GetMapping("/users/{id}") public ApiResponse<Map<String,Object>> user(@PathVariable String id) { return ApiResponse.success(service.user(id)); }
    @PutMapping("/users") public ApiResponse<Void> userAction(Authentication auth,@Valid @RequestBody UserAction request) { service.userAction(auth.getName(),request); return ApiResponse.success("User updated",null); }
    @DeleteMapping("/users") public ApiResponse<Void> deleteUser(Authentication auth,@RequestParam String id) { service.deleteUser(auth.getName(),id); return ApiResponse.success("User deleted",null); }
    @GetMapping("/verification") public ApiResponse<List<Map<String,Object>>> verifications(@RequestParam(defaultValue="PENDING") String status,@RequestParam(defaultValue="1") int current,@RequestParam(defaultValue="10") int pageSize) {
        var rows=service.verifications(status,current,pageSize);
        return ApiResponse.page("Verifications retrieved",rows,current,pageSize,service.verificationCount(status));
    }
    @PutMapping("/verification") public ApiResponse<Void> decideVerification(Authentication auth,@Valid @RequestBody VerificationDecision decision) { service.decideVerification(auth.getName(),decision); return ApiResponse.success("Verification reviewed",null); }
    @GetMapping("/interest") public ApiResponse<List<Map<String,Object>>> categories() { return ApiResponse.success(service.categories()); }
    @PostMapping("/interest") public ApiResponse<Map<String,Object>> createCategory(Authentication auth,@Valid @RequestBody CategoryChange change) { return ApiResponse.success("Category created",service.createCategory(auth.getName(),change)); }
    @PutMapping("/interest") public ApiResponse<Void> updateCategory(Authentication auth,@Valid @RequestBody CategoryChange change) { service.updateCategory(auth.getName(),change); return ApiResponse.success("Category updated",null); }
    @DeleteMapping("/interest") public ApiResponse<Void> deleteCategory(Authentication auth,@RequestParam String id) { service.deleteCategory(auth.getName(),id); return ApiResponse.success("Category deleted",null); }
}
