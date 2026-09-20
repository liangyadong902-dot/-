package com.tuge.controller;

import com.tuge.common.jwt.JwtContext;
import com.tuge.common.result.Result;
import com.tuge.domain.dto.PersonalitySubmitRequest;
import com.tuge.domain.service.PersonalityService;
import com.tuge.domain.vo.PersonalityQuestionVO;
import com.tuge.domain.vo.PersonalityResultVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/personality")
public class PersonalityController {
    private final PersonalityService service;

    public PersonalityController(PersonalityService service) {
        this.service = service;
    }

    @GetMapping("/questions")
    public Result<List<PersonalityQuestionVO>> questions() {
        return Result.success(service.questions());
    }

    @PostMapping("/submit")
    public Result<PersonalityResultVO> submit(@Valid @RequestBody PersonalitySubmitRequest request) {
        return Result.success(service.submit(JwtContext.getUserId(), request));
    }

    @GetMapping("/my-result")
    public Result<PersonalityResultVO> myResult() {
        return Result.success(service.myResult(JwtContext.getUserId()));
    }
}
