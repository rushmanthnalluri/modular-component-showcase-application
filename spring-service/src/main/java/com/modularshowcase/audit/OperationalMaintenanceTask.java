package com.modularshowcase.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class OperationalMaintenanceTask {

    private static final Logger LOGGER = LoggerFactory.getLogger(OperationalMaintenanceTask.class);

    @Scheduled(fixedDelayString = "${app.maintenance.fixed-delay-ms:300000}")
    public void emitOperationalHeartbeat() {
        LOGGER.info("maintenance_task heartbeat=alive");
    }
}
