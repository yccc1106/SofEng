package com.meetu.backend.admin.service.impl;
import com.meetu.backend.admin.dto.AdminDtos.*;
import com.meetu.backend.admin.mapper.AuditMapper;
import com.meetu.backend.admin.mapper.ManagementMapper;
import com.meetu.backend.admin.service.ManagementException;
import com.meetu.backend.admin.service.ManagementService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
/** 管理用户、认证和分类；修改与审计记录在同一事务内提交。 */
@Service
public class ManagementServiceImpl implements ManagementService {
    private final ManagementMapper mapper; private final AuditMapper audit;
    public ManagementServiceImpl(ManagementMapper mapper,AuditMapper audit) { this.mapper=mapper; this.audit=audit; }
    private static void paging(int page,int size) { if (page<1 || size<1 || size>100) throw ManagementException.invalid("Invalid pagination"); }
    private static Map<String,Object> userView(Map<String,Object> row) {
        Map<String,Object> result=new LinkedHashMap<>(row);
        result.put("_count",Map.of("posts",row.get("posts"),"teamsCreated",row.get("teams"),"teamMembers",row.get("memberships"),"feedback",row.get("feedbackCount"),"reportsReceived",row.get("reportsReceived")));
        return result;
    }
    @Override public List<Map<String,Object>> users(String status,String verification,String keyword,int page,int size) { paging(page,size); return mapper.users(status,verification,keyword,size,(page-1)*size).stream().map(ManagementServiceImpl::userView).toList(); }
    @Override public long userCount(String status,String verification,String keyword) { return mapper.userCount(status,verification,keyword); }
    @Override public Map<String,Object> user(String id) {
        Map<String,Object> row=mapper.user(id);
        if (row==null) throw ManagementException.missing("User not found");
        Map<String,Object> result=userView(row);
        result.put("posts",mapper.userPosts(id));
        result.put("teamsCreated",mapper.userTeams(id));
        result.put("teamMembers",mapper.userMemberships(id).stream().map(member -> {
            Map<String,Object> item=new LinkedHashMap<>();
            item.put("role",member.get("role"));
            item.put("team",Map.of("id",member.get("teamId"),"name",member.get("teamName")));
            return item;
        }).toList());
        result.put("verificationRequests",mapper.userVerifications(id));
        return result;
    }
    /** 锁定目标用户后校验管理员保护规则，再更新资料或账号状态。 */
    @Override @Transactional public void userAction(String admin,UserAction action) {
        if ("update".equals(action.action())) {
            Map<String,Object> row=mapper.lockUser(action.id());
            if (row==null) throw ManagementException.missing("User not found");
            if (admin.equals(action.id()) || "ADMIN".equals(row.get("role"))) throw ManagementException.forbidden("Cannot edit an administrator");
            if ("DELETED".equals(row.get("status"))) throw ManagementException.conflict("User is deleted");
            if (action.name()!=null && action.name().isBlank() || action.email()!=null && action.email().isBlank()) throw ManagementException.invalid("Name and email cannot be blank");
            if (action.role()!=null && !Set.of("USER","ADMIN").contains(action.role())) throw ManagementException.invalid("Invalid role");
            if (action.email()!=null && mapper.duplicateEmail(action.email(),action.id())!=null) throw ManagementException.conflict("Email already exists");
            List<String> fields=new ArrayList<>();
            if (action.name()!=null) fields.add("name");
            if (action.email()!=null) fields.add("email");
            if (action.school()!=null) fields.add("school");
            if (action.major()!=null) fields.add("major");
            if (action.grade()!=null) fields.add("grade");
            if (action.bio()!=null) fields.add("bio");
            if (action.role()!=null) fields.add("role="+action.role());
            if (fields.isEmpty()) throw ManagementException.invalid("No user fields supplied");
            mapper.updateUser(action.id(),action.name(),action.email(),action.school(),action.major(),action.grade(),action.bio(),action.role());
            audit.record(admin,"USER",action.id(),"UPDATE",String.join(",",fields));
            return;
        }
        String status=switch(action.action()) { case "freeze" -> "FROZEN"; case "unfreeze","activate" -> "ACTIVE"; case "ban" -> "BANNED"; default -> throw ManagementException.invalid("Invalid user action"); };
        Map<String,Object> row=mapper.lockUser(action.id());
        if (row==null) throw ManagementException.missing("User not found");
        if (admin.equals(action.id()) || "ADMIN".equals(row.get("role"))) throw ManagementException.forbidden("Cannot change an administrator");
        if ("DELETED".equals(row.get("status")) || status.equals(row.get("status"))) throw ManagementException.conflict("User status cannot be changed");
        mapper.userStatus(action.id(),status); audit.record(admin,"USER",action.id(),action.action(),null);
    }
    @Override @Transactional public void deleteUser(String admin,String id) {
        Map<String,Object> row=mapper.lockUser(id);
        if (row==null) throw ManagementException.missing("User not found");
        if (admin.equals(id) || "ADMIN".equals(row.get("role"))) throw ManagementException.forbidden("Cannot delete an administrator");
        if ("DELETED".equals(row.get("status"))) throw ManagementException.conflict("User already deleted");
        mapper.userStatus(id,"DELETED"); audit.record(admin,"USER",id,"DELETE",null);
    }
    @Override public List<Map<String,Object>> verifications(String status,int page,int size) {
        paging(page,size); if (!"all".equals(status) && !Set.of("PENDING","APPROVED","REJECTED").contains(status)) throw ManagementException.invalid("Invalid verification status");
        return mapper.verifications(status,size,(page-1)*size).stream().map(row -> { Map<String,Object> result=new LinkedHashMap<>(row); result.put("user",Map.of("id",row.get("userId"),"name",Objects.toString(row.get("userName"),""),"email",Objects.toString(row.get("userEmail"),""),"image",Objects.toString(row.get("userImage"),""),"verificationStatus",row.get("userVerificationStatus"))); return result; }).toList();
    }
    @Override public long verificationCount(String status) { return mapper.verificationCount(status); }
    /** 认证审批同步更新申请和用户状态，并记录审核人及意见。 */
    @Override @Transactional public void decideVerification(String admin,VerificationDecision decision) {
        if (!Set.of("approve","reject").contains(decision.action())) throw ManagementException.invalid("Invalid verification action");
        Map<String,Object> row=mapper.lockVerification(decision.id());
        if (row==null) throw ManagementException.missing("Verification request not found");
        if (!"PENDING".equals(row.get("status"))) throw ManagementException.conflict("Request already reviewed");
        if (admin.equals(row.get("userId"))) throw ManagementException.forbidden("Cannot review own request");
        boolean approve="approve".equals(decision.action());
        mapper.decideVerification(decision.id(),approve?"APPROVED":"REJECTED",admin,decision.reviewNote());
        String user=(String)row.get("userId");
        if (approve) mapper.approveUser(user,"VERIFIED",(String)row.get("realName"),(String)row.get("studentId"),(String)row.get("school"),(String)row.get("major"),(String)row.get("grade"));
        else mapper.rejectUser(user);
        audit.record(admin,"VERIFICATION",decision.id(),decision.action(),decision.reviewNote());
    }
    @Override public List<Map<String,Object>> categories() { return mapper.categories().stream().map(row -> { Map<String,Object> result=new LinkedHashMap<>(row); result.put("parent",Objects.toString(row.get("parent"),"-")); return result; }).toList(); }
    /** 校验分类名称、父分类和层级循环，防止形成无效分类树。 */
    private void validateCategory(CategoryChange change) {
        if (change.name().isBlank()) throw ManagementException.invalid("Category name required");
        if (mapper.duplicateCategory(change.name().trim(),change.id()==null?"":change.id())!=null) throw ManagementException.conflict("Category name already exists");
        if (change.parentId()!=null) {
            if (change.parentId().equals(change.id())) throw ManagementException.invalid("Category cannot be its own parent");
            Map<String,Object> parent=mapper.category(change.parentId());
            if (parent==null) throw ManagementException.missing("Parent category not found");
            if (change.id()!=null) {
                String cursor=change.parentId(); Set<String> visited=new HashSet<>();
                while (cursor!=null) {
                    if (cursor.equals(change.id()) || !visited.add(cursor)) throw ManagementException.invalid("Category cycle");
                    Map<String,Object> row=mapper.category(cursor); cursor=row==null?null:(String)row.get("parentId");
                }
            }
        }
    }
    @Override @Transactional public Map<String,Object> createCategory(String admin,CategoryChange change) { validateCategory(change); String id=UUID.randomUUID().toString(); mapper.insertCategory(id,change.name().trim(),change.parentId(),change.description()); audit.record(admin,"CATEGORY",id,"CREATE",null); return mapper.categoryDetail(id); }
    @Override @Transactional public void updateCategory(String admin,CategoryChange change) { if (change.id()==null || mapper.category(change.id())==null) throw ManagementException.missing("Category not found"); validateCategory(change); mapper.updateCategory(change.id(),change.name().trim(),change.parentId(),change.description()); audit.record(admin,"CATEGORY",change.id(),"UPDATE",null); }
    @Override @Transactional public void deleteCategory(String admin,String id) {
        if (mapper.category(id)==null) throw ManagementException.missing("Category not found");
        if (mapper.childCount(id)>0 || mapper.referenceCount(id)>0) throw ManagementException.conflict("Category has related content");
        mapper.deleteCategory(id); audit.record(admin,"CATEGORY",id,"DELETE",null);
    }
}
