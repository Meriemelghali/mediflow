package tn.mediflow.examservice.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
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

    @PostMapping("/{examenId}/results")
    public Resultat addResultat(@PathVariable Long examenId, @RequestBody Resultat resultat) {
        return examService.addResultat(examenId, resultat);
    }

    @GetMapping
    public List<Examen> getAllExams() {
        return examService.getAllExams();
    }

    @GetMapping("/{id}")
    public Examen getExamById(@PathVariable Long id) {
        return examService.getExamById(id);
    }
}
