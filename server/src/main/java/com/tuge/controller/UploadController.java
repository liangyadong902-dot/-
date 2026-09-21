package com.tuge.controller;

import com.tuge.common.exception.BusinessException;
import com.tuge.common.jwt.JwtContext;
import com.tuge.common.result.Result;
import com.tuge.domain.entity.UploadLog;
import com.tuge.domain.mapper.UploadLogMapper;
import com.tuge.domain.vo.UploadVO;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/v1/upload")
public class UploadController {
    private static final Logger log = LoggerFactory.getLogger(UploadController.class);
    private static final Path ROOT = Paths.get(System.getProperty("java.io.tmpdir"), "tuge-uploads");

    private final UploadLogMapper uploadLogMapper;

    public UploadController(UploadLogMapper uploadLogMapper) {
        this.uploadLogMapper = uploadLogMapper;
    }

    @PostMapping("/image")
    public Result<UploadVO> image(@RequestPart("file") MultipartFile file, HttpServletRequest request) {
        return Result.success(save(file, request));
    }

    @PostMapping("/images")
    public Result<List<UploadVO>> images(@RequestPart("files") MultipartFile[] files, HttpServletRequest request) {
        if (files == null || files.length == 0 || files.length > 9) throw new BusinessException(400, "最多上传 9 张图片");
        return Result.success(Arrays.stream(files).map((file) -> save(file, request)).toList());
    }

    private UploadVO save(MultipartFile file, HttpServletRequest request) {
        if (file == null || file.isEmpty() || file.getSize() > 10 * 1024 * 1024) throw new BusinessException(400, "图片不能为空且不能超过10MB");
        String type = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!ListSupport.IMAGE_TYPES.contains(type)) throw new BusinessException(400, "只支持 JPG、PNG、WEBP 图片");
        String ext = StringUtils.getFilenameExtension(file.getOriginalFilename());
        String name = UUID.randomUUID() + "." + (ext == null ? "jpg" : ext.toLowerCase());
        try { Files.createDirectories(ROOT); file.transferTo(ROOT.resolve(name)); } catch (IOException e) { throw new BusinessException(500, "图片保存失败"); }
        UploadVO vo = new UploadVO(); vo.setUploadId(name); vo.setUrl("/uploads/" + name); vo.setSize(file.getSize()); vo.setMimeType(type);
        recordUpload(request, name, vo, file.getSize(), type);
        return vo;
    }

    /** 埋点：记录每次上传的客户端 IP、请求 Host、上传者和返回地址，排查图片跨端不显示 */
    private void recordUpload(HttpServletRequest request, String name, UploadVO vo, long size, String type) {
        try {
            String ip = clientIp(request);
            String host = request.getHeader("Host");
            Long userId = JwtContext.getUserId();
            UploadLog row = new UploadLog();
            row.setUserId(userId);
            row.setClientIp(ip);
            row.setHostHeader(host);
            row.setFileName(name);
            row.setStoredUrl(vo.getUrl());
            row.setSizeBytes(size);
            row.setMimeType(type);
            row.setCreatedAt(LocalDateTime.now());
            uploadLogMapper.insert(row);
            log.info("[upload] userId={} ip={} host={} file={} url={} size={}", userId, ip, host, name, vo.getUrl(), size);
        } catch (Exception e) {
            // 记录失败不能影响上传主流程
            log.warn("[upload] ip 记录写入失败: {}", e.getMessage());
        }
    }

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwarded)) {
            String first = forwarded.split(",")[0].trim();
            if (!first.isEmpty()) return first;
        }
        return request.getRemoteAddr();
    }

    private static final class ListSupport { private static final java.util.Set<String> IMAGE_TYPES = java.util.Set.of("image/jpeg", "image/png", "image/webp"); }
}
