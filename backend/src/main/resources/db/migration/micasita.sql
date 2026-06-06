-- ==========================================
-- CONFIGURACIÓN DE ENTORNO
-- ==========================================
SET FOREIGN_KEY_CHECKS = 0;
SET NAMES 'utf8mb4';

CREATE DATABASE IF NOT EXISTS micasita;
USE micasita;

-- ==========================================
-- 1. TABLAS DE CATÁLOGO (SIN DEPENDENCIAS)
-- ==========================================

CREATE TABLE `Roles` (
  `ID_roles` INT PRIMARY KEY AUTO_INCREMENT,
  `Nombre_rol` NVARCHAR(50) NOT NULL
);

CREATE TABLE `Metodo_Pago` (
  `ID_metodo_pago` INT PRIMARY KEY AUTO_INCREMENT,
  `Nombre` NVARCHAR(50) NOT NULL
);

CREATE TABLE `Estado_Pago` (
  `ID_estado_pago` INT PRIMARY KEY AUTO_INCREMENT,
  `Nombre` NVARCHAR(50) NOT NULL
);

CREATE TABLE `Estado_Asistencia` (
  `ID_estado_Asistencia` INT PRIMARY KEY AUTO_INCREMENT,
  `Nombre` NVARCHAR(50) NOT NULL
);

CREATE TABLE `Estado_Solicitud` (
  `ID_estado_solicitud` INT PRIMARY KEY AUTO_INCREMENT,
  `Nombre` NVARCHAR(50) NOT NULL
);

CREATE TABLE `Estado_Matricula` (
  `ID_estado_matricula` INT PRIMARY KEY AUTO_INCREMENT,
  `Nombre_Estado` NVARCHAR(50) NOT NULL
);

CREATE TABLE `Tipo_Documento` (
  `ID_tipo_documento` INT PRIMARY KEY AUTO_INCREMENT,
  `Nombre` NVARCHAR(100) NOT NULL,
  `Es_Obligatorio` BOOLEAN DEFAULT true
);

CREATE TABLE `Puesto` (
  `ID_Puesto` INT PRIMARY KEY AUTO_INCREMENT,
  `Nombre` NVARCHAR(200) NOT NULL,
  `Descripcion` NVARCHAR(300),
  `Rango` INT 
);

CREATE TABLE `Tipo_Publico_Taller` (
  `ID_tipo_publico` INT PRIMARY KEY AUTO_INCREMENT,
  `Nombre` NVARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE `Configuracion_Sistema` (
  `ID_config` INT PRIMARY KEY AUTO_INCREMENT,
  `Nombre_Institucion` NVARCHAR(150),
  `Eslogan` NVARCHAR(255),
  `Ruta_Logo` NVARCHAR(500),
  `Correo_Contacto` NVARCHAR(100),
  `Telefono` NVARCHAR(20),
  `Direccion` NVARCHAR(1000),
  `Ultima_Actualizacion` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE Estado_Caja (
  ID_estado_caja INT PRIMARY KEY AUTO_INCREMENT,
  Nombre VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE Tipo_Recibo (
  ID_tipo_recibo INT PRIMARY KEY AUTO_INCREMENT,
  Nombre VARCHAR(50) NOT NULL,
  Codigo VARCHAR(10) NOT NULL UNIQUE,
  Activo BOOLEAN NOT NULL DEFAULT TRUE
);
-- ==========================================
-- 2. NÚCLEO DE IDENTIDAD
-- ==========================================

CREATE TABLE `Persona` (
  `ID_persona` INT PRIMARY KEY AUTO_INCREMENT,
  `Nombre` NVARCHAR(100) NOT NULL,
  `Apellido` NVARCHAR(100) NOT NULL,
  `Fecha_Nacimiento` DATE,
  `Telefono` NVARCHAR(20),
  `Correo` NVARCHAR(100) UNIQUE, -- Para registro express
  `Identificador` NVARCHAR(40) UNIQUE, -- Cédula/DNI
  `Activo` BOOLEAN DEFAULT true
);

CREATE TABLE `Usuario` (
  `ID_usuario` INT PRIMARY KEY AUTO_INCREMENT,
  `ID_persona` INT UNIQUE NOT NULL,
  `Email` NVARCHAR(100) UNIQUE NOT NULL,
  `Password_hash` NVARCHAR(255) NOT NULL,
  `Path_avatar` NVARCHAR(255),
  `Activo` BOOLEAN DEFAULT true,
  FOREIGN KEY (`ID_persona`) REFERENCES `Persona`(`ID_persona`),
  `Intentos_Fallidos` INT NOT NULL DEFAULT 0,
  `Token_Version` BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE `Persona_Roles` (
  `ID_Persona_Roles` INT PRIMARY KEY AUTO_INCREMENT,
  `ID_persona` INT NOT NULL,
  `ID_roles` INT NOT NULL,
  FOREIGN KEY (`ID_persona`) REFERENCES `Persona`(`ID_persona`),
  FOREIGN KEY (`ID_roles`) REFERENCES `Roles`(`ID_roles`)
);

-- ==========================================
-- 3. ACTORES DEL SISTEMA
-- ==========================================

CREATE TABLE `Estudiante` (
  `ID_estudiante` INT PRIMARY KEY AUTO_INCREMENT,
  `ID_persona` INT NOT NULL,
  `Alergias_Graves` NVARCHAR(255),
  `Observacion_Medica_Corta` NVARCHAR(500),
  `Matricula_Activa` BOOLEAN DEFAULT false,
  `Activo` BOOLEAN DEFAULT true,
  FOREIGN KEY (`ID_persona`) REFERENCES `Persona`(`ID_persona`)
);

CREATE TABLE `Profesor` (
  `ID_Profesor` INT PRIMARY KEY AUTO_INCREMENT,
  `ID_persona` INT NOT NULL,
  `ID_Puesto` INT NOT NULL,
  `Carrera` NVARCHAR(100),
  `Activo` BOOLEAN DEFAULT true,
  FOREIGN KEY (`ID_persona`) REFERENCES `Persona`(`ID_persona`),
  FOREIGN KEY (`ID_Puesto`) REFERENCES `Puesto`(`ID_Puesto`)
);

CREATE TABLE `Tutor` (
  `ID_tutor` INT PRIMARY KEY AUTO_INCREMENT,
  `ID_persona` INT NOT NULL,
  `Direccion` NVARCHAR(100),
  `Cedula` NVARCHAR(16),
  FOREIGN KEY (`ID_persona`) REFERENCES `Persona`(`ID_persona`)
);

CREATE TABLE `Participante` (
  `ID_participante` INT PRIMARY KEY AUTO_INCREMENT,
  `ID_persona` INT NULL, -- NULL permite el "tránsito rápido"
  -- Campos temporales para externos
  `Nombre_tmp` NVARCHAR(100) NULL,
  `Fecha_Nacimiento_tmp` DATE NULL,
  `Nombre_responsable` NVARCHAR(100) NULL,
  `Telefono_de_contacto` NVARCHAR(20) NULL,
  `Activo` BOOLEAN DEFAULT true,
  FOREIGN KEY (`ID_persona`) REFERENCES `Persona`(`ID_persona`)
);

-- ==========================================
-- 4. ESTRUCTURA ACADÉMICA
-- ==========================================

CREATE TABLE `Grupo` (
  `ID_Grupo` INT PRIMARY KEY AUTO_INCREMENT,
  `Nombre` NVARCHAR(100) NOT NULL,
  `Codigo_funcion` INT
);

CREATE TABLE `Asignatura` (
  `ID_Asignatura` INT PRIMARY KEY AUTO_INCREMENT,
  `Nombre` NVARCHAR(200) NOT NULL,
  `Descripcion` NVARCHAR(200)
);

CREATE TABLE `Hoja_Asignatura` (
  `ID_Hoja_Asignatura` INT PRIMARY KEY AUTO_INCREMENT,
  `ID_Asignatura` INT NOT NULL,
  `Nombre` NVARCHAR(100),
  FOREIGN KEY (`ID_Asignatura`) REFERENCES `Asignatura`(`ID_Asignatura`)
);

CREATE TABLE `Estudiante_Asignatura` (
  `ID_Estudiante_Asignatura` INT PRIMARY KEY AUTO_INCREMENT,
  `ID_estudiante` INT NOT NULL,
  `ID_Asignatura` INT NOT NULL,
  `Periodo` DATE,
  `Nota_Final` INT,
  FOREIGN KEY (`ID_estudiante`) REFERENCES `Estudiante`(`ID_estudiante`),
  FOREIGN KEY (`ID_Asignatura`) REFERENCES `Asignatura`(`ID_Asignatura`)
);

CREATE TABLE `Asistencia_Estudiante` (
  `ID_asistencia` INT PRIMARY KEY AUTO_INCREMENT,
  `ID_Estudiante_Asignatura` INT NOT NULL,
  `Fecha` DATE NOT NULL,
  `ID_estado_Asistencia` INT NOT NULL,
  `ID_usuario` INT NOT NULL,
  `Observaciones` NVARCHAR(200),
  FOREIGN KEY (`ID_Estudiante_Asignatura`) REFERENCES `Estudiante_Asignatura`(`ID_Estudiante_Asignatura`),
  FOREIGN KEY (`ID_estado_Asistencia`) REFERENCES `Estado_Asistencia`(`ID_estado_Asistencia`),
  FOREIGN KEY (`ID_usuario`) REFERENCES `Usuario`(`ID_usuario`)
);

CREATE TABLE `Trabajo` (
  `ID_Trabajo` INT PRIMARY KEY AUTO_INCREMENT,
  `ID_Estudiante_Asignatura` INT NOT NULL,
  `Nota` INT,
  `Fecha` DATE,
  FOREIGN KEY (`ID_Estudiante_Asignatura`) REFERENCES `Estudiante_Asignatura`(`ID_Estudiante_Asignatura`)
);

CREATE TABLE `Estudiante_Grupo` (
  `ID_Estudiante_Grupo` INT PRIMARY KEY AUTO_INCREMENT,
  `ID_estudiante` INT NOT NULL,
  `ID_Grupo` INT NOT NULL,
  `Fecha_Inscripcion` DATE,
  FOREIGN KEY (`ID_estudiante`) REFERENCES `Estudiante`(`ID_estudiante`),
  FOREIGN KEY (`ID_Grupo`) REFERENCES `Grupo`(`ID_Grupo`)
);

CREATE TABLE `Profesor_Grupo` (
  `ID_Profesor_Grupo` INT PRIMARY KEY AUTO_INCREMENT,
  `ID_Profesor` INT NOT NULL,
  `ID_Grupo` INT NOT NULL,
  `Fecha_Inicio` DATE,
  FOREIGN KEY (`ID_Profesor`) REFERENCES `Profesor`(`ID_Profesor`),
  FOREIGN KEY (`ID_Grupo`) REFERENCES `Grupo`(`ID_Grupo`)
);

CREATE TABLE `Grupo_Asignatura` (
  `ID_Grupo_Asignatura` INT PRIMARY KEY AUTO_INCREMENT,
  `ID_Grupo` INT NOT NULL,
  `ID_Asignatura` INT NOT NULL,
  FOREIGN KEY (`ID_Grupo`) REFERENCES `Grupo`(`ID_Grupo`),
  FOREIGN KEY (`ID_Asignatura`) REFERENCES `Asignatura`(`ID_Asignatura`)
);

-- ==========================================
-- 5. ADMISIÓN Y DOCUMENTOS
-- ==========================================


CREATE TABLE Solicitud_Admision (
  ID_solicitud INT PRIMARY KEY AUTO_INCREMENT,
  ID_persona INT NULL,
  ID_estado_solicitud INT NOT NULL,
  Fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  Comentarios_Director VARCHAR(500),

  -- Datos del postulante (si no hay persona vinculada todavia)
  Nombre_Postulante VARCHAR(100) NULL,
  Apellido_Postulante VARCHAR(100) NULL,
  Fecha_Nacimiento_Postulante DATE NULL,
  Telefono_Postulante VARCHAR(20) NULL,
  Correo_Postulante VARCHAR(100) NULL,
  Identificador_Postulante VARCHAR(40) NULL,

  -- Tutor principal
  Nombre_Tutor VARCHAR(120) NULL,
  Parentesco_Tutor VARCHAR(60) NULL,
  Telefono_Tutor VARCHAR(20) NULL,
  Correo_Tutor VARCHAR(100) NULL,

  -- Resumen JSON/string de tutores extra si aplica
  Tutores_Adicionales_Resumen VARCHAR(1200) NULL,

  Activo BOOLEAN DEFAULT TRUE,

  CONSTRAINT FK_SolicitudAdmision_Persona
    FOREIGN KEY (ID_persona) REFERENCES Persona(ID_persona),
  CONSTRAINT FK_SolicitudAdmision_EstadoSolicitud
    FOREIGN KEY (ID_estado_solicitud) REFERENCES Estado_Solicitud(ID_estado_solicitud)
);
CREATE TABLE `Documento_Solicitud` (
  `ID_doc_solicitud` INT PRIMARY KEY AUTO_INCREMENT,
  `ID_solicitud` INT NOT NULL,
  `ID_tipo_documento` INT NOT NULL,
  `Ruta_Archivo` NVARCHAR(255),
  `Fecha_Subida` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`ID_solicitud`) REFERENCES `Solicitud_Admision`(`ID_solicitud`) ON DELETE CASCADE,
  FOREIGN KEY (`ID_tipo_documento`) REFERENCES `Tipo_Documento`(`ID_tipo_documento`)
);

CREATE TABLE `Documento_Estudiante` (
  `ID_doc_estudiante` INT PRIMARY KEY AUTO_INCREMENT,
  `ID_estudiante` INT NOT NULL,
  `ID_tipo_documento` INT NOT NULL,
  `Ruta_Archivo` NVARCHAR(255),
  `Fecha_Registro` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`ID_estudiante`) REFERENCES `Estudiante`(`ID_estudiante`),
  FOREIGN KEY (`ID_tipo_documento`) REFERENCES `Tipo_Documento`(`ID_tipo_documento`)
);

-- ==========================================
-- 6. MATRÍCULA Y FINANZAS
-- ==========================================


CREATE TABLE `Matricula` (
  `ID_matricula` INT PRIMARY KEY AUTO_INCREMENT,
  `ID_estudiante` INT NOT NULL,
  `fecha_matricula` DATE,
  `Anio_lectivo` NVARCHAR(20),
  `ID_estado_matricula` INT NOT NULL,
  FOREIGN KEY (`ID_estudiante`) REFERENCES `Estudiante`(`ID_estudiante`),
  FOREIGN KEY (`ID_estado_matricula`) REFERENCES `Estado_Matricula`(`ID_estado_matricula`)
);

CREATE TABLE Caja_Sesion (
  ID_caja_sesion INT PRIMARY KEY AUTO_INCREMENT,
  Codigo VARCHAR(40) NOT NULL UNIQUE,
  ID_estado_caja INT NOT NULL,
  ID_usuario_apertura INT NOT NULL,
  ID_usuario_cierre INT NULL,
  Saldo_inicial DECIMAL(10,2) NOT NULL DEFAULT 0,
  Saldo_cierre DECIMAL(10,2) NULL,
  Observacion_apertura VARCHAR(255) NULL,
  Observacion_cierre VARCHAR(255) NULL,
  Fecha_apertura DATETIME NOT NULL,
  Fecha_cierre DATETIME NULL,
  CONSTRAINT FK_CajaSesion_EstadoCaja
    FOREIGN KEY (ID_estado_caja) REFERENCES Estado_Caja(ID_estado_caja),
  CONSTRAINT FK_CajaSesion_UsuarioApertura
    FOREIGN KEY (ID_usuario_apertura) REFERENCES Usuario(ID_usuario),
  CONSTRAINT FK_CajaSesion_UsuarioCierre
    FOREIGN KEY (ID_usuario_cierre) REFERENCES Usuario(ID_usuario)
);

CREATE TABLE Secuencia_Recibo (
  ID_secuencia_recibo INT PRIMARY KEY AUTO_INCREMENT,
  ID_tipo_recibo INT NOT NULL,
  Anio INT NOT NULL,
  Mes INT NOT NULL,
  Ultimo_numero INT NOT NULL DEFAULT 0,
  CONSTRAINT UK_SecuenciaRecibo_Tipo_Anio_Mes UNIQUE (ID_tipo_recibo, Anio, Mes),
  CONSTRAINT FK_SecuenciaRecibo_TipoRecibo
    FOREIGN KEY (ID_tipo_recibo) REFERENCES Tipo_Recibo(ID_tipo_recibo)
);
CREATE TABLE Pago_matricula (
  ID_pago_matricula INT PRIMARY KEY AUTO_INCREMENT,
  ID_matricula INT NOT NULL,
  ID_usuario INT NOT NULL,
  Numero_Recibo VARCHAR(20) NOT NULL UNIQUE,
  Monto DECIMAL(10,2) NOT NULL,
  ID_metodo_pago INT NOT NULL,
  ID_estado_pago INT NOT NULL,
  fecha_de_pago DATE,
  Es_Anulado BOOLEAN NOT NULL DEFAULT FALSE,
  Motivo_Anulacion VARCHAR(255),
  ID_caja_sesion INT NULL,
  Detalle VARCHAR(200),
  FOREIGN KEY (ID_matricula) REFERENCES Matricula(ID_matricula),
  FOREIGN KEY (ID_usuario) REFERENCES Usuario(ID_usuario),
  FOREIGN KEY (ID_metodo_pago) REFERENCES Metodo_Pago(ID_metodo_pago),
  FOREIGN KEY (ID_estado_pago) REFERENCES Estado_Pago(ID_estado_pago),
  FOREIGN KEY (ID_caja_sesion) REFERENCES Caja_Sesion(ID_caja_sesion)
);


CREATE TABLE Mensualidad (
  ID_pago_mensualidad INT PRIMARY KEY AUTO_INCREMENT,
  ID_estudiante INT NOT NULL,
  ID_usuario INT NOT NULL,
  Numero_Recibo VARCHAR(20) NOT NULL UNIQUE,
  Monto_Base DECIMAL(10,2) NOT NULL,
  Monto_Mora DECIMAL(10,2) NOT NULL DEFAULT 0,
  ID_metodo_pago INT NOT NULL,
  ID_estado_pago INT NOT NULL,
  Mes_de_pago INT NOT NULL,
  Fecha_de_pago DATE,
  Es_Anulado BOOLEAN NOT NULL DEFAULT FALSE,
  Motivo_Anulacion VARCHAR(255),
  ID_caja_sesion INT NULL,
  Detalle VARCHAR(200),
  FOREIGN KEY (ID_estudiante) REFERENCES Estudiante(ID_estudiante),
  FOREIGN KEY (ID_usuario) REFERENCES Usuario(ID_usuario),
  FOREIGN KEY (ID_metodo_pago) REFERENCES Metodo_Pago(ID_metodo_pago),
  FOREIGN KEY (ID_estado_pago) REFERENCES Estado_Pago(ID_estado_pago),
  FOREIGN KEY (ID_caja_sesion) REFERENCES Caja_Sesion(ID_caja_sesion)
);

-- ==========================================
-- 7. TALLERES
-- ==========================================

CREATE TABLE `Taller` (
  `ID_taller` INT PRIMARY KEY AUTO_INCREMENT,
  `ID_tipo_publico` INT NOT NULL,
  `Nombre` NVARCHAR(100) NOT NULL,
  `Descripcion` NVARCHAR(200),
  `Ruta_Imagen` NVARCHAR(255),
  `Fecha_inicial` DATE,
  `Fecha_final` DATE,
  `Costo` DECIMAL(10,2),
  `Cupos_maximos` INT,
  `Edad_minima` INT NULL,
  `Edad_maxima` INT NULL,
  `Activo` BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT `FK_taller_tipo_publico` FOREIGN KEY (`ID_tipo_publico`) REFERENCES `Tipo_Publico_Taller` (`ID_tipo_publico`),
  CONSTRAINT `CHK_taller_rango_edad` CHECK (`Edad_minima` IS NULL OR `Edad_maxima` IS NULL OR `Edad_maxima` >= `Edad_minima`)
);

CREATE TABLE `Cupo_taller` (
  `ID_cupo` INT PRIMARY KEY AUTO_INCREMENT,
  `ID_taller` INT NOT NULL,
  `ID_participante` INT NOT NULL,
  `Fecha` DATE,
  `Costo` DECIMAL(10,2),
  FOREIGN KEY (`ID_taller`) REFERENCES `Taller`(`ID_taller`),
  FOREIGN KEY (`ID_participante`) REFERENCES `Participante`(`ID_participante`)
);

CREATE TABLE Pago_cupo (
  ID_pago_cupo INT PRIMARY KEY AUTO_INCREMENT,
  ID_cupo INT NOT NULL,
  ID_usuario INT NOT NULL,
  Numero_Recibo VARCHAR(20) NOT NULL UNIQUE,
  Monto DECIMAL(10,2),
  ID_metodo_pago INT NOT NULL,
  ID_estado_pago INT NOT NULL,
  Es_Anulado BOOLEAN NOT NULL DEFAULT FALSE,
  Motivo_Anulacion VARCHAR(255),
  Fecha_de_pago DATE,
  ID_caja_sesion INT NULL,
  FOREIGN KEY (ID_cupo) REFERENCES Cupo_taller(ID_cupo),
  FOREIGN KEY (ID_usuario) REFERENCES Usuario(ID_usuario),
  FOREIGN KEY (ID_metodo_pago) REFERENCES Metodo_Pago(ID_metodo_pago),
  FOREIGN KEY (ID_estado_pago) REFERENCES Estado_Pago(ID_estado_pago),
  FOREIGN KEY (ID_caja_sesion) REFERENCES Caja_Sesion(ID_caja_sesion)
);




-- ==========================================
-- 8. CONTACTO Y RELACIONES SOCIALES
-- ==========================================

CREATE TABLE `Telefono_tutor` (
  `ID_telefono_tutor` INT PRIMARY KEY AUTO_INCREMENT,
  `ID_tutor` INT NOT NULL,
  `Celular` NVARCHAR(20) NOT NULL,
  FOREIGN KEY (`ID_tutor`) REFERENCES `Tutor`(`ID_tutor`)
);

CREATE TABLE `Telefono_Profesor` (
  `ID_Telefono_Profesor` INT PRIMARY KEY AUTO_INCREMENT,
  `ID_Profesor` INT NOT NULL,
  `Celular` NVARCHAR(20) NOT NULL,
  FOREIGN KEY (`ID_Profesor`) REFERENCES `Profesor`(`ID_Profesor`)
);

CREATE TABLE `Estudiante_tutor` (
  `ID_estudiante_tutor` INT PRIMARY KEY AUTO_INCREMENT,
  `ID_estudiante` INT NOT NULL,
  `ID_tutor` INT NOT NULL,
  FOREIGN KEY (`ID_estudiante`) REFERENCES `Estudiante`(`ID_estudiante`),
  FOREIGN KEY (`ID_tutor`) REFERENCES `Tutor`(`ID_tutor`)
);

-- ==========================================
-- 9. AUDITORÍA Y CONTROL
-- ==========================================

CREATE TABLE `Asistencia_general` (
  `ID_asistencia_general` INT PRIMARY KEY AUTO_INCREMENT,
  `ID_Grupo` INT NOT NULL,
  `Fecha` DATE NOT NULL,
  FOREIGN KEY (`ID_Grupo`) REFERENCES `Grupo`(`ID_Grupo`)
);

-- Asegurar la estructura correcta de Log_Auditoria

CREATE TABLE Log_Auditoria (
    ID_log INT IDENTITY(1,1) PRIMARY KEY,
    ID_usuario INT NULL,                          -- NULL por si el cambio lo hace un proceso del sistema
    Tabla_Afectada NVARCHAR(100) NOT NULL,
    ID_Registro INT NOT NULL,
    Accion NVARCHAR(20) NOT NULL,                 -- 'INSERT', 'UPDATE', 'DELETE'
    Valor_Anterior NVARCHAR(MAX) NULL,             -- Cambiado de TEXT a NVARCHAR(MAX)
    Valor_Nuevo NVARCHAR(MAX) NULL,                -- Cambiado de TEXT a NVARCHAR(MAX)
    Fecha_Hora DATETIME2 DEFAULT SYSDATETIME(),   -- Precisión de fecha recomendada
    IP_Terminal NVARCHAR(45) NULL,
    campos_modificados NVARCHAR(MAX) NULL,             -- Lista de campos modificados (solo para UPDATE, formato: "Campo1,Campo2")
    Navegador_Cliente NVARCHAR(255) NULL          -- Dispositivo/Navegador desde donde se hizo el cambio
);

CREATE TABLE Anuncio (
    ID_anuncio INT IDENTITY(1,1) PRIMARY KEY,
    Titulo NVARCHAR(150) NOT NULL,
    Descripcion NVARCHAR(MAX) NOT NULL,
    Ruta_Imagen NVARCHAR(500) NULL,
    Fecha_Publicacion DATETIME2 DEFAULT SYSDATETIME(),
    Fecha_Expiracion DATE NULL,
    ID_usuario INT NOT NULL,
    Activo BIT DEFAULT 1,
    CONSTRAINT FK_Anuncio_Usuario FOREIGN KEY (ID_usuario) REFERENCES Usuario(ID_usuario)
);

--para ver quien accedio al sistema
CREATE TABLE Auditoria_Accesos_Sistema (
    ID_acceso INT IDENTITY(1,1) PRIMARY KEY,
    ID_usuario INT NOT NULL,                          -- Quién se conectó
    Email_Usuario NVARCHAR(100) NOT NULL,             -- Para auditoría rápida sin JOINS
    Fecha_Ingreso DATETIME2 DEFAULT SYSDATETIME(),    -- Cuándo se conectó
    IP_Terminal NVARCHAR(45) NOT NULL,                -- Desde dónde (IPv4 o IPv6)
    Navegador_Cliente NVARCHAR(255) NULL,             -- User-Agent (Chrome, Edge, Firefox)
    Estado_Intento NVARCHAR(20) NOT NULL,             -- 'EXITOSO' o 'FALLIDO' (Detectar ataques de fuerza bruta)
    CONSTRAINT FK_Accesos_Usuario FOREIGN KEY (ID_usuario) REFERENCES Usuario(ID_usuario)
);


-- =========================================================================
-- 1. TRIGGER DE AUDITORÍA PARA LA TABLA: Mensualidad
-- =========================================================================
CREATE TRIGGER TR_Auditoria_Mensualidad
ON Mensualidad
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- CASO 1: SE ACTUALIZÓ UN REGISTRO (Ej: Se anuló un pago o cambió el monto)
    IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, IP_Terminal, Navegador_Cliente, campos_modificados)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT), -- Usuario REAL de la sesión
            'Mensualidad',
            i.ID_pago_mensualidad,
            'UPDATE',
            (SELECT d.Monto_Base, d.Monto_Mora, d.ID_estado_pago, d.Es_Anulado, d.Numero_Recibo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            (SELECT i.Monto_Base, i.Monto_Mora, i.ID_estado_pago, i.Es_Anulado, i.Numero_Recibo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)),
            CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255)),
            (
                SELECT 
                    CASE WHEN ISNULL(d.Monto_Base,0) <> ISNULL(i.Monto_Base,0) THEN 'Monto_Base' ELSE NULL END AS Monto_Base,
                    CASE WHEN ISNULL(d.ID_estado_pago,0) <> ISNULL(i.ID_estado_pago,0) THEN 'ID_estado_pago' ELSE NULL END AS ID_estado_pago,
                    CASE WHEN ISNULL(d.Es_Anulado,0) <> ISNULL(i.Es_Anulado,0) THEN 'Es_Anulado' ELSE NULL END AS Es_Anulado
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            )
        FROM inserted i
        INNER JOIN deleted d ON i.ID_pago_mensualidad = d.ID_pago_mensualidad;
    END

    -- CASO 2: SE ELIMINÓ UN REGISTRO (Alerta de riesgo crítico)
    IF NOT EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, IP_Terminal, Navegador_Cliente)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT),
            'Mensualidad',
            d.ID_pago_mensualidad,
            'DELETE',
            (SELECT d.Monto_Base, d.Monto_Mora, d.ID_estado_pago, d.Es_Anulado, d.Numero_Recibo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            NULL,
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)),
            CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255))
        FROM deleted d;
    END
END;
GO

-- =========================================================================
-- 2. TRIGGER DE AUDITORÍA PARA LA TABLA: Pago_matricula
-- =========================================================================
CREATE TRIGGER TR_Auditoria_PagoMatricula
ON Pago_matricula
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- CASO 1: ACTUALIZACIÓN
    IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, IP_Terminal, Navegador_Cliente, campos_modificados)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT),
            'Pago_matricula',
            i.ID_pago_matricula,
            'UPDATE',
            (SELECT d.Monto, d.ID_estado_pago, d.Es_Anulado, d.Numero_Recibo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            (SELECT i.Monto, i.ID_estado_pago, i.Es_Anulado, i.Numero_Recibo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)),
            CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255)),
            (
                SELECT 
                    CASE WHEN ISNULL(d.Monto,0) <> ISNULL(i.Monto,0) THEN 'Monto' ELSE NULL END AS Monto,
                    CASE WHEN ISNULL(d.ID_estado_pago,0) <> ISNULL(i.ID_estado_pago,0) THEN 'ID_estado_pago' ELSE NULL END AS ID_estado_pago,
                    CASE WHEN ISNULL(d.Es_Anulado,0) <> ISNULL(i.Es_Anulado,0) THEN 'Es_Anulado' ELSE NULL END AS Es_Anulado
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            )
        FROM inserted i
        INNER JOIN deleted d ON i.ID_pago_matricula = d.ID_pago_matricula;
    END

    -- CASO 2: ELIMINACIÓN
    IF NOT EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, IP_Terminal, Navegador_Cliente)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT),
            'Pago_matricula',
            d.ID_pago_matricula,
            'DELETE',
            (SELECT d.Monto, d.ID_estado_pago, d.Es_Anulado, d.Numero_Recibo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            NULL,
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)),
            CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255))
        FROM deleted d;
    END
END;
GO

-- =========================================================================
-- 3. TRIGGER DE AUDITORÍA PARA LA TABLA: Pago_cupo (Talleres)
-- =========================================================================
CREATE TRIGGER TR_Auditoria_PagoCupo
ON Pago_cupo
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- CASO 1: ACTUALIZACIÓN
    IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, IP_Terminal, Navegador_Cliente, campos_modificados)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT),
            'Pago_cupo',
            i.ID_pago_cupo,
            'UPDATE',
            (SELECT d.Monto, d.ID_estado_pago, d.Es_Anulado, d.Numero_Recibo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            (SELECT i.Monto, i.ID_estado_pago, i.Es_Anulado, i.Numero_Recibo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)),
            CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255)),
            (
                SELECT 
                    CASE WHEN ISNULL(d.Monto,0) <> ISNULL(i.Monto,0) THEN 'Monto' ELSE NULL END AS Monto,
                    CASE WHEN ISNULL(d.ID_estado_pago,0) <> ISNULL(i.ID_estado_pago,0) THEN 'ID_estado_pago' ELSE NULL END AS ID_estado_pago,
                    CASE WHEN ISNULL(d.Es_Anulado,0) <> ISNULL(i.Es_Anulado,0) THEN 'Es_Anulado' ELSE NULL END AS Es_Anulado
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            )
        FROM inserted i
        INNER JOIN deleted d ON i.ID_pago_cupo = d.ID_pago_cupo;
    END

    -- CASO 2: ELIMINACIÓN
    IF NOT EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, IP_Terminal, Navegador_Cliente)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT),
            'Pago_cupo',
            d.ID_pago_cupo,
            'DELETE',
            (SELECT d.Monto, d.ID_estado_pago, d.Es_Anulado, d.Numero_Recibo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            NULL,
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)),
            CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255))
        FROM deleted d;
    END
END;
GO

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

-- =========================================================================
-- 4. TRIGGER DE AUDITORÍA PARA LA TABLA: Matricula
-- =========================================================================
CREATE TRIGGER TR_Auditoria_Matricula
ON Matricula
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS(SELECT * FROM inserted) AND NOT EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Nuevo, IP_Terminal, Navegador_Cliente)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT), 'Matricula', i.ID_matricula, 'INSERT',
            (SELECT i.ID_estudiante, i.Anio_lectivo, i.ID_estado_matricula FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)), CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255))
        FROM inserted i;
    END

    IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, IP_Terminal, Navegador_Cliente, campos_modificados)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT), 'Matricula', i.ID_matricula, 'UPDATE',
            (SELECT d.ID_estudiante, d.Anio_lectivo, d.ID_estado_matricula FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            (SELECT i.ID_estudiante, i.Anio_lectivo, i.ID_estado_matricula FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)), CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255)),
            (SELECT 
                CASE WHEN ISNULL(d.ID_estado_matricula,0) <> ISNULL(i.ID_estado_matricula,0) THEN 'ID_estado_matricula' ELSE NULL END AS ID_estado_matricula,
                CASE WHEN ISNULL(d.Anio_lectivo,'') <> ISNULL(i.Anio_lectivo,'') THEN 'Anio_lectivo' ELSE NULL END AS Anio_lectivo
             FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
        FROM inserted i INNER JOIN deleted d ON i.ID_matricula = d.ID_matricula;
    END

    IF NOT EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, IP_Terminal, Navegador_Cliente)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT), 'Matricula', d.ID_matricula, 'DELETE',
            (SELECT d.ID_estudiante, d.Anio_lectivo, d.ID_estado_matricula FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)), CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255))
        FROM deleted d;
    END
END;
GO

-- =========================================================================
-- 5. TRIGGER DE AUDITORÍA PARA LA TABLA: Solicitud_Admision
-- =========================================================================
CREATE TRIGGER TR_Auditoria_SolicitudAdmision
ON Solicitud_Admision
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS(SELECT * FROM inserted) AND NOT EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Nuevo, IP_Terminal, Navegador_Cliente)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT), 'Solicitud_Admision', i.ID_solicitud, 'INSERT',
            (SELECT i.ID_estado_solicitud, i.Activo, i.Nombre_Postulante FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)), CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255))
        FROM inserted i;
    END

    IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, IP_Terminal, Navegador_Cliente, campos_modificados)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT), 'Solicitud_Admision', i.ID_solicitud, 'UPDATE',
            (SELECT d.ID_estado_solicitud, d.Activo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            (SELECT i.ID_estado_solicitud, i.Activo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)), CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255)),
            (SELECT 
                CASE WHEN ISNULL(d.ID_estado_solicitud,0) <> ISNULL(i.ID_estado_solicitud,0) THEN 'ID_estado_solicitud' ELSE NULL END AS ID_estado_solicitud,
                CASE WHEN ISNULL(d.Activo,0) <> ISNULL(i.Activo,0) THEN 'Activo' ELSE NULL END AS Activo 
             FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
        FROM inserted i INNER JOIN deleted d ON i.ID_solicitud = d.ID_solicitud;
    END

    IF NOT EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, IP_Terminal, Navegador_Cliente)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT), 'Solicitud_Admision', d.ID_solicitud, 'DELETE',
            (SELECT d.ID_estado_solicitud, d.Activo, d.Nombre_Postulante FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)), CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255))
        FROM deleted d;
    END
END;
GO

-- =========================================================================
-- 6. TRIGGER DE AUDITORÍA PARA LA TABLA: Taller
-- =========================================================================
CREATE TRIGGER TR_Auditoria_Taller
ON Taller
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS(SELECT * FROM inserted) AND NOT EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Nuevo, IP_Terminal, Navegador_Cliente)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT), 'Taller', i.ID_taller, 'INSERT',
            (SELECT i.Nombre, i.Costo, i.Activo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)), CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255))
        FROM inserted i;
    END

    IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, IP_Terminal, Navegador_Cliente, campos_modificados)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT), 'Taller', i.ID_taller, 'UPDATE',
            (SELECT d.Nombre, d.Costo, d.Activo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            (SELECT i.Nombre, i.Costo, i.Activo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)), CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255)),
            (SELECT 
                CASE WHEN ISNULL(d.Nombre,'') <> ISNULL(i.Nombre,'') THEN 'Nombre' ELSE NULL END AS Nombre,
                CASE WHEN ISNULL(d.Costo,0) <> ISNULL(i.Costo,0) THEN 'Costo' ELSE NULL END AS Costo,
                CASE WHEN ISNULL(d.Activo,0) <> ISNULL(i.Activo,0) THEN 'Activo' ELSE NULL END AS Activo 
             FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
        FROM inserted i INNER JOIN deleted d ON i.ID_taller = d.ID_taller;
    END

    IF NOT EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, IP_Terminal, Navegador_Cliente)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT), 'Taller', d.ID_taller, 'DELETE',
            (SELECT d.Nombre, d.Costo, d.Activo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)), CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255))
        FROM deleted d;
    END
END;
GO

-- =========================================================================
-- 7. TRIGGER DE AUDITORÍA PARA LA TABLA: Caja_Sesion
-- =========================================================================
CREATE TRIGGER TR_Auditoria_Caja_Sesion
ON Caja_Sesion
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS(SELECT * FROM inserted) AND NOT EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Nuevo, IP_Terminal, Navegador_Cliente)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT), 'Caja_Sesion', i.ID_caja_sesion, 'INSERT',
            (SELECT i.Codigo, i.ID_estado_caja, i.Saldo_inicial FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)), CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255))
        FROM inserted i;
    END

    IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, IP_Terminal, Navegador_Cliente, campos_modificados)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT), 'Caja_Sesion', i.ID_caja_sesion, 'UPDATE',
            (SELECT d.Codigo, d.ID_estado_caja, d.Saldo_inicial, d.Saldo_cierre FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            (SELECT i.Codigo, i.ID_estado_caja, i.Saldo_inicial, i.Saldo_cierre FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)), CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255)),
            (SELECT 
                CASE WHEN ISNULL(d.ID_estado_caja,0) <> ISNULL(i.ID_estado_caja,0) THEN 'ID_estado_caja' ELSE NULL END AS ID_estado_caja,
                CASE WHEN ISNULL(d.Saldo_cierre,0) <> ISNULL(i.Saldo_cierre,0) THEN 'Saldo_cierre' ELSE NULL END AS Saldo_cierre 
             FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
        FROM inserted i INNER JOIN deleted d ON i.ID_caja_sesion = d.ID_caja_sesion;
    END
END;
GO

SET FOREIGN_KEY_CHECKS = 1;
/*Tabla sin conexiones */
