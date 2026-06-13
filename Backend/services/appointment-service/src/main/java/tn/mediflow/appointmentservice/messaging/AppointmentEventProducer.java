package tn.mediflow.appointmentservice.messaging;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import tn.mediflow.appointmentservice.config.RabbitMQConfig;
import tn.mediflow.appointmentservice.dto.AppointmentResponse;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class AppointmentEventProducer {

    private final RabbitTemplate rabbitTemplate;

    public AppointmentEventProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishAppointmentCreated(AppointmentResponse appointment) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("appointmentId", appointment.getId());
        payload.put("patientId", appointment.getPatientId());
        payload.put("doctorId", appointment.getDoctorId());
        payload.put("appointmentDate", appointment.getAppointmentDate() != null ? appointment.getAppointmentDate().toString() : "");
        payload.put("reason", appointment.getReason() != null ? appointment.getReason() : "");
        payload.put("notes", appointment.getNotes() != null ? appointment.getNotes() : "");

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE,
                RabbitMQConfig.RK_APPOINTMENT_CREATED,
                payload
        );

        log.info("📤 [RabbitMQ Appointment Producer] Rendez-vous publié sur '{}' : Patient #{} / Médecin #{}",
                RabbitMQConfig.RK_APPOINTMENT_CREATED, appointment.getPatientId(), appointment.getDoctorId());
    }
}
