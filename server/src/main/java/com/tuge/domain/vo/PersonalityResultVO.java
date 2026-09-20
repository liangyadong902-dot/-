package com.tuge.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PersonalityResultVO {
    private String type;
    private String name;
    private String mark;
    private String description;
    private String recommend;
}
