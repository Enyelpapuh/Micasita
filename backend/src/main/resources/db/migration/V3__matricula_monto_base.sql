IF COL_LENGTH('Matricula', 'Monto_Base') IS NULL
BEGIN
    ALTER TABLE Matricula
    ADD Monto_Base DECIMAL(10,2) NOT NULL CONSTRAINT DF_Matricula_Monto_Base DEFAULT 0;
END;
GO