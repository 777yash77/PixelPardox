package com.pixelparadox.controller;

import com.pixelparadox.model.QuizQuestion;
import com.pixelparadox.repository.QuizQuestionRepository;
import com.pixelparadox.service.GameService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/quiz")
@CrossOrigin(origins = "*")
public class AdminQuizController {

    private final QuizQuestionRepository quizQuestionRepository;
    private final GameService gameService;

    public AdminQuizController(QuizQuestionRepository quizQuestionRepository, GameService gameService) {
        this.quizQuestionRepository = quizQuestionRepository;
        this.gameService = gameService;
    }

    @GetMapping
    public ResponseEntity<List<QuizQuestion>> getAllQuestions() {
        return ResponseEntity.ok(quizQuestionRepository.findAllByOrderByOrderNumAsc());
    }

    @PostMapping
    public ResponseEntity<QuizQuestion> createQuestion(@RequestBody QuizQuestion question) {
        if (question.getOrderNum() == 0) {
            long count = quizQuestionRepository.count();
            question.setOrderNum((int) count + 1);
        }
        if (question.getPoints() == 0) {
            question.setPoints(10); // Standard 10 points
        }
        return ResponseEntity.ok(quizQuestionRepository.save(question));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<QuizQuestion>> bulkCreateQuestions(@RequestBody List<QuizQuestion> questions) {
        return ResponseEntity.ok(quizQuestionRepository.saveAll(questions));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateQuestion(@PathVariable Long id, @RequestBody QuizQuestion questionData) {
        return quizQuestionRepository.findById(id).map(q -> {
            q.setQuestionText(questionData.getQuestionText());
            q.setOptionA(questionData.getOptionA());
            q.setOptionB(questionData.getOptionB());
            q.setOptionC(questionData.getOptionC());
            q.setOptionD(questionData.getOptionD());
            q.setCorrectAnswer(questionData.getCorrectAnswer());
            q.setPoints(questionData.getPoints());
            q.setOrderNum(questionData.getOrderNum());
            q.setActive(questionData.isActive());
            return ResponseEntity.ok(quizQuestionRepository.save(q));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteQuestion(@PathVariable Long id) {
        if (quizQuestionRepository.existsById(id)) {
            quizQuestionRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Question deleted"));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/all")
    @Transactional
    public ResponseEntity<?> clearAllQuestions() {
        quizQuestionRepository.deleteAll();
        return ResponseEntity.ok(Map.of("message", "All quiz questions cleared"));
    }

    @PostMapping("/seed")
    @Transactional
    public ResponseEntity<?> seedDefaultQuestions() {
        List<QuizQuestion> questions = gameService.seedDefaultPrelimQuestions();
        return ResponseEntity.ok(Map.of("message", "Seeded 30 default Stage 0 Prelims questions successfully", "count", questions.size()));
    }
}
