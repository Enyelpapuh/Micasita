package com.micasita.backend.entities.core;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Log_Auditoria")
public class LogAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_log")
    private Long idLog;

    @Column(name = "ID_usuario")
    private Long idUsuario;

    @Column(name = "Tabla_Afectada")
    private String tablaAfectada;

    @Column(name = "ID_Registro")
    private Long idRegistro;

    @Column(name = "Accion")
    private String accion;

    @Column(name = "Valor_Anterior")
    private String valorAnterior;

    @Column(name = "Valor_Nuevo")
    private String valorNuevo;

    @Column(name = "campos_modificados")
    private String camposModificados;

    @Column(name = "Fecha_Hora", insertable = false, updatable = false)
    private LocalDateTime fechaHora;

    @Column(name = "IP_Terminal")
    private String ipTerminal;

    public Long getIdLog() {
        return idLog;
    }

    public void setIdLog(Long idLog) {
        this.idLog = idLog;
    }

    public Long getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Long idUsuario) {
        this.idUsuario = idUsuario;
    }

    public String getTablaAfectada() {
        return tablaAfectada;
    }

    public void setTablaAfectada(String tablaAfectada) {
        this.tablaAfectada = tablaAfectada;
    }

    public Long getIdRegistro() {
        return idRegistro;
    }

    public void setIdRegistro(Long idRegistro) {
        this.idRegistro = idRegistro;
    }

    public String getAccion() {
        return accion;
    }

    public void setAccion(String accion) {
        this.accion = accion;
    }

    public LocalDateTime getFechaHora() {
        return fechaHora;
    }

    public void setFechaHora(LocalDateTime fechaHora) {
        this.fechaHora = fechaHora;
    }

    public String getIpTerminal() {
        return ipTerminal;
    }

    public void setIpTerminal(String ipTerminal) {
        this.ipTerminal = ipTerminal;
    }

    public String getValorAnterior() {
        return valorAnterior;
    }

    public void setValorAnterior(String valorAnterior) {
        this.valorAnterior = valorAnterior;
    }

    public String getValorNuevo() {
        return valorNuevo;
    }

    public void setValorNuevo(String valorNuevo) {
        this.valorNuevo = valorNuevo;
    }

    public String getCamposModificados() {
        return camposModificados;
    }

    public void setCamposModificados(String camposModificados) {
        this.camposModificados = camposModificados;
    }

    @Column(name = "Navegador_Cliente")
    private String navegadorCliente;

    public String getNavegadorCliente() {
        return navegadorCliente;
    }

    public void setNavegadorCliente(String navegadorCliente) {
        this.navegadorCliente = navegadorCliente;
    }

}