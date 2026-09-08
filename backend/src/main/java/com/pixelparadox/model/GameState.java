package com.pixelparadox.model;

import jakarta.persistence.*;

@Entity
@Table(name = "game_state")
public class GameState {
    @Id
    private Long id = 1L; // Always 1 for the global single state

    private int activeRound = 0; // 0=LOBBY, 1=PRELIMS, 2=PICTURE_ROUND, 3=AI_FLAW_ROUND, 4=PROMPT_ENGINEERING_FINAL, 5=COMPLETED
    
    private Long activeQuestionId;
    
    private int timerDuration = 0; // in seconds
    
    private Long questionStartTime = 0L; // system time in ms
    
    private boolean isTimerRunning = false;

    private int zoomLevel = 100; // zoom percentage for tie breaker (e.g., starts at 10%, goes to 100%)

    public GameState() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getActiveRound() { return activeRound; }
    public void setActiveRound(int activeRound) { this.activeRound = activeRound; }

    public Long getActiveQuestionId() { return activeQuestionId; }
    public void setActiveQuestionId(Long activeQuestionId) { this.activeQuestionId = activeQuestionId; }

    public int getTimerDuration() { return timerDuration; }
    public void setTimerDuration(int timerDuration) { this.timerDuration = timerDuration; }

    public Long getQuestionStartTime() { return questionStartTime; }
    public void setQuestionStartTime(Long questionStartTime) { this.questionStartTime = questionStartTime; }

    public boolean isTimerRunning() { return isTimerRunning; }
    public void setTimerRunning(boolean timerRunning) { isTimerRunning = timerRunning; }

    public int getZoomLevel() { return zoomLevel; }
    public void setZoomLevel(int zoomLevel) { this.zoomLevel = zoomLevel; }
}
