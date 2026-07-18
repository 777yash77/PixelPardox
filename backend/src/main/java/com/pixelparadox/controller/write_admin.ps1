$content = @"
package com.pixelparadox.controller;

import com.pixelparadox.model.User;
import com.pixelparadox.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    public AdminTeamController(UserRepository userRepository) {
        this.userRepository = userRepository;
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

    @DeleteMapping("/teams/{id}")
    public ResponseEntity<?> deleteTeam(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty())
            return ResponseEntity.notFound().build();
        User user = userOpt.get();
        if ("ROLE_ADMIN".equals(user.getRole()))
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot delete admin accounts."));
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Team deleted successfully."));
    }
}
"@
Set-Content -Path "AdminTeamController.java" -Value $content -Encoding UTF8
Write-Host "AdminTeamController written"
