package com.pixelparadox.config;

import com.pixelparadox.model.GameState;
import com.pixelparadox.model.User;
import com.pixelparadox.repository.GameStateRepository;
import com.pixelparadox.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final GameStateRepository gameStateRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, GameStateRepository gameStateRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.gameStateRepository = gameStateRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        // 1. Seed Admin User
        String adminEmail = "ywanth224@gmail.com";
        Optional<User> adminOpt = userRepository.findByLeaderEmail(adminEmail);
        
        if (adminOpt.isEmpty()) {
            User admin = new User();
            admin.setTeamName("Admin Organizer");
            admin.setLeaderEmail(adminEmail);
            admin.setLeaderName("Admin Organizer");
            admin.setMemberName("MCA Coordinator");
            admin.setPassword(passwordEncoder.encode("Yash1234"));
            admin.setRole("ROLE_ADMIN");
            admin.setVerified(true);
            userRepository.save(admin);
            System.out.println(">>> Seeded default admin user: " + adminEmail);
        } else {
            User admin = adminOpt.get();
            if (admin.getLeaderName() == null) admin.setLeaderName("Admin Organizer");
            admin.setPassword(passwordEncoder.encode("Yash1234"));
            admin.setRole("ROLE_ADMIN");
            admin.setVerified(true);
            userRepository.save(admin);
            System.out.println(">>> Updated admin credentials to standard: " + adminEmail);
        }

        // 3. Seed second admin user
        String secondAdminEmail = "25mx356@gmail.com";
        Optional<User> secondAdminOpt = userRepository.findByLeaderEmail(secondAdminEmail);
        if (secondAdminOpt.isEmpty()) {
            User secondAdmin = new User();
            secondAdmin.setTeamName("Second Admin");
            secondAdmin.setLeaderEmail(secondAdminEmail);
            secondAdmin.setLeaderName("Second Admin");
            secondAdmin.setMemberName("Second Coordinator");
            secondAdmin.setPassword(passwordEncoder.encode("vix-1234"));
            secondAdmin.setRole("ROLE_ADMIN");
            secondAdmin.setVerified(true);
            userRepository.save(secondAdmin);
            System.out.println(">>> Seeded second admin user: " + secondAdminEmail);
        } else {
            User secondAdmin = secondAdminOpt.get();
            if (secondAdmin.getLeaderName() == null) secondAdmin.setLeaderName("Second Admin");
            secondAdmin.setPassword(passwordEncoder.encode("vix-1234"));
            secondAdmin.setRole("ROLE_ADMIN");
            secondAdmin.setVerified(true);
            userRepository.save(secondAdmin);
            System.out.println(">>> Updated second admin credentials: " + secondAdminEmail);
        }
    }
}
