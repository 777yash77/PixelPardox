package com.pixelparadox.repository;

import com.pixelparadox.model.ImageQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImageQuestionRepository extends JpaRepository<ImageQuestion, Long> {
    List<ImageQuestion> findByRoundNumber(int roundNumber);
}
