package com.tuge.domain.vo;

import lombok.Data;

@Data
public class UserVO {
    private Long id;
    private String nickname;
    private String avatarUrl;
    private String phone;
    private Integer gender;
    private String city;
    private String registerChannel;
    private String status;
    private boolean hasPhone;
    private boolean wechatOpenidBound;
    private String title;
    private String personalityType;
}
