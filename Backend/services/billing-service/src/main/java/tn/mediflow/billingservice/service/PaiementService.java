package tn.mediflow.billingservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.mediflow.billingservice.entity.Paiement;
import tn.mediflow.billingservice.repository.PaiementRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PaiementService {

    private final PaiementRepository paiementRepository;

    public Paiement ajouterPaiement(Paiement paiement) {
        return paiementRepository.save(paiement);
    }

    public List<Paiement> getAllPaiements() {
        return paiementRepository.findAll();
    }

    public Paiement getPaiementById(Long id) {
        return paiementRepository.findById(id).orElse(null);
    }

    public void deletePaiement(Long id) {
        paiementRepository.deleteById(id);
    }
}