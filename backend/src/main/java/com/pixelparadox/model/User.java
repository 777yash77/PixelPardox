package com.pixelparadox.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String teamName;

    @Column(unique = true, nullable = false)
    private String teamId;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private int teamSize = 2;

    @Column(columnDefinition = "TEXT")
    private String memberNames;

    private int roundNumber = 1;
    private int score = 0;
    @JsonProperty("isEliminated")
    private boolean isEliminated = false;

    public User() {}

    public User(String teamName, String teamId, String password, String role, int teamSize) {
        this.teamName = teamName;
        this.teamId = teamId;
        this.password = password;
        this.role = role;
        this.teamSize = teamSize;
        this.roundNumber = 1;
        this.score = 0;
        this.isEliminated = false;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }
    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public int getRoundNumber() { return roundNumber; }
    public void setRoundNumber(int roundNumber) { this.roundNumber = roundNumber; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public boolean isEliminated() { return isEliminated; }
    public void setEliminated(boolean eliminated) { this.isEliminated = eliminated; }
    public int getTeamSize() { return teamSize; }
    public void setTeamSize(int teamSize) { this.teamSize = teamSize; }
    public String getMemberNames() { return memberNames; }
    public void setMemberNames(String memberNames) { this.memberNames = memberNames; }
}
