package tn.mediflow.billingservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.mediflow.billingservice.entity.Facture;
import tn.mediflow.billingservice.repository.FactureRepository;
import tn.mediflow.billingservice.client.AppointmentClient;
import tn.mediflow.billingservice.client.RoomClient;
import tn.mediflow.billingservice.dto.Appointment;
import tn.mediflow.billingservice.dto.Room;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FactureService {

    private final FactureRepository factureRepository;
    private final AppointmentClient appointmentClient;
    private final RoomClient roomClient;

    // CREATE
    public Facture ajouterFacture(Facture facture) {
        return factureRepository.save(facture);
    }

    // READ ALL
    public List<Facture> getAllFactures() {
        return factureRepository.findAll();
    }

    // READ BY ID
    public Facture getFactureById(Long id) {
        return factureRepository.findById(id).orElse(null);
    }

    // DELETE
    public void deleteFacture(Long id) {
        factureRepository.deleteById(id);
    }

    //UPDATE
    public Facture updateFacture(Long id, Facture facture) {

        Facture existingFacture = factureRepository.findById(id).orElse(null);

        if (existingFacture != null) {
            existingFacture.setReference(facture.getReference());
            existingFacture.setMontantTotal(facture.getMontantTotal());
            existingFacture.setStatut(facture.getStatut());

            return factureRepository.save(existingFacture);
        }

        return null;
    }

    public Facture createFactureFromAppointment(Long appointmentId) {

        // appel microservice appointment
        Appointment appointment = appointmentClient.getAppointment(appointmentId);

        if (appointment == null) {
            throw new RuntimeException("Appointment not found");
        }

        // création facture basée sur appointment
        Facture facture = new Facture();
        facture.setReference("FAC-" + appointment.getId());
        facture.setMontantTotal(appointment.getPrice());
        facture.setStatut("EN_ATTENTE");

        return factureRepository.save(facture);
    }

    public Facture createFactureFromRoom(Long roomId, int days) {

    Room room = roomClient.getRoom(roomId);

    if (room == null) {
        throw new RuntimeException("Room not found");
    }

    double pricePerDay;

    switch (room.getType()) {
    case "VIP":
        pricePerDay = 200;
        break;
    case "ICU":
        pricePerDay = 300;
        break;
    case "DOUBLE":
        pricePerDay = 120;
        break;
    case "SIMPLE":
        pricePerDay = 80;
        break;
    case "PEDIATRIC":
        pricePerDay = 150;
        break;
    case "MATERNITY":
        pricePerDay = 180;
        break;
    default:
        throw new RuntimeException("Unknown room type: " + room.getType());
}

    double montant = pricePerDay * days;

    Facture facture = new Facture();
    facture.setReference("FAC-ROOM-" + roomId);
    facture.setMontantTotal(montant);
    facture.setStatut("EN_ATTENTE");

    return factureRepository.save(facture);
}
}