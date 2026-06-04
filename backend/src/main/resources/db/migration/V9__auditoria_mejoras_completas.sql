-- Flyway V9: Completar datos de auditoría para Usuarios, Roles y Talleres

-- =========================================================================
-- 1. Mejorar Trigger de Taller para incluir TODOS los campos (Activación, fechas, etc)
-- =========================================================================
IF OBJECT_ID('TR_Auditoria_Taller', 'TR') IS NOT NULL DROP TRIGGER TR_Auditoria_Taller;
GO

CREATE TRIGGER TR_Auditoria_Taller
ON Taller
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, Campos_Modificados, IP_Terminal, Navegador_Cliente)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT), 'Taller', i.ID_taller, 'UPDATE',
            (SELECT d.Nombre, d.Descripcion, d.Costo, d.Activo, d.Fecha_inicial, d.Fecha_final, d.Cupos_maximos, d.Edad_minima, d.Edad_maxima FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            (SELECT i.Nombre, i.Descripcion, i.Costo, i.Activo, i.Fecha_inicial, i.Fecha_final, i.Cupos_maximos, i.Edad_minima, i.Edad_maxima FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            (
                SELECT 
                    CASE WHEN ISNULL(d.Nombre,'') <> ISNULL(i.Nombre,'') THEN 'Nombre' ELSE NULL END AS Nombre,
                    CASE WHEN ISNULL(d.Descripcion,'') <> ISNULL(i.Descripcion,'') THEN 'Descripcion' ELSE NULL END AS Descripcion,
                    CASE WHEN ISNULL(d.Costo,0) <> ISNULL(i.Costo,0) THEN 'Costo' ELSE NULL END AS Costo,
                    CASE WHEN ISNULL(CAST(d.Activo AS INT),0) <> ISNULL(CAST(i.Activo AS INT),0) THEN 'Activo' ELSE NULL END AS Activo,
                    CASE WHEN ISNULL(CAST(d.Fecha_inicial AS VARCHAR),'') <> ISNULL(CAST(i.Fecha_inicial AS VARCHAR),'') THEN 'Fecha_inicial' ELSE NULL END AS Fecha_inicial,
                    CASE WHEN ISNULL(CAST(d.Fecha_final AS VARCHAR),'') <> ISNULL(CAST(i.Fecha_final AS VARCHAR),'') THEN 'Fecha_final' ELSE NULL END AS Fecha_final,
                    CASE WHEN ISNULL(d.Cupos_maximos,0) <> ISNULL(i.Cupos_maximos,0) THEN 'Cupos_maximos' ELSE NULL END AS Cupos_maximos,
                    CASE WHEN ISNULL(d.Edad_minima,-1) <> ISNULL(i.Edad_minima,-1) THEN 'Edad_minima' ELSE NULL END AS Edad_minima,
                    CASE WHEN ISNULL(d.Edad_maxima,-1) <> ISNULL(i.Edad_maxima,-1) THEN 'Edad_maxima' ELSE NULL END AS Edad_maxima
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)), CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255))
        FROM inserted i INNER JOIN deleted d ON i.ID_taller = d.ID_taller;
    END

    IF NOT EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, Campos_Modificados, IP_Terminal, Navegador_Cliente)
        SELECT CAST(SESSION_CONTEXT(N'UserId') AS INT), 'Taller', d.ID_taller, 'DELETE',
            (SELECT d.Nombre, d.Descripcion, d.Costo, d.Activo, d.Fecha_inicial, d.Fecha_final, d.Cupos_maximos, d.Edad_minima, d.Edad_maxima FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            NULL, NULL, CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)), CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255))
        FROM deleted d;
    END
END;
GO

-- =========================================================================
-- 2. Mejorar Trigger de Usuario para campos_modificados y bloqueos
-- =========================================================================
IF OBJECT_ID('TR_Auditoria_Usuario', 'TR') IS NOT NULL DROP TRIGGER TR_Auditoria_Usuario;
GO

CREATE TRIGGER TR_Auditoria_Usuario
ON Usuario
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, campos_modificados, IP_Terminal, Navegador_Cliente)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT), 'Usuario', i.ID_usuario, 'UPDATE',
            (SELECT d.Email, d.Activo, d.Intentos_Fallidos, d.ID_persona FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            (SELECT i.Email, i.Activo, i.Intentos_Fallidos, i.ID_persona FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            (
                SELECT 
                    CASE WHEN ISNULL(d.Email,'') <> ISNULL(i.Email,'') THEN 'Email' ELSE NULL END AS Email,
                    CASE WHEN ISNULL(CAST(d.Activo AS INT),0) <> ISNULL(CAST(i.Activo AS INT),0) THEN 'Activo' ELSE NULL END AS Activo,
                    CASE WHEN ISNULL(d.Intentos_Fallidos,0) <> ISNULL(i.Intentos_Fallidos,0) THEN 'Intentos_Fallidos' ELSE NULL END AS Intentos_Fallidos
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)), CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255))
        FROM inserted i INNER JOIN deleted d ON i.ID_usuario = d.ID_usuario;
    END
END;
GO

-- =========================================================================
-- 3. Mejorar Trigger de Roles para capturar el NOMBRE del rol
-- =========================================================================
IF OBJECT_ID('TR_Auditoria_PersonaRoles', 'TR') IS NOT NULL DROP TRIGGER TR_Auditoria_PersonaRoles;
GO

CREATE TRIGGER TR_Auditoria_PersonaRoles
ON Persona_Roles
AFTER INSERT, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS(SELECT * FROM inserted) AND NOT EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, IP_Terminal, Navegador_Cliente)
        SELECT CAST(SESSION_CONTEXT(N'UserId') AS INT), 'Persona_Roles', i.ID_Persona_Roles, 'INSERT', NULL,
            (SELECT i.ID_persona, i.ID_roles, r.Nombre_rol AS Rol_Asignado FROM inserted i2 INNER JOIN Roles r ON i2.ID_roles = r.ID_roles WHERE i2.ID_Persona_Roles = i.ID_Persona_Roles FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)), CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255))
        FROM inserted i;
    END
    IF EXISTS(SELECT * FROM deleted) AND NOT EXISTS(SELECT * FROM inserted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, IP_Terminal, Navegador_Cliente)
        SELECT CAST(SESSION_CONTEXT(N'UserId') AS INT), 'Persona_Roles', d.ID_Persona_Roles, 'DELETE',
            (SELECT d.ID_persona, d.ID_roles, r.Nombre_rol AS Rol_Revocado FROM deleted d2 INNER JOIN Roles r ON d2.ID_roles = r.ID_roles WHERE d2.ID_Persona_Roles = d.ID_Persona_Roles FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            NULL, CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)), CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255))
        FROM deleted d;
    END
END;
GO