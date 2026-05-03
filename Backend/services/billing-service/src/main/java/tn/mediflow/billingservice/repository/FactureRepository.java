package tn.mediflow.billingservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.mediflow.billingservice.entity.Facture;

public interface FactureRepository extends JpaRepository<Facture, Long> {
}