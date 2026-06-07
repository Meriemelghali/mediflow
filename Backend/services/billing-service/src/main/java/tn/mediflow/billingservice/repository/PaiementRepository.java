package tn.mediflow.billingservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.mediflow.billingservice.entity.Paiement;

public interface PaiementRepository extends JpaRepository<Paiement, Long> {
}