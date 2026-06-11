package tn.mediflow.billingservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import tn.mediflow.billingservice.dto.Appointment;



@FeignClient(name = "APPOINTMENT-SERVICE")
public interface AppointmentClient {

    @GetMapping("/api/appointments/{id}")
    Appointment getAppointment(@PathVariable Long id);
}