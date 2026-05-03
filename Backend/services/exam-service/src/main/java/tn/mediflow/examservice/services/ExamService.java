package tn.mediflow.examservice.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.mediflow.examservice.clients.PatientClient;
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

    public Examen createExamen(Examen examen) {
        // Vérifier l'existence du patient via OpenFeign (Désactivé car le service patient n'existe pas encore)
        /*
        try {
            patientClient.getPatientById(examen.getPatientId());
        } catch (Exception e) {
            throw new RuntimeException("Patient non trouvé avec l'ID : " + examen.getPatientId());
        }
        */
        
        examen.setDateExamen(LocalDateTime.now());
        return examenRepository.save(examen);
    }

    public Resultat addResultat(Long examenId, Resultat resultat) {
        Examen examen = examenRepository.findById(examenId)
                .orElseThrow(() -> new RuntimeException("Examen non trouvé"));
        resultat.setExamen(examen);
        return resultatRepository.save(resultat);
    }

    public List<Examen> getAllExams() {
        return examenRepository.findAll();
    }

    public Examen getExamById(Long id) {
        return examenRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Examen non trouvé"));
    }
}
