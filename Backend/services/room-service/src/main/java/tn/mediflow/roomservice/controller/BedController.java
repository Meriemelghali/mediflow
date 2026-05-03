package tn.mediflow.roomservice.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;
import java.util.Map;

import tn.mediflow.roomservice.entity.Bed;
import tn.mediflow.roomservice.feign.BedAssignmentResponse;
import tn.mediflow.roomservice.service.BedService;

@RestController
@RequestMapping("/api/rooms")
public class BedController {

    @Autowired
    private BedService bedService;

    // POST /api/rooms/{roomId}/beds
    @PostMapping("/{roomId}/beds")
    public Bed addBed(@PathVariable Long roomId, @RequestBody Bed bed) {
        return bedService.addBed(roomId, bed);
    }

    // GET /api/rooms/beds
    @GetMapping("/beds")
    public List<Bed> getAllBeds() {
        return bedService.getAllBeds();
    }

    // GET /api/rooms/beds/available
    @GetMapping("/beds/available")
    public List<Bed> getAvailableBeds() {
        return bedService.getAvailableBeds();
    }

    // GET /api/rooms/{roomId}/beds
    @GetMapping("/{roomId}/beds")
    public List<Bed> getBedsByRoom(@PathVariable Long roomId) {
        return bedService.getBedsByRoom(roomId);
    }

    // PUT /api/rooms/beds/{id}/assign  — réserver sans patient connu
    @PutMapping("/beds/{id}/assign")
    public Bed assignBed(@PathVariable Long id) {
        return bedService.assignBed(id);
    }

  
    @PutMapping("/beds/{id}/admit")
    public BedAssignmentResponse admitPatient(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Long patientId = Long.valueOf(body.get("patientId").toString());
        String patientName = body.get("patientName").toString();
        return bedService.assignPatientWithPharmacyCheck(id, patientId, patientName);
    }

    // PUT /api/rooms/beds/{id}/release
    @PutMapping("/beds/{id}/release")
    public Bed releaseBed(@PathVariable Long id) {
        return bedService.releaseBed(id);
    }
}
