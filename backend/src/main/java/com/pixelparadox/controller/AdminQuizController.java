package com.pixelparadox.controller;

import com.pixelparadox.model.QuizQuestion;
import com.pixelparadox.repository.QuizQuestionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/quiz")
@CrossOrigin(origins = "*")
public class AdminQuizController {

    private final QuizQuestionRepository quizQuestionRepository;

    public AdminQuizController(QuizQuestionRepository quizQuestionRepository) {
        this.quizQuestionRepository = quizQuestionRepository;
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
        if (quizQuestionRepository.count() > 0) {
            quizQuestionRepository.deleteAll();
        }

        List<QuizQuestion> questions = createDefault30Questions();
        quizQuestionRepository.saveAll(questions);
        return ResponseEntity.ok(Map.of("message", "Seeded 30 default Stage 0 Prelims questions successfully", "count", questions.size()));
    }

    private List<QuizQuestion> createDefault30Questions() {
        List<QuizQuestion> list = new ArrayList<>();

        list.add(q(1, "Which generative architecture is based on gradually reversing a forward noise process to synthesize images?",
                "Generative Adversarial Networks (GANs)", "Denoising Diffusion Probabilistic Models (DDPM)", "Variational Autoencoders (VAEs)", "Autoregressive Transformers",
                "Denoising Diffusion Probabilistic Models (DDPM)"));

        list.add(q(2, "What is the primary visual indicator of synthetic generation frequently found in early AI images of human hands?",
                "Pixelation around edges", "Non-anatomical finger counts and fused joints", "Uniform skin tone without pores", "Inverted drop shadows",
                "Non-anatomical finger counts and fused joints"));

        list.add(q(3, "In text-to-image diffusion models, which component converts user text prompts into latent embeddings?",
                "U-Net Denoising Backbone", "Text Encoder (e.g. CLIP / T5)", "Variational Decoder", "Perlin Noise Generator",
                "Text Encoder (e.g. CLIP / T5)"));

        list.add(q(4, "What term describes the phenomenon where an AI generates convincing but completely fabricated or logically impossible details?",
                "Quantization", "Hallucination", "Overfitting", "Gradient Vanishing",
                "Hallucination"));

        list.add(q(5, "Which of the following is an effective technique used in prompt engineering to steer models away from generating specific unwanted artifacts?",
                "Prompt Inversion", "Negative Prompting", "Epoch Pruning", "Temperature Decoupling",
                "Negative Prompting"));

        list.add(q(6, "In Generative Adversarial Networks (GANs), what are the two competing neural networks called?",
                "Encoder and Decoder", "Generator and Discriminator", "Predictor and Classifier", "Actor and Critic",
                "Generator and Discriminator"));

        list.add(q(7, "What artifact is most commonly seen in AI-generated background signage and text inside synthetic images?",
                "Inverted cursive fonts", "Pseudo-lettering and illegible gibberish glyphs", "Strict monospace alignment", "Extreme chromatic fringing",
                "Pseudo-lettering and illegible gibberish glyphs"));

        list.add(q(8, "What does CFG stand for in diffusion model sampling parameters?",
                "Continuous Function Gradient", "Classifier-Free Guidance", "Convolutional Feature Generator", "Custom Filter Grid",
                "Classifier-Free Guidance"));

        list.add(q(9, "Which physical inconsistency is a primary hallmark for detecting deepfake composite faces in forensics?",
                "Identical skin tones across different lighting", "Mismatched corneal specular reflections across both eyes", "Symmetrical lens flare", "Uniform ambient occlusion",
                "Mismatched corneal specular reflections across both eyes"));

        list.add(q(10, "Which AI model family introduced Latent Consistency Models (LCM) for ultra-fast few-step image generation?",
                "DALL-E", "Latent Diffusion / Stable Diffusion", "StyleGAN", "Midjourney",
                "Latent Diffusion / Stable Diffusion"));

        list.add(q(11, "What neural network extension allows users to add spatial conditioning (e.g. openpose, canny edges, depth maps) to text-to-image models?",
                "LoRA", "ControlNet", "DreamBooth", "Textual Inversion",
                "ControlNet"));

        list.add(q(12, "What visual inconsistency is typically observed in AI deepfake pupils under forensic examination?",
                "Deepfake pupils are always diamond-shaped", "Deepfake pupils often exhibit irregular or non-circular boundaries", "Human pupils reflect zero ambient light", "Deepfake pupils have inverted color gradients",
                "Deepfake pupils often exhibit irregular or non-circular boundaries"));

        list.add(q(13, "What lightweight fine-tuning method freezes base weights and injects trainable low-rank decomposition matrices?",
                "Post-training Quantization", "LoRA (Low-Rank Adaptation)", "Hypernetwork Splitting", "Model Distillation",
                "LoRA (Low-Rank Adaptation)"));

        list.add(q(14, "In digital forensics, what frequency analysis technique exposes grid-like spectral peaks left by GAN upsampling layers?",
                "Hexadecimal Dithering", "2D Fourier Transform (FFT) Power Spectrum Analysis", "Linear Least Squares", "Bloom Filter Parsing",
                "2D Fourier Transform (FFT) Power Spectrum Analysis"));

        list.add(q(15, "Which AI generation model developed by Black Forest Labs gained wide acclaim in 2024 for exceptional photorealism and typographic accuracy?",
                "Sora", "FLUX.1", "Midjourney v1", "Craiyon",
                "FLUX.1"));

        list.add(q(16, "What prompt engineering pattern provides a small set of input-output demonstrations before asking the model to execute a task?",
                "Zero-shot prompting", "Few-shot prompting", "Chain-of-Thought without examples", "Prompt Injection",
                "Few-shot prompting"));

        list.add(q(17, "What perspective artifact is frequently found in synthetic images of complex architecture?",
                "Completely uniform texture repetitions", "Multiple non-converging vanishing points and non-parallel structural mullions", "Extreme color posterization", "Perfect mathematical right angles throughout",
                "Multiple non-converging vanishing points and non-parallel structural mullions"));

        list.add(q(18, "Which quantitative metric is standard for measuring synthetic image visual quality and distribution similarity to real images?",
                "BLEU Score", "Fréchet Inception Distance (FID)", "Word Error Rate (WER)", "ROUGE-L Score",
                "Fréchet Inception Distance (FID)"));

        list.add(q(19, "Which industry standard provenance initiative embeds cryptographically signed metadata into media to authenticate authenticity?",
                "HTTPS Certificate", "C2PA (Coalition for Content Provenance and Authenticity)", "EXIF 1.0 Legacy Standard", "WebM Consortium",
                "C2PA (Coalition for Content Provenance and Authenticity)"));

        list.add(q(20, "In visual prompt crafting, how does increasing Classifier-Free Guidance (CFG) typically affect generation output?",
                "Increases creativity while ignoring prompt keywords", "Forces stricter adherence to prompt at the cost of potential over-saturation / contrast artifacts", "Reduces generation resolution", "Decreases the number of sampling steps",
                "Forces stricter adherence to prompt at the cost of potential over-saturation / contrast artifacts"));

        list.add(q(21, "Which loss function is commonly used in neural style transfer and perceptual image generation to compare high-level deep features?",
                "Mean Squared Pixel Error (MSE)", "VGG Perceptual Loss (Content/Style Loss)", "Hinge Loss", "Cross-Entropy Loss",
                "VGG Perceptual Loss (Content/Style Loss)"));

        list.add(q(22, "What biological marker was famously absent or irregular in early deepfake video portraits?",
                "Hair color variation", "Spontaneous, natural eye blinking rate and pulse blood flow signals", "Teeth alignment", "Skin pore visibility",
                "Spontaneous, natural eye blinking rate and pulse blood flow signals"));

        list.add(q(23, "In modern vision-language models, what attention mechanism aligns visual patch tokens with text tokens?",
                "Self-Attention only", "Cross-Attention", "Sparse Flash Attention without projections", "Convolutional Max-Pooling",
                "Cross-Attention"));

        list.add(q(24, "What type of subtle cyber attack injects humanly imperceptible pixel noise to force deep learning models into misclassifications?",
                "DDoS Flooding", "Adversarial Perturbation Attack (e.g. FGSM)", "SQL Injection", "Buffer Overflow",
                "Adversarial Perturbation Attack (e.g. FGSM)"));

        list.add(q(25, "What is the primary technical barrier that distinguishes generative video models (like Sora/Gen-3) from single-frame image models?",
                "Pixel color depth", "Temporal consistency and persistent object physics across frames", "File format encoding", "Higher sound fidelity",
                "Temporal consistency and persistent object physics across frames"));

        list.add(q(26, "Which mathematical paradigm forms the core trajectory formulation in next-generation Flow Matching generative models like FLUX.1?",
                "Markov Decision Process", "Ordinary Differential Equations (ODEs) connecting noise to data", "Naive Bayes Classifiers", "Support Vector Machines",
                "Ordinary Differential Equations (ODEs) connecting noise to data"));

        list.add(q(27, "Which subtle facial feature is notoriously prone to asymmetrical or morphing artifacts in synthetic human portraits?",
                "Cheekbone contour", "Ear lobes, ear cartilage, and dangling earrings", "Nose bridge straightness", "Forehead height",
                "Ear lobes, ear cartilage, and dangling earrings"));

        list.add(q(28, "In generative model decoders, what does adjusting the 'Temperature' parameter directly control?",
                "Image saturation level", "Randomness and diversity versus deterministic selection in sampling", "The GPU clock frequency", "The resolution upscaling ratio",
                "Randomness and diversity versus deterministic selection in sampling"));

        list.add(q(29, "What digital forensics technique highlights compression discontinuities and local manipulation across 8x8 DCT pixel blocks in JPEG images?",
                "Discrete Wavelet Filtering", "Error Level Analysis (ELA)", "Sobel Edge Detection only", "Histogram Equalization",
                "Error Level Analysis (ELA)"));

        list.add(q(30, "What Google DeepMind technology embeds an invisible cryptographic digital watermark directly into generative AI image pixels without altering quality?",
                "SafeSearch", "SynthID", "DeepWatermark v1", "TensorFlow Shield",
                "SynthID"));

        return list;
    }

    private QuizQuestion q(int order, String text, String a, String b, String c, String d, String correct) {
        QuizQuestion question = new QuizQuestion();
        question.setOrderNum(order);
        question.setQuestionText(text);
        question.setOptionA(a);
        question.setOptionB(b);
        question.setOptionC(c);
        question.setOptionD(d);
        question.setCorrectAnswer(correct);
        question.setPoints(10); // 10 points per question
        question.setActive(true);
        return question;
    }
}
