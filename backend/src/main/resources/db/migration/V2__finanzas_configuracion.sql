IF OBJECT_ID('Configuracion_Finanzas', 'U') IS NULL
BEGIN
    CREATE TABLE Configuracion_Finanzas (
        ID_config_finanzas INT IDENTITY(1,1) PRIMARY KEY,
        Monto_Matricula_Base DECIMAL(10,2) NOT NULL DEFAULT 0,
        Monto_Mensualidad_Base DECIMAL(10,2) NOT NULL DEFAULT 0,
        Monto_Mora_Fija DECIMAL(10,2) NOT NULL DEFAULT 0,
        Porcentaje_Descuento_Familiar DECIMAL(5,2) NOT NULL DEFAULT 0,
        Maximo_Descuento_Familiar DECIMAL(10,2) NOT NULL DEFAULT 0,
        Aplicar_Mora_Automatica BIT NOT NULL DEFAULT 1,
        Dias_Limite_Mora INT NOT NULL DEFAULT 10,
        Activo BIT NOT NULL DEFAULT 1,
        Ultima_Actualizacion DATETIME2 DEFAULT SYSDATETIME()
    );

    INSERT INTO Configuracion_Finanzas (
        Monto_Matricula_Base,
        Monto_Mensualidad_Base,
        Monto_Mora_Fija,
        Porcentaje_Descuento_Familiar,
        Maximo_Descuento_Familiar,
        Aplicar_Mora_Automatica,
        Dias_Limite_Mora,
        Activo
    ) VALUES (0, 0, 0, 0, 0, 1, 10, 1);
END;
GO