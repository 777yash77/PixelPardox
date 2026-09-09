package com.pixelparadox.controller;

import com.pixelparadox.model.QuizAttempt;
import com.pixelparadox.model.Submission;
import com.pixelparadox.model.User;
import com.pixelparadox.model.WebcamRecording;
import com.pixelparadox.repository.QuizAttemptRepository;
import com.pixelparadox.repository.SubmissionRepository;
import com.pixelparadox.repository.UserRepository;
import com.pixelparadox.repository.WebcamRecordingRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
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
    private final QuizAttemptRepository quizAttemptRepository;
    private final WebcamRecordingRepository webcamRecordingRepository;

    public AdminTeamController(UserRepository userRepository, 
                               SubmissionRepository submissionRepository,
                               QuizAttemptRepository quizAttemptRepository,
                               WebcamRecordingRepository webcamRecordingRepository) {
        this.userRepository = userRepository;
        this.submissionRepository = submissionRepository;
        this.quizAttemptRepository = quizAttemptRepository;
        this.webcamRecordingRepository = webcamRecordingRepository;
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
            m.put("teamId", u.getTeamId());
            m.put("teamSize", u.getTeamSize());
            m.put("memberNames", u.getMemberNames() != null ? u.getMemberNames() : "");
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

        // Step 2: Delete all quiz attempts for this team (FK: quiz_attempts.team_id)
        List<QuizAttempt> attempts = quizAttemptRepository.findByTeamId(user.getId());
        if (!attempts.isEmpty()) {
            quizAttemptRepository.deleteAll(attempts);
            quizAttemptRepository.flush();
        }

        // Step 3: Delete webcam recordings and physical files for this team
        if (user.getTeamId() != null) {
            List<WebcamRecording> recordings = webcamRecordingRepository.findByTeamId(user.getTeamId());
            for (WebcamRecording rec : recordings) {
                String url = rec.getVideoUrl();
                if (url != null && url.startsWith("/uploads/videos/")) {
                    try {
                        Files.deleteIfExists(Paths.get(url.substring(1)));
                    } catch (IOException ignored) {}
                }
            }
            if (!recordings.isEmpty()) {
                webcamRecordingRepository.deleteAll(recordings);
                webcamRecordingRepository.flush();
            }
        }

        // Step 4: Now safely delete the user
        userRepository.delete(user);

        return ResponseEntity.ok(Map.of("message", "Team deleted successfully."));
    }

    public record UpdateTeamRequest(
            String teamName,
            String teamId,
            Integer teamSize,
            String memberNames
    ) {}

    @PutMapping("/teams/{id}")
    public ResponseEntity<?> updateTeam(@PathVariable Long id, @RequestBody UpdateTeamRequest request) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty())
            return ResponseEntity.notFound().build();
        User user = userOpt.get();
        if ("ROLE_ADMIN".equals(user.getRole()))
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot edit admin accounts."));

        if (request.teamName() != null && !request.teamName().isBlank()) {
            String newName = request.teamName().trim();
            if (!newName.equalsIgnoreCase(user.getTeamName())) {
                if (userRepository.findByTeamName(newName).isPresent()) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Team name '" + newName + "' is already in use by another team."));
                }
                user.setTeamName(newName);
            }
        }

        if (request.teamId() != null && !request.teamId().isBlank()) {
            String newId = request.teamId().trim();
            if (!newId.equalsIgnoreCase(user.getTeamId())) {
                if (userRepository.findByTeamId(newId).isPresent()) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Team ID '" + newId + "' is already in use by another team."));
                }
                user.setTeamId(newId);
            }
        }

        if (request.teamSize() != null && request.teamSize() >= 2 && request.teamSize() <= 4) {
            user.setTeamSize(request.teamSize());
        }

        if (request.memberNames() != null) {
            user.setMemberNames(request.memberNames().trim());
        }

        userRepository.save(user);
        
        Map<String, Object> m = new HashMap<>();
        m.put("id", user.getId());
        m.put("teamName", user.getTeamName());
        m.put("teamId", user.getTeamId());
        m.put("teamSize", user.getTeamSize());
        m.put("memberNames", user.getMemberNames() != null ? user.getMemberNames() : "");
        m.put("score", user.getScore());
        m.put("roundNumber", user.getRoundNumber());
        m.put("isEliminated", user.isEliminated());

        return ResponseEntity.ok(m);
    }
}
