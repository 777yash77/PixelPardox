package com.pixelparadox.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity
@Table(name = "image_questions")
public class ImageQuestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String imageUrl;

    @JsonProperty("isAi")
    private boolean isAi; // true if AI, false if Real

    private String modelUsed; // e.g., Midjourney, DALL-E, etc.

    private int roundNumber; // 1, 2, 3 (Prompt Wars), 4 (Tie-breaker)

    private String bonusQuestion; // e.g., "What AI Model was used to generate this image?"

    @Column(columnDefinition = "TEXT")
    private String answerDetails; // contains the text answer, reverse prompt, or glitch explanation

    private String glitchCoordinates; // for glitch hunt (e.g. "x,y,r" or coordinates)

    @JsonProperty("isLightning")
    private boolean isLightning; // true if this is a Round 2 surprise lightning round image

    public ImageQuestion() {}

    public ImageQuestion(String imageUrl, boolean isAi, String modelUsed, int roundNumber, String bonusQuestion, String answerDetails, String glitchCoordinates, boolean isLightning) {
        this.imageUrl = imageUrl;
        this.isAi = isAi;
        this.modelUsed = modelUsed;
        this.roundNumber = roundNumber;
        this.bonusQuestion = bonusQuestion;
        this.answerDetails = answerDetails;
        this.glitchCoordinates = glitchCoordinates;
        this.isLightning = isLightning;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public boolean isAi() { return isAi; }
    public void setAi(boolean ai) { isAi = ai; }

    public String getModelUsed() { return modelUsed; }
    public void setModelUsed(String modelUsed) { this.modelUsed = modelUsed; }

    public int getRoundNumber() { return roundNumber; }
    public void setRoundNumber(int roundNumber) { this.roundNumber = roundNumber; }

    public String getBonusQuestion() { return bonusQuestion; }
    public void setBonusQuestion(String bonusQuestion) { this.bonusQuestion = bonusQuestion; }

    public String getAnswerDetails() { return answerDetails; }
    public void setAnswerDetails(String answerDetails) { this.answerDetails = answerDetails; }

    public String getGlitchCoordinates() { return glitchCoordinates; }
    public void setGlitchCoordinates(String glitchCoordinates) { this.glitchCoordinates = glitchCoordinates; }

    public boolean isLightning() { return isLightning; }
    public void setLightning(boolean lightning) { isLightning = lightning; }
}
