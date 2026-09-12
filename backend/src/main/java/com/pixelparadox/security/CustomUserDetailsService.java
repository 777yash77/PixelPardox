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
    public UserDetails loadUserByUsername(String teamId) throws UsernameNotFoundException {
        User user = userRepository.findByTeamId(teamId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with Team ID: " + teamId));

        return new org.springframework.security.core.userdetails.User(
                user.getTeamId(),
                user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority(user.getRole())));
    }
}
