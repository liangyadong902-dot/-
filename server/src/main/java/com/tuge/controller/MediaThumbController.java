package com.tuge.controller;

import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.regex.Pattern;

/**
 * 图片缩略图接口：/api/v1/media/thumb?f=文件名&w=宽度
 * 首次访问生成缩略图并落盘缓存（uploads/thumbs），之后直接回文件；
 * 源图缺失、格式不支持（如 webp）或生成失败时回退原图字节。
 */
@RestController
@RequestMapping("/api/v1/media")
public class MediaThumbController {

    private static final Path ROOT = Paths.get(System.getProperty("java.io.tmpdir"), "tuge-uploads");
    private static final Path THUMB_DIR = ROOT.resolve("thumbs");
    private static final Pattern SAFE_NAME = Pattern.compile("^[A-Za-z0-9._-]+\\.(jpe?g|png|webp)$");
    private static final Pattern INT = Pattern.compile("^\\d{1,4}$");

    @GetMapping("/thumb")
    public ResponseEntity<byte[]> thumb(@RequestParam("f") String f,
                                        @RequestParam(value = "w", defaultValue = "600") String w) {
        if (f == null || !SAFE_NAME.matcher(f).matches()) return ResponseEntity.badRequest().build();
        if (!INT.matcher(w).matches()) return ResponseEntity.badRequest().build();
        int width = Math.min(Math.max(Integer.parseInt(w), 80), 1600);
        try {
            Path source = ROOT.resolve(f).normalize();
            if (!source.startsWith(ROOT) || !Files.exists(source)) return ResponseEntity.notFound().build();
            if (!Files.exists(THUMB_DIR)) Files.createDirectories(THUMB_DIR);
            String base = f.replaceFirst("\\.[A-Za-z0-9]+$", "");
            Path target = THUMB_DIR.resolve(base + "_w" + width + ".jpg");
            byte[] payload;
            if (Files.exists(target)) {
                payload = Files.readAllBytes(target);
            } else {
                payload = generate(source, width);
                if (payload != null) {
                    try { Files.write(target, payload); } catch (Exception ignore) { }
                } else {
                    payload = Files.readAllBytes(source);
                }
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG)
                    .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
                    .body(payload);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    /** ImageIO 读不了 webp 或生成失败时返回 null（调用方回退原图） */
    private byte[] generate(Path source, int width) {
        try {
            BufferedImage image = ImageIO.read(source.toFile());
            if (image == null) return null;
            int sw = image.getWidth();
            if (sw <= width) return Files.readAllBytes(source);
            // 大幅缩小时逐级减半，避免一次缩放产生锯齿
            BufferedImage current = image;
            int cw = sw;
            while (cw / 2 >= width) {
                int nw = cw / 2;
                current = scale(current, nw, Math.max(1, current.getHeight() * nw / cw));
                cw = nw;
            }
            current = scale(current, width, Math.max(1, current.getHeight() * width / cw));
            ByteArrayOutputStream out = new ByteArrayOutputStream(64 * 1024);
            ImageIO.write(current, "jpg", out);
            return out.toByteArray();
        } catch (Exception e) {
            return null;
        }
    }

    private BufferedImage scale(BufferedImage src, int w, int h) {
        BufferedImage target = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = target.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(src, 0, 0, w, h, null);
        g.dispose();
        return target;
    }
}
