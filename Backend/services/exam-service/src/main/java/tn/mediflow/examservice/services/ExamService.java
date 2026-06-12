package tn.mediflow.examservice.services;

import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import tn.mediflow.examservice.config.RabbitMQConfig;
import tn.mediflow.examservice.clients.BillingClient;
import tn.mediflow.examservice.clients.PatientClient;
import tn.mediflow.examservice.dto.BillDTO;
import tn.mediflow.examservice.dto.ExamRequestDTO;
import tn.mediflow.examservice.dto.ExamResponseDTO;
import tn.mediflow.examservice.dto.Patient;
import tn.mediflow.examservice.dto.ResultatRequestDTO;
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
    private final BillingClient billingClient; // Keep for getExamWithPatient if needed
    private final RabbitTemplate rabbitTemplate;

    public Examen createExamen(ExamRequestDTO requestDTO) {
        // Démonstration OpenFeign : Vérification via le service patient
        try {
            patientClient.getPatientById(requestDTO.getPatientId());
        } catch (Exception e) {
            System.err.println("Note: Communication Feign avec user-service échouée ou patient introuvable.");
        }
        
        Examen examen = new Examen();
        examen.setNomExamen(requestDTO.getNomExamen());
        examen.setPatientId(requestDTO.getPatientId());
        examen.setDateExamen(LocalDateTime.now());
        
        if (requestDTO.getStatus() != null) {
            examen.setStatus(requestDTO.getStatus());
        } else {
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

    public Examen updateExamen(Long id, ExamRequestDTO requestDTO) {
        Examen existing = getExamById(id);
        if (requestDTO.getNomExamen() != null) {
            existing.setNomExamen(requestDTO.getNomExamen());
        }
        if (requestDTO.getPatientId() != null) {
            existing.setPatientId(requestDTO.getPatientId());
        }
        if (requestDTO.getStatus() != null) {
            existing.setStatus(requestDTO.getStatus());
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
                
                BillDTO bill = BillDTO.builder()
                        .reference(reference)
                        .montantTotal(50.0)
                        .statut("NON_PAYE")
                        .build();
                
                rabbitTemplate.convertAndSend(RabbitMQConfig.BILLING_EXCHANGE, RabbitMQConfig.BILLING_ROUTING_KEY, bill);
                System.out.println("Message de facturation envoyé à RabbitMQ pour: " + reference);
            } catch (Exception e) {
                System.err.println("Échec de l'envoi de facturation via RabbitMQ: " + e.getMessage());
            }
        }
    }

    public Resultat addResultat(Long examenId, ResultatRequestDTO requestDTO) {
        Examen examen = getExamById(examenId);
        if (examen.getStatus() == ExamStatus.ANNULE) {
            throw new RuntimeException("Impossible d'ajouter un résultat à un examen annulé");
        }
        
        Resultat resultat = new Resultat();
        resultat.setValeur(requestDTO.getValeur());
        resultat.setUnite(requestDTO.getUnite());
        resultat.setExamen(examen);
        
        Resultat saved = resultatRepository.save(resultat);
        if (examen.getStatus() == ExamStatus.PLANIFIE) {
            examen.setStatus(ExamStatus.EN_COURS);
            examenRepository.save(examen);
        }
        return saved;
    }

    public Resultat updateResultat(Long id, ResultatRequestDTO requestDTO) {
        Resultat existing = resultatRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Résultat non trouvé"));
        if (requestDTO.getValeur() != null) {
            existing.setValeur(requestDTO.getValeur());
        }
        if (requestDTO.getUnite() != null) {
            existing.setUnite(requestDTO.getUnite());
        }
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
