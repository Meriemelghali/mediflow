package tn.mediflow.billingservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.mediflow.billingservice.entity.Facture;
import tn.mediflow.billingservice.repository.FactureRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FactureService {

    private final FactureRepository factureRepository;

    // CREATE
    public Facture ajouterFacture(Facture facture) {
        return factureRepository.save(facture);
    }

    // READ ALL
    public List<Facture> getAllFactures() {
        return factureRepository.findAll();
    }

    // READ BY ID
    public Facture getFactureById(Long id) {
        return factureRepository.findById(id).orElse(null);
    }

    // DELETE
    public void deleteFacture(Long id) {
        factureRepository.deleteById(id);
    }

    //UPDATE
    public Facture updateFacture(Long id, Facture facture) {

        Facture existingFacture = factureRepository.findById(id).orElse(null);

        if (existingFacture != null) {
            existingFacture.setReference(facture.getReference());
            existingFacture.setMontantTotal(facture.getMontantTotal());
            existingFacture.setStatut(facture.getStatut());

            return factureRepository.save(existingFacture);
        }

        return null;
    }
}