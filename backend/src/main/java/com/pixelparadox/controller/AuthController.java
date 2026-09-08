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
        Integer teamSize
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

        if (userRepository.findByTeamName(request.teamName()).isPresent())
            return ResponseEntity.badRequest().body(Map.of("message", "Team name already registered."));
        if (userRepository.findByTeamId(request.teamId()).isPresent())
            return ResponseEntity.badRequest().body(Map.of("message", "Team ID already registered."));

        int size = (request.teamSize() != null && request.teamSize() >= 2 && request.teamSize() <= 4) ? request.teamSize() : 2;
        User user = new User(
                request.teamName(),
                request.teamId(),
                passwordEncoder.encode(request.password()),
                "ROLE_TEAM",
                size
        );
        userRepository.save(user);

        Map<String, Object> resp = new HashMap<>();
        resp.put("message", "Registration successful. You can now log in.");
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        System.out.println(">>> Login attempt for teamId: '" + request.teamId() + "' with password length: " + (request.password() != null ? request.password().length() : 0));
        Optional<User> userOpt = userRepository.findByTeamId(request.teamId());
        if (userOpt.isEmpty()) {
            System.out.println(">>> User NOT FOUND in database for teamId: '" + request.teamId() + "'");
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid Team ID or password. (User not found)"));
        }
        User user = userOpt.get();
        System.out.println(">>> User found in DB: " + user.getTeamId() + ", role: " + user.getRole() + ", hash: " + user.getPassword());
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.teamId(), request.password())
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);
            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("teamName", user.getTeamName());
            response.put("teamId", user.getTeamId());
            response.put("role", user.getRole());
            response.put("score", user.getScore());
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
