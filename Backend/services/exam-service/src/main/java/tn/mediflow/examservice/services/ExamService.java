package tn.mediflow.examservice.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
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
        // Démonstration OpenFeign : Vérification via le service patient
        try {
            patientClient.getPatientById(examen.getPatientId());
        } catch (Exception e) {
            System.err.println("Note: Communication Feign avec user-service échouée ou patient introuvable.");
        }
        
        examen.setDateExamen(LocalDateTime.now());
        if (examen.getStatus() == null) {
            examen.setStatus(ExamStatus.PLANIFIE);
        }
        Examen saved = examenRepository.save(examen);
        triggerBilling(saved);
        return saved;
    }

    public ExamResponseDTO getExamWithPatient(Long id) {
        Examen examen = getExamById(id);
        Patient patient = null;
        List<BillDTO> bills = null;
        
        try {
            patient = patientClient.getPatientById(examen.getPatientId());
        } catch (Exception e) {
            System.err.println("Erreur Feign Patient: " + e.getMessage());
        }

        try {
            List<BillDTO> allBills = billingClient.getAllBills();
            if (allBills != null) {
                String reference = "EXAM-" + examen.getId();
                bills = allBills.stream()
                        .filter(b -> reference.equals(b.getReference()))
                        .toList();
            }
        } catch (Exception e) {
            System.err.println("Erreur Feign Billing: " + e.getMessage());
        }

        return ExamResponseDTO.builder()
                .examen(examen)
                .patient(patient)
                .bills(bills)
                .build();
    }

    public Examen updateExamen(Long id, Examen updatedExamen) {
        Examen existing = getExamById(id);
        existing.setNomExamen(updatedExamen.getNomExamen());
        existing.setPatientId(updatedExamen.getPatientId());
        if (updatedExamen.getStatus() != null) {
            existing.setStatus(updatedExamen.getStatus());
        }
        Examen saved = examenRepository.save(existing);
        triggerBilling(saved);
        return saved;
    }

    public void deleteExamen(Long id) {
        Examen existing = getExamById(id);
        examenRepository.delete(existing);
    }

    public Examen updateExamStatus(Long id, ExamStatus status) {
        Examen existing = getExamById(id);
        existing.setStatus(status);
        Examen saved = examenRepository.save(existing);
        triggerBilling(saved);
        return saved;
    }

    private void triggerBilling(Examen examen) {
        if (examen.getStatus() == ExamStatus.TERMINE) {
            try {
                String reference = "EXAM-" + examen.getId();
                
                // Éviter les doublons : vérifier si une facture existe déjà
                boolean alreadyBilled = false;
                try {
                    List<BillDTO> allBills = billingClient.getAllBills();
                    if (allBills != null) {
                        alreadyBilled = allBills.stream()
                                .anyMatch(b -> reference.equals(b.getReference()));
                    }
                } catch (Exception e) {
                    System.err.println("Erreur vérification doublons billing: " + e.getMessage());
                }

                if (!alreadyBilled) {
                    BillDTO bill = BillDTO.builder()
                            .reference(reference)
                            .montantTotal(50.0)
                            .statut("NON_PAYE")
                            .build();
                    billingClient.createBill(bill);
                }
            } catch (Exception e) {
                System.err.println("Échec de la facturation via Feign: " + e.getMessage());
            }
        }
    }

    public Resultat addResultat(Long examenId, Resultat resultat) {
        Examen examen = getExamById(examenId);
        if (examen.getStatus() == ExamStatus.ANNULE) {
            throw new RuntimeException("Impossible d'ajouter un résultat à un examen annulé");
        }
        resultat.setExamen(examen);
        Resultat saved = resultatRepository.save(resultat);
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

    public Page<Examen> searchExams(String keyword, ExamStatus status, Long patientId, Pageable pageable) {
        Specification<Examen> spec = Specification.where(null);
        if (keyword != null && !keyword.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("nomExamen")), "%" + keyword.toLowerCase() + "%"));
        }
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (patientId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("patientId"), patientId));
        }
        return examenRepository.findAll(spec, pageable);
    }

    public Examen getExamById(Long id) {
        return examenRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Examen non trouvé avec l'ID : " + id));
    }
}
