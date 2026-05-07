package tn.mediflow.examservice.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;
import tn.mediflow.examservice.dto.ExamResponseDTO;
import tn.mediflow.examservice.entities.ExamStatus;
import tn.mediflow.examservice.entities.Examen;
import tn.mediflow.examservice.entities.Resultat;
import tn.mediflow.examservice.services.ExamService;

import java.util.List;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {
    private final ExamService examService;

    @PostMapping
    public Examen createExamen(@RequestBody Examen examen) {
        return examService.createExamen(examen);
    }

    @GetMapping("/{id}/full")
    public ExamResponseDTO getFullExamDetails(@PathVariable Long id) {
        return examService.getExamWithPatient(id);
    }

    @PutMapping("/{id}")
    public Examen updateExamen(@PathVariable Long id, @RequestBody Examen examen) {
        return examService.updateExamen(id, examen);
    }

    @DeleteMapping("/{id}")
    public void deleteExamen(@PathVariable Long id) {
        examService.deleteExamen(id);
    }

    @PatchMapping("/{id}/status")
    public Examen updateStatus(@PathVariable Long id, @RequestParam ExamStatus status) {
        return examService.updateExamStatus(id, status);
    }

    @PostMapping("/{examenId}/results")
    public Resultat addResultat(@PathVariable Long examenId, @RequestBody Resultat resultat) {
        return examService.addResultat(examenId, resultat);
    }

    @PutMapping("/results/{id}")
    public Resultat updateResultat(@PathVariable Long id, @RequestBody Resultat resultat) {
        return examService.updateResultat(id, resultat);
    }

    @DeleteMapping("/results/{id}")
    public void deleteResultat(@PathVariable Long id) {
        examService.deleteResultat(id);
    }

    @GetMapping
    public List<Examen> getAllExams() {
        return examService.getAllExams();
    }

    @GetMapping("/search")
    public Page<Examen> searchExams(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ExamStatus status,
            @RequestParam(required = false) Long patientId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        
        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return examService.searchExams(keyword, status, patientId, PageRequest.of(page, size, sort));
    }

    @GetMapping("/patient/{patientId}")
    public List<Examen> getExamsByPatient(@PathVariable Long patientId) {
        return examService.getExamsByPatient(patientId);
    }

    @GetMapping("/{id}")
    public Examen getExamById(@PathVariable Long id) {
        return examService.getExamById(id);
    }
}
