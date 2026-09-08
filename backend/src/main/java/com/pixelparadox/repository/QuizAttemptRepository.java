package com.pixelparadox.repository;

import com.pixelparadox.model.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    Optional<QuizAttempt> findByTeamIdAndParticipantName(Long teamId, String participantName);
    List<QuizAttempt> findByTeamId(Long teamId);
}
