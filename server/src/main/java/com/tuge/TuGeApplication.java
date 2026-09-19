package com.tuge;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 途个惊喜 · 后端服务启动类
 *
 * @author tuge
 */
@SpringBootApplication
@EnableScheduling
@MapperScan("com.tuge.**.mapper")
public class TuGeApplication {

    public static void main(String[] args) {
        SpringApplication.run(TuGeApplication.class, args);
    }
}
