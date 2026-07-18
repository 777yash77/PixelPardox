package com.pixelparadox.controller;

import com.pixelparadox.model.Submission;
import com.pixelparadox.model.User;
import com.pixelparadox.repository.SubmissionRepository;
import com.pixelparadox.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminTeamController {

    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;

    public AdminTeamController(UserRepository userRepository, SubmissionRepository submissionRepository) {
        this.userRepository = userRepository;
        this.submissionRepository = submissionRepository;
    }

    @GetMapping("/teams")
    public ResponseEntity<?> getAllTeams() {
        List<User> teams = userRepository.findAll().stream()
                .filter(u -> "ROLE_TEAM".equals(u.getRole()))
                .collect(Collectors.toList());

        List<Map<String, Object>> result = teams.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("teamName", u.getTeamName());
            m.put("leaderName", u.getLeaderName());
            m.put("leaderEmail", u.getLeaderEmail());
            m.put("memberName", u.getMemberName());
            m.put("memberNames", u.getMemberNames());
            m.put("isVerified", u.isVerified());
            m.put("score", u.getScore());
            m.put("roundNumber", u.getRoundNumber());
            m.put("isEliminated", u.isEliminated());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @Transactional
    @DeleteMapping("/teams/{id}")
    public ResponseEntity<?> deleteTeam(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty())
            return ResponseEntity.notFound().build();
        User user = userOpt.get();
        if ("ROLE_ADMIN".equals(user.getRole()))
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot delete admin accounts."));

        // Step 1: Delete all game submissions for this team (FK: submissions.user_id)
        List<Submission> submissions = submissionRepository.findByUser(user);
        if (!submissions.isEmpty()) {
            submissionRepository.deleteAll(submissions);
            submissionRepository.flush();
        }

        // Step 2: Clear the @ElementCollection to remove rows from user_member_names (FK: user_member_names.user_id)
        user.setMemberNames(new ArrayList<>());
        userRepository.saveAndFlush(user);

        // Step 3: Now safely delete the user with no dangling FK references
        userRepository.delete(user);

        return ResponseEntity.ok(Map.of("message", "Team deleted successfully."));
    }

    public record UpdateTeamRequest(
            String teamName,
            String leaderName,
            String leaderEmail,
            String memberName,
            List<String> memberNames,
            Boolean isVerified
    ) {}

    @PutMapping("/teams/{id}")
    public ResponseEntity<?> updateTeam(@PathVariable Long id, @RequestBody UpdateTeamRequest request) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty())
            return ResponseEntity.notFound().build();
        User user = userOpt.get();
        if ("ROLE_ADMIN".equals(user.getRole()))
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot edit admin accounts."));

        if (request.teamName() != null && !request.teamName().isBlank()) user.setTeamName(request.teamName());
        if (request.leaderName() != null && !request.leaderName().isBlank()) user.setLeaderName(request.leaderName());
        if (request.leaderEmail() != null && !request.leaderEmail().isBlank()) user.setLeaderEmail(request.leaderEmail());
        if (request.memberName() != null && !request.memberName().isBlank()) user.setMemberName(request.memberName());
        if (request.memberNames() != null) {
            List<String> validMembers = request.memberNames().stream()
                    .filter(name -> name != null && !name.isBlank())
                    .collect(Collectors.toList());
            user.setMemberNames(validMembers);
        }
        if (request.isVerified() != null) user.setVerified(request.isVerified());

        userRepository.save(user);
        
        Map<String, Object> m = new HashMap<>();
        m.put("id", user.getId());
        m.put("teamName", user.getTeamName());
        m.put("leaderName", user.getLeaderName());
        m.put("leaderEmail", user.getLeaderEmail());
        m.put("memberName", user.getMemberName());
        m.put("memberNames", user.getMemberNames());
        m.put("isVerified", user.isVerified());
        m.put("score", user.getScore());
        m.put("roundNumber", user.getRoundNumber());
        m.put("isEliminated", user.isEliminated());

        return ResponseEntity.ok(m);
    }
}
