package tn.mediflow.roomservice.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;

import tn.mediflow.roomservice.entity.Bed;
import tn.mediflow.roomservice.service.BedService;

@RestController
@RequestMapping("/beds")
public class BedController {

    @Autowired
    private BedService bedService;

    @PostMapping("/{roomId}")
    public Bed addBed(@PathVariable Long roomId, @RequestBody Bed bed) {
        return bedService.addBed(roomId, bed);
    }

    @GetMapping
    public List<Bed> getAllBeds() {
        return bedService.getAllBeds();
    }

    @GetMapping("/available")
    public List<Bed> getAvailableBeds() {
        return bedService.getAvailableBeds();
    }


    @PutMapping("/{id}/release")
    public Bed releaseBed(@PathVariable Long id) {
        return bedService.releaseBed(id);
    }
}