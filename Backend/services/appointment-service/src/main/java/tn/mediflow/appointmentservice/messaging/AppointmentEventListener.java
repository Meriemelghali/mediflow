package tn.mediflow.appointmentservice.messaging;

import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import tn.mediflow.appointmentservice.config.RabbitMQConfig;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class AppointmentEventListener {

    public static final List<String> eventLogs = new CopyOnWriteArrayList<>();

    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(value = "appointment.events.demo", durable = "true"),
            exchange = @Exchange(value = RabbitMQConfig.EXCHANGE, type = "topic"),
            key = RabbitMQConfig.RK_APPOINTMENT_CREATED
    ))
    public void handleAppointmentEvent(Map<String, Object> payload) {
        Object appointmentId = payload.get("appointmentId");
        Object patientId = payload.get("patientId");
        Object appointmentDate = payload.get("appointmentDate");

        String msg = "[AppointmentEventListener] RDV #" + appointmentId + " planifié pour patient #" + patientId + " le " + appointmentDate;
        System.out.println(msg);
        eventLogs.add(msg);
    }
}
