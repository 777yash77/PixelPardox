package com.pixelparadox.repository;

import com.pixelparadox.model.WebcamRecording;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WebcamRecordingRepository extends JpaRepository<WebcamRecording, Long> {
    List<WebcamRecording> findByTeamId(String teamId);
}
