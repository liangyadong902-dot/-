package com.tuge.common.config;

import com.tuge.common.auth.AdminAuthInterceptor;
import com.tuge.common.auth.AuthInterceptor;
import com.tuge.common.auth.OptionalAuthInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;

/**
 * Web MVC 配置：拦截器注册 + 跨域。
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final AuthInterceptor authInterceptor;
    private final AdminAuthInterceptor adminAuthInterceptor;
    private final OptionalAuthInterceptor optionalAuthInterceptor;

    public WebMvcConfig(AuthInterceptor authInterceptor, AdminAuthInterceptor adminAuthInterceptor,
                        OptionalAuthInterceptor optionalAuthInterceptor) {
        this.authInterceptor = authInterceptor;
        this.adminAuthInterceptor = adminAuthInterceptor;
        this.optionalAuthInterceptor = optionalAuthInterceptor;
    }

    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        // 管理端（admin 角色）
        registry.addInterceptor(adminAuthInterceptor)
                .addPathPatterns("/api/v1/admin/**")
                .excludePathPatterns("/api/v1/admin/login");

        registry.addInterceptor(optionalAuthInterceptor)
                .addPathPatterns("/api/v1/personality/submit", "/api/v1/ai/chat", "/api/v1/ai/chat/stream");

        // 用户端：仅拦截需要登录的子路径（按需补充）
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/v1/**")
                .excludePathPatterns(
                        "/api/v1/admin/**",
                        "/api/v1/health",
                        "/api/v1/auth/**",
                        "/api/v1/boxes/**",
                        "/api/v1/banners",
                        "/api/v1/badges",
                        "/api/v1/mood-logs",
                        "/api/v1/personality/questions",
                        "/api/v1/personality/submit",
                        "/api/v1/ai/config",
                        "/api/v1/ai/chat",
                "/api/v1/ai/chat/stream",
                "/api/v1/pay/notify/alipay",
                        "/api/v1/pay/**",
                        "/api/v1/community/**",
                        "/api/v1/checkins/**",
                        "/api/v1/achievements",
                        "/api/v1/achievements/**"
                );
        registry.addInterceptor(optionalAuthInterceptor)
                .addPathPatterns("/api/v1/community/**", "/api/v1/checkins/**", "/api/v1/achievements", "/api/v1/achievements/**");
    }

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        String uploadRoot = "file:" + System.getProperty("java.io.tmpdir") + "/tuge-uploads/";
        registry.addResourceHandler("/uploads/**").addResourceLocations(uploadRoot);
    }
}
