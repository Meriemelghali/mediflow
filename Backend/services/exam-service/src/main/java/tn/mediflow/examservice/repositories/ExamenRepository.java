package tn.mediflow.examservice.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.mediflow.examservice.entities.ExamStatus;
import tn.mediflow.examservice.entities.Examen;

import java.util.List;

public interface ExamenRepository extends JpaRepository<Examen, Long> {
    List<Examen> findByPatientId(Long patientId);
    List<Examen> findByStatus(ExamStatus status);
}
