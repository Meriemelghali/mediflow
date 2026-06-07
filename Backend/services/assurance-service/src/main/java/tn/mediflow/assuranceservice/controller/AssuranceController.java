package tn.mediflow.assuranceservice.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import tn.mediflow.assuranceservice.dto.AssuranceCreateRequest;
import tn.mediflow.assuranceservice.dto.AssuranceResponse;
import tn.mediflow.assuranceservice.dto.AssuranceUpdateRequest;
import tn.mediflow.assuranceservice.service.AssuranceService;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
@RequestMapping({"/api/assurance", "/assurance"})
@Validated
public class AssuranceController {

    private final AssuranceService assuranceService;

    public AssuranceController(AssuranceService assuranceService) {
        this.assuranceService = assuranceService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AssuranceResponse create(@Valid @RequestBody AssuranceCreateRequest request) {
        return assuranceService.create(request);
    }

    @GetMapping("/{id}")
    public AssuranceResponse getById(@PathVariable("id") Long id) {
        return assuranceService.getById(id);
    }

    @GetMapping
    public List<AssuranceResponse> getByPatientId(@RequestParam("patientId") Long patientId) {
        return assuranceService.getByPatientId(patientId);
    }

    @PatchMapping("/{id}/active")
    public AssuranceResponse setActive(
            @PathVariable("id") Long id,
            @RequestParam("value") @NotNull Boolean value
    ) {
        return assuranceService.setActive(id, value);
    }

    @PutMapping("/{id}")
    public AssuranceResponse update(@PathVariable("id") Long id, @Valid @RequestBody AssuranceUpdateRequest request) {
        return assuranceService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") Long id) {
        assuranceService.delete(id);
    }
}
