package tn.mediflow.pharmacyservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.mediflow.pharmacyservice.entity.Medication;
import java.util.List;

public interface MedicationRepository extends JpaRepository<Medication, Long> {
    List<Medication> findByCategory(String category);
    List<Medication> findByCurrentStockLessThan(Integer threshold);
}