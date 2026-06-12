FROM maven:3.8.8-eclipse-temurin-17 AS builder
WORKDIR /app

# Copy only what is needed to build to leverage Docker cache
COPY pom.xml mvnw .
COPY .mvn .mvn
COPY src src

RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY --from=builder /app/target/*jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
