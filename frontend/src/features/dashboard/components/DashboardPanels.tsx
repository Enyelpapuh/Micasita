import { useEffect, useState, useMemo, type ChangeEvent, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import {
  Camera,
  Eye,
  EyeOff,
  LoaderCircle,
  Printer,
  PlusCircle,
  Pencil,
  Trash2,
  LogIn,
  AlertTriangle,
  Search,
  History,
} from 'lucide-react'
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
import type { DashboardView } from './DashboardSidebar'
import { TalleresView } from '../../talleres/components/TalleresView'
import { IdentityAccessPanel } from './IdentityAccessPanel'
import { AdmisionDashboardPanel } from '../../admision/components/AdmisionDashboardPanel'
import { AcademicoAsistenciaPanel, AcademicoGestionPanel, AcademicoNotasPanel } from './AcademicoPanels'
import { StudentDirectoryPanel } from './StudentDirectoryPanel'
import { useAuth } from '../../auth/AuthContext'
import axios from 'axios'
import { changeMyPassword, resolveMyAvatarUrl, updateMyProfile, uploadMyAvatar } from './settings.api'
import { CajaDashboardPanel } from './CajaDashboardPanel'
import { getCajaHistorialGeneral } from './caja.api'
import { AdminFinanzasPanel } from './AdminFinanzasPanel'
import { ContactMessagesPanel } from './ContactMessagesPanel'
import { AuditoriaPanel } from './AuditoriaPanel'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

type DashboardPanelProps = {
  user?: AuthUser | null
}

export function PanelShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Dashboard</p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{subtitle}</p>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  )
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </article>
  )
}

function formatMoney(value?: number | null) {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' }).format(Number.isFinite(amount) ? amount : 0)
}

export function OverviewPanel({ user }: DashboardPanelProps) {
  const { token } = useAuth()
  const [cajaResumen, setCajaResumen] = useState<Awaited<ReturnType<typeof getCajaHistorialGeneral>> | null>(null)
  const [periodFilter, setPeriodFilter] = useState<'0' | '7' | '15' | '30' | 'all' | 'custom'>('30')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

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
        totalTaller: 0, totalMatricula: 0, totalMensualidad: 0, total: 0, combined: []
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
  }, [cajaResumen, periodFilter])

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
                onChange={(e) => { setDateFrom(e.target.value); if (e.target.value) setPeriodFilter('custom'); }}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-slate-700">Hasta:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); if (e.target.value) setPeriodFilter('custom'); }}
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
          <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Resumen Financiero</p>
            <p className="mt-1 text-sm text-slate-600">Ingresos generales según el periodo seleccionado.</p>
            
            <div className="mt-4 flex-1 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-white text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Concepto</th>
                    <th className="px-4 py-3 text-right font-semibold">Pagos</th>
                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-3">Talleres</td>
                    <td className="px-4 py-3 text-right">{filteredData.validTaller.length}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatMoney(totalTalleres)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Matrícula</td>
                    <td className="px-4 py-3 text-right">{filteredData.validMatricula.length}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatMoney(totalMatriculas)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Mensualidad</td>
                    <td className="px-4 py-3 text-right">{filteredData.validMensualidad.length}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatMoney(totalMensualidades)}</td>
                  </tr>
                  <tr className="bg-slate-50 text-rose-700">
                    <td className="px-4 py-3">Anulaciones</td>
                    <td className="px-4 py-3 text-right">{filteredData.cantidadAnulados}</td>
                    <td className="px-4 py-3 text-right font-medium">-{formatMoney(filteredData.totalAnulado)}</td>
                  </tr>
                  <tr className="bg-white font-semibold text-slate-900">
                    <td className="px-4 py-3">TOTAL NETO</td>
                    <td className="px-4 py-3 text-right">{filteredData.combined.length}</td>
                    <td className="px-4 py-3 text-right text-teal-700">{formatMoney(totalGeneral)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Ingresos Clasificados</p>
            <p className="mt-1 text-sm text-slate-600">Desglose de operaciones en el periodo.</p>
            
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
                    {filteredData.combined.map((item, idx) => (
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
                    ))}
                    {filteredData.combined.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          No hay registros en este periodo.
                        </td>
                      </tr>
                    ) : null}
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

export function WorkshopsPanel() {
  return <TalleresView />
}

export function IdentityAccessDashboardPanel() {
  return <IdentityAccessPanel />
}

export function StudentsPanel() {
  return <AcademicoGestionPanel />
}

export function PeoplePanel() {
  return <StudentDirectoryPanel />
}

export function AttendancePanel() {
  return <AcademicoAsistenciaPanel />
}

export function GradesPanel() {
  return <AcademicoNotasPanel />
}

export function TalleresPanel() {
  return <TalleresView />
}

export function CashierPanel() {
  return <CajaDashboardPanel />
}

export function RecepcionPanel() {
  return <AdmisionDashboardPanel />
}

export function MensajesPanel() {
  return <ContactMessagesPanel />
}

// export function AvisosPanel() {
//   return <NoticiasPanel />
// }

export function SettingsPanel() {
  const { token, user, refreshUser } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [telefono, setTelefono] = useState(user?.telefono ?? '')
  const [identificador, setIdentificador] = useState(user?.identificador ?? '')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  

  const validateStrongPassword = (password: string) => {
    if (password.length < 8 || password.length > 64) {
      return 'La contraseña debe tener entre 8 y 64 caracteres.'
    }
    if (!/[A-Z]/.test(password)) {
      return 'La contraseña debe incluir al menos una letra mayúscula.'
    }
    if (!/[a-z]/.test(password)) {
      return 'La contraseña debe incluir al menos una letra minúscula.'
    }
    if (!/\d/.test(password)) {
      return 'La contraseña debe incluir al menos un número.'
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return 'La contraseña debe incluir al menos un caracter especial.'
    }
    return null
  }

  const submitPasswordChange = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      toast.error('Completa todos los campos de contraseña')
      return
    }

    const passwordValidation = validateStrongPassword(newPassword.trim())
    if (passwordValidation) {
      toast.error(passwordValidation)
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('La confirmación no coincide con la nueva contraseña')
      return
    }

    setIsSaving(true)
    try {
      await changeMyPassword(token, currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Contraseña actualizada correctamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la contraseña')
    } finally {
      setIsSaving(false)
    }
  }

  const submitProfileUpdate = async () => {
    const nextTelefono = telefono.trim()
    const nextIdentificador = identificador.trim()

    if (nextTelefono && !/^\d{8}$/.test(nextTelefono)) {
      toast.error('El teléfono debe tener exactamente 8 dígitos.')
      return
    }

    if (nextIdentificador && !/^(\d{3}-\d{6}-\d{4}[A-Za-z]|\d{13}[A-Za-z])$/.test(nextIdentificador)) {
      toast.error('Cédula inválida. Usa formato nicaragüense ###-######-####L o sin guiones.')
      return
    }

    setIsSavingProfile(true)
    try {
      await updateMyProfile(token, {
        telefono: nextTelefono || null,
        identificador: nextIdentificador || null,
      })
      await refreshUser()
      toast.success('Perfil actualizado correctamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el perfil')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleUploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.currentTarget.value = ''
    if (!file) {
      return
    }

    setIsUploadingAvatar(true)
    try {
      await uploadMyAvatar(token, file)
      await refreshUser()
      toast.success('Avatar actualizado correctamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el avatar')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  return (
    <PanelShell
      title="Configuración"
      subtitle="Autogestión de datos sensibles de tu cuenta: teléfono, cédula, avatar y contraseña."
    >
      <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-5">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Seguridad de la cuenta</p>

        <div className="space-y-3">
          <div className="mb-3 flex items-center gap-3">
            {user?.pathAvatar ? (
              <img src={resolveMyAvatarUrl(user.pathAvatar)} alt="Avatar" className="h-14 w-14 rounded-full border border-slate-200 object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700">
                {(user?.nombre?.[0] ?? 'U').toUpperCase()}
                {(user?.apellido?.[0] ?? '').toUpperCase()}
              </div>
            )}
            <label className="inline-flex cursor-pointer items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
              {isUploadingAvatar ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Camera className="mr-2 h-3.5 w-3.5" />}
              Cambiar avatar
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadAvatar} />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Teléfono</span>
            <input
              value={telefono}
              onChange={(event) => setTelefono(event.target.value)}
              placeholder="8 dígitos"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Cédula</span>
            <input
              value={identificador}
              onChange={(event) => setIdentificador(event.target.value)}
              placeholder="Ej. ###-######-####L o sin guiones"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
            />
          </label>

          <button
            type="button"
            onClick={submitProfileUpdate}
            disabled={isSavingProfile}
            className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-70"
          >
            {isSavingProfile ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar perfil
          </button>

          <div className="my-3 h-px bg-slate-200" />

          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Contraseña actual</span>
            <div className="flex items-center rounded-xl border border-slate-300 px-3 py-2">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="w-full text-sm outline-none"
                placeholder="Escribe tu contraseña actual"
              />
              <button type="button" onClick={() => setShowCurrentPassword((prev) => !prev)} className="text-slate-500 hover:text-slate-700">
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Nueva contraseña</span>
            <div className="flex items-center rounded-xl border border-slate-300 px-3 py-2">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full text-sm outline-none"
                placeholder="8-64, mayúscula, minúscula, número y símbolo"
              />
              <button type="button" onClick={() => setShowNewPassword((prev) => !prev)} className="text-slate-500 hover:text-slate-700">
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Confirmar nueva contraseña</span>
            <div className="flex items-center rounded-xl border border-slate-300 px-3 py-2">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full text-sm outline-none"
                placeholder="Repite la nueva contraseña"
              />
              <button type="button" onClick={() => setShowConfirmPassword((prev) => !prev)} className="text-slate-500 hover:text-slate-700">
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <button
            type="button"
            onClick={submitPasswordChange}
            disabled={isSaving}
            className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
          >
            {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar nueva contraseña
          </button>
        </div>
      </div>

      {/* Removed embedded AdminFinanzasPanel: financial system config moved to its own panel */}
    </PanelShell>
  )
}

export function FinanzasConfigPanel({ user }: { user?: AuthUser | null }) {
  const canEditFinanzas = (user?.roles ?? []).some((role) => ['ADMIN', 'DEVELOPER', 'ADMINISTRACION', 'ADMIN_DIRECCION', 'PROFESOR'].includes(role?.toUpperCase?.() ?? role))

  // Debug: información para validar acceso
  console.log('=== FinanzasConfigPanel Debug ===')
  console.log('Usuario completo:', user)
  console.log('Roles del usuario:', user?.roles)
  console.log('Permisos del usuario:', user?.permisos)
  console.log('Email del usuario:', user?.email)
  console.log('Roles en mayúscula:', user?.roles?.map(r => r?.toUpperCase?.() ?? r))
  console.log('¿Puede editar finanzas?:', canEditFinanzas)
  console.log('Roles permitidos: ADMIN, DEVELOPER, ADMINISTRACION, ADMIN_DIRECCION, PROFESOR')
  console.log('================================')

  return (
    <PanelShell
      title="Configuración de precios"
      subtitle="Define el precio de matrícula y mensualidad para el período activo."
    >
      {canEditFinanzas ? (
        <AdminFinanzasPanel />
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No tienes permisos para editar precios de matrícula y mensualidad. Contacta a administración.
        </div>
      )}
    </PanelShell>
  )
}

export function getDashboardPanel(view: DashboardView, user?: AuthUser | null) {
  switch (view) {
    case 'overview':
      return <OverviewPanel user={user} />
    case 'identityAccess':
      return <IdentityAccessDashboardPanel />
    case 'workshops':
      return <WorkshopsPanel />
    case 'students':
      return <StudentsPanel />
    case 'people':
      return <PeoplePanel />
    case 'attendance':
      return <AttendancePanel />
    case 'grades':
      return <GradesPanel />
    case 'cashier':
      return <CashierPanel />
    case 'finanzasConfig':
      return <FinanzasConfigPanel user={user} />
    case 'talleres':
      return <TalleresPanel />
    case 'recepcion':
      return <RecepcionPanel />
    case 'mensajes':
      return <MensajesPanel />
    // case 'noticias':
    //   return <AvisosPanel />
    case 'settings':
      return <SettingsPanel />
    case 'auditoria':
      return <AuditoriaPanel />
    default:
      return <OverviewPanel user={user} />
  }
}
