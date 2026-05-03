package tn.mediflow.examservice.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.mediflow.examservice.entities.Examen;

public interface ExamenRepository extends JpaRepository<Examen, Long> {
}
