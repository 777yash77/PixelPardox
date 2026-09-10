package com.pixelparadox.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Ensure the uploads and videos directories exist
        File uploadDir = new File("uploads");
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }
        File videoDir = new File("uploads/videos");
        if (!videoDir.exists()) {
            videoDir.mkdirs();
        }

        String uploadUri = uploadDir.toPath().toAbsolutePath().normalize().toUri().toString();
        if (!uploadUri.endsWith("/")) {
            uploadUri += "/";
        }

        // Map request paths starting with /uploads/ to the local folder
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadUri, "file:uploads/");
    }
}
