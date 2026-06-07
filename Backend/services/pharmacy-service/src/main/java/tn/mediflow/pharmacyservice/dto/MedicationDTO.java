package tn.mediflow.pharmacyservice.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicationDTO {
    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    private String description;

    @NotBlank(message = "Category is required")
    private String category;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal unitPrice;

    @NotNull
    @Min(0)
    private Integer currentStock;

    private String manufacturer;
    private LocalDate expirationDate;
}