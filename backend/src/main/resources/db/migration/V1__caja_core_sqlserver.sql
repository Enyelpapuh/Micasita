-- =========================================================
-- Micasita - Full baseline schema for SQL Server (Flyway V1)
-- Converted from MySQL script provided by project owner.
-- =========================================================

CREATE TABLE Roles (
  ID_roles INT IDENTITY(1,1) PRIMARY KEY,
  Nombre_rol NVARCHAR(50) NOT NULL
);

CREATE TABLE Metodo_Pago (
  ID_metodo_pago INT IDENTITY(1,1) PRIMARY KEY,
  Nombre NVARCHAR(50) NOT NULL
);

CREATE TABLE Estado_Pago (
  ID_estado_pago INT IDENTITY(1,1) PRIMARY KEY,
  Nombre NVARCHAR(50) NOT NULL
);

CREATE TABLE Estado_Asistencia (
  ID_estado_Asistencia INT IDENTITY(1,1) PRIMARY KEY,
  Nombre NVARCHAR(50) NOT NULL
);

CREATE TABLE Estado_Solicitud (
  ID_estado_solicitud INT IDENTITY(1,1) PRIMARY KEY,
  Nombre NVARCHAR(50) NOT NULL
);

CREATE TABLE Estado_Matricula (
  ID_estado_matricula INT IDENTITY(1,1) PRIMARY KEY,
  Nombre_Estado NVARCHAR(50) NOT NULL
);

CREATE TABLE Tipo_Documento (
  ID_tipo_documento INT IDENTITY(1,1) PRIMARY KEY,
  Nombre NVARCHAR(100) NOT NULL,
  Es_Obligatorio BIT DEFAULT 1
);

CREATE TABLE Puesto (
  ID_Puesto INT IDENTITY(1,1) PRIMARY KEY,
  Nombre NVARCHAR(200) NOT NULL,
  Descripcion NVARCHAR(300),
  Rango NVARCHAR(50)
);

CREATE TABLE Tipo_Publico_Taller (
  ID_tipo_publico INT IDENTITY(1,1) PRIMARY KEY,
  Nombre NVARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE Configuracion_Sistema (
  ID_config INT IDENTITY(1,1) PRIMARY KEY,
  Nombre_Institucion NVARCHAR(150),
  Eslogan NVARCHAR(255),
  Ruta_Logo NVARCHAR(500),
  Correo_Contacto NVARCHAR(100),
  Telefono NVARCHAR(20),
  Direccion NVARCHAR(1000),
  Ultima_Actualizacion DATETIME2 DEFAULT SYSDATETIME()
);

CREATE TABLE Estado_Caja (
  ID_estado_caja INT IDENTITY(1,1) PRIMARY KEY,
  Nombre VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE Tipo_Recibo (
  ID_tipo_recibo INT IDENTITY(1,1) PRIMARY KEY,
  Nombre VARCHAR(50) NOT NULL,
  Codigo VARCHAR(10) NOT NULL UNIQUE,
  Activo BIT NOT NULL DEFAULT 1
);

CREATE TABLE Persona (
  ID_persona INT IDENTITY(1,1) PRIMARY KEY,
  Nombre NVARCHAR(100) NOT NULL,
  Apellido NVARCHAR(100) NOT NULL,
  Fecha_Nacimiento DATE,
  Telefono NVARCHAR(20),
  Correo NVARCHAR(100) UNIQUE,
  Identificador NVARCHAR(40) UNIQUE,
  Activo BIT DEFAULT 1
);

CREATE TABLE Usuario (
  ID_usuario INT IDENTITY(1,1) PRIMARY KEY,
  ID_persona INT UNIQUE NOT NULL,
  Email NVARCHAR(100) UNIQUE NOT NULL,
  Password_hash NVARCHAR(255) NOT NULL,
  Path_avatar NVARCHAR(255),
  Activo BIT DEFAULT 1,
  FOREIGN KEY (ID_persona) REFERENCES Persona(ID_persona)
);

CREATE TABLE Persona_Roles (
  ID_Persona_Roles INT IDENTITY(1,1) PRIMARY KEY,
  ID_persona INT NOT NULL,
  ID_roles INT NOT NULL,
  FOREIGN KEY (ID_persona) REFERENCES Persona(ID_persona),
  FOREIGN KEY (ID_roles) REFERENCES Roles(ID_roles)
);

CREATE TABLE Estudiante (
  ID_estudiante INT IDENTITY(1,1) PRIMARY KEY,
  ID_persona INT NOT NULL,
  Alergias_Graves NVARCHAR(255),
  Observacion_Medica_Corta NVARCHAR(500),
  Matricula_Activa BIT DEFAULT 0,
  Activo BIT DEFAULT 1,
  FOREIGN KEY (ID_persona) REFERENCES Persona(ID_persona)
);

CREATE TABLE Profesor (
  ID_Profesor INT IDENTITY(1,1) PRIMARY KEY,
  ID_persona INT NOT NULL,
  ID_Puesto INT NOT NULL,
  Carrera NVARCHAR(100),
  Activo BIT DEFAULT 1,
  FOREIGN KEY (ID_persona) REFERENCES Persona(ID_persona),
  FOREIGN KEY (ID_Puesto) REFERENCES Puesto(ID_Puesto)
);

CREATE TABLE Tutor (
  ID_tutor INT IDENTITY(1,1) PRIMARY KEY,
  ID_persona INT NOT NULL,
  Direccion NVARCHAR(100),
  Cedula NVARCHAR(16),
  FOREIGN KEY (ID_persona) REFERENCES Persona(ID_persona)
);

CREATE TABLE Participante (
  ID_participante INT IDENTITY(1,1) PRIMARY KEY,
  ID_persona INT NULL,
  Nombre_tmp NVARCHAR(100) NULL,
  Fecha_Nacimiento_tmp DATE NULL,
  Nombre_responsable NVARCHAR(100) NULL,
  Telefono_de_contacto NVARCHAR(20) NULL,
  Activo BIT DEFAULT 1,
  FOREIGN KEY (ID_persona) REFERENCES Persona(ID_persona)
);

CREATE TABLE Grupo (
  ID_Grupo INT IDENTITY(1,1) PRIMARY KEY,
  Nombre NVARCHAR(100) NOT NULL,
  Codigo_funcion INT
);

CREATE TABLE Asignatura (
  ID_Asignatura INT IDENTITY(1,1) PRIMARY KEY,
  Nombre NVARCHAR(200) NOT NULL,
  Descripcion NVARCHAR(200)
);

CREATE TABLE Hoja_Asignatura (
  ID_Hoja_Asignatura INT IDENTITY(1,1) PRIMARY KEY,
  ID_Asignatura INT NOT NULL,
  Nombre NVARCHAR(100),
  FOREIGN KEY (ID_Asignatura) REFERENCES Asignatura(ID_Asignatura)
);

CREATE TABLE Estudiante_Asignatura (
  ID_Estudiante_Asignatura INT IDENTITY(1,1) PRIMARY KEY,
  ID_estudiante INT NOT NULL,
  ID_Asignatura INT NOT NULL,
  Periodo DATE,
  Nota_Final INT,
  FOREIGN KEY (ID_estudiante) REFERENCES Estudiante(ID_estudiante),
  FOREIGN KEY (ID_Asignatura) REFERENCES Asignatura(ID_Asignatura)
);

CREATE TABLE Asistencia_Estudiante (
  ID_asistencia INT IDENTITY(1,1) PRIMARY KEY,
  ID_Estudiante_Asignatura INT NOT NULL,
  Fecha DATE NOT NULL,
  ID_estado_Asistencia INT NOT NULL,
  ID_usuario INT NOT NULL,
  Observaciones NVARCHAR(200),
  FOREIGN KEY (ID_Estudiante_Asignatura) REFERENCES Estudiante_Asignatura(ID_Estudiante_Asignatura),
  FOREIGN KEY (ID_estado_Asistencia) REFERENCES Estado_Asistencia(ID_estado_Asistencia),
  FOREIGN KEY (ID_usuario) REFERENCES Usuario(ID_usuario)
);

CREATE TABLE Trabajo (
  ID_Trabajo INT IDENTITY(1,1) PRIMARY KEY,
  ID_Estudiante_Asignatura INT NOT NULL,
  Nota INT,
  Fecha DATE,
  FOREIGN KEY (ID_Estudiante_Asignatura) REFERENCES Estudiante_Asignatura(ID_Estudiante_Asignatura)
);

CREATE TABLE Estudiante_Grupo (
  ID_Estudiante_Grupo INT IDENTITY(1,1) PRIMARY KEY,
  ID_estudiante INT NOT NULL,
  ID_Grupo INT NOT NULL,
  Fecha_Inscripcion DATE,
  FOREIGN KEY (ID_estudiante) REFERENCES Estudiante(ID_estudiante),
  FOREIGN KEY (ID_Grupo) REFERENCES Grupo(ID_Grupo)
);

CREATE TABLE Profesor_Grupo (
  ID_Profesor_Grupo INT IDENTITY(1,1) PRIMARY KEY,
  ID_Profesor INT NOT NULL,
  ID_Grupo INT NOT NULL,
  Fecha_Inicio DATE,
  FOREIGN KEY (ID_Profesor) REFERENCES Profesor(ID_Profesor),
  FOREIGN KEY (ID_Grupo) REFERENCES Grupo(ID_Grupo)
);

CREATE TABLE Grupo_Asignatura (
  ID_Grupo_Asignatura INT IDENTITY(1,1) PRIMARY KEY,
  ID_Grupo INT NOT NULL,
  ID_Asignatura INT NOT NULL,
  FOREIGN KEY (ID_Grupo) REFERENCES Grupo(ID_Grupo),
  FOREIGN KEY (ID_Asignatura) REFERENCES Asignatura(ID_Asignatura)
);

CREATE TABLE Solicitud_Admision (
  ID_solicitud INT IDENTITY(1,1) PRIMARY KEY,
  ID_persona INT NULL,
  ID_estado_solicitud INT NOT NULL,
  Fecha_creacion DATETIME2 DEFAULT SYSDATETIME(),
  Comentarios_Director VARCHAR(500),
  Nombre_Postulante VARCHAR(100) NULL,
  Apellido_Postulante VARCHAR(100) NULL,
  Fecha_Nacimiento_Postulante DATE NULL,
  Telefono_Postulante VARCHAR(20) NULL,
  Correo_Postulante VARCHAR(100) NULL,
  Identificador_Postulante VARCHAR(40) NULL,
  Nombre_Tutor VARCHAR(120) NULL,
  Parentesco_Tutor VARCHAR(60) NULL,
  Telefono_Tutor VARCHAR(20) NULL,
  Correo_Tutor VARCHAR(100) NULL,
  Tutores_Adicionales_Resumen VARCHAR(1200) NULL,
  Activo BIT DEFAULT 1,
  CONSTRAINT FK_SolicitudAdmision_Persona
    FOREIGN KEY (ID_persona) REFERENCES Persona(ID_persona),
  CONSTRAINT FK_SolicitudAdmision_EstadoSolicitud
    FOREIGN KEY (ID_estado_solicitud) REFERENCES Estado_Solicitud(ID_estado_solicitud)
);

CREATE TABLE Documento_Solicitud (
  ID_doc_solicitud INT IDENTITY(1,1) PRIMARY KEY,
  ID_solicitud INT NOT NULL,
  ID_tipo_documento INT NOT NULL,
  Ruta_Archivo NVARCHAR(255),
  Fecha_Subida DATETIME2 DEFAULT SYSDATETIME(),
  FOREIGN KEY (ID_solicitud) REFERENCES Solicitud_Admision(ID_solicitud) ON DELETE CASCADE,
  FOREIGN KEY (ID_tipo_documento) REFERENCES Tipo_Documento(ID_tipo_documento)
);

CREATE TABLE Documento_Estudiante (
  ID_doc_estudiante INT IDENTITY(1,1) PRIMARY KEY,
  ID_estudiante INT NOT NULL,
  ID_tipo_documento INT NOT NULL,
  Ruta_Archivo NVARCHAR(255),
  Fecha_Registro DATETIME2 DEFAULT SYSDATETIME(),
  FOREIGN KEY (ID_estudiante) REFERENCES Estudiante(ID_estudiante),
  FOREIGN KEY (ID_tipo_documento) REFERENCES Tipo_Documento(ID_tipo_documento)
);

CREATE TABLE Matricula (
  ID_matricula INT IDENTITY(1,1) PRIMARY KEY,
  ID_estudiante INT NOT NULL,
  fecha_matricula DATE,
  Anio_lectivo NVARCHAR(20),
  ID_estado_matricula INT NOT NULL,
  FOREIGN KEY (ID_estudiante) REFERENCES Estudiante(ID_estudiante),
  FOREIGN KEY (ID_estado_matricula) REFERENCES Estado_Matricula(ID_estado_matricula)
);

CREATE TABLE Caja_Sesion (
  ID_caja_sesion INT IDENTITY(1,1) PRIMARY KEY,
  Codigo VARCHAR(40) NOT NULL UNIQUE,
  ID_estado_caja INT NOT NULL,
  ID_usuario_apertura INT NOT NULL,
  ID_usuario_cierre INT NULL,
  Saldo_inicial DECIMAL(10,2) NOT NULL DEFAULT 0,
  Saldo_cierre DECIMAL(10,2) NULL,
  Observacion_apertura VARCHAR(255) NULL,
  Observacion_cierre VARCHAR(255) NULL,
  Fecha_apertura DATETIME2 NOT NULL,
  Fecha_cierre DATETIME2 NULL,
  CONSTRAINT FK_CajaSesion_EstadoCaja
    FOREIGN KEY (ID_estado_caja) REFERENCES Estado_Caja(ID_estado_caja),
  CONSTRAINT FK_CajaSesion_UsuarioApertura
    FOREIGN KEY (ID_usuario_apertura) REFERENCES Usuario(ID_usuario),
  CONSTRAINT FK_CajaSesion_UsuarioCierre
    FOREIGN KEY (ID_usuario_cierre) REFERENCES Usuario(ID_usuario)
);

CREATE TABLE Secuencia_Recibo (
  ID_secuencia_recibo INT IDENTITY(1,1) PRIMARY KEY,
  ID_tipo_recibo INT NOT NULL,
  Anio INT NOT NULL,
  Mes INT NOT NULL,
  Ultimo_numero INT NOT NULL DEFAULT 0,
  CONSTRAINT UK_SecuenciaRecibo_Tipo_Anio_Mes UNIQUE (ID_tipo_recibo, Anio, Mes),
  CONSTRAINT FK_SecuenciaRecibo_TipoRecibo
    FOREIGN KEY (ID_tipo_recibo) REFERENCES Tipo_Recibo(ID_tipo_recibo)
);

CREATE TABLE Pago_matricula (
  ID_pago_matricula INT IDENTITY(1,1) PRIMARY KEY,
  ID_matricula INT NOT NULL,
  ID_usuario INT NOT NULL,
  Numero_Recibo VARCHAR(20) NOT NULL UNIQUE,
  Monto DECIMAL(10,2) NOT NULL,
  ID_metodo_pago INT NOT NULL,
  ID_estado_pago INT NOT NULL,
  fecha_de_pago DATE,
  Es_Anulado BIT NOT NULL DEFAULT 0,
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
  ID_pago_mensualidad INT IDENTITY(1,1) PRIMARY KEY,
  ID_estudiante INT NOT NULL,
  ID_usuario INT NOT NULL,
  Numero_Recibo VARCHAR(20) NOT NULL UNIQUE,
  Monto_Base DECIMAL(10,2) NOT NULL,
  Monto_Mora DECIMAL(10,2) NOT NULL DEFAULT 0,
  ID_metodo_pago INT NOT NULL,
  ID_estado_pago INT NOT NULL,
  Mes_de_pago INT NOT NULL,
  Fecha_de_pago DATE,
  Es_Anulado BIT NOT NULL DEFAULT 0,
  Motivo_Anulacion VARCHAR(255),
  ID_caja_sesion INT NULL,
  Detalle VARCHAR(200),
  FOREIGN KEY (ID_estudiante) REFERENCES Estudiante(ID_estudiante),
  FOREIGN KEY (ID_usuario) REFERENCES Usuario(ID_usuario),
  FOREIGN KEY (ID_metodo_pago) REFERENCES Metodo_Pago(ID_metodo_pago),
  FOREIGN KEY (ID_estado_pago) REFERENCES Estado_Pago(ID_estado_pago),
  FOREIGN KEY (ID_caja_sesion) REFERENCES Caja_Sesion(ID_caja_sesion)
);

CREATE TABLE Taller (
  ID_taller INT IDENTITY(1,1) PRIMARY KEY,
  ID_tipo_publico INT NOT NULL,
  Nombre NVARCHAR(100) NOT NULL,
  Descripcion NVARCHAR(200),
  Ruta_Imagen NVARCHAR(255),
  Fecha_inicial DATE,
  Fecha_final DATE,
  Costo DECIMAL(10,2),
  Cupos_maximos INT,
  Edad_minima INT NULL,
  Edad_maxima INT NULL,
  Activo BIT NOT NULL DEFAULT 1,
  CONSTRAINT FK_taller_tipo_publico FOREIGN KEY (ID_tipo_publico) REFERENCES Tipo_Publico_Taller (ID_tipo_publico),
  CONSTRAINT CHK_taller_rango_edad CHECK (Edad_minima IS NULL OR Edad_maxima IS NULL OR Edad_maxima >= Edad_minima)
);

CREATE TABLE Cupo_taller (
  ID_cupo INT IDENTITY(1,1) PRIMARY KEY,
  ID_taller INT NOT NULL,
  ID_participante INT NOT NULL,
  Fecha DATE,
  Costo DECIMAL(10,2),
  FOREIGN KEY (ID_taller) REFERENCES Taller(ID_taller),
  FOREIGN KEY (ID_participante) REFERENCES Participante(ID_participante)
);

CREATE TABLE Pago_cupo (
  ID_pago_cupo INT IDENTITY(1,1) PRIMARY KEY,
  ID_cupo INT NOT NULL,
  ID_usuario INT NOT NULL,
  Numero_Recibo VARCHAR(20) NOT NULL UNIQUE,
  Monto DECIMAL(10,2),
  ID_metodo_pago INT NOT NULL,
  ID_estado_pago INT NOT NULL,
  Es_Anulado BIT NOT NULL DEFAULT 0,
  Motivo_Anulacion VARCHAR(255),
  Fecha_de_pago DATE,
  ID_caja_sesion INT NULL,
  FOREIGN KEY (ID_cupo) REFERENCES Cupo_taller(ID_cupo),
  FOREIGN KEY (ID_usuario) REFERENCES Usuario(ID_usuario),
  FOREIGN KEY (ID_metodo_pago) REFERENCES Metodo_Pago(ID_metodo_pago),
  FOREIGN KEY (ID_estado_pago) REFERENCES Estado_Pago(ID_estado_pago),
  FOREIGN KEY (ID_caja_sesion) REFERENCES Caja_Sesion(ID_caja_sesion)
);

CREATE TABLE Telefono_tutor (
  ID_telefono_tutor INT IDENTITY(1,1) PRIMARY KEY,
  ID_tutor INT NOT NULL,
  Celular NVARCHAR(20) NOT NULL,
  FOREIGN KEY (ID_tutor) REFERENCES Tutor(ID_tutor)
);

CREATE TABLE Telefono_Profesor (
  ID_Telefono_Profesor INT IDENTITY(1,1) PRIMARY KEY,
  ID_Profesor INT NOT NULL,
  Celular NVARCHAR(20) NOT NULL,
  FOREIGN KEY (ID_Profesor) REFERENCES Profesor(ID_Profesor)
);

CREATE TABLE Estudiante_tutor (
  ID_estudiante_tutor INT IDENTITY(1,1) PRIMARY KEY,
  ID_estudiante INT NOT NULL,
  ID_tutor INT NOT NULL,
  FOREIGN KEY (ID_estudiante) REFERENCES Estudiante(ID_estudiante),
  FOREIGN KEY (ID_tutor) REFERENCES Tutor(ID_tutor)
);

CREATE TABLE Asistencia_general (
  ID_asistencia_general INT IDENTITY(1,1) PRIMARY KEY,
  ID_Grupo INT NOT NULL,
  Fecha DATE NOT NULL,
  FOREIGN KEY (ID_Grupo) REFERENCES Grupo(ID_Grupo)
);

CREATE TABLE Log_Auditoria (
  ID_log INT IDENTITY(1,1) PRIMARY KEY,
  ID_usuario INT NOT NULL,
  Tabla_Afectada NVARCHAR(50),
  ID_Registro INT NOT NULL,
  Accion NVARCHAR(10),
  Valor_Anterior NVARCHAR(MAX),
  Valor_Nuevo NVARCHAR(MAX),
  Fecha_Hora DATETIME2 DEFAULT SYSDATETIME(),
  IP_Terminal NVARCHAR(45),
  FOREIGN KEY (ID_usuario) REFERENCES Usuario(ID_usuario)
);
