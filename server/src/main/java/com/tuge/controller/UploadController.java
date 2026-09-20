package com.tuge.controller;

import com.tuge.common.exception.BusinessException;
import com.tuge.common.result.Result;
import com.tuge.domain.vo.UploadVO;
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
import java.util.UUID;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/v1/upload")
public class UploadController {
    private static final Path ROOT = Paths.get(System.getProperty("java.io.tmpdir"), "tuge-uploads");

    @PostMapping("/image")
    public Result<UploadVO> image(@RequestPart("file") MultipartFile file) {
        return Result.success(save(file));
    }

    @PostMapping("/images")
    public Result<List<UploadVO>> images(@RequestPart("files") MultipartFile[] files) {
        if (files == null || files.length == 0 || files.length > 9) throw new BusinessException(400, "最多上传 9 张图片");
        return Result.success(Arrays.stream(files).map(this::save).toList());
    }

    private UploadVO save(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() > 10 * 1024 * 1024) throw new BusinessException(400, "图片不能为空且不能超过10MB");
        String type = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!ListSupport.IMAGE_TYPES.contains(type)) throw new BusinessException(400, "只支持 JPG、PNG、WEBP 图片");
        String ext = StringUtils.getFilenameExtension(file.getOriginalFilename());
        String name = UUID.randomUUID() + "." + (ext == null ? "jpg" : ext.toLowerCase());
        try { Files.createDirectories(ROOT); file.transferTo(ROOT.resolve(name)); } catch (IOException e) { throw new BusinessException(500, "图片保存失败"); }
        UploadVO vo = new UploadVO(); vo.setUploadId(name); vo.setUrl("/uploads/" + name); vo.setSize(file.getSize()); vo.setMimeType(type); return vo;
    }

    private static final class ListSupport { private static final java.util.Set<String> IMAGE_TYPES = java.util.Set.of("image/jpeg", "image/png", "image/webp"); }
}
