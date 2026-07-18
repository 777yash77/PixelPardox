package com.pixelparadox.repository;

import com.pixelparadox.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByLeaderEmail(String leaderEmail);
    Optional<User> findByTeamName(String teamName);
    List<User> findByRoleAndIsVerifiedTrueOrderByScoreDesc(String role);
    List<User> findByRoleAndIsVerifiedTrueAndIsEliminatedFalseOrderByScoreDesc(String role);
    long countByRoleAndIsVerifiedTrue(String role);
}
