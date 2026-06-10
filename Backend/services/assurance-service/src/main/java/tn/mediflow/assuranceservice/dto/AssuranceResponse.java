package tn.mediflow.assuranceservice.dto;

import java.math.BigDecimal;

public record AssuranceResponse(
        Long id,
        Long patientId,
        String typeAssurance,
        BigDecimal tauxRemboursement,
        boolean active
) {}

