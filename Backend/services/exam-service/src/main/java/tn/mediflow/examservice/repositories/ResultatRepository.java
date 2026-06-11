package tn.mediflow.examservice.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.mediflow.examservice.entities.Resultat;

public interface ResultatRepository extends JpaRepository<Resultat, Long> {
}
