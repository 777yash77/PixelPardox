package com.pixelparadox.config;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class GameWebSocketHandler extends TextWebSocketHandler {

    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        System.out.println("WebSocket connection established: " + session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        System.out.println("WebSocket connection closed: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        String payload = message.getPayload();
        if (payload.contains("\"type\":\"REGISTER_ADMIN\"")) {
            session.getAttributes().put("isAdmin", true);
            System.out.println("WebSocket session registered as ADMIN: " + session.getId());
        } else if (payload.contains("\"type\":\"CAMERA_FRAME\"")) {
            // Relay camera frames only to admin sessions
            broadcast(payload);
        }
    }

    public void broadcast(String message) {
        boolean isCamera = message.contains("\"type\":\"CAMERA_FRAME\"");
        if (!isCamera) {
            String logMsg = message.length() > 200 ? message.substring(0, 200) + "... [truncated]" : message;
            System.out.println("Broadcasting WebSocket message: " + logMsg);
        }
        TextMessage textMessage = new TextMessage(message);
        for (WebSocketSession session : sessions) {
            if (!session.isOpen()) continue;
            
            // Camera frames are confidential for invigilators, never send to fellow contestants
            if (isCamera && !Boolean.TRUE.equals(session.getAttributes().get("isAdmin"))) {
                continue;
            }

            // Thread-safe delivery prevents Tomcat IllegalStateException: TEXT_FULL_WRITING
            synchronized (session) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(textMessage);
                    } catch (IOException e) {
                        System.err.println("Failed to send WebSocket message to session " + session.getId() + ": " + e.getMessage());
                    }
                }
            }
        }
    }
}

