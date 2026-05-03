package tn.mediflow.pharmacyservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.mediflow.pharmacyservice.entity.Dispensing;
import java.util.List;

public interface DispensingRepository extends JpaRepository<Dispensing, Long> {
    List<Dispensing> findByPatientId(Long patientId);
}