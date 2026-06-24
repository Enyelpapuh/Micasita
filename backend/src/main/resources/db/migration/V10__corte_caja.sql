-- V10__corte_caja.sql
-- 1. Crear tabla Corte_Caja
CREATE TABLE Corte_Caja (
  ID_corte INT IDENTITY(1,1) PRIMARY KEY,
  ID_caja_sesion INT NOT NULL,
  Total_cobrado DECIMAL(10,2) NOT NULL DEFAULT 0,
  Total_anulado DECIMAL(10,2) NOT NULL DEFAULT 0,
  Total_matriculas DECIMAL(10,2) NOT NULL DEFAULT 0,
  Total_talleres DECIMAL(10,2) NOT NULL DEFAULT 0,
  Total_mensualidades DECIMAL(10,2) NOT NULL DEFAULT 0,
  Cantidad_anulaciones INT NOT NULL DEFAULT 0,
  Diferencia DECIMAL(10,2) NOT NULL DEFAULT 0,
  Fecha_corte DATETIME NOT NULL DEFAULT GETDATE(),
  CONSTRAINT FK_CorteCaja_CajaSesion FOREIGN KEY (ID_caja_sesion) REFERENCES Caja_Sesion(ID_caja_sesion)
);
GO

-- 2. Agregar columnas de reembolso en tablas de pago
ALTER TABLE Pago_matricula ADD Monto_Reembolsado DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE Pago_cupo ADD Monto_Reembolsado DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE Mensualidad ADD Monto_Reembolsado DECIMAL(10,2) NOT NULL DEFAULT 0.00;
GO

-- Pago_matricula
ALTER TABLE Pago_matricula ADD Monto_Recibido DECIMAL(10,2) NULL;
ALTER TABLE Pago_matricula ADD Cambio_Devuelto DECIMAL(10,2) NULL;
-- Mensualidad
ALTER TABLE Mensualidad ADD Monto_Recibido DECIMAL(10,2) NULL;
ALTER TABLE Mensualidad ADD Cambio_Devuelto DECIMAL(10,2) NULL;
-- Pago_cupo
ALTER TABLE Pago_cupo ADD Monto_Recibido DECIMAL(10,2) NULL;
ALTER TABLE Pago_cupo ADD Cambio_Devuelto DECIMAL(10,2) NULL;

-- 3. Crear trigger de auditoría para Corte_Caja
CREATE TRIGGER TR_Auditoria_Corte_Caja
ON Corte_Caja
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, IP_Terminal, Navegador_Cliente)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT),
            'Corte_Caja',
            i.ID_corte,
            'UPDATE',
            (SELECT d.Total_cobrado, d.Diferencia FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            (SELECT i.Total_cobrado, i.Diferencia FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)),
            CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255))
        FROM inserted i
        INNER JOIN deleted d ON i.ID_corte = d.ID_corte;
    END

    IF NOT EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO Log_Auditoria (ID_usuario, Tabla_Afectada, ID_Registro, Accion, Valor_Anterior, Valor_Nuevo, IP_Terminal, Navegador_Cliente)
        SELECT 
            CAST(SESSION_CONTEXT(N'UserId') AS INT),
            'Corte_Caja',
            d.ID_corte,
            'DELETE',
            (SELECT d.Total_cobrado, d.Diferencia FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            NULL,
            CAST(CONNECTIONPROPERTY('client_net_address') AS NVARCHAR(45)),
            CAST(SESSION_CONTEXT(N'UserAgent') AS NVARCHAR(255))
        FROM deleted d;
    END
END;
GO
