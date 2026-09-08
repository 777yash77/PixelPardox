package com.pixelparadox.controller;

import com.pixelparadox.model.WebcamRecording;
import com.pixelparadox.repository.WebcamRecordingRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/recordings")
public class AdminRecordingController {

    private final WebcamRecordingRepository webcamRecordingRepository;

    public AdminRecordingController(WebcamRecordingRepository webcamRecordingRepository) {
        this.webcamRecordingRepository = webcamRecordingRepository;
    }

    @GetMapping
    public ResponseEntity<List<WebcamRecording>> getAllRecordings() {
        return ResponseEntity.ok(webcamRecordingRepository.findAll());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRecording(@PathVariable Long id) {
        return webcamRecordingRepository.findById(id).map(recording -> {
            String fileUrl = recording.getVideoUrl();
            if (fileUrl != null && fileUrl.startsWith("/uploads/videos/")) {
                String filePath = fileUrl.substring(1);
                try {
                    Files.deleteIfExists(Paths.get(filePath));
                } catch (IOException e) {
                    // Ignore or log
                }
            }
            webcamRecordingRepository.delete(recording);
            return ResponseEntity.ok(Map.of("message", "Recording deleted successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
