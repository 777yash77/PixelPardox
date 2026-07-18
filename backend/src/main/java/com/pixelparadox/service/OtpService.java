package com.pixelparadox.service;

import com.pixelparadox.model.User;
import com.pixelparadox.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class OtpService {

    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@pixelparadox.com}")
    private String mailSenderUsername;

    public OtpService(UserRepository userRepository, JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.mailSender = mailSender;
    }

    public void generateAndSendOtp(User user) {
        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(1000000));

        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        System.out.println("=================================================");
        System.out.println("       PIXEL PARADOX - OTP GENERATION LOG        ");
        System.out.println("Team    : " + user.getTeamName());
        System.out.println("Leader  : " + user.getLeaderName());
        System.out.println("Email   : " + user.getLeaderEmail());
        System.out.println("OTP Code: [HIDDEN - check email]");
        System.out.println("=================================================");

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailSenderUsername);
            message.setTo(user.getLeaderEmail());
            message.setSubject("[Pixel Paradox] Email Verification - OTP Code");
            message.setText(
                "Hello " + user.getLeaderName() + " (Team: " + user.getTeamName() + "),\n\n" +
                "Thank you for registering for Pixel Paradox: AI or Reality?\n\n" +
                "Your one-time verification code is:\n\n" +
                "  " + otp + "\n\n" +
                "This code is valid for 10 minutes.\n\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "Good luck!\n" +
                "— Pixel Paradox Event Coordinators"
            );
            mailSender.send(message);
            System.out.println(">>> OTP email sent successfully to " + user.getLeaderEmail());
        } catch (Exception e) {
            System.err.println(">>> SMTP email failed: " + e.getMessage());
            System.err.println(">>> IMPORTANT: Check application.properties SMTP settings (Gmail App Password required).");
        }
    }

    public boolean verifyOtp(User user, String inputOtp) {
        if (user.getOtp() == null || user.getOtpExpiry() == null) {
            return false;
        }
        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            return false;
        }
        if (user.getOtp().equals(inputOtp)) {
            user.setVerified(true);
            user.setOtp(null);
            user.setOtpExpiry(null);
            userRepository.save(user);
            return true;
        }
        return false;
    }
}
