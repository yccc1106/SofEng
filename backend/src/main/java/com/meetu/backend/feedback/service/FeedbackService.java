package com.meetu.backend.feedback.service;

import com.meetu.backend.feedback.dto.FeedbackDtos.*;
import java.util.List;
import java.util.Map;

public interface FeedbackService {
    Map<String,Object> submit(String user,Submit request);
    List<Map<String,Object>> mine(String user);
    List<Map<String,Object>> all(String type);
    void handle(String admin,Handle request);
}
