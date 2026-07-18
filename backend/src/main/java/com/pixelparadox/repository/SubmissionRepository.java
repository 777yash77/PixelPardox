package com.pixelparadox.repository;

import com.pixelparadox.model.Submission;
import com.pixelparadox.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    Optional<Submission> findByUserIdAndImageQuestionId(Long userId, Long imageQuestionId);
    List<Submission> findByRoundNumber(int roundNumber);
    List<Submission> findByUser(User user);
    List<Submission> findByImageQuestionId(Long imageQuestionId);
    List<Submission> findByRoundNumberAndIsGradedFalse(int roundNumber);
}
