package tn.mediflow.examservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.mediflow.examservice.entities.Examen;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ExamResponseDTO {
    private Examen examen;
    private Patient patient;
    private List<BillDTO> bills;
}
