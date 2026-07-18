@"
package com.pixelparadox.model;

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
    private String leaderEmail;

    @Column(nullable = false)
    private String leaderName;

    @Column(nullable = true)
    private String memberName;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_member_names", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "member_name")
    private List<String> memberNames = new ArrayList<>();

    private boolean isVerified = false;
    private String otp;
    private LocalDateTime otpExpiry;
    private int roundNumber = 1;
    private int score = 0;
    private boolean isEliminated = false;

    public User() {}

    public User(String teamName, String leaderEmail, String leaderName, String memberName,
                String password, String role) {
        this.teamName = teamName;
        this.leaderEmail = leaderEmail;
        this.leaderName = leaderName;
        this.memberName = memberName;
        this.password = password;
        this.role = role;
        this.isVerified = false;
        this.roundNumber = 1;
        this.score = 0;
        this.isEliminated = false;
        this.memberNames = new ArrayList<>();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }
    public String getLeaderEmail() { return leaderEmail; }
    public void setLeaderEmail(String leaderEmail) { this.leaderEmail = leaderEmail; }
    public String getLeaderName() { return leaderName; }
    public void setLeaderName(String leaderName) { this.leaderName = leaderName; }
    public String getMemberName() { return memberName; }
    public void setMemberName(String memberName) { this.memberName = memberName; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public List<String> getMemberNames() { return memberNames; }
    public void setMemberNames(List<String> memberNames) {
        this.memberNames = memberNames != null ? new ArrayList<>(memberNames) : new ArrayList<>();
    }
    public boolean isVerified() { return isVerified; }
    public void setVerified(boolean verified) { this.isVerified = verified; }
    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }
    public LocalDateTime getOtpExpiry() { return otpExpiry; }
    public void setOtpExpiry(LocalDateTime otpExpiry) { this.otpExpiry = otpExpiry; }
    public int getRoundNumber() { return roundNumber; }
    public void setRoundNumber(int roundNumber) { this.roundNumber = roundNumber; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public boolean isEliminated() { return isEliminated; }
    public void setEliminated(boolean eliminated) { this.isEliminated = eliminated; }
}
"@ | Out-File -FilePath "User.java" -Encoding UTF8
