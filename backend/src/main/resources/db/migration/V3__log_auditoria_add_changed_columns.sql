-- Flyway V3: add Campos_Modificados column to Log_Auditoria
IF COL_LENGTH('Log_Auditoria', 'Campos_Modificados') IS NULL
BEGIN
    ALTER TABLE Log_Auditoria ADD Campos_Modificados NVARCHAR(500) NULL;
END
GO
