package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 上传接口 IP 记录：排查图片跨端不显示（谁从哪个 IP 上传、返回了什么地址）
 */
@Data
@TableName("upload_log")
public class UploadLog {
    @TableId(type = IdType.AUTO) private Long id;
    private Long userId;
    private String clientIp;
    private String hostHeader;
    private String fileName;
    private String storedUrl;
    private Long sizeBytes;
    private String mimeType;
    private LocalDateTime createdAt;
}
