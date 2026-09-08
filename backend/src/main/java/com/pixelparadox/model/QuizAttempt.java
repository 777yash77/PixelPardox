package com.pixelparadox.model;

import jakarta.persistence.*;

@Entity
@Table(name = "quiz_attempts")
public class QuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "team_id", nullable = false)
    private User team;

    @Column(nullable = false)
    private String participantName;

    private Long startedAt;

    private Long completedAt;

    private int score = 0;

    @Column(nullable = false)
    private String status = "NOT_STARTED"; // NOT_STARTED, IN_PROGRESS, COMPLETED

    public QuizAttempt() {}

    public QuizAttempt(User team, String participantName) {
        this.team = team;
        this.participantName = participantName;
        this.status = "NOT_STARTED";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getTeam() { return team; }
    public void setTeam(User team) { this.team = team; }

    public String getParticipantName() { return participantName; }
    public void setParticipantName(String participantName) { this.participantName = participantName; }

    public Long getStartedAt() { return startedAt; }
    public void setStartedAt(Long startedAt) { this.startedAt = startedAt; }

    public Long getCompletedAt() { return completedAt; }
    public void setCompletedAt(Long completedAt) { this.completedAt = completedAt; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
