package com.tuge.domain.vo;

import lombok.Data;

@Data
public class UploadVO {
    private String uploadId;
    private String url;
    private Long size;
    private String mimeType;
}
