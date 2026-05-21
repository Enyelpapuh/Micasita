-- =========================================================
-- Flyway V2: Auditing triggers for Taller and Persona_Roles
-- Inserts records into Log_Auditoria on UPDATE/DELETE for Taller
-- and on INSERT/DELETE for Persona_Roles (role assignments)
-- =========================================================

-- Trigger for Taller updates/deletes
IF OBJECT_ID('TR_Auditoria_Taller', 'TR') IS NOT NULL
    DROP TRIGGER TR_Auditoria_Taller;
GO

CREATE TRIGGER TR_Auditoria_Taller
ON Taller
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- UPDATE case: log previous and new values
    IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, IP_Terminal)
        SELECT 
            NULL, -- application should provide user id via context if available
            'Taller',
            i.ID_taller,
            'UPDATE',
            (SELECT d.Nombre, d.Descripcion, d.Costo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            (SELECT i.Nombre, i.Descripcion, i.Costo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45))
        FROM inserted i
        INNER JOIN deleted d ON i.ID_taller = d.ID_taller;
    END

    -- DELETE case: log previous values only
    IF NOT EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, IP_Terminal)
        SELECT 
            NULL,
            'Taller',
            d.ID_taller,
            'DELETE',
            (SELECT d.Nombre, d.Descripcion, d.Costo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            NULL,
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45))
        FROM deleted d;
    END
END;
GO

-- Trigger for Persona_Roles (role assignment/removal)
IF OBJECT_ID('TR_Auditoria_PersonaRoles', 'TR') IS NOT NULL
    DROP TRIGGER TR_Auditoria_PersonaRoles;
GO

CREATE TRIGGER TR_Auditoria_PersonaRoles
ON Persona_Roles
AFTER INSERT, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- INSERT: new role assigned
    IF EXISTS(SELECT * FROM inserted) AND NOT EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, IP_Terminal)
        SELECT 
            NULL,
            'Persona_Roles',
            i.ID_Persona_Roles,
            'INSERT',
            NULL,
            (SELECT i.ID_persona, i.ID_roles FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45))
        FROM inserted i;
    END

    -- DELETE: role removed
    IF EXISTS(SELECT * FROM deleted) AND NOT EXISTS(SELECT * FROM inserted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, IP_Terminal)
        SELECT 
            NULL,
            'Persona_Roles',
            d.ID_Persona_Roles,
            'DELETE',
            (SELECT d.ID_persona, d.ID_roles FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            NULL,
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45))
        FROM deleted d;
    END
END;
GO

-- Notes:
-- 1) Triggers record NULL for ID_usuario because the database trigger cannot reliably know
--    the application user. To capture the actor (who performed the change), update the
--    application to call a stored procedure that sets a SESSION_CONTEXT key (e.g. 'actorId')
--    or sets CONTEXT_INFO before performing DML, and then the trigger can read that value.
-- 2) If you want audit entries for other tables (taller price changes via related tables,
--    recibos anulados, etc.) add similar triggers following this pattern.
