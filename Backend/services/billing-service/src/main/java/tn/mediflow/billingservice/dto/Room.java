package tn.mediflow.billingservice.dto;

import lombok.Data;

@Data
public class Room {
    private Long id;
    private String type; // ⚠️ STRING pas enum (Feign simple)
}