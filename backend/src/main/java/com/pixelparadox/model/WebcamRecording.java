package com.pixelparadox.model;

import jakarta.persistence.*;

@Entity
@Table(name = "webcam_recordings")
public class WebcamRecording {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String teamId;
    private String participantName;
    private String videoUrl;
    private long recordedAt;

    public WebcamRecording() {}

    public WebcamRecording(String teamId, String participantName, String videoUrl) {
        this.teamId = teamId;
        this.participantName = participantName;
        this.videoUrl = videoUrl;
        this.recordedAt = System.currentTimeMillis();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }
    public String getParticipantName() { return participantName; }
    public void setParticipantName(String participantName) { this.participantName = participantName; }
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    public long getRecordedAt() { return recordedAt; }
    public void setRecordedAt(long recordedAt) { this.recordedAt = recordedAt; }
}
