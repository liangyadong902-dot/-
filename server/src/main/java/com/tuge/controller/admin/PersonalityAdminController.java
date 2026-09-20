package com.tuge.controller.admin;

import com.tuge.common.result.Result;
import com.tuge.domain.dto.AdminPersonalityOptionRequest;
import com.tuge.domain.dto.AdminPersonalityQuestionRequest;
import com.tuge.domain.dto.AdminPersonalityResultRequest;
import com.tuge.domain.entity.PersonalityOption;
import com.tuge.domain.entity.PersonalityQuestion;
import com.tuge.domain.entity.PersonalityResult;
import com.tuge.domain.service.AdminPersonalityService;
import com.tuge.domain.vo.AdminPersonalityQuestionVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/personality")
public class PersonalityAdminController {
    private final AdminPersonalityService service;

    public PersonalityAdminController(AdminPersonalityService service) { this.service = service; }

    @GetMapping("/questions") public Result<List<AdminPersonalityQuestionVO>> questions() { return Result.success(service.questions()); }
    @PostMapping("/questions") public Result<PersonalityQuestion> createQuestion(@Valid @RequestBody AdminPersonalityQuestionRequest request) { return Result.success(service.saveQuestion(null, request)); }
    @PutMapping("/questions/{id}") public Result<PersonalityQuestion> updateQuestion(@PathVariable Long id, @Valid @RequestBody AdminPersonalityQuestionRequest request) { return Result.success(service.saveQuestion(id, request)); }
    @DeleteMapping("/questions/{id}") public Result<Void> deleteQuestion(@PathVariable Long id) { service.deleteQuestion(id); return Result.success(); }

    @PostMapping("/questions/{questionId}/options") public Result<PersonalityOption> createOption(@PathVariable Long questionId, @Valid @RequestBody AdminPersonalityOptionRequest request) { return Result.success(service.saveOption(questionId, null, request)); }
    @PutMapping("/options/{id}") public Result<PersonalityOption> updateOption(@PathVariable Long id, @Valid @RequestBody AdminPersonalityOptionRequest request) { return Result.success(service.saveOption(null, id, request)); }
    @DeleteMapping("/options/{id}") public Result<Void> deleteOption(@PathVariable Long id) { service.deleteOption(id); return Result.success(); }

    @GetMapping("/results") public Result<List<PersonalityResult>> results() { return Result.success(service.results()); }
    @PostMapping("/results") public Result<PersonalityResult> createResult(@Valid @RequestBody AdminPersonalityResultRequest request) { return Result.success(service.saveResult(null, request)); }
    @PutMapping("/results/{id}") public Result<PersonalityResult> updateResult(@PathVariable Long id, @Valid @RequestBody AdminPersonalityResultRequest request) { return Result.success(service.saveResult(id, request)); }
    @DeleteMapping("/results/{id}") public Result<Void> deleteResult(@PathVariable Long id) { service.deleteResult(id); return Result.success(); }
}
