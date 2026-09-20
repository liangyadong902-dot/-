package com.tuge.domain.vo;

import lombok.Data;

import java.util.Collections;
import java.util.List;

@Data
public class AiReplyVO {
    private String content;
    private boolean fallback;
    private List<BlindBoxVO> recommendBoxes = Collections.emptyList();
    private String sessionId;
}
