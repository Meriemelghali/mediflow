package tn.mediflow.examservice.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.mediflow.examservice.clients.BillingClient;
import tn.mediflow.examservice.clients.PatientClient;
import tn.mediflow.examservice.dto.BillDTO;
import tn.mediflow.examservice.dto.ExamResponseDTO;
import tn.mediflow.examservice.dto.Patient;
import tn.mediflow.examservice.entities.ExamStatus;
import tn.mediflow.examservice.entities.Examen;
import tn.mediflow.examservice.entities.Resultat;
import tn.mediflow.examservice.repositories.ExamenRepository;
import tn.mediflow.examservice.repositories.ResultatRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamService {
    private final ExamenRepository examenRepository;
    private final ResultatRepository resultatRepository;
    private final PatientClient patientClient;
    private final BillingClient billingClient;
    public Examen createExamen(Examen examen) {
        // Démonstration OpenFeign : Vérifier l'existence du patient avant de créer l'examen
        //try {
        //    patientClient.getPatientById(examen.getPatientId());
       // } catch (Exception e) {
            // Si le service patient n'est pas dispo ou patient introuvable, on log l'erreur 
            // mais on peut décider de continuer ou bloquer. Ici on bloque pour la démo.
        //    throw new RuntimeException("Communication Feign échouée ou Patient introuvable : " + e.getMessage());
       // }
        
        examen.setDateExamen(LocalDateTime.now());
        if (examen.getStatus() == null) {
            examen.setStatus(ExamStatus.PLANIFIE);
        }
        return examenRepository.save(examen);
    }

    // Nouvelle méthode pour démontrer la récupération de données jointes entre services
    public ExamResponseDTO getExamWithPatient(Long id) {
        Examen examen = getExamById(id);
        Patient patient = null;
        
        try {
            // Appel synchrone vers le microservice patient
            patient = patientClient.getPatientById(examen.getPatientId());
        } catch (Exception e) {
            // Fallback simple : si le service patient est down, on retourne l'examen sans les détails du patient
            System.err.println("Erreur lors de la récupération du patient via Feign: " + e.getMessage());
        }
        
        return ExamResponseDTO.builder()
                .examen(examen)
                .patient(patient)
                .build();
    }

    public Examen updateExamen(Long id, Examen updatedExamen) {
        Examen existing = getExamById(id);
        existing.setNomExamen(updatedExamen.getNomExamen());
        existing.setPatientId(updatedExamen.getPatientId());
        if (updatedExamen.getStatus() != null) {
            existing.setStatus(updatedExamen.getStatus());
        }
        return examenRepository.save(existing);
    }

    public void deleteExamen(Long id) {
        Examen existing = getExamById(id);
        examenRepository.delete(existing);
    }

    public Examen updateExamStatus(Long id, ExamStatus status) {
        Examen existing = getExamById(id);
        existing.setStatus(status);
        Examen saved = examenRepository.save(existing);
        
        // Démonstration OpenFeign : Si l'examen est terminé, on génère une facture
        if (status == ExamStatus.TERMINE) {
            try {
                BillDTO bill = BillDTO.builder()
                        .reference("EXAM-" + saved.getId())
                        .montantTotal(50.0)
                        .statut("NON_PAYE")
                        .build();
                
                billingClient.createBill(bill);
                System.out.println("Facture envoyée au service billing pour le patient " + saved.getPatientId());
            } catch (Exception e) {
                System.err.println("Échec de la communication avec le service Billing : " + e.getMessage());
            }
        }
        
        return saved;
    }

    public Resultat addResultat(Long examenId, Resultat resultat) {
        Examen examen = getExamById(examenId);
        
        if (examen.getStatus() == ExamStatus.ANNULE) {
            throw new RuntimeException("Impossible d'ajouter un résultat à un examen annulé");
        }
        
        resultat.setExamen(examen);
        Resultat saved = resultatRepository.save(resultat);
        
        // Mettre à jour le statut de l'examen si c'est le premier résultat
        if (examen.getStatus() == ExamStatus.PLANIFIE) {
            examen.setStatus(ExamStatus.EN_COURS);
            examenRepository.save(examen);
        }
        
        return saved;
    }

    public Resultat updateResultat(Long id, Resultat updatedResultat) {
        Resultat existing = resultatRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Résultat non trouvé"));
        existing.setValeur(updatedResultat.getValeur());
        existing.setUnite(updatedResultat.getUnite());
        return resultatRepository.save(existing);
    }

    public void deleteResultat(Long id) {
        Resultat existing = resultatRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Résultat non trouvé"));
        resultatRepository.delete(existing);
    }

    public List<Examen> getAllExams() {
        return examenRepository.findAll();
    }

    public List<Examen> getExamsByPatient(Long patientId) {
        return examenRepository.findByPatientId(patientId);
    }

    public Examen getExamById(Long id) {
        return examenRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Examen non trouvé avec l'ID : " + id));
    }
}
