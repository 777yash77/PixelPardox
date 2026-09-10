package com.pixelparadox.controller;

import com.pixelparadox.model.User;
import com.pixelparadox.repository.UserRepository;
import com.pixelparadox.security.JwtTokenProvider;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    public AuthController(AuthenticationManager authenticationManager,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtTokenProvider tokenProvider) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    public record RegisterRequest(
        String teamName,
        String teamId,
        String password,
        Integer teamSize,
        List<String> memberNames
    ) {}

    public record LoginRequest(String teamId, String password) {}

    @PostMapping("/register")
    public ResponseEntity<?> registerTeam(@RequestBody RegisterRequest request) {
        if (request.teamName() == null || request.teamName().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Team name is required."));
        if (request.teamId() == null || request.teamId().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Team ID is required."));
        if (request.password() == null || request.password().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Password is required."));

        String cleanTeamName = request.teamName().trim();
        String cleanTeamId = request.teamId().trim();

        // Check if Team ID already exists
        Optional<User> existingUserOpt = userRepository.findByTeamId(cleanTeamId);
        if (existingUserOpt.isPresent()) {
            User existing = existingUserOpt.get();
            if (passwordEncoder.matches(request.password(), existing.getPassword())) {
                return ResponseEntity.ok(Map.of(
                    "status", "TEAM_EXISTS",
                    "message", "Squad '" + existing.getTeamName() + "' is already registered! All teammates use this shared Team ID. You can now log in.",
                    "teamId", existing.getTeamId(),
                    "teamName", existing.getTeamName()
                ));
            }
            return ResponseEntity.badRequest().body(Map.of("message", "Team ID '" + cleanTeamId + "' is already taken. Please choose another Team ID or sign in."));
        }

        if (userRepository.findByTeamName(cleanTeamName).isPresent())
            return ResponseEntity.badRequest().body(Map.of("message", "Team name already registered."));

        if (request.teamSize() != null && (request.teamSize() < 2 || request.teamSize() > 3)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Team size must be strictly 2 or 3 members."));
        }

        int size = (request.teamSize() != null && request.teamSize() >= 2 && request.teamSize() <= 3) ? request.teamSize() : 2;
        User user = new User(
                cleanTeamName,
                cleanTeamId,
                passwordEncoder.encode(request.password()),
                "ROLE_TEAM",
                size
        );

        if (request.memberNames() != null && !request.memberNames().isEmpty()) {
            String membersJoined = request.memberNames().stream()
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .limit(size)
                    .collect(Collectors.joining(", "));
            user.setMemberNames(membersJoined);
        }

        userRepository.save(user);

        Map<String, Object> resp = new HashMap<>();
        resp.put("message", "Registration successful. You can now log in.");
        resp.put("teamId", cleanTeamId);
        resp.put("teamName", cleanTeamName);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        String cleanTeamId = request.teamId() != null ? request.teamId().trim() : "";
        System.out.println(">>> Login attempt for teamId: '" + cleanTeamId + "' with password length: " + (request.password() != null ? request.password().length() : 0));
        Optional<User> userOpt = userRepository.findByTeamId(cleanTeamId);
        if (userOpt.isEmpty()) {
            System.out.println(">>> User NOT FOUND in database for teamId: '" + cleanTeamId + "'");
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid Team ID or password. (User not found)"));
        }
        User user = userOpt.get();
        System.out.println(">>> User found in DB: " + user.getTeamId() + ", role: " + user.getRole());
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(cleanTeamId, request.password())
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);
            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("teamName", user.getTeamName());
            response.put("teamId", user.getTeamId());
            response.put("role", user.getRole());
            response.put("score", user.getScore());
            response.put("teamSize", user.getTeamSize());
            response.put("memberNames", user.getMemberNames() != null ? user.getMemberNames() : "");
            response.put("roundNumber", user.getRoundNumber());
            response.put("isEliminated", user.isEliminated());
            System.out.println(">>> Login successful for: " + user.getTeamId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println(">>> Auth exception for " + request.teamId() + ": " + e.getClass().getName() + " - " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid Team ID or password: " + e.getMessage()));
        }
    }
}
