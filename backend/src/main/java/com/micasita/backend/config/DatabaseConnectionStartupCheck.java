package com.micasita.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;

@Component
public class DatabaseConnectionStartupCheck {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConnectionStartupCheck.class);

    private final DataSource dataSource;

    public DatabaseConnectionStartupCheck(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void checkConnectionOnStartup() {
        try (Connection connection = dataSource.getConnection()) {
            if (!connection.isClosed()) {
                log.info("[DB] Conexion a MySQL exitosa. URL: {}", connection.getMetaData().getURL());
            }
        } catch (Exception ex) {
            log.error("[DB] No fue posible conectar a MySQL al iniciar la aplicacion: {}", ex.getMessage(), ex);
        }
    }
}
