package com.pixelparadox.controller;

import com.pixelparadox.model.User;
import com.pixelparadox.repository.UserRepository;
import com.pixelparadox.security.JwtTokenProvider;
import com.pixelparadox.service.OtpService;
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
    private final OtpService otpService;

    public AuthController(AuthenticationManager authenticationManager,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtTokenProvider tokenProvider,
                          OtpService otpService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.otpService = otpService;
    }

    public record RegisterRequest(
        String teamName,
        String leaderEmail,
        String leaderName,
        String memberName,
        String password,
        List<String> memberNames
    ) {}

    public record LoginRequest(String email, String password) {}
    public record VerifyOtpRequest(String email, String otp) {}

    @PostMapping("/register")
    public ResponseEntity<?> registerTeam(@RequestBody RegisterRequest request) {
        if (request.teamName() == null || request.teamName().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Team name is required."));
        if (request.leaderEmail() == null || request.leaderEmail().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Leader email is required."));
        if (request.leaderName() == null || request.leaderName().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Leader name is required."));
        if (request.memberName() == null || request.memberName().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Member 2 name is required."));

        if (userRepository.findByTeamName(request.teamName()).isPresent())
            return ResponseEntity.badRequest().body(Map.of("message", "Team name already registered."));
        if (userRepository.findByLeaderEmail(request.leaderEmail()).isPresent())
            return ResponseEntity.badRequest().body(Map.of("message", "Leader email already registered."));

        List<String> validMembers = (request.memberNames() != null) 
            ? request.memberNames().stream().filter(name -> name != null && !name.isBlank()).toList() 
            : new ArrayList<>();
            
        int totalMembers = 1 + 1 + validMembers.size();
        if (totalMembers < 3 || totalMembers > 5)
            return ResponseEntity.badRequest().body(Map.of("message",
                "Team must have 3-5 members (including leader). Current count: " + totalMembers));

        User user = new User(
                request.teamName(),
                request.leaderEmail(),
                request.leaderName(),
                request.memberName(),
                passwordEncoder.encode(request.password()),
                "ROLE_TEAM"
        );
        if (!validMembers.isEmpty()) {
            user.setMemberNames(new ArrayList<>(validMembers));
        }
        userRepository.save(user);

        otpService.generateAndSendOtp(user);
        Map<String, Object> resp = new HashMap<>();
        resp.put("message", "Registration successful. Please verify OTP sent to your email.");
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest request) {
        Optional<User> userOpt = userRepository.findByLeaderEmail(request.email());
        if (userOpt.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("message", "Team not found."));
        User user = userOpt.get();
        boolean verified = otpService.verifyOtp(user, request.otp());
        if (verified)
            return ResponseEntity.ok(Map.of("message", "OTP verified. You can now log in."));
        else
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired OTP."));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByLeaderEmail(request.email());
        if (userOpt.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid email or password."));
        User user = userOpt.get();
        if (user.getRole().equals("ROLE_TEAM") && !user.isVerified())
            return ResponseEntity.badRequest().body(Map.of("message", "Please verify your OTP first."));
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);
            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("teamName", user.getTeamName());
            response.put("email", user.getLeaderEmail());
            response.put("leaderName", user.getLeaderName());
            response.put("memberName", user.getMemberName());
            response.put("memberNames", user.getMemberNames());
            response.put("role", user.getRole());
            response.put("score", user.getScore());
            response.put("roundNumber", user.getRoundNumber());
            response.put("isEliminated", user.isEliminated());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid email or password."));
        }
    }
}
