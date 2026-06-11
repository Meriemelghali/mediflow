package tn.mediflow.assuranceservice.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import tn.mediflow.assuranceservice.entity.Assurance;

public interface AssuranceRepository extends JpaRepository<Assurance, Long> {
    List<Assurance> findByPatientId(Long patientId);
}
