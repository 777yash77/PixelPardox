package com.pixelparadox.config;

import com.pixelparadox.model.GameState;
import com.pixelparadox.model.User;
import com.pixelparadox.repository.GameStateRepository;
import com.pixelparadox.repository.QuizQuestionRepository;
import com.pixelparadox.repository.UserRepository;
import com.pixelparadox.service.GameService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final GameStateRepository gameStateRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final GameService gameService;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           GameStateRepository gameStateRepository,
                           QuizQuestionRepository quizQuestionRepository,
                           GameService gameService,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.gameStateRepository = gameStateRepository;
        this.quizQuestionRepository = quizQuestionRepository;
        this.gameService = gameService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        // 1-4. Seed Admin Users
        String[] adminEmails = {
            "ywanth224@gmail.com",
            "25mx356@gmail.com",
            "volunteer1@gmail.com",
            "volunteer2@gmail.com"
        };

        for (String email : adminEmails) {
            Optional<User> adminOpt = userRepository.findByTeamId(email);
            if (adminOpt.isEmpty()) {
                User admin = new User();
                admin.setTeamName("Admin Organizer");
                admin.setTeamId(email);
                admin.setPassword(passwordEncoder.encode("mcappt"));
                admin.setRole("ROLE_ADMIN");
                admin.setTeamSize(1);
                userRepository.save(admin);
                System.out.println(">>> Seeded admin user: " + email);
            } else {
                User admin = adminOpt.get();
                admin.setPassword(passwordEncoder.encode("mcappt"));
                admin.setRole("ROLE_ADMIN");
                userRepository.save(admin);
                System.out.println(">>> Updated admin credentials: " + email);
            }
        }

        // 3. Ensure GameState exists
        if (gameStateRepository.findById(1L).isEmpty()) {
            GameState state = new GameState();
            state.setActiveRound(0);
            gameStateRepository.save(state);
            System.out.println(">>> Initialized default GameState (Round 0 Lobby)");
        }

        // 4. Auto-seed default 30 Stage 0 Prelims questions if question bank is empty
        if (quizQuestionRepository.count() == 0) {
            gameService.seedDefaultPrelimQuestions();
            System.out.println(">>> Auto-seeded 30 curated Stage 0 Prelims questions for LOGIN 2026");
        }
    }
}
