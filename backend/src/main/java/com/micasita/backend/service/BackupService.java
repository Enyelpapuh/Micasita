package com.micasita.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class BackupService {

    private static final Logger logger = LoggerFactory.getLogger(BackupService.class);

    private final JdbcTemplate jdbcTemplate;

    @Value("${app.backup.dir:}")
    private String configuredBackupDir;

    private String backupDir;

    BackupService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void init() {
        if (configuredBackupDir != null && !configuredBackupDir.trim().isEmpty()) {
            this.backupDir = configuredBackupDir;
        } else {
            String osName = System.getProperty("os.name").toLowerCase();
            if (osName.contains("win")) {
                this.backupDir = "C:\\Backups";
            } else {
                this.backupDir = System.getProperty("user.home") + File.separator + "backups" + File.separator + "micasita";
            }
        }
        try {
            File dir = new File(this.backupDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }
        } catch (Exception e) {
            logger.error("No se pudo crear el directorio de backups: {}", e.getMessage());
        }
        logger.info("BackupService inicializado con directorio: {}", this.backupDir);
    }

    public String generarBackupManual() {
        return ejecutarBackup();
    }

    // Se ejecuta automáticamente todos los días a las 2:00 AM
    @Scheduled(cron = "0 0 2 * * ?")
    public void generarBackupAutomatico() {
        logger.info("Iniciando tarea programada: Backup automático de base de datos...");
        try {
            String ruta = ejecutarBackup();
            logger.info("Backup automático generado con éxito en: {}", ruta);
            limpiarBackupsAntiguos();
        } catch (Exception e) {
            logger.error("Error al generar backup automático: {}", e.getMessage());
        }
    }

    public List<Map<String, Object>> listarBackups() {
        File dir = new File(this.backupDir);
        List<Map<String, Object>> list = new ArrayList<>();
        if (dir.exists() && dir.isDirectory()) {
            File[] files = dir.listFiles((d, name) -> name.endsWith(".bak"));
            if (files != null) {
                Arrays.sort(files, (f1, f2) -> Long.compare(f2.lastModified(), f1.lastModified()));
                for (File file : files) {
                    list.add(Map.of(
                            "fileName", file.getName(),
                            "size", file.length(),
                            "lastModified", LocalDateTime.ofInstant(java.time.Instant.ofEpochMilli(file.lastModified()),
                                    java.time.ZoneId.systemDefault())));
                }
            }
        }
        return list;
    }

    public Resource descargarBackup(String fileName) {
        try {
            if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\"))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nombre de archivo inválido");
            Path base = Paths.get(this.backupDir).toAbsolutePath().normalize();
            Path target = base.resolve(fileName).normalize();
            if (!target.startsWith(base) || !Files.exists(target))
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Archivo no encontrado");
            return new UrlResource(target.toUri());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al leer el archivo", ex);
        }
    }

    private String ejecutarBackup() {
        String dbName = "micasita";
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        
        File directory = new File(this.backupDir);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        String backupPath = this.backupDir + File.separator + dbName + "_" + timestamp + ".bak";
        String absoluteBackupPath = new File(backupPath).getAbsolutePath();

        String sql = "BACKUP DATABASE [" + dbName + "] TO DISK = '" + absoluteBackupPath
                + "' WITH FORMAT, MEDIANAME = 'Z_SQLServerBackups', NAME = 'Full Backup of " + dbName + "'";
        jdbcTemplate.execute(sql);

        return absoluteBackupPath;
    }

    private void limpiarBackupsAntiguos() {
        File dir = new File(this.backupDir);
        if (dir.exists() && dir.isDirectory()) {
            File[] files = dir.listFiles((d, name) -> name.endsWith(".bak"));
            if (files != null) {
                long threshold = System.currentTimeMillis() - (30L * 24 * 60 * 60 * 1000);
                for (File file : files) {
                    if (file.lastModified() < threshold && file.delete()) {
                        logger.info("Backup antiguo eliminado por política de retención de 30 días: {}",
                                file.getName());
                    }
                }
            }
        }
    }
}
