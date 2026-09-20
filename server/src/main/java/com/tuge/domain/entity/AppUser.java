package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户
 */
@Data
@TableName("app_user")
public class AppUser {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String phone;
    private String wechatOpenid;
    private String wechatUnionid;
    private String nickname;
    private String avatarUrl;
    private Integer gender;
    private String city;
    private String registerChannel;
    private String status;
    private String disabledReason;
    private String lastMood;
    private String personalityType;
    private LocalDateTime personalityAt;
    private LocalDateTime lastLoginAt;
    private LocalDateTime lastActiveAt;
    private String csNote;
    private Integer version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
