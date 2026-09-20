package com.tuge.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PersonalityQuestionVO {
    private Long id;
    private Integer sortNo;
    private String question;
    private List<OptionVO> options;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionVO {
        private Long id;
        private String text;
    }
}
