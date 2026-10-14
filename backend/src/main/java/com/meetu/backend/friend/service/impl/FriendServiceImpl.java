package com.meetu.backend.friend.service.impl;

import com.meetu.backend.friend.dto.FriendDtos;
import com.meetu.backend.friend.mapper.FriendMapper;
import com.meetu.backend.friend.service.FriendService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** 处理好友申请与双向关系，统一校验接收方权限和重复关系。 */
@Service
public class FriendServiceImpl implements FriendService {
    private final FriendMapper mapper;
    public FriendServiceImpl(FriendMapper mapper) { this.mapper = mapper; }

    @Override public List<FriendDtos.Person> friends(String userId) {
        return mapper.friends(userId).stream().map(r -> new FriendDtos.Person(s(r,"id"),s(r,"name"),s(r,"image"),s(r,"school"),s(r,"role"))).toList();
    }
    @Override public List<FriendDtos.Request> requests(String userId, String type) {
        if (!"received".equals(type) && !"sent".equals(type)) throw new InvalidFriendRequest("Invalid request type");
        return mapper.requests(userId,type).stream().map(r -> {
            var person = new FriendDtos.Person(s(r,"personId"),s(r,"personName"),s(r,"personImage"),s(r,"personSchool"),null);
            return toRequest(r,"sent".equals(type) ? null : person,"sent".equals(type) ? person : null);
        }).toList();
    }
    /** 发送申请前锁定双方账号，避免相反方向的并发申请绕过重复校验。 */
    @Override @Transactional public FriendDtos.Request send(String userId, FriendDtos.Send input) {
        String receiver = input.receiverId().trim();
        if (userId.equals(receiver)) throw new InvalidFriendRequest("Cannot add yourself");
        lockPair(userId,receiver);
        if (mapper.existingFriendship(userId,receiver) != null) throw new FriendConflict("Already friends");
        if (mapper.pending(userId,userId,receiver) != null) throw new FriendConflict("Request already pending");
        String id = UUID.randomUUID().toString();
        try {
            mapper.insertRequest(id,userId,receiver,input.message() == null ? null : input.message().trim());
        } catch (DataIntegrityViolationException exception) {
            throw new FriendConflict("Request already pending");
        }
        return toRequest(mapper.request(id),null,null);
    }
    /** 审批申请，并在同一事务中建立好友关系或记录拒绝结果。 */
    @Override @Transactional public void decide(String userId, String requestId, FriendDtos.Decision input) {
        if (!"ACCEPT".equals(input.action()) && !"REJECT".equals(input.action())) throw new InvalidFriendRequest("Invalid action");
        var first = mapper.request(requestId);
        if (first == null) throw new FriendNotFound();
        if (!userId.equals(s(first,"receiverId"))) throw new FriendForbidden();
        String sender = s(first,"senderId");
        lockPair(sender,userId);
        var current = mapper.request(requestId);
        if (current == null) throw new FriendNotFound();
        if (!"PENDING".equals(s(current,"status"))) throw new FriendConflict("Request already processed");
        if ("ACCEPT".equals(input.action())) {
            if (mapper.existingFriendship(sender,userId) != null) throw new FriendConflict("Already friends");
            if (mapper.decide(requestId,"ACCEPTED") != 1) throw new FriendConflict("Request already processed");
            try {
                mapper.insertFriendship(UUID.randomUUID().toString(),sender.compareTo(userId)<0 ? sender : userId,
                        sender.compareTo(userId)<0 ? userId : sender);
            } catch (DataIntegrityViolationException exception) {
                throw new FriendConflict("Already friends");
            }
            mapper.closeOtherPending(sender,userId);
        } else if (mapper.decide(requestId,"REJECTED") != 1) {
            throw new FriendConflict("Request already processed");
        }
    }
    // 固定锁顺序，降低双方同时发起操作时的死锁风险。
    private void lockPair(String a, String b) {
        if (mapper.lockActiveUser(a.compareTo(b)<0 ? a : b) == null || mapper.lockActiveUser(a.compareTo(b)<0 ? b : a) == null)
            throw new FriendNotFound();
    }
    private static FriendDtos.Request toRequest(Map<String,Object> r, FriendDtos.Person sender, FriendDtos.Person receiver) {
        return new FriendDtos.Request(s(r,"id"),s(r,"senderId"),s(r,"receiverId"),s(r,"status"),s(r,"message"),
                instant(r.get("createdAt")),instant(r.get("updatedAt")),sender,receiver);
    }
    private static String s(Map<String,Object> row,String key) { return row.get(key)==null ? null : row.get(key).toString(); }
    private static Instant instant(Object value) { return value instanceof Timestamp t ? t.toInstant() : value instanceof Instant i ? i : null; }
    public static class InvalidFriendRequest extends RuntimeException { public InvalidFriendRequest(String message) { super(message); } }
    public static class FriendConflict extends RuntimeException { public FriendConflict(String message) { super(message); } }
    public static class FriendNotFound extends RuntimeException {}
    public static class FriendForbidden extends RuntimeException {}
}
