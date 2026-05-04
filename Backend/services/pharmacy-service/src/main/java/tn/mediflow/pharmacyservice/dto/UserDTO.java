package tn.mediflow.pharmacyservice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

/**
 * DTO représentant un utilisateur tel que retourné par user-service (Node.js + MongoDB).
 * @JsonIgnoreProperties(ignoreUnknown = true) permet d'ignorer les champs MongoDB
 * dont on n'a pas besoin (_id, __v, createdAt, etc.)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserDTO {
    private Long patientCode;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private String phone;
}