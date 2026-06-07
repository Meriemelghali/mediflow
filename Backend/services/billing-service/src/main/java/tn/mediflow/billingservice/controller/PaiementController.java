package tn.mediflow.billingservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.mediflow.billingservice.entity.Paiement;
import tn.mediflow.billingservice.service.PaiementService;

import java.util.List;

@RestController
@RequestMapping("/api/paiements")
@RequiredArgsConstructor
public class PaiementController {

    private final PaiementService paiementService;

    @PostMapping
    public Paiement ajouterPaiement(@RequestBody Paiement paiement) {
        return paiementService.ajouterPaiement(paiement);
    }

    @GetMapping
    public List<Paiement> getAllPaiements() {
        return paiementService.getAllPaiements();
    }

    @GetMapping("/{id}")
    public Paiement getPaiementById(@PathVariable Long id) {
        return paiementService.getPaiementById(id);
    }

    @DeleteMapping("/{id}")
    public void deletePaiement(@PathVariable Long id) {
        paiementService.deletePaiement(id);
    }
}