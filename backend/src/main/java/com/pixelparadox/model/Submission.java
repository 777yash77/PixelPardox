package com.pixelparadox.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity
@Table(name = "submissions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "image_question_id"})
})
public class Submission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "image_question_id", nullable = false)
    private ImageQuestion imageQuestion;

    private int roundNumber;

    private String chosenAnswer; // "REAL", "AI", "ZOOMED_IN_GUESS"
    private String bonusAnswer; // model guess for Round 1
    
    @Column(columnDefinition = "TEXT")
    private String textSubmission; // prompt text for Round 3 or glitch description for Round 2

    @JsonProperty("isGraded")
    private boolean isGraded;
    private int score;

    public Submission() {}

    public Submission(User user, ImageQuestion imageQuestion, int roundNumber, String chosenAnswer, String bonusAnswer, String textSubmission, boolean isGraded, int score) {
        this.user = user;
        this.imageQuestion = imageQuestion;
        this.roundNumber = roundNumber;
        this.chosenAnswer = chosenAnswer;
        this.bonusAnswer = bonusAnswer;
        this.textSubmission = textSubmission;
        this.isGraded = isGraded;
        this.score = score;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public ImageQuestion getImageQuestion() { return imageQuestion; }
    public void setImageQuestion(ImageQuestion imageQuestion) { this.imageQuestion = imageQuestion; }

    public int getRoundNumber() { return roundNumber; }
    public void setRoundNumber(int roundNumber) { this.roundNumber = roundNumber; }

    public String getChosenAnswer() { return chosenAnswer; }
    public void setChosenAnswer(String chosenAnswer) { this.chosenAnswer = chosenAnswer; }

    public String getBonusAnswer() { return bonusAnswer; }
    public void setBonusAnswer(String bonusAnswer) { this.bonusAnswer = bonusAnswer; }

    public String getTextSubmission() { return textSubmission; }
    public void setTextSubmission(String textSubmission) { this.textSubmission = textSubmission; }

    public boolean isGraded() { return isGraded; }
    public void setGraded(boolean graded) { isGraded = graded; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
}
