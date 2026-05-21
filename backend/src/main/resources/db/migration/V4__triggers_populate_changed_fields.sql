-- Flyway V4: rebuild triggers to populate Campos_Modificados JSON with changed fields

-- Drop existing triggers if any
IF OBJECT_ID('TR_Auditoria_Taller', 'TR') IS NOT NULL
    DROP TRIGGER TR_Auditoria_Taller;
GO

IF OBJECT_ID('TR_Auditoria_PersonaRoles', 'TR') IS NOT NULL
    DROP TRIGGER TR_Auditoria_PersonaRoles;
GO

-- Recreate TR_Auditoria_Taller with Campos_Modificados
CREATE TRIGGER TR_Auditoria_Taller
ON Taller
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- UPDATE case
    IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, Campos_Modificados, IP_Terminal)
        SELECT 
            NULL,
            'Taller',
            i.ID_taller,
            'UPDATE',
            (SELECT d.Nombre, d.Descripcion, d.Costo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            (SELECT i.Nombre, i.Descripcion, i.Costo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            (
                SELECT 
                    CASE WHEN ISNULL(d.Nombre,'') <> ISNULL(i.Nombre,'') THEN 'Nombre' ELSE NULL END AS Nombre,
                    CASE WHEN ISNULL(d.Descripcion,'') <> ISNULL(i.Descripcion,'') THEN 'Descripcion' ELSE NULL END AS Descripcion,
                    CASE WHEN ISNULL(d.Costo,0) <> ISNULL(i.Costo,0) THEN 'Costo' ELSE NULL END AS Costo
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45))
        FROM inserted i
        INNER JOIN deleted d ON i.ID_taller = d.ID_taller;
    END

    -- DELETE case
    IF NOT EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, Campos_Modificados, IP_Terminal)
        SELECT 
            NULL,
            'Taller',
            d.ID_taller,
            'DELETE',
            (SELECT d.Nombre, d.Descripcion, d.Costo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            NULL,
            NULL,
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45))
        FROM deleted d;
    END
END;
GO

-- Recreate TR_Auditoria_PersonaRoles with Campos_Modificados
CREATE TRIGGER TR_Auditoria_PersonaRoles
ON Persona_Roles
AFTER INSERT, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- INSERT: new role assigned
    IF EXISTS(SELECT * FROM inserted) AND NOT EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, Campos_Modificados, IP_TermINAL)
        SELECT 
            NULL,
            'Persona_Roles',
            i.ID_Persona_Roles,
            'INSERT',
            NULL,
            (SELECT i.ID_persona, i.ID_roles FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            (SELECT 'ID_persona' AS Campo, i.ID_persona AS Antes, i.ID_roles AS Despues FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45))
        FROM inserted i;
    END

    -- DELETE: role removed
    IF EXISTS(SELECT * FROM deleted) AND NOT EXISTS(SELECT * FROM inserted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, Campos_Modificados, IP_TermINAL)
        SELECT 
            NULL,
            'Persona_Roles',
            d.ID_Persona_Roles,
            'DELETE',
            (SELECT d.ID_persona, d.ID_roles FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            NULL,
            (SELECT 'ID_persona' AS Campo, d.ID_persona AS Antes, d.ID_roles AS Despues FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45))
        FROM deleted d;
    END
END;
GO
