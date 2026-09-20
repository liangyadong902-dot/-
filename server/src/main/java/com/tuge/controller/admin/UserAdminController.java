package com.tuge.controller.admin;

import com.tuge.common.result.PageResult;
import com.tuge.common.result.Result;
import com.tuge.domain.service.AdminUserService;
import com.tuge.domain.service.AdminUserManagementService;
import com.tuge.domain.dto.AdminUserNoteRequest;
import com.tuge.domain.dto.AdminUserStatusRequest;
import com.tuge.domain.vo.AdminUserDetailVO;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import com.tuge.domain.vo.AdminUserVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/users")
public class UserAdminController {
    private final AdminUserService service;
    private final AdminUserManagementService managementService;

    public UserAdminController(AdminUserService service, AdminUserManagementService managementService) {
        this.service = service;
        this.managementService = managementService;
    }

    @GetMapping
    public Result<PageResult<AdminUserVO>> list(@RequestParam(required = false) String keyword,
                                                @RequestParam(required = false) String status,
                                                @RequestParam(required = false) String channel,
                                                @RequestParam(defaultValue = "1") long page,
                                                @RequestParam(defaultValue = "20") long pageSize) {
        return Result.success(service.list(keyword, status, channel, page, pageSize));
    }

    @GetMapping("/{id}")
    public Result<AdminUserDetailVO> detail(@PathVariable Long id) {
        return Result.success(managementService.detail(id));
    }

    @PatchMapping("/{id}/status")
    public Result<Void> status(@PathVariable Long id, @Valid @RequestBody AdminUserStatusRequest request) {
        managementService.updateStatus(id, request);
        return Result.success();
    }

    @PatchMapping("/{id}/note")
    public Result<Void> note(@PathVariable Long id, @Valid @RequestBody AdminUserNoteRequest request) {
        managementService.updateNote(id, request);
        return Result.success();
    }

    @GetMapping("/export")
    public ResponseEntity<String> export(@RequestParam(required = false) String keyword,
                                         @RequestParam(required = false) String status,
                                         @RequestParam(required = false) String channel) {
        String csv = managementService.export(keyword, status, channel);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=users.csv")
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .body(csv);
    }
}
