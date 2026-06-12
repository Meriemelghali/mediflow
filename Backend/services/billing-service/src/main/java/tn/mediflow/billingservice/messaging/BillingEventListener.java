package tn.mediflow.billingservice.messaging;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import tn.mediflow.billingservice.config.RabbitMQConfig;
import tn.mediflow.billingservice.dto.BillEvent;
import tn.mediflow.billingservice.entity.Facture;
import tn.mediflow.billingservice.service.FactureService;

@Component
public class BillingEventListener {

    private final FactureService factureService;

    public BillingEventListener(FactureService factureService) {
        this.factureService = factureService;
    }

    @RabbitListener(queues = RabbitMQConfig.BILLING_QUEUE)
    public void handleBillEvent(BillEvent event) {
        Facture facture = factureService.createFactureFromEvent(event);
        System.out.println("[BillingEventListener] Facture créée depuis RabbitMQ: " + facture.getReference()
                + " (id=" + facture.getId() + ", montant=" + facture.getMontantTotal() + ")");
    }
}
