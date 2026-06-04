-- 1. Agregar columnas para control de seguridad en la tabla Usuario
ALTER TABLE Usuario ADD Intentos_Fallidos INT NOT NULL DEFAULT 0;
ALTER TABLE Usuario ADD Token_Version BIGINT NOT NULL DEFAULT 0;
GO

-- 2. Trigger de Auditoría para la tabla Usuario
CREATE TRIGGER TR_Auditoria_Usuario
ON Usuario
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- CASO 1: INSERT
    IF EXISTS(SELECT * FROM inserted) AND NOT EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Nuevo, IP_Terminal, Navegador_Cliente)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT),
            'Usuario', i.ID_usuario, 'INSERT',
            (SELECT i.Email, i.Activo, i.ID_persona FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)), CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255))
        FROM inserted i;
    END

    -- CASO 2: UPDATE
    IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, IP_Terminal, Navegador_Cliente)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT),
            'Usuario', i.ID_usuario, 'UPDATE',
            (SELECT d.Email, d.Activo, d.ID_persona FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            (SELECT i.Email, i.Activo, i.ID_persona FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)), CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255))
        FROM inserted i
        INNER JOIN deleted d ON i.ID_usuario = d.ID_usuario;
    END

    -- CASO 3: DELETE
    IF NOT EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, IP_Terminal, Navegador_Cliente)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT),
            'Usuario', d.ID_usuario, 'DELETE',
            (SELECT d.Email, d.Activo, d.ID_persona FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)), CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255))
        FROM deleted d;
    END
END;
GO