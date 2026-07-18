package com.pixelparadox.controller;

import com.pixelparadox.model.GameState;
import com.pixelparadox.model.ImageQuestion;
import com.pixelparadox.model.Submission;
import com.pixelparadox.model.User;
import com.pixelparadox.repository.ImageQuestionRepository;
import com.pixelparadox.repository.UserRepository;
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

    public GameController(GameService gameService,
                          ImageQuestionRepository imageQuestionRepository,
                          UserRepository userRepository) {
        this.gameService = gameService;
        this.imageQuestionRepository = imageQuestionRepository;
        this.userRepository = userRepository;
    }

    // Request Records
    public record UpdateStateRequest(int round, Long questionId, int duration, int zoom) {}
    public record SubmitRequest(Long questionId, String chosenAnswer, String bonusAnswer, String textSubmission) {}
    public record GradeRequest(Long submissionId, int score) {}
    public record AdvanceRequest(int limitValue, boolean isPercent) {}

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
                request.zoom()
        );
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
                    isLightning
            );

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
                    "",    // modelUsed hidden
                    img.getRoundNumber(),
                    img.getBonusQuestion(), // Needs to see the bonus question text
                    "",    // answerDetails hidden
                    "",    // glitchCoordinates hidden
                    img.isLightning()
                );
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
                    // Try to delete physical file
                    String fileUrl = question.getImageUrl();
                    if (fileUrl.startsWith("/uploads/")) {
                        String filePath = fileUrl.substring(1); // removes leading slash
                        try {
                            Files.deleteIfExists(Paths.get(filePath));
                        } catch (IOException e) {
                            // Log warning
                        }
                    }
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
                    request.textSubmission()
            );
            return ResponseEntity.ok(submission);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getName();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Internal server error: " + msg));
        }
    }

    @GetMapping("/submissions")
    public ResponseEntity<List<Submission>> getSubmissionsForGrading(@RequestParam int round) {
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

    @GetMapping("/leaderboard")
    public ResponseEntity<List<User>> getLeaderboard() {
        // Return only teams, not admin
        List<User> teams = userRepository.findByRoleAndIsVerifiedTrueOrderByScoreDesc("ROLE_TEAM");
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
}
