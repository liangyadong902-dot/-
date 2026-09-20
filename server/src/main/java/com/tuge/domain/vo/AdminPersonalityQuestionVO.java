package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Data
public class AdminPersonalityQuestionVO {
    private Long id;
    private Integer seq;
    private String stem;
    private String status;
    private LocalDateTime updatedAt;
    private List<OptionVO> options = Collections.emptyList();

    @Data
    public static class OptionVO {
        private Long id;
        private Long questionId;
        private Integer seq;
        private String label;
        private Map<String, Integer> score;
    }
}
