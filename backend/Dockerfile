# ==========================================
# Stage 1: Build the Spring Boot application
# ==========================================
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and package application
COPY src ./src
RUN mvn clean package -DskipTests -B

# ==========================================
# Stage 2: Lightweight Production Runtime
# ==========================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create directory for file and video uploads
RUN mkdir -p uploads/videos && chmod -R 777 uploads

# Copy packaged jar from builder stage
COPY --from=builder /app/target/pixel-paradox-*.jar app.jar

# Render assigns port dynamically via $PORT (defaults to 8080)
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Djava.security.egd=file:/dev/./urandom -Dserver.port=${PORT:-8080} -jar app.jar"]
