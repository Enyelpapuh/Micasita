import { useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { Printer } from 'lucide-react'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import type { AuthUser } from '../../auth/auth.types'
import { useAuth } from '../../auth/AuthContext'
import { getCajaHistorialGeneral, getHistoricalCortes, type CorteSessionResponse } from './caja.api'
import logoSvg from '../../../assets/MiCASITALOGO-cropped.svg?raw'
import { PanelShell, formatMoney } from './DashboardPanels'
import { ResumenFinancieroSection } from './ResumenFinancieroSection'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </article>
  )
}

export function OverviewPanel({ user }: { user?: AuthUser | null }) {
  const { token } = useAuth()
  const [cajaResumen, setCajaResumen] = useState<Awaited<ReturnType<typeof getCajaHistorialGeneral>> | null>(null)
  const [periodFilter, setPeriodFilter] = useState<'0' | '7' | '15' | '30' | 'all' | 'custom'>('30')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [conceptFilter, setConceptFilter] = useState<'all' | 'Taller' | 'Matrícula' | 'Mensualidad'>('all')
  const [reportType, setReportType] = useState<'general' | 'talleres' | 'matriculas' | 'mensualidades'>('general')
  const [activeTab, setActiveTab] = useState<'ingresos' | 'cortes'>('ingresos')
  const [cortesList, setCortesList] = useState<CorteSessionResponse[] | null>(null)
  const [isLoadingCortes, setIsLoadingCortes] = useState(false)
  const [selectedCorte, setSelectedCorte] = useState<CorteSessionResponse | null>(null)

  useEffect(() => {
    if (activeTab !== 'cortes') return
    if (cortesList) return

    const loadCortes = async () => {
      setIsLoadingCortes(true)
      try {
        const data = await getHistoricalCortes(token)
        setCortesList(data)
      } catch {
        toast.error('No se pudo cargar el historial de cierres de caja.')
      } finally {
        setIsLoadingCortes(false)
      }
    }

    void loadCortes()
  }, [activeTab, token, cortesList])

  const printCorteDetail = (corte: CorteSessionResponse) => {
    const logoHtml = `<div style="width: 150px; margin: 0 auto 10px;">${logoSvg}</div>`
    const diffText = corte.diferencia > 0 
      ? `Sobrante: ${formatMoney(corte.diferencia)}` 
      : corte.diferencia < 0 
        ? `Faltante: -${formatMoney(Math.abs(corte.diferencia))}` 
        : 'Sin diferencia'

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Arqueo de Caja - Turno ${corte.codigo}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          @page { size: A4 portrait; margin: 20mm 15mm; }
          body { font-family: 'Inter', system-ui, sans-serif; color: #0f172a; background-color: #fff; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .header-container { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0f766e; padding-bottom: 20px; margin-bottom: 25px; }
          .logo-wrapper { max-width: 140px; }
          .header-info { text-align: right; }
          h1 { color: #0f766e; font-size: 20px; font-weight: 700; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: 0.5px; }
          .meta-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 1px; }
          .meta-value { font-size: 14px; font-weight: 500; color: #1e293b; margin: 2px 0 10px 0; }
          
          .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 25px; background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
          .info-item { font-size: 13px; color: #475569; line-height: 1.6; }
          .info-item strong { color: #0f172a; }
          
          .summary-cards { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; font-size: 13px; }
          .card-title { color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
          .card-value { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 6px; }
          .card-value.highlight { color: #0f766e; }
          .card-value.danger { color: #b91c1c; }
          
          h2 { color: #0f172a; font-size: 15px; font-weight: 700; text-transform: uppercase; margin: 25px 0 12px 0; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { background-color: #0f172a; color: #ffffff; text-transform: uppercase; font-size: 10px; font-weight: 600; letter-spacing: 1px; padding: 12px 14px; text-align: left; }
          th:first-child { border-top-left-radius: 6px; border-bottom-left-radius: 6px; }
          th:last-child { border-top-right-radius: 6px; border-bottom-right-radius: 6px; }
          td { border-bottom: 1px solid #e2e8f0; padding: 12px 14px; color: #334155; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .text-right { text-align: right; }
          .total-row { font-weight: 700; background-color: #f1f5f9 !important; color: #0f172a; }
          .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 35px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          tr { page-break-inside: avoid; }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="logo-wrapper">${logoHtml}</div>
          <div class="header-info">
            <h1>Reporte de Arqueo y Cierre</h1>
            <div class="meta-label">Fecha de Emisión</div>
            <div class="meta-value">${new Date().toLocaleDateString('es-NI')}</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <strong>Código de Turno:</strong> ${corte.codigo}<br>
            <strong>Cajero Apertura:</strong> ${corte.usuarioAperturaNombre || '-'}<br>
            <strong>Cajero Cierre:</strong> ${corte.usuarioCierreNombre || '-'}
          </div>
          <div class="info-item">
            <strong>Apertura:</strong> ${corte.fechaApertura ? new Date(corte.fechaApertura).toLocaleString('es-NI') : '-'}<br>
            <strong>Cierre:</strong> ${corte.fechaCierre ? new Date(corte.fechaCierre).toLocaleString('es-NI') : 'Aún abierto'}
          </div>
        </div>

        <h2>Resumen de Saldos</h2>
        <div class="summary-cards">
          <div class="card">
            <div class="card-title">Saldo Inicial (Apertura)</div>
            <div class="card-value">${formatMoney(corte.saldoInicial)}</div>
          </div>
          <div class="card">
            <div class="card-title">Ingresos Recaudados (Turno)</div>
            <div class="card-value highlight">+ ${formatMoney(corte.totalCobrado)}</div>
          </div>
          <div class="card">
            <div class="card-title">Saldo Esperado en Caja</div>
            <div class="card-value">${formatMoney(corte.saldoInicial + corte.totalCobrado)}</div>
          </div>
          <div class="card">
            <div class="card-title">Monto Físico Entregado</div>
            <div class="card-value">${formatMoney(corte.saldoCierre)}</div>
          </div>
        </div>

        <div style="margin-top: 15px; margin-bottom: 25px; padding: 16px; border-radius: 12px; border: 1px solid ${corte.diferencia < 0 ? '#fca5a5' : corte.diferencia > 0 ? '#86efac' : '#cbd5e1'}; background-color: ${corte.diferencia < 0 ? '#fef2f2' : corte.diferencia > 0 ? '#f0fdf4' : '#f8fafc'}; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 13px; font-weight: 600; color: ${corte.diferencia < 0 ? '#991b1b' : corte.diferencia > 0 ? '#166534' : '#334155'};">
            ESTADO DE LA DISCREPANCIA
          </div>
          <div style="font-size: 18px; font-weight: 800; color: ${corte.diferencia < 0 ? '#b91c1c' : corte.diferencia > 0 ? '#166534' : '#0f172a'};">
            ${diffText}
          </div>
        </div>

        <h2>Desglose de Ingresos Cobrados</h2>
        <table>
          <thead>
            <tr>
              <th style="border-top-left-radius: 6px; border-bottom-left-radius: 6px;">Concepto / Categoría</th>
              <th class="text-right" style="border-top-right-radius: 6px; border-bottom-right-radius: 6px;">Total Cobrado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-weight: 500;">Matrículas</td>
              <td class="text-right" style="font-weight: 600;">${formatMoney(corte.desglose?.matriculas?.cobrado)}</td>
            </tr>
            <tr>
              <td style="font-weight: 500;">Mensualidades</td>
              <td class="text-right" style="font-weight: 600;">${formatMoney(corte.desglose?.mensualidades?.cobrado)}</td>
            </tr>
            <tr>
              <td style="font-weight: 500;">Talleres</td>
              <td class="text-right" style="font-weight: 600;">${formatMoney(corte.desglose?.talleres?.cobrado)}</td>
            </tr>
            <tr class="total-row">
              <td>Total General Recaudado</td>
              <td class="text-right" style="color: #0f766e;">${formatMoney(corte.totalCobrado)}</td>
            </tr>
          </tbody>
        </table>

        ${corte.observacionCierre ? `
          <h2>Observaciones de Cierre</h2>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; font-size: 13px; color: #475569; line-height: 1.6; margin-top: 10px;">
            ${corte.observacionCierre}
          </div>
        ` : ''}

        <div class="footer">
          Centro Integral de Estimulación Temprana "Mi Casita" · Reporte Oficial de Caja
        </div>
      </body>
      </html>
    `

    const w = window.open('', '_blank')
    if (!w) {
      toast.error('Permite los popups para generar el reporte de cierre')
      return
    }
    w.document.write(html)
    w.document.close()
    setTimeout(() => {
      w.focus()
      w.print()
    }, 300)
  }

  useEffect(() => {
    let cancelled = false

    const loadResumen = async () => {
      if (!token) {
        setCajaResumen(null)
        return
      }

      try {
        const dashboard = await getCajaHistorialGeneral(token)
        if (!cancelled) {
          setCajaResumen(dashboard)
        }
      } catch {
      }
    }

    void loadResumen()

    return () => {
      cancelled = true
    }
  }, [token])

  const filteredData = useMemo(() => {
    if (!cajaResumen) {
      return {
        validTaller: [], validMatricula: [], validMensualidad: [],
        totalTaller: 0, totalMatricula: 0, totalMensualidad: 0, total: 0, combined: [], totalAnulado: 0, cantidadAnulados: 0
      }
    }

    let filterStart = new Date(0)
    let filterEnd = new Date()
    filterEnd.setHours(23, 59, 59, 999)

    if (periodFilter === 'custom') {
      if (dateFrom) filterStart = new Date(dateFrom + 'T00:00:00')
      if (dateTo) filterEnd = new Date(dateTo + 'T23:59:59.999')
    } else if (periodFilter !== 'all') {
      filterStart = new Date()
      filterStart.setDate(filterStart.getDate() - parseInt(periodFilter))
      filterStart.setHours(0, 0, 0, 0)
    }

    const isInsideDate = (dateStr?: string | null) => {
      if (!dateStr) return false

      const d = new Date(dateStr as string)
      return d >= filterStart && d <= filterEnd
    }

    const validTaller = (cajaResumen.pagosTaller || []).filter((p) => !p.anulado && isInsideDate(p.fechaPago))
    const validMatricula = (cajaResumen.pagosMatricula || []).filter((p) => !p.anulado && isInsideDate(p.fechaPago))
    const validMensualidad = (cajaResumen.mensualidades || []).filter((p) => !p.anulado && isInsideDate(p.fechaPago))

    const annulledTaller = (cajaResumen.pagosTaller || []).filter((p) => p.anulado && isInsideDate(p.fechaPago))
    const annulledMatricula = (cajaResumen.pagosMatricula || []).filter((p) => p.anulado && isInsideDate(p.fechaPago))
    const annulledMensualidad = (cajaResumen.mensualidades || []).filter((p) => p.anulado && isInsideDate(p.fechaPago))

    const totalTaller = validTaller.reduce((acc, curr) => acc + (curr.monto || 0), 0)
    const totalMatricula = validMatricula.reduce((acc, curr) => acc + (curr.monto || 0), 0)
    const totalMensualidad = validMensualidad.reduce((acc, curr) => acc + (curr.monto || 0), 0)
    const total = totalTaller + totalMatricula + totalMensualidad

    const totalAnulado = [...annulledTaller, ...annulledMatricula, ...annulledMensualidad].reduce((acc, curr) => acc + (curr.monto || 0), 0)
    const cantidadAnulados = annulledTaller.length + annulledMatricula.length + annulledMensualidad.length

    const combined = [
      ...validTaller.map((t) => ({ fecha: t.fechaPago, concepto: 'Taller', detalle: `${t.taller || 'Taller'} - ${t.participante || 'Sin nombre'}`, monto: t.monto, metodo: t.metodoPago, recibo: t.numeroRecibo })),
      ...validMatricula.map((m) => ({ fecha: m.fechaPago, concepto: 'Matrícula', detalle: m.estudiante, monto: m.monto, metodo: m.metodoPago, recibo: m.numeroRecibo })),
      ...validMensualidad.map((m) => ({ fecha: m.fechaPago, concepto: 'Mensualidad', detalle: m.estudiante + ' (Mes ' + m.mes + ')', monto: m.monto, metodo: m.metodoPago, recibo: m.numeroRecibo })),
    ].sort((a, b) => (b.fecha ? new Date(b.fecha as string).getTime() : 0) - (a.fecha ? new Date(a.fecha as string).getTime() : 0))

    return { validTaller, validMatricula, validMensualidad, totalTaller, totalMatricula, totalMensualidad, total, combined, totalAnulado, cantidadAnulados }
  }, [cajaResumen, periodFilter, dateFrom, dateTo])

  const talleresAgrupados = useMemo(() => {
    const map = new Map<string, { cantidad: number; total: number }>()
    filteredData.validTaller.forEach((t) => {
      const nombre = t.taller || 'Taller General'
      const actual = map.get(nombre) || { cantidad: 0, total: 0 }
      map.set(nombre, {
        cantidad: actual.cantidad + 1,
        total: actual.total + (t.monto || 0),
      })
    })
    return Array.from(map.entries())
      .map(([nombre, datos]) => ({ nombre, ...datos }))
      .sort((a, b) => b.total - a.total)
  }, [filteredData.validTaller])

  const totalTalleres = filteredData.totalTaller
  const totalMatriculas = filteredData.totalMatricula
  const totalMensualidades = filteredData.totalMensualidad
  const totalGeneral = filteredData.total

  const barChartData = {
    labels: ['Talleres', 'Matrícula', 'Mensualidad'],
    datasets: [
      {
        label: 'Ingresos',
        data: [totalTalleres, totalMatriculas, totalMensualidades],
        backgroundColor: ['#0f766e', '#0ea5e9', '#f59e0b'],
        borderRadius: 6,
      },
    ],
  }

  const doughnutChartData = {
    labels: ['Talleres', 'Matrícula', 'Mensualidad'],
    datasets: [
      {
        data: [totalTalleres, totalMatriculas, totalMensualidades],
        backgroundColor: ['#0f766e', '#0ea5e9', '#f59e0b'],
        borderWidth: 0,
      },
    ],
  }

  const printReport = () => {
    const logoHtml = `<div style="width: 150px; margin: 0 auto 10px;">${logoSvg}</div>`

    let filterLabel = ''
    if (periodFilter === 'custom') {
      if (dateFrom && dateTo) {
         filterLabel = `Desde ${new Date(dateFrom + 'T00:00:00').toLocaleDateString('es-NI')} hasta ${new Date(dateTo + 'T00:00:00').toLocaleDateString('es-NI')}`
      } else if (dateFrom) {
         filterLabel = `Desde ${new Date(dateFrom + 'T00:00:00').toLocaleDateString('es-NI')}`
      } else if (dateTo) {
         filterLabel = `Hasta ${new Date(dateTo + 'T00:00:00').toLocaleDateString('es-NI')}`
      } else {
         filterLabel = 'Personalizado'
      }
    } else {
      filterLabel = periodFilter === '0' ? 'Hoy' : periodFilter === '7' ? 'Últimos 7 días' : periodFilter === '15' ? 'Últimos 15 días' : periodFilter === '30' ? 'Último mes' : 'Histórico Completo'
    }
    
    let tallerInsights = ''
    if (talleresAgrupados.length > 0) {
      const masRentable = talleresAgrupados[0]
      const masVendido = [...talleresAgrupados].sort((a, b) => b.cantidad - a.cantidad)[0]
      
      tallerInsights = `
        <div style="display: flex; gap: 20px; margin-top: 15px; margin-bottom: 25px;">
          <div style="flex: 1; background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 12px;">
            <p style="margin: 0 0 6px 0; font-size: 10px; color: #166534; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Mayor Recaudación</p>
            <p style="margin: 0; font-size: 15px; font-weight: 700; color: #14532d;">${masRentable.nombre}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 600; color: #15803d;">${formatMoney(masRentable.total)}</p>
          </div>
          <div style="flex: 1; background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 16px; border-radius: 12px;">
            <p style="margin: 0 0 6px 0; font-size: 10px; color: #075985; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Más Inscripciones</p>
            <p style="margin: 0; font-size: 15px; font-weight: 700; color: #0c4a6e;">${masVendido.nombre}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 600; color: #0369a1;">${masVendido.cantidad} inscripciones</p>
          </div>
        </div>
      `
    }

    let reportBody = ''
    let reportTitle = 'Reporte de Ingresos'

    if (reportType === 'general') {
      reportTitle = 'Reporte de Ingresos General'
      reportBody = `
        <h2>Resumen General por Concepto</h2>
        <table>
          <thead>
            <tr>
              <th style="border-top-left-radius: 6px; border-bottom-left-radius: 6px;">Concepto</th>
              <th class="text-right">Cantidad de Pagos</th>
              <th class="text-right" style="border-top-right-radius: 6px; border-bottom-right-radius: 6px;">Total Recaudado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-weight: 500;">Talleres</td>
              <td class="text-right">${filteredData.validTaller.length}</td>
              <td class="text-right" style="font-weight: 600;">${formatMoney(filteredData.totalTaller)}</td>
            </tr>
            <tr>
              <td style="font-weight: 500;">Matrícula</td>
              <td class="text-right">${filteredData.validMatricula.length}</td>
              <td class="text-right" style="font-weight: 600;">${formatMoney(filteredData.totalMatricula)}</td>
            </tr>
            <tr>
              <td style="font-weight: 500;">Mensualidad</td>
              <td class="text-right">${filteredData.validMensualidad.length}</td>
              <td class="text-right" style="font-weight: 600;">${formatMoney(filteredData.totalMensualidad)}</td>
            </tr>
            <tr style="color: #b91c1c; font-weight: 500;">
              <td>Anulaciones (No suman al total)</td>
              <td class="text-right">${filteredData.cantidadAnulados}</td>
              <td class="text-right">-${formatMoney(filteredData.totalAnulado)}</td>
            </tr>
            <tr class="total-row">
              <td>TOTAL INGRESOS NETOS</td>
              <td class="text-right">${filteredData.combined.length}</td>
              <td class="text-right" style="color: #0f766e;">${formatMoney(filteredData.total)}</td>
            </tr>
          </tbody>
        </table>

        <h2>Desglose por Talleres</h2>
        ${tallerInsights}
        <table>
          <thead>
            <tr>
              <th style="border-top-left-radius: 6px; border-bottom-left-radius: 6px;">Nombre del Taller</th>
              <th class="text-right">Inscripciones Pagadas</th>
              <th class="text-right" style="border-top-right-radius: 6px; border-bottom-right-radius: 6px;">Total Recaudado</th>
            </tr>
          </thead>
          <tbody>
            ${talleresAgrupados.map(t => `
              <tr>
                <td style="font-weight: 500;">${t.nombre}</td>
                <td class="text-right">${t.cantidad}</td>
                <td class="text-right" style="font-weight: 600; color: #0f766e;">${formatMoney(t.total)}</td>
              </tr>
            `).join('')}
            ${talleresAgrupados.length === 0 ? '<tr><td colspan="3" style="text-align:center; padding: 15px;">No hay ingresos por talleres</td></tr>' : ''}
          </tbody>
        </table>

        <h2>Ingresos Clasificados (Desglose General)</h2>
        <table>
          <thead>
            <tr>
              <th style="border-top-left-radius: 6px; border-bottom-left-radius: 6px;">Fecha</th>
              <th>Nº Recibo</th>
              <th>Concepto</th>
              <th>Detalle / Estudiante</th>
              <th>Método</th>
              <th class="text-right" style="border-top-right-radius: 6px; border-bottom-right-radius: 6px;">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.combined.map(item => `
              <tr>
                <td>${item.fecha ? new Date(item.fecha as string).toLocaleDateString('es-NI') : '-'}</td>
                <td style="font-weight: 600;">${item.recibo || '-'}</td>
                <td><span class="badge" style="background-color: ${
                  item.concepto === 'Taller' ? '#e6f4ea' : item.concepto === 'Matrícula' ? '#e0f2fe' : '#fef3c7'
                }; color: ${
                  item.concepto === 'Taller' ? '#137333' : item.concepto === 'Matrícula' ? '#0369a1' : '#b45309'
                }; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 700;">${item.concepto}</span></td>
                <td>${item.detalle || '-'}</td>
                <td>${item.metodo || '-'}</td>
                <td class="text-right" style="font-weight: 600;">${formatMoney(item.monto)}</td>
              </tr>
            `).join('')}
            ${filteredData.combined.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding: 20px;">No hay ingresos registrados en este periodo</td></tr>' : ''}
          </tbody>
        </table>
      `
    } else if (reportType === 'talleres') {
      reportTitle = 'Reporte Desglosado de Talleres'
      reportBody = `
        ${tallerInsights}

        <h2>Resumen de Talleres</h2>
        <table>
          <thead>
            <tr>
              <th style="border-top-left-radius: 6px; border-bottom-left-radius: 6px;">Nombre del Taller</th>
              <th class="text-right">Inscripciones Pagadas</th>
              <th class="text-right" style="border-top-right-radius: 6px; border-bottom-right-radius: 6px;">Total Recaudado</th>
            </tr>
          </thead>
          <tbody>
            ${talleresAgrupados.map(t => `
              <tr>
                <td style="font-weight: 500;">${t.nombre}</td>
                <td class="text-right">${t.cantidad}</td>
                <td class="text-right" style="font-weight: 600; color: #0f766e;">${formatMoney(t.total)}</td>
              </tr>
            `).join('')}
            ${talleresAgrupados.length === 0 ? '<tr><td colspan="3" style="text-align:center; padding: 15px;">No hay ingresos por talleres</td></tr>' : ''}
            <tr class="total-row">
              <td>TOTAL TALLERES</td>
              <td class="text-right">${filteredData.validTaller.length}</td>
              <td class="text-right" style="color: #0f766e;">${formatMoney(filteredData.totalTaller)}</td>
            </tr>
          </tbody>
        </table>

        <h2>Detalle de Ingresos por Taller</h2>
        <table>
          <thead>
            <tr>
              <th style="border-top-left-radius: 6px; border-bottom-left-radius: 6px;">Fecha</th>
              <th>Nº Recibo</th>
              <th>Taller / Participante</th>
              <th>Método</th>
              <th class="text-right" style="border-top-right-radius: 6px; border-bottom-right-radius: 6px;">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.validTaller.map(item => `
              <tr>
                <td>${item.fechaPago ? new Date(item.fechaPago as string).toLocaleDateString('es-NI') : '-'}</td>
                <td style="font-weight: 600;">${item.numeroRecibo || '-'}</td>
                <td>${item.taller || 'Taller'} - ${item.participante || 'Sin nombre'}</td>
                <td>${item.metodoPago || '-'}</td>
                <td class="text-right" style="font-weight: 600;">${formatMoney(item.monto)}</td>
              </tr>
            `).join('')}
            ${filteredData.validTaller.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 20px;">No hay ingresos de talleres en este periodo</td></tr>' : ''}
          </tbody>
        </table>
      `
    } else if (reportType === 'matriculas') {
      reportTitle = 'Reporte Desglosado de Matrículas'
      reportBody = `
        <h2>Detalle de Ingresos por Matrícula</h2>
        <table>
          <thead>
            <tr>
              <th style="border-top-left-radius: 6px; border-bottom-left-radius: 6px;">Fecha</th>
              <th>Nº Recibo</th>
              <th>Estudiante</th>
              <th>Método</th>
              <th class="text-right" style="border-top-right-radius: 6px; border-bottom-right-radius: 6px;">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.validMatricula.map(item => `
              <tr>
                <td>${item.fechaPago ? new Date(item.fechaPago as string).toLocaleDateString('es-NI') : '-'}</td>
                <td style="font-weight: 600;">${item.numeroRecibo || '-'}</td>
                <td>${item.estudiante || 'Sin nombre'}</td>
                <td>${item.metodoPago || '-'}</td>
                <td class="text-right" style="font-weight: 600;">${formatMoney(item.monto)}</td>
              </tr>
            `).join('')}
            ${filteredData.validMatricula.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 20px;">No hay ingresos de matrículas en este periodo</td></tr>' : ''}
            <tr class="total-row">
              <td colspan="4">TOTAL MATRÍCULAS</td>
              <td class="text-right" style="color: #0f766e;">${formatMoney(filteredData.totalMatricula)}</td>
            </tr>
          </tbody>
        </table>
      `
    } else if (reportType === 'mensualidades') {
      reportTitle = 'Reporte Desglosado de Mensualidades'
      reportBody = `
        <h2>Detalle de Ingresos por Mensualidad</h2>
        <table>
          <thead>
            <tr>
              <th style="border-top-left-radius: 6px; border-bottom-left-radius: 6px;">Fecha</th>
              <th>Nº Recibo</th>
              <th>Estudiante (Mes)</th>
              <th>Método</th>
              <th class="text-right" style="border-top-right-radius: 6px; border-bottom-right-radius: 6px;">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.validMensualidad.map(item => `
              <tr>
                <td>${item.fechaPago ? new Date(item.fechaPago as string).toLocaleDateString('es-NI') : '-'}</td>
                <td style="font-weight: 600;">${item.numeroRecibo || '-'}</td>
                <td>${item.estudiante || 'Sin nombre'} (Mes ${item.mes})</td>
                <td>${item.metodoPago || '-'}</td>
                <td class="text-right" style="font-weight: 600;">${formatMoney(item.monto)}</td>
              </tr>
            `).join('')}
            ${filteredData.validMensualidad.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 20px;">No hay ingresos de mensualidades en este periodo</td></tr>' : ''}
            <tr class="total-row">
              <td colspan="4">TOTAL MENSUALIDADES</td>
              <td class="text-right" style="color: #0f766e;">${formatMoney(filteredData.totalMensualidad)}</td>
            </tr>
          </tbody>
        </table>
      `
    }

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${reportTitle} - Mi Casita</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          @page { size: A4 landscape; margin: 15mm 10mm; }
          body { font-family: 'Inter', system-ui, sans-serif; color: #0f172a; background-color: #fff; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .header-container { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0f766e; padding-bottom: 15px; margin-bottom: 20px; }
          .logo-wrapper { max-width: 140px; }
          .header-info { text-align: right; }
          h1 { color: #0f766e; font-size: 20px; font-weight: 700; text-transform: uppercase; margin: 0 0 4px 0; letter-spacing: 0.5px; }
          .meta-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 1px; }
          .meta-value { font-size: 13px; font-weight: 500; color: #1e293b; margin: 2px 0 0 0; }
          
          .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 20px; background: #f8fafc; padding: 12px 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
          .info-item { font-size: 12px; color: #475569; line-height: 1.5; }
          .info-item strong { color: #0f172a; }
          
          h2 { color: #0f172a; font-size: 14px; font-weight: 700; text-transform: uppercase; margin: 25px 0 10px 0; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          th { background-color: #0f172a; color: #ffffff; text-transform: uppercase; font-size: 9px; font-weight: 600; letter-spacing: 1.5px; padding: 10px 12px; text-align: left; }
          th:first-child { border-top-left-radius: 6px; border-bottom-left-radius: 6px; }
          th:last-child { border-top-right-radius: 6px; border-bottom-right-radius: 6px; }
          td { border-bottom: 1px solid #e2e8f0; padding: 10px 12px; color: #334155; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .text-right { text-align: right; }
          .total-row { font-weight: 700; background-color: #f1f5f9 !important; color: #0f172a; font-size: 12px; }
          .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; background-color: #f1f5f9; color: #475569; }
          .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          tr { page-break-inside: avoid; }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="logo-wrapper">${logoHtml}</div>
          <div class="header-info">
            <h1>${reportTitle}</h1>
            <div class="meta-label">Periodo</div>
            <div class="meta-value">${filterLabel}</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <strong>Generador por:</strong> ${user?.nombre || 'Usuario'} ${user?.apellido || ''}<br>
            <strong>Rol de usuario:</strong> Administrador
          </div>
          <div class="info-item">
            <strong>Fecha de Reporte:</strong> ${new Date().toLocaleString('es-NI')}<br>
            <strong>Centro:</strong> Mi Casita
          </div>
        </div>

        ${reportBody}

        <div class="footer">
          Centro Integral de Estimulación Temprana "Mi Casita" · Reporte Oficial de Ingresos
        </div>
      </body>
      </html>
    `

    const w = window.open('', '_blank')
    if (!w) {
      toast.error('Permite los popups para generar el reporte PDF')
      return
    }
    w.document.write(html)
    w.document.close()
    setTimeout(() => {
      w.focus()
      w.print()
    }, 300)
  }

  return (
    <div className="flex flex-col gap-6">
      <PanelShell
        title={`Bienvenido, ${user?.nombre ?? 'usuario'}`}
        subtitle="Genera reportes y analiza los ingresos financieros."
      >
        {/* Selector de Pestañas (Tabs) */}
        <div className="border-b border-slate-200 mt-2">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('ingresos')}
              className={`pb-3 text-sm font-semibold transition-all border-b-2 px-1 ${
                activeTab === 'ingresos'
                  ? 'border-teal-700 text-teal-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Ingresos y Gráficos
            </button>
            <button
              onClick={() => setActiveTab('cortes')}
              className={`pb-3 text-sm font-semibold transition-all border-b-2 px-1 ${
                activeTab === 'cortes'
                  ? 'border-teal-700 text-teal-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Cierres de Caja (Cortes)
            </button>
          </div>
        </div>

        {activeTab === 'ingresos' ? (
          <>
            <div className="mb-6 mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-slate-700">Desde:</label>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => { 
                  const val = e.target.value; 
                  setDateFrom(val); 
                  if (val) setPeriodFilter('custom'); 
                  if (val && dateTo && val > dateTo) setDateTo(val);
                }}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-slate-700">Hasta:</label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => { 
                  const val = e.target.value; 
                  setDateTo(val); 
                  if (val) setPeriodFilter('custom'); 
                  if (val && dateFrom && val < dateFrom) setDateFrom(val);
                }}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-slate-700">O rápido:</label>
              <select 
                value={periodFilter} 
                onChange={(e) => { setPeriodFilter(e.target.value as any); if (e.target.value !== 'custom') { setDateFrom(''); setDateTo(''); } }}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              >
                <option value="0">Hoy</option>
                <option value="7">Últimos 7 días</option>
                <option value="15">Últimos 15 días</option>
                <option value="30">Último mes</option>
                <option value="all">Todo el histórico</option>
                <option value="custom" className="hidden">Personalizado</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-slate-700">Tipo de reporte:</label>
              <select 
                value={reportType} 
                onChange={(e) => setReportType(e.target.value as any)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              >
                <option value="general">General</option>
                <option value="talleres">Desglosado de Talleres</option>
                <option value="matriculas">Desglosado de Matrículas</option>
                <option value="mensualidades">Desglosado de Mensualidades</option>
              </select>
            </div>
          </div>
          
          <button
            type="button"
            onClick={printReport}
            className="inline-flex items-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            <Printer className="mr-2 h-4 w-4" />
            Generar Reporte PDF
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          <MetricCard label="Recaudado talleres" value={formatMoney(totalTalleres)} detail="En el periodo seleccionado" />
          <MetricCard label="Recaudado matrícula" value={formatMoney(totalMatriculas)} detail="En el periodo seleccionado" />
          <MetricCard label="Recaudado mensualidad" value={formatMoney(totalMensualidades)} detail="En el periodo seleccionado" />
          <MetricCard label="Recaudado total" value={formatMoney(totalGeneral)} detail="Suma total en el periodo" />
          <MetricCard label="Total anulado" value={formatMoney(filteredData.totalAnulado)} detail={`${filteredData.cantidadAnulados} operaciones anuladas`} />
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Recaudación por Concepto</p>
            <div className="mt-4 h-[250px]">
              <Bar
                data={barChartData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, ticks: { callback: (value) => formatMoney(Number(value)) } },
                    x: { grid: { display: false } }
                  },
                }}
              />
            </div>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Distribución de Ingresos</p>
            <div className="mt-4 flex h-[250px] items-center justify-center">
              <Doughnut
                data={doughnutChartData}
                options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }}
              />
            </div>
          </article>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.5fr]">
          <ResumenFinancieroSection data={filteredData} />

          <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Ingresos Clasificados</p>
                <p className="mt-1 text-sm text-slate-600">Desglose de operaciones en el periodo.</p>
              </div>
              <select
                value={conceptFilter}
                onChange={(e) => setConceptFilter(e.target.value as any)}
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500"
              >
                <option value="all">Todos los conceptos</option>
                <option value="Taller">Solo Talleres</option>
                <option value="Matrícula">Solo Matrícula</option>
                <option value="Mensualidad">Solo Mensualidad</option>
              </select>
            </div>
            
            <div className="mt-4 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="max-h-[320px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-slate-600 shadow-sm z-10">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                      <th className="px-4 py-3 text-left font-semibold">Recibo</th>
                      <th className="px-4 py-3 text-left font-semibold">Concepto</th>
                      <th className="px-4 py-3 text-left font-semibold">Detalle</th>
                      <th className="px-4 py-3 text-right font-semibold">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const displayed = filteredData.combined.filter(item => conceptFilter === 'all' || item.concepto === conceptFilter)
                      if (displayed.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                              No hay registros en este periodo o para este filtro.
                            </td>
                          </tr>
                        )
                      }
                      return displayed.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-slate-500">{item.fecha ? new Date(item.fecha as string).toLocaleDateString('es-NI') : '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{item.recibo || '-'}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                              {item.concepto}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 truncate max-w-[180px]" title={item.detalle}>{item.detalle || '-'}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-900">{formatMoney(item.monto)}</td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-6">
          <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Desglose por Talleres</p>
            <p className="mt-1 text-sm text-slate-600">Recaudación detallada por cada taller impartido en el periodo.</p>
            
            {talleresAgrupados.length > 0 && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Mayor Recaudación</p>
                  <p className="mt-1 font-semibold text-emerald-900">{talleresAgrupados[0].nombre}</p>
                  <p className="text-sm font-medium text-emerald-800">{formatMoney(talleresAgrupados[0].total)}</p>
                </div>
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-700">Más Inscripciones</p>
                  <p className="mt-1 font-semibold text-sky-900">
                    {[...talleresAgrupados].sort((a, b) => b.cantidad - a.cantidad)[0].nombre}
                  </p>
                  <p className="text-sm font-medium text-sky-800">
                    {[...talleresAgrupados].sort((a, b) => b.cantidad - a.cantidad)[0].cantidad} inscritos
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-white text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Nombre del Taller</th>
                    <th className="px-4 py-3 text-right font-semibold">Inscripciones Pagadas</th>
                    <th className="px-4 py-3 text-right font-semibold">Total Recaudado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {talleresAgrupados.map((taller, idx) => (
                    <tr key={idx} className="transition-colors hover:bg-white">
                      <td className="px-4 py-3 font-medium text-slate-900">{taller.nombre}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{taller.cantidad}</td>
                      <td className="px-4 py-3 text-right font-semibold text-teal-700">{formatMoney(taller.total)}</td>
                    </tr>
                  ))}
                  {talleresAgrupados.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                        No hay pagos de talleres registrados en este periodo.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </article>
        </div>
          </>
        ) : (
          <div className="mt-4 flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div>
                <h4 className="text-base font-bold text-slate-900">Historial de Turnos y Cortes</h4>
                <p className="text-sm text-slate-600">Registro histórico de las sesiones de caja y arqueos confirmados.</p>
              </div>
              <button
                onClick={() => setCortesList(null)}
                disabled={isLoadingCortes}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition"
              >
                {isLoadingCortes ? 'Actualizando...' : 'Actualizar Lista'}
              </button>
            </div>

            {isLoadingCortes ? (
              <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700"></div>
                  <p className="text-sm text-slate-500 font-medium">Cargando cortes de caja...</p>
                </div>
              </div>
            ) : !cortesList || cortesList.length === 0 ? (
              <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                <p className="text-slate-500 font-medium">No se encontraron sesiones de caja registradas.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Código</th>
                        <th className="px-4 py-3 text-left font-semibold">Apertura</th>
                        <th className="px-4 py-3 text-left font-semibold">Cierre</th>
                        <th className="px-4 py-3 text-left font-semibold">Cajero(s)</th>
                        <th className="px-4 py-3 text-right font-semibold">Monto Inicial</th>
                        <th className="px-4 py-3 text-right font-semibold">Recaudado</th>
                        <th className="px-4 py-3 text-right font-semibold">Saldo Cierre</th>
                        <th className="px-4 py-3 text-right font-semibold">Diferencia</th>
                        <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cortesList.map((corte) => {
                        const cajeros = corte.usuarioAperturaNombre === corte.usuarioCierreNombre || !corte.usuarioCierreNombre
                          ? corte.usuarioAperturaNombre || '-'
                          : `${corte.usuarioAperturaNombre} / ${corte.usuarioCierreNombre}`;

                        return (
                          <tr key={corte.sessionId} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-800">{corte.codigo}</td>
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                              {corte.fechaApertura ? new Date(corte.fechaApertura).toLocaleString('es-NI') : '-'}
                            </td>
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                              {corte.fechaCierre ? new Date(corte.fechaCierre).toLocaleString('es-NI') : (
                                <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                  Activo (Abierto)
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-700 truncate max-w-[140px]" title={cajeros}>
                              {cajeros}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">{formatMoney(corte.saldoInicial)}</td>
                            <td className="px-4 py-3 text-right text-teal-700 font-medium">+{formatMoney(corte.totalCobrado)}</td>
                            <td className="px-4 py-3 text-right text-slate-800 font-medium">
                              {corte.saldoCierre !== null && corte.saldoCierre !== undefined ? formatMoney(corte.saldoCierre) : '-'}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">
                              {corte.diferencia !== null && corte.diferencia !== undefined ? (
                                <span className={corte.diferencia < 0 ? 'text-rose-600' : corte.diferencia > 0 ? 'text-emerald-600' : 'text-slate-500'}>
                                  {corte.diferencia > 0 ? '+' : ''}{formatMoney(corte.diferencia)}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setSelectedCorte(corte)}
                                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                                >
                                  Ver Arqueo
                                </button>
                                <button
                                  onClick={() => printCorteDetail(corte)}
                                  className="rounded-lg border border-teal-300 bg-white px-2.5 py-1 text-xs font-semibold text-teal-700 shadow-sm hover:bg-teal-55 transition"
                                >
                                  Imprimir
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal de Detalle de Arqueo */}
        {selectedCorte && createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setSelectedCorte(null)} />
            <div className="relative w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">Arqueo de Caja - Turno {selectedCorte.codigo}</h4>
                  <p className="text-sm text-slate-600">Desglose de saldos y transacciones del cierre.</p>
                </div>
                <button onClick={() => setSelectedCorte(null)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">✕</button>
              </div>

              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <p className="text-xs text-slate-500 font-medium">Apertura</p>
                    <p className="text-sm font-semibold text-slate-700">{selectedCorte.fechaApertura ? new Date(selectedCorte.fechaApertura).toLocaleString('es-NI') : '-'}</p>
                    <p className="text-xs text-slate-500 mt-1">Cajero: {selectedCorte.usuarioAperturaNombre || '-'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <p className="text-xs text-slate-500 font-medium">Cierre</p>
                    <p className="text-sm font-semibold text-slate-700">{selectedCorte.fechaCierre ? new Date(selectedCorte.fechaCierre).toLocaleString('es-NI') : 'Aún Abierto'}</p>
                    <p className="text-xs text-slate-500 mt-1">Cajero: {selectedCorte.usuarioCierreNombre || '-'}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/30 p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Saldo Inicial</span>
                    <span className="font-semibold text-slate-800">{formatMoney(selectedCorte.saldoInicial)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Ingresos Turno</span>
                    <span className="font-semibold text-teal-700">+{formatMoney(selectedCorte.totalCobrado)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Anulado</span>
                    <span className="font-semibold text-rose-700">-{formatMoney(selectedCorte.totalAnulado)}</span>
                  </div>
                  <hr className="border-slate-200" />
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-800">Saldo Esperado en Caja</span>
                    <span className="text-slate-900">{formatMoney(selectedCorte.saldoInicial + selectedCorte.totalCobrado)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-800">Saldo Cierre Real Contado</span>
                    <span className="text-slate-900">{formatMoney(selectedCorte.saldoCierre)}</span>
                  </div>
                  <div className={`flex justify-between text-sm font-bold p-2 rounded-lg ${selectedCorte.diferencia < 0 ? 'bg-rose-50 text-rose-800' : selectedCorte.diferencia > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                    <span>Discrepancia (Diferencia)</span>
                    <span>
                      {selectedCorte.diferencia > 0 ? '+' : ''}
                      {formatMoney(selectedCorte.diferencia)}
                    </span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2 text-left">Categoría</th>
                        <th className="px-4 py-2 text-right">Recaudado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-4 py-2 text-slate-700">Matrículas</td>
                        <td className="px-4 py-2 text-right font-medium text-slate-900">{formatMoney(selectedCorte.desglose?.matriculas?.cobrado)}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-700">Mensualidades</td>
                        <td className="px-4 py-2 text-right font-medium text-slate-900">{formatMoney(selectedCorte.desglose?.mensualidades?.cobrado)}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-700">Talleres</td>
                        <td className="px-4 py-2 text-right font-medium text-slate-900">{formatMoney(selectedCorte.desglose?.talleres?.cobrado)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {selectedCorte.observacionCierre && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500 font-medium">Observaciones de Cierre</p>
                    <p className="text-sm text-slate-600 mt-1 italic">"{selectedCorte.observacionCierre}"</p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => printCorteDetail(selectedCorte)} className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
                    Imprimir Arqueo
                  </button>
                  <button type="button" onClick={() => setSelectedCorte(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Cerrar Vista
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </PanelShell>
    </div>
  )
}