package tn.mediflow.pharmacyservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import tn.mediflow.pharmacyservice.dto.InvoiceRequest;
import tn.mediflow.pharmacyservice.dto.InvoiceResponse;

@FeignClient(name = "billing-service")
public interface BillingClient {

    @PostMapping("/api/billing/invoices")
    InvoiceResponse createInvoice(@RequestBody InvoiceRequest request);
}