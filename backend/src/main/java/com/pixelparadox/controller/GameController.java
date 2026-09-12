package com.pixelparadox.controller;

import com.pixelparadox.model.GameState;
import com.pixelparadox.model.ImageQuestion;
import com.pixelparadox.model.Submission;
import com.pixelparadox.model.User;
import com.pixelparadox.repository.ImageQuestionRepository;
import com.pixelparadox.repository.SubmissionRepository;
import com.pixelparadox.repository.UserRepository;
import com.pixelparadox.repository.WebcamRecordingRepository;
import com.pixelparadox.model.WebcamRecording;
import com.pixelparadox.service.GameService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/game")
public class GameController {

    private final GameService gameService;
    private final ImageQuestionRepository imageQuestionRepository;
    private final UserRepository userRepository;
    private final WebcamRecordingRepository webcamRecordingRepository;
    private final SubmissionRepository submissionRepository;

    public GameController(GameService gameService,
            ImageQuestionRepository imageQuestionRepository,
            UserRepository userRepository,
            WebcamRecordingRepository webcamRecordingRepository,
            SubmissionRepository submissionRepository) {
        this.gameService = gameService;
        this.imageQuestionRepository = imageQuestionRepository;
        this.userRepository = userRepository;
        this.webcamRecordingRepository = webcamRecordingRepository;
        this.submissionRepository = submissionRepository;
    }

    // Request Records
    public record UpdateStateRequest(int round, Long questionId, int duration, int zoom) {
    }

    public record SubmitRequest(Long questionId, String chosenAnswer, String bonusAnswer, String textSubmission) {
    }

    public record GradeRequest(Long submissionId, int score) {
    }

    public record AdvanceRequest(int limitValue, boolean isPercent) {
    }

    // Prelims records
    public record StartQuizRequest(String participantName) {
    }

    public record SubmitQuizRequest(String participantName, Map<Long, String> answers) {
    }

    @GetMapping("/state")
    public ResponseEntity<GameState> getGameState() {
        return ResponseEntity.ok(gameService.getOrCreateGameState());
    }

    @PostMapping("/state/update")
    public ResponseEntity<GameState> updateGameState(@RequestBody UpdateStateRequest request) {
        GameState updated = gameService.updateGameState(
                request.round(),
                request.questionId(),
                request.duration(),
                request.zoom());
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/state/timer")
    public ResponseEntity<GameState> setTimerRunning(@RequestParam boolean running) {
        return ResponseEntity.ok(gameService.setTimerRunning(running));
    }

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("isAi") boolean isAi,
            @RequestParam(value = "modelUsed", required = false) String modelUsed,
            @RequestParam("roundNumber") int roundNumber,
            @RequestParam(value = "bonusQuestion", required = false) String bonusQuestion,
            @RequestParam(value = "answerDetails", required = false) String answerDetails,
            @RequestParam(value = "glitchCoordinates", required = false) String glitchCoordinates,
            @RequestParam(value = "isLightning", defaultValue = "false") boolean isLightning) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "File cannot be empty"));
        }

        try {
            // Save upload file
            String uploadDir = "uploads";
            File directory = new File(uploadDir);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename().replaceAll("\\s+", "_");
            Path path = Paths.get(uploadDir, fileName);
            Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);

            // Construct image URL (assuming backend is on localhost:8080)
            String imageUrl = "/uploads/" + fileName;

            ImageQuestion question = new ImageQuestion(
                    imageUrl,
                    isAi,
                    modelUsed,
                    roundNumber,
                    bonusQuestion,
                    answerDetails,
                    glitchCoordinates,
                    isLightning);

            ImageQuestion saved = imageQuestionRepository.save(question);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to save file: " + e.getMessage()));
        }
    }

    @GetMapping("/images")
    public ResponseEntity<List<ImageQuestion>> getAllImages() {
        List<ImageQuestion> images = imageQuestionRepository.findAll();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isTeam = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_TEAM"));

        if (isTeam) {
            List<ImageQuestion> safeImages = images.stream().map(img -> {
                ImageQuestion safe = new ImageQuestion(
                        img.getImageUrl(),
                        false, // isAi hidden
                        "", // modelUsed hidden
                        img.getRoundNumber(),
                        img.getBonusQuestion(), // Needs to see the bonus question text
                        "", // answerDetails hidden
                        "", // glitchCoordinates hidden
                        img.isLightning());
                safe.setId(img.getId());
                return safe;
            }).toList();
            return ResponseEntity.ok(safeImages);
        }

        return ResponseEntity.ok(images);
    }

    @PostMapping("/reset")
    public ResponseEntity<?> resetGameEngine() {
        try {
            gameService.resetGameEngine();
            return ResponseEntity.ok(Map.of("message", "Game engine reset successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to reset game: " + e.getMessage()));
        }
    }

    @DeleteMapping("/images/{id}")
    public ResponseEntity<?> deleteImage(@PathVariable Long id) {
        return imageQuestionRepository.findById(id)
                .map(question -> {
                    // Step 1: Cascade delete any submissions referencing this question and deduct
                    // user scores
                    List<Submission> submissions = submissionRepository.findByImageQuestionId(id);
                    if (!submissions.isEmpty()) {
                        for (Submission s : submissions) {
                            if (s.isGraded() && s.getScore() > 0 && s.getUser() != null) {
                                User u = s.getUser();
                                u.setScore(Math.max(0, u.getScore() - s.getScore()));
                                userRepository.save(u);
                            }
                        }
                        submissionRepository.deleteAll(submissions);
                        submissionRepository.flush();
                        gameService.broadcastLeaderboard();
                    }

                    // Step 2: If this question is active in GameState, reset activeQuestionId
                    GameState currentState = gameService.getOrCreateGameState();
                    if (currentState != null && id.equals(currentState.getActiveQuestionId())) {
                        gameService.updateGameState(
                                currentState.getActiveRound(),
                                null,
                                currentState.getTimerDuration(),
                                currentState.getZoomLevel());
                    }

                    // Step 3: Try to delete physical file
                    String fileUrl = question.getImageUrl();
                    if (fileUrl != null && fileUrl.startsWith("/uploads/")) {
                        String filePath = fileUrl.substring(1); // removes leading slash
                        try {
                            Files.deleteIfExists(Paths.get(filePath));
                        } catch (IOException e) {
                            // Log warning
                        }
                    }

                    // Step 4: Delete the question entity
                    imageQuestionRepository.delete(question);
                    return ResponseEntity.ok(Map.of("message", "Question deleted successfully"));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitAnswer(@RequestBody SubmitRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName(); // Leader email is the username in JWT

        try {
            Submission submission = gameService.submitAnswer(
                    email,
                    request.questionId(),
                    request.chosenAnswer(),
                    request.bonusAnswer(),
                    request.textSubmission());
            return ResponseEntity.ok(submission);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getName();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Internal server error: " + msg));
        }
    }

    @GetMapping("/submissions")
    public ResponseEntity<List<Submission>> getSubmissionsForGrading(
            @RequestParam(required = false, defaultValue = "0") int round) {
        return ResponseEntity.ok(gameService.getSubmissionsForGrading(round));
    }

    @PostMapping("/grade")
    public ResponseEntity<?> gradeSubmission(@RequestBody GradeRequest request) {
        try {
            gameService.gradeSubmission(request.submissionId(), request.score());
            return ResponseEntity.ok(Map.of("message", "Grading successful"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/my-team")
    public ResponseEntity<?> getMyTeamProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Authentication required"));
        }
        String teamId = auth.getName();
        Optional<User> userOpt = gameService.findTeamUser(teamId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = userOpt.get();
        List<com.pixelparadox.model.QuizAttempt> attempts = gameService.getTeamQuizAttempts(teamId);
        int rank = gameService.getTeamRank(user.getId());
        long totalTeams = userRepository.countByRole("ROLE_TEAM");

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("teamName", user.getTeamName());
        profile.put("teamId", user.getTeamId());
        profile.put("teamSize", user.getTeamSize());
        profile.put("score", user.getScore());
        profile.put("roundNumber", user.getRoundNumber());
        profile.put("isEliminated", user.isEliminated());
        profile.put("memberNames", user.getMemberNames() != null ? user.getMemberNames() : "");
        profile.put("attempts", attempts);
        profile.put("rank", rank);
        profile.put("totalTeams", totalTeams);

        return ResponseEntity.ok(profile);
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<User>> getLeaderboard() {
        // Return only teams, not admin
        List<User> teams = userRepository.findByRoleOrderByScoreDesc("ROLE_TEAM");
        return ResponseEntity.ok(teams);
    }

    @PostMapping("/advance-teams")
    public ResponseEntity<?> advanceTeams(@RequestBody AdvanceRequest request) {
        try {
            gameService.advanceTeams(request.limitValue(), request.isPercent());
            return ResponseEntity.ok(Map.of("message", "Teams qualified successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to advance teams: " + e.getMessage()));
        }
    }

    // --- PRELIMS ENDPOINTS ---

    @GetMapping("/prelims/questions")
    public ResponseEntity<?> getQuizQuestions() {
        // Hide correct answers from participants
        List<com.pixelparadox.model.QuizQuestion> questions = gameService.getQuizQuestions().stream().map(q -> {
            com.pixelparadox.model.QuizQuestion safe = new com.pixelparadox.model.QuizQuestion();
            safe.setId(q.getId());
            safe.setQuestionText(q.getQuestionText());
            safe.setOptionA(q.getOptionA());
            safe.setOptionB(q.getOptionB());
            safe.setOptionC(q.getOptionC());
            safe.setOptionD(q.getOptionD());
            safe.setOrderNum(q.getOrderNum());
            safe.setPoints(q.getPoints());
            // omit correctAnswer
            return safe;
        }).toList();
        return ResponseEntity.ok(questions);
    }

    @GetMapping("/prelims/attempt")
    public ResponseEntity<?> getQuizAttempt(@RequestParam String participantName) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return gameService.getQuizAttempt(email, participantName)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/prelims/start")
    public ResponseEntity<?> startQuizAttempt(@RequestBody StartQuizRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            com.pixelparadox.model.QuizAttempt attempt = gameService.startQuizAttempt(email, request.participantName());
            return ResponseEntity.ok(attempt);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/prelims/submit")
    public ResponseEntity<?> submitQuizAttempt(@RequestBody SubmitQuizRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            com.pixelparadox.model.QuizAttempt attempt = gameService.submitQuizAttempt(email, request.participantName(),
                    request.answers());
            return ResponseEntity.ok(attempt);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping(value = "/prelims/video", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadWebcamRecording(
            @RequestParam("file") MultipartFile file,
            @RequestParam("participantName") String participantName) {

        String teamId = SecurityContextHolder.getContext().getAuthentication().getName();

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Video file cannot be empty"));
        }

        try {
            String uploadDir = "uploads/videos";
            File directory = new File(uploadDir);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            String cleanTeam = (teamId != null ? teamId : "team").replaceAll("[^a-zA-Z0-9_-]", "_");
            String cleanMember = (participantName != null ? participantName : "member").replaceAll("[^a-zA-Z0-9_-]",
                    "_");
            String fileName = System.currentTimeMillis() + "_" + cleanTeam + "_" + cleanMember + ".webm";
            Path path = Paths.get(uploadDir, fileName);
            Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);

            String videoUrl = "/uploads/videos/" + fileName;
            WebcamRecording recording = new WebcamRecording(teamId, participantName, videoUrl);
            webcamRecordingRepository.save(recording);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Recording uploaded successfully"));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to save video: " + e.getMessage()));
        }
    }
}
