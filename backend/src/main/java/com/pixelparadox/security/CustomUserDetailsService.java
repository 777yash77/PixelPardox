package com.pixelparadox.security;

import com.pixelparadox.model.User;
import com.pixelparadox.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByLeaderEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // Ensure user is verified to log in as a team, admins don't need verification check (already verified)
        if (user.getRole().equals("ROLE_TEAM") && !user.isVerified()) {
            throw new UsernameNotFoundException("Team is not verified. Please verify OTP first.");
        }

        return new org.springframework.security.core.userdetails.User(
                user.getLeaderEmail(),
                user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority(user.getRole()))
        );
    }
}
