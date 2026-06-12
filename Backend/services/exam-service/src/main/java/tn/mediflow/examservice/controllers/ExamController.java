package tn.mediflow.examservice.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.mediflow.examservice.dto.ExamRequestDTO;
import tn.mediflow.examservice.dto.ExamResponseDTO;
import tn.mediflow.examservice.dto.ResultatRequestDTO;
import tn.mediflow.examservice.entities.ExamStatus;
import tn.mediflow.examservice.entities.Examen;
import tn.mediflow.examservice.entities.Resultat;
import tn.mediflow.examservice.services.ExamService;

import java.util.List;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
@Tag(name = "Examens", description = "Gestion des examens médicaux")
public class ExamController {
    private final ExamService examService;

    @PostMapping
    @Operation(summary = "Créer un examen", description = "Crée un nouvel examen médical. Le statut par défaut est PLANIFIE.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Examen créé avec succès"),
        @ApiResponse(responseCode = "400", description = "Données invalides"),
        @ApiResponse(responseCode = "401", description = "Non authentifié")
    })
    public ResponseEntity<Examen> createExamen(@RequestBody ExamRequestDTO examRequestDTO) {
        Examen created = examService.createExamen(examRequestDTO);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/{id}/full")
    @Operation(summary = "Détails complets d'un examen", description = "Retourne l'examen avec les informations patient et factures associées.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Détails retournés"),
        @ApiResponse(responseCode = "404", description = "Examen non trouvé")
    })
    public ResponseEntity<ExamResponseDTO> getFullExamDetails(@PathVariable Long id) {
        return ResponseEntity.ok(examService.getExamWithPatient(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier un examen", description = "Met à jour les informations d'un examen existant. Les champs null sont ignorés.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Examen mis à jour"),
        @ApiResponse(responseCode = "404", description = "Examen non trouvé")
    })
    public ResponseEntity<Examen> updateExamen(@PathVariable Long id, @RequestBody ExamRequestDTO examRequestDTO) {
        return ResponseEntity.ok(examService.updateExamen(id, examRequestDTO));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un examen")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Examen supprimé"),
        @ApiResponse(responseCode = "404", description = "Examen non trouvé")
    })
    public ResponseEntity<Void> deleteExamen(@PathVariable Long id) {
        examService.deleteExamen(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Changer le statut d'un examen",
               description = "Statuts : PLANIFIE, EN_COURS, TERMINE, ANNULE. Le passage à TERMINE déclenche une facture via RabbitMQ.")
    public ResponseEntity<Examen> updateStatus(@PathVariable Long id, @RequestParam ExamStatus status) {
        return ResponseEntity.ok(examService.updateExamStatus(id, status));
    }

    @PostMapping("/{examenId}/results")
    @Operation(summary = "Ajouter un résultat à un examen")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Résultat ajouté"),
        @ApiResponse(responseCode = "400", description = "Examen annulé — ajout impossible"),
        @ApiResponse(responseCode = "404", description = "Examen non trouvé")
    })
    public ResponseEntity<Resultat> addResultat(@PathVariable Long examenId, @RequestBody ResultatRequestDTO resultatRequestDTO) {
        Resultat created = examService.addResultat(examenId, resultatRequestDTO);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/results/{id}")
    @Operation(summary = "Modifier un résultat")
    public ResponseEntity<Resultat> updateResultat(@PathVariable Long id, @RequestBody ResultatRequestDTO resultatRequestDTO) {
        return ResponseEntity.ok(examService.updateResultat(id, resultatRequestDTO));
    }

    @DeleteMapping("/results/{id}")
    @Operation(summary = "Supprimer un résultat")
    public ResponseEntity<Void> deleteResultat(@PathVariable Long id) {
        examService.deleteResultat(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @Operation(summary = "Lister tous les examens")
    public ResponseEntity<List<Examen>> getAllExams() {
        return ResponseEntity.ok(examService.getAllExams());
    }

    @GetMapping("/search")
    @Operation(summary = "Rechercher des examens", description = "Recherche paginée avec filtres : mot-clé, statut, patientId.")
    public ResponseEntity<Page<Examen>> searchExams(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ExamStatus status,
            @RequestParam(required = false) Long patientId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return ResponseEntity.ok(examService.searchExams(keyword, status, patientId, PageRequest.of(page, size, sort)));
    }

    @GetMapping("/patient/{patientId}")
    @Operation(summary = "Examens par patient")
    public ResponseEntity<List<Examen>> getExamsByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(examService.getExamsByPatient(patientId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir un examen par ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Examen trouvé"),
        @ApiResponse(responseCode = "404", description = "Examen non trouvé")
    })
    public ResponseEntity<Examen> getExamById(@PathVariable Long id) {
        return ResponseEntity.ok(examService.getExamById(id));
    }
}
