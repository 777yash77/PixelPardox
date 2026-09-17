-- ============================================================
-- Pixel Paradox: MySQL Database Schema (pixel_paradox)
-- ============================================================

CREATE DATABASE IF NOT EXISTS pixel_paradox;
USE pixel_paradox;

-- 1. Users Table (Admin & Registered Teams)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(255) NOT NULL UNIQUE,
    team_id VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    team_size INT NOT NULL DEFAULT 2,
    round_number INT DEFAULT 1,
    score INT DEFAULT 0,
    is_eliminated BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Global Game State
CREATE TABLE IF NOT EXISTS game_state (
    id BIGINT PRIMARY KEY DEFAULT 1,
    active_round INT DEFAULT 0,
    active_question_id BIGINT,
    timer_duration INT DEFAULT 0,
    question_start_time BIGINT DEFAULT 0,
    is_timer_running BOOLEAN DEFAULT FALSE,
    zoom_level INT DEFAULT 100
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Image Questions (Stages 1 - 3)
CREATE TABLE IF NOT EXISTS image_questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    image_url VARCHAR(500) NOT NULL,
    is_ai BOOLEAN NOT NULL,
    model_used VARCHAR(255),
    round_number INT NOT NULL,
    bonus_question VARCHAR(500),
    answer_details TEXT,
    glitch_coordinates VARCHAR(255),
    is_lightning BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Submissions (User answers for image rounds)
CREATE TABLE IF NOT EXISTS submissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    image_question_id BIGINT NOT NULL,
    round_number INT NOT NULL,
    chosen_answer VARCHAR(100),
    bonus_answer VARCHAR(255),
    text_submission TEXT,
    is_graded BOOLEAN DEFAULT FALSE,
    score INT DEFAULT 0,
    CONSTRAINT fk_submission_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_submission_image FOREIGN KEY (image_question_id) REFERENCES image_questions (id) ON DELETE CASCADE,
    CONSTRAINT uq_user_question UNIQUE (user_id, image_question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Stage 0 Prelims Quiz Questions (30 Questions)
CREATE TABLE IF NOT EXISTS quiz_questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    question_text VARCHAR(1000) NOT NULL,
    option_a VARCHAR(500) NOT NULL,
    option_b VARCHAR(500) NOT NULL,
    option_c VARCHAR(500) NOT NULL,
    option_d VARCHAR(500) NOT NULL,
    correct_answer VARCHAR(500) NOT NULL,
    points INT DEFAULT 10,
    order_num INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Quiz Attempts (Individual participant results for Stage 0)
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    team_id BIGINT NOT NULL,
    participant_name VARCHAR(255) NOT NULL,
    started_at BIGINT,
    completed_at BIGINT,
    score INT DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED',
    CONSTRAINT fk_attempt_team FOREIGN KEY (team_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Webcam Recordings (Silent invigilation video logs)
CREATE TABLE IF NOT EXISTS webcam_recordings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    team_id VARCHAR(255),
    participant_name VARCHAR(255),
    video_url VARCHAR(500),
    recorded_at BIGINT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
