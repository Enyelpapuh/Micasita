package com.micasita.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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

    @Autowired
    private JdbcTemplate jdbcTemplate;

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
        File dir = new File("C:\\Backups");
        List<Map<String, Object>> list = new ArrayList<>();
        if (dir.exists() && dir.isDirectory()) {
            File[] files = dir.listFiles((d, name) -> name.endsWith(".bak"));
            if (files != null) {
                Arrays.sort(files, (f1, f2) -> Long.compare(f2.lastModified(), f1.lastModified()));
                for (File file : files) {
                    list.add(Map.of(
                            "fileName", file.getName(),
                            "size", file.length(),
                            "lastModified", LocalDateTime.ofInstant(java.time.Instant.ofEpochMilli(file.lastModified()), java.time.ZoneId.systemDefault())
                    ));
                }
            }
        }
        return list;
    }

    public Resource descargarBackup(String fileName) {
        try {
            if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nombre de archivo inválido");
            Path target = Paths.get("C:\\Backups").resolve(fileName).normalize();
            if (!target.startsWith(Paths.get("C:\\Backups")) || !Files.exists(target)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Archivo no encontrado");
            return new UrlResource(target.toUri());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al leer el archivo", ex);
        }
    }

    private String ejecutarBackup() {
        String dbName = "micasita";
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String backupPath = "C:\\Backups\\" + dbName + "_" + timestamp + ".bak";
        
        File directory = new File("C:\\Backups");
        if (!directory.exists()) {
            directory.mkdirs();
        }

        String sql = "BACKUP DATABASE [" + dbName + "] TO DISK = '" + backupPath + "' WITH FORMAT, MEDIANAME = 'Z_SQLServerBackups', NAME = 'Full Backup of " + dbName + "'";
        jdbcTemplate.execute(sql);
        
        return backupPath;
    }

    private void limpiarBackupsAntiguos() {
        File dir = new File("C:\\Backups");
        if (dir.exists() && dir.isDirectory()) {
            File[] files = dir.listFiles((d, name) -> name.endsWith(".bak"));
            if (files != null) {
                long threshold = System.currentTimeMillis() - (30L * 24 * 60 * 60 * 1000);
                for (File file : files) {
                    if (file.lastModified() < threshold && file.delete()) {
                        logger.info("Backup antiguo eliminado por política de retención de 30 días: {}", file.getName());
                    }
                }
            }
        }
    }
}
