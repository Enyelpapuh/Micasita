import { useEffect, useState, useMemo } from 'react'
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
import { getCajaHistorialGeneral } from './caja.api'
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
        <div style="display: flex; gap: 20px; margin-top: 10px; margin-bottom: 20px;">
          <div style="flex: 1; background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px;">
            <p style="margin: 0 0 5px 0; font-size: 12px; color: #166534; text-transform: uppercase; font-weight: bold;">Mayor Recaudación</p>
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #14532d;">${masRentable.nombre}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #15803d;">${formatMoney(masRentable.total)}</p>
          </div>
          <div style="flex: 1; background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 15px; border-radius: 8px;">
            <p style="margin: 0 0 5px 0; font-size: 12px; color: #075985; text-transform: uppercase; font-weight: bold;">Más Inscripciones</p>
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #0c4a6e;">${masVendido.nombre}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #0369a1;">${masVendido.cantidad} inscritos</p>
          </div>
        </div>
      `
    }

    let reportBody = ''

    if (reportType === 'general') {
      reportBody = `
        <div class="header">
          <h1>Reporte de Ingresos</h1>
          <p class="meta"><strong>Periodo:</strong> ${filterLabel}</p>
          <p class="meta"><strong>Generado el:</strong> ${new Date().toLocaleString('es-NI')}</p>
          <p class="meta"><strong>Usuario en sesión:</strong> ${user?.nombre} ${user?.apellido || ''}</p>
        </div>

        <h2>Resumen General por Concepto</h2>
        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th class="text-right">Cantidad de Pagos</th>
              <th class="text-right">Total Recaudado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Talleres</td>
              <td class="text-right">${filteredData.validTaller.length}</td>
              <td class="text-right">${formatMoney(filteredData.totalTaller)}</td>
            </tr>
            <tr>
              <td>Matrícula</td>
              <td class="text-right">${filteredData.validMatricula.length}</td>
              <td class="text-right">${formatMoney(filteredData.totalMatricula)}</td>
            </tr>
            <tr>
              <td>Mensualidad</td>
              <td class="text-right">${filteredData.validMensualidad.length}</td>
              <td class="text-right">${formatMoney(filteredData.totalMensualidad)}</td>
            </tr>
            <tr style="color: #b91c1c;">
              <td>Anulaciones (No suman al total)</td>
              <td class="text-right">${filteredData.cantidadAnulados}</td>
              <td class="text-right">-${formatMoney(filteredData.totalAnulado)}</td>
            </tr>
            <tr class="total-row">
              <td>TOTAL INGRESOS NETOS</td>
              <td class="text-right">${filteredData.combined.length}</td>
              <td class="text-right">${formatMoney(filteredData.total)}</td>
            </tr>
          </tbody>
        </table>

        <h2>Desglose por Talleres</h2>
        ${tallerInsights}
        <table>
          <thead>
            <tr>
              <th>Nombre del Taller</th>
              <th class="text-right">Inscripciones Pagadas</th>
              <th class="text-right">Total Recaudado</th>
            </tr>
          </thead>
          <tbody>
            ${talleresAgrupados.map(t => `
              <tr>
                <td>${t.nombre}</td>
                <td class="text-right">${t.cantidad}</td>
                <td class="text-right" style="font-weight: 500; color: #0f766e;">${formatMoney(t.total)}</td>
              </tr>
            `).join('')}
            ${talleresAgrupados.length === 0 ? '<tr><td colspan="3" style="text-align:center; padding: 15px;">No hay ingresos por talleres</td></tr>' : ''}
          </tbody>
        </table>

        <h2>Ingresos Clasificados (Desglose General)</h2>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Nº Recibo</th>
              <th>Concepto</th>
              <th>Detalle / Estudiante</th>
              <th>Método</th>
              <th class="text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.combined.map(item => `
              <tr>
                <td>${item.fecha ? new Date(item.fecha as string).toLocaleDateString('es-NI') : '-'}</td>
                <td>${item.recibo || '-'}</td>
                <td><span class="badge">${item.concepto}</span></td>
                <td>${item.detalle || '-'}</td>
                <td>${item.metodo || '-'}</td>
                <td class="text-right" style="font-weight: 500;">${formatMoney(item.monto)}</td>
              </tr>
            `).join('')}
            ${filteredData.combined.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding: 20px;">No hay ingresos registrados en este periodo</td></tr>' : ''}
          </tbody>
        </table>
      `
    } else if (reportType === 'talleres') {
      reportBody = `
        <div class="header">
          <h1>Reporte Desglosado de Talleres</h1>
          <p class="meta"><strong>Periodo:</strong> ${filterLabel}</p>
          <p class="meta"><strong>Generado el:</strong> ${new Date().toLocaleString('es-NI')}</p>
          <p class="meta"><strong>Usuario en sesión:</strong> ${user?.nombre} ${user?.apellido || ''}</p>
        </div>

        ${tallerInsights}

        <h2>Resumen de Talleres</h2>
        <table>
          <thead>
            <tr>
              <th>Nombre del Taller</th>
              <th class="text-right">Inscripciones Pagadas</th>
              <th class="text-right">Total Recaudado</th>
            </tr>
          </thead>
          <tbody>
            ${talleresAgrupados.map(t => `
              <tr>
                <td>${t.nombre}</td>
                <td class="text-right">${t.cantidad}</td>
                <td class="text-right" style="font-weight: 500; color: #0f766e;">${formatMoney(t.total)}</td>
              </tr>
            `).join('')}
            ${talleresAgrupados.length === 0 ? '<tr><td colspan="3" style="text-align:center; padding: 15px;">No hay ingresos por talleres</td></tr>' : ''}
            <tr class="total-row">
              <td>TOTAL TALLERES</td>
              <td class="text-right">${filteredData.validTaller.length}</td>
              <td class="text-right">${formatMoney(filteredData.totalTaller)}</td>
            </tr>
          </tbody>
        </table>

        <h2>Detalle de Ingresos por Taller</h2>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Nº Recibo</th>
              <th>Taller / Participante</th>
              <th>Método</th>
              <th class="text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.validTaller.map(item => `
              <tr>
                <td>${item.fechaPago ? new Date(item.fechaPago as string).toLocaleDateString('es-NI') : '-'}</td>
                <td>${item.numeroRecibo || '-'}</td>
                <td>${item.taller || 'Taller'} - ${item.participante || 'Sin nombre'}</td>
                <td>${item.metodoPago || '-'}</td>
                <td class="text-right" style="font-weight: 500;">${formatMoney(item.monto)}</td>
              </tr>
            `).join('')}
            ${filteredData.validTaller.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 20px;">No hay ingresos de talleres en este periodo</td></tr>' : ''}
          </tbody>
        </table>
      `
    } else if (reportType === 'matriculas') {
      reportBody = `
        <div class="header">
          <h1>Reporte Desglosado de Matrículas</h1>
          <p class="meta"><strong>Periodo:</strong> ${filterLabel}</p>
          <p class="meta"><strong>Generado el:</strong> ${new Date().toLocaleString('es-NI')}</p>
          <p class="meta"><strong>Usuario en sesión:</strong> ${user?.nombre} ${user?.apellido || ''}</p>
        </div>

        <h2>Detalle de Ingresos por Matrícula</h2>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Nº Recibo</th>
              <th>Estudiante</th>
              <th>Método</th>
              <th class="text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.validMatricula.map(item => `
              <tr>
                <td>${item.fechaPago ? new Date(item.fechaPago as string).toLocaleDateString('es-NI') : '-'}</td>
                <td>${item.numeroRecibo || '-'}</td>
                <td>${item.estudiante || 'Sin nombre'}</td>
                <td>${item.metodoPago || '-'}</td>
                <td class="text-right" style="font-weight: 500;">${formatMoney(item.monto)}</td>
              </tr>
            `).join('')}
            ${filteredData.validMatricula.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 20px;">No hay ingresos de matrículas en este periodo</td></tr>' : ''}
            <tr class="total-row">
              <td colspan="4">TOTAL MATRÍCULAS</td>
              <td class="text-right">${formatMoney(filteredData.totalMatricula)}</td>
            </tr>
          </tbody>
        </table>
      `
    } else if (reportType === 'mensualidades') {
      reportBody = `
        <div class="header">
          <h1>Reporte Desglosado de Mensualidades</h1>
          <p class="meta"><strong>Periodo:</strong> ${filterLabel}</p>
          <p class="meta"><strong>Generado el:</strong> ${new Date().toLocaleString('es-NI')}</p>
          <p class="meta"><strong>Usuario en sesión:</strong> ${user?.nombre} ${user?.apellido || ''}</p>
        </div>

        <h2>Detalle de Ingresos por Mensualidad</h2>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Nº Recibo</th>
              <th>Estudiante (Mes)</th>
              <th>Método</th>
              <th class="text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.validMensualidad.map(item => `
              <tr>
                <td>${item.fechaPago ? new Date(item.fechaPago as string).toLocaleDateString('es-NI') : '-'}</td>
                <td>${item.numeroRecibo || '-'}</td>
                <td>${item.estudiante || 'Sin nombre'} (Mes ${item.mes})</td>
                <td>${item.metodoPago || '-'}</td>
                <td class="text-right" style="font-weight: 500;">${formatMoney(item.monto)}</td>
              </tr>
            `).join('')}
            ${filteredData.validMensualidad.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 20px;">No hay ingresos de mensualidades en este periodo</td></tr>' : ''}
            <tr class="total-row">
              <td colspan="4">TOTAL MENSUALIDADES</td>
              <td class="text-right">${formatMoney(filteredData.totalMensualidad)}</td>
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
        <title>Reporte Financiero - Mi Casita</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0f766e; padding-bottom: 20px; }
          h1 { color: #0f766e; margin: 0 0 10px 0; }
          .meta { font-size: 14px; color: #555; margin: 5px 0; }
          h2 { color: #1e293b; font-size: 18px; margin-top: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
          th { background-color: #f8fafc; color: #334155; font-weight: bold; text-transform: uppercase; font-size: 12px; }
          .text-right { text-align: right; }
          .total-row { font-weight: bold; background-color: #e2e8f0; font-size: 14px; }
          .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 11px; background-color: #f1f5f9; color: #475569; }
        </style>
      </head>
      <body>
        ${reportBody}
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
              <div className="max-h-[320px] overflow-y-auto">
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

            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
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
      </PanelShell>
    </div>
  )
}