package com.micasita.backend.repositories.core;

import com.micasita.backend.entities.core.LogAuditoria;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LogAuditoriaRepository extends JpaRepository<LogAuditoria, Long> {
}