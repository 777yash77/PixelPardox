package com.pixelparadox.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pixelparadox.config.GameWebSocketHandler;
import com.pixelparadox.model.GameState;
import com.pixelparadox.model.ImageQuestion;
import com.pixelparadox.model.Submission;
import com.pixelparadox.model.User;
import com.pixelparadox.repository.GameStateRepository;
import com.pixelparadox.repository.ImageQuestionRepository;
import com.pixelparadox.repository.SubmissionRepository;
import com.pixelparadox.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class GameService {

    private final GameStateRepository gameStateRepository;
    private final ImageQuestionRepository imageQuestionRepository;
    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final GameWebSocketHandler gameWebSocketHandler;
    private final ObjectMapper objectMapper;

    public GameService(GameStateRepository gameStateRepository,
                       ImageQuestionRepository imageQuestionRepository,
                       SubmissionRepository submissionRepository,
                       UserRepository userRepository,
                       GameWebSocketHandler gameWebSocketHandler,
                       ObjectMapper objectMapper) {
        this.gameStateRepository = gameStateRepository;
        this.imageQuestionRepository = imageQuestionRepository;
        this.submissionRepository = submissionRepository;
        this.userRepository = userRepository;
        this.gameWebSocketHandler = gameWebSocketHandler;
        this.objectMapper = objectMapper;
    }

    public GameState getOrCreateGameState() {
        return gameStateRepository.findById(1L).orElseGet(() -> {
            GameState state = new GameState();
            return gameStateRepository.save(state);
        });
    }

    @Transactional
    public GameState updateGameState(int round, Long questionId, int duration, int zoom) {
        GameState state = getOrCreateGameState();
        state.setActiveRound(round);
        state.setActiveQuestionId(questionId);
        state.setTimerDuration(duration);
        state.setZoomLevel(zoom);
        
        if (duration > 0) {
            state.setQuestionStartTime(System.currentTimeMillis());
            state.setTimerRunning(true);
        } else {
            state.setQuestionStartTime(0L);
            state.setTimerRunning(false);
        }

        GameState saved = gameStateRepository.save(state);
        broadcastGameState(saved);
        return saved;
    }

    @Transactional
    public GameState setTimerRunning(boolean running) {
        GameState state = getOrCreateGameState();
        state.setTimerRunning(running);
        if (running && state.getQuestionStartTime() == 0L) {
            state.setQuestionStartTime(System.currentTimeMillis());
        }
        GameState saved = gameStateRepository.save(state);
        broadcastGameState(saved);
        return saved;
    }

    public void broadcastGameState(GameState state) {
        try {
            Map<String, Object> message = Map.of("type", "GAME_STATE", "payload", state);
            String json = objectMapper.writeValueAsString(message);
            gameWebSocketHandler.broadcast(json);
        } catch (Exception e) {
            System.err.println("Failed to broadcast game state: " + e.getMessage());
        }
    }

    @Transactional
    public Submission submitAnswer(String email, Long questionId, String chosenAnswer, String bonusAnswer, String textSubmission) {
        User user = userRepository.findByLeaderEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Team user not found"));

        if (user.isEliminated()) {
            throw new IllegalStateException("Your team has been eliminated and cannot submit answers.");
        }

        ImageQuestion question = imageQuestionRepository.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("Question not found"));

        // Check if user has already submitted for this question
        Optional<Submission> existing = submissionRepository.findByUserIdAndImageQuestionId(user.getId(), questionId);
        if (existing.isPresent()) {
            throw new IllegalStateException("You have already submitted an answer for this question.");
        }

        Submission submission = new Submission();
        submission.setUser(user);
        submission.setImageQuestion(question);
        submission.setRoundNumber(question.getRoundNumber());
        submission.setChosenAnswer(chosenAnswer);
        submission.setBonusAnswer(bonusAnswer);
        submission.setTextSubmission(textSubmission);

        // Auto-scoring for Round 1
        if (question.getRoundNumber() == 1) {
            int score = 0;
            
            if (!question.isAi() && "REAL".equalsIgnoreCase(chosenAnswer)) {
                // Correctly guessed Real
                score = 10;
            } else if (question.isAi() && "AI".equalsIgnoreCase(chosenAnswer)) {
                // Correctly guessed AI
                score = 8; // Base points for guessing AI correctly
                
                // Match model if provided
                if (question.getModelUsed() != null && !question.getModelUsed().trim().isEmpty() && bonusAnswer != null) {
                    if (question.getModelUsed().equalsIgnoreCase(bonusAnswer.trim())) {
                        score = 10; // 8 + 2 bonus points = 10 points
                    }
                }
            }
            
            submission.setScore(score);
            submission.setGraded(true);

            // Update user total score
            user.setScore(user.getScore() + score);
            userRepository.save(user);
        } else {
            // Descriptive answers for R2, R3 or guesses for Tie-breaker are graded manually by admin
            submission.setScore(0);
            submission.setGraded(false);
            
            // For Tie-breaker, we can also support auto-matching if user submits a text guess
            if (question.getRoundNumber() == 4) {
                if (question.getAnswerDetails() != null && textSubmission != null &&
                    question.getAnswerDetails().trim().equalsIgnoreCase(textSubmission.trim())) {
                    // Auto correct for Tie breaker!
                    submission.setScore(20);
                    submission.setGraded(true);
                    user.setScore(user.getScore() + 20);
                    userRepository.save(user);
                }
            }
        }

        Submission saved = submissionRepository.save(submission);
        
        // Notify admin of a new submission (send minimal payload to avoid serialization issues)
        try {
            Map<String, Object> submissionPayload = new HashMap<>();
            submissionPayload.put("id", saved.getId());
            submissionPayload.put("roundNumber", saved.getRoundNumber());
            submissionPayload.put("chosenAnswer", saved.getChosenAnswer());
            submissionPayload.put("bonusAnswer", saved.getBonusAnswer());
            submissionPayload.put("textSubmission", saved.getTextSubmission());
            submissionPayload.put("isGraded", saved.isGraded());
            submissionPayload.put("score", saved.getScore());
            
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("teamName", user.getTeamName());
            userInfo.put("leaderEmail", user.getLeaderEmail());
            submissionPayload.put("user", userInfo);
            
            Map<String, Object> questionInfo = new HashMap<>();
            questionInfo.put("id", question.getId());
            questionInfo.put("imageUrl", question.getImageUrl());
            questionInfo.put("roundNumber", question.getRoundNumber());
            questionInfo.put("answerDetails", question.getAnswerDetails());
            submissionPayload.put("imageQuestion", questionInfo);
            
            Map<String, Object> message = Map.of("type", "SUBMISSION", "payload", submissionPayload);
            String json = objectMapper.writeValueAsString(message);
            gameWebSocketHandler.broadcast(json);
        } catch (Exception e) {
            System.err.println("Failed to broadcast submission event: " + e.getMessage());
        }

        // Always broadcast updated leaderboard so all clients refresh scores in real-time
        broadcastLeaderboard();
        
        return saved;
    }

    public void broadcastLeaderboard() {
        try {
            List<User> teams = userRepository.findByRoleAndIsVerifiedTrueOrderByScoreDesc("ROLE_TEAM");
            Map<String, Object> scoreMsg = Map.of("type", "SCORES_UPDATED", "payload", teams);
            gameWebSocketHandler.broadcast(objectMapper.writeValueAsString(scoreMsg));
        } catch (Exception e) {
            System.err.println("Failed to broadcast leaderboard: " + e.getMessage());
        }
    }

    public List<Submission> getSubmissionsForGrading(int roundNumber) {
        return submissionRepository.findByRoundNumberAndIsGradedFalse(roundNumber);
    }

    @Transactional
    public void gradeSubmission(Long submissionId, int scorePoints) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));

        User user = submission.getUser();
        
        // Adjust score if already graded (overwriting grade)
        if (submission.isGraded()) {
            user.setScore(user.getScore() - submission.getScore());
        }

        submission.setScore(scorePoints);
        submission.setGraded(true);
        user.setScore(user.getScore() + scorePoints);

        userRepository.save(user);
        submissionRepository.save(submission);

        // Notify all clients of score changes with real leaderboard data
        broadcastLeaderboard();
    }

    @Transactional
    public void advanceTeams(int limitValue, boolean isPercent) {
        // Fetch all active, verified teams
        List<User> activeTeams = userRepository.findByRoleAndIsVerifiedTrueAndIsEliminatedFalseOrderByScoreDesc("ROLE_TEAM");

        if (activeTeams.isEmpty()) {
            return;
        }

        int cutoffIndex;
        if (isPercent) {
            // Limit by top N% (e.g. 50%)
            cutoffIndex = (int) Math.ceil((activeTeams.size() * limitValue) / 100.0);
        } else {
            // Limit by top X (e.g. 10 teams)
            cutoffIndex = Math.min(limitValue, activeTeams.size());
        }

        // We should adjust cutoff index to resolve ties at the boundary
        if (cutoffIndex > 0 && cutoffIndex < activeTeams.size()) {
            int cutoffScore = activeTeams.get(cutoffIndex - 1).getScore();
            // Extend cutoff to include any team that has the exact same score as the cutoff team
            while (cutoffIndex < activeTeams.size() && activeTeams.get(cutoffIndex).getScore() == cutoffScore) {
                cutoffIndex++;
            }
        }

        // Eliminate teams below the cutoff
        for (int i = cutoffIndex; i < activeTeams.size(); i++) {
            User team = activeTeams.get(i);
            team.setEliminated(true);
            userRepository.save(team);
        }

        // For advanced teams, increment their round number state
        GameState state = getOrCreateGameState();
        int nextRound = state.getActiveRound() + 1;
        for (int i = 0; i < cutoffIndex; i++) {
            User team = activeTeams.get(i);
            team.setRoundNumber(nextRound);
            userRepository.save(team);
        }

        // Update active round global state as well
        state.setActiveRound(nextRound);
        state.setActiveQuestionId(null);
        state.setTimerDuration(0);
        state.setTimerRunning(false);
        gameStateRepository.save(state);

        broadcastGameState(state);
        broadcastLeaderboard();
    }

    @Transactional
    public void resetGameEngine() {
        // Clear all submissions
        submissionRepository.deleteAll();

        // Reset all teams
        List<User> teams = userRepository.findAll().stream()
                .filter(u -> "ROLE_TEAM".equals(u.getRole()))
                .toList();
        for (User team : teams) {
            team.setScore(0);
            team.setEliminated(false);
            team.setRoundNumber(1);
            userRepository.save(team);
        }

        // Reset GameState
        GameState state = getOrCreateGameState();
        state.setActiveRound(0);
        state.setActiveQuestionId(null);
        state.setTimerDuration(0);
        state.setQuestionStartTime(0L);
        state.setTimerRunning(false);
        state.setZoomLevel(100);
        gameStateRepository.save(state);

        broadcastGameState(state);
        broadcastLeaderboard();
    }
}
