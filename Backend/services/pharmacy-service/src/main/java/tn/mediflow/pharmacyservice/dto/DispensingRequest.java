package tn.mediflow.pharmacyservice.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispensingRequest {

    @NotNull
    private Long medicationId;

    @NotNull
    private Long patientId;

    @NotNull
    @Min(1)
    private Integer quantity;
}