package tn.mediflow.pharmacyservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.mediflow.pharmacyservice.entity.PharmacyPatientRecord;

import java.util.Optional;

@Repository
public interface PharmacyPatientRecordRepository extends JpaRepository<PharmacyPatientRecord, Long> {
    Optional<PharmacyPatientRecord> findByPatientCode(Long patientCode);
    boolean existsByPatientCode(Long patientCode);
}
