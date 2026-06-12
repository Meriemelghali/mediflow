package tn.mediflow.examservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.mediflow.examservice.entities.ExamStatus;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ExamRequestDTO {
    private String nomExamen;
    private Long patientId;
    private ExamStatus status;
}
