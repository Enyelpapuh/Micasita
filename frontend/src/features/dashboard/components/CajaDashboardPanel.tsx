import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, CreditCard, LoaderCircle, ReceiptText, UserCircle, Wallet, X, ChevronRight, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import logoSvg from '../../../assets/MiCASITALOGO-cropped.svg?raw'
import { useAuth } from '../../auth/AuthContext'
import { listEstudiantesActivos, type EstudianteItem } from './academico.api'
import {
  annulPagoMatricula,
  annulPagoMensualidad,
  annulPagoTaller,
  closeAllOpenCajas,
  getCorteSession,
  type CorteSessionResponse,
  closeCajaSession,
  getActiveCajaSession,
  getCajaDashboard,
  getCajaHistorialGeneral,
  getCajaTarifas,
  getMensualidadMesesResumen,
  getMetodosPago,
  getResumenPendientesMensualidad,
  getPendientesMensualidades,
  openCajaSession,
  payMatricula,
  payMensualidad,
  previewMatricula,
  payTaller,
  type CajaSessionInfo,
  type CajaDashboardResponse,
  type CajaMatriculaPendienteItem,
  type CajaMensualidadItem,
  type CajaOperacionResult,
  type CajaHistorialResponse,
  type CajaPagoMatriculaItem,
  type CajaPagoTallerItem,
  type CajaTallerPendienteItem,
  type MensualidadMesesResumenResponse,
  type MetodoPagoOption,
  type ResumenPendientesMensualidadResponse,
  type CajaTarifasResponse,
} from './caja.api'
import MensualidadPaymentPanel from './MensualidadPaymentPanel'

type CajaTab = 'talleres' | 'matricula' | 'mensualidad'
type AnnulTargetType = 'taller' | 'matricula' | 'mensualidad'

type PendingAnnulment = {
  idUnico: string
  type: AnnulTargetType
  idElemento: number
  label: string
  monto: number
  timestamp: string
  status?: string
}

type AnnulModalState = {
  type: AnnulTargetType
  id: number
  label: string
  monto: number
}

function formatDate(value?: string | null) {
  if (!value) {
    return '-'
  }
  const date = parseDateValue(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getMonthName(monthNumberStr: string) {
  const monthNumber = parseInt(monthNumberStr, 10)
  if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) return monthNumberStr
  const date = new Date(2024, monthNumber - 1, 1)
  const month = date.toLocaleString('es-NI', { month: 'long' })
  return month.charAt(0).toUpperCase() + month.slice(1)
}

function parseDateValue(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  return new Date(value)
}

function formatMoney(value?: number | null) {
  if (value == null) {
    return '-'
  }
  return new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' }).format(value)
}

function SectionCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      </div>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </article>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {message}
    </div>
  )
}

function MetodoPagoSelect({
  value,
  onChange,
  metodosPago,
}: {
  value: string
  onChange: (value: string) => void
  metodosPago: MetodoPagoOption[]
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
    >
      <option value="">Seleccionar metodo de pago</option>
      {metodosPago.map((metodo) => (
        <option key={metodo.id} value={String(metodo.id)}>
          {metodo.nombre}
        </option>
      ))}
    </select>
  )
}

function readNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseMonthNumber(value: string) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 12) {
    return null
  }
  return parsed
}

function isSameLocalDay(value?: string | null, baseDate = new Date()) {
  if (!value) {
    return false
  }
  const date = parseDateValue(value)
  if (Number.isNaN(date.getTime())) {
    return false
  }
  return (
    date.getFullYear() === baseDate.getFullYear() &&
    date.getMonth() === baseDate.getMonth() &&
    date.getDate() === baseDate.getDate()
  )
}

function isSameLocalDateValue(value?: string | null, dateValue?: string) {
  if (!value || !dateValue) {
    return true
  }

  const date = parseDateValue(value)
  if (Number.isNaN(date.getTime())) {
    return false
  }

  const [year, month, day] = dateValue.split('-').map(Number)
  if (!year || !month || !day) {
    return true
  }

  return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day
}

function calculateMoraPeriods(mesDePago: string, diaLimitePago: string, now = new Date()) {
  const month = parseMonthNumber(mesDePago)
  if (!month) {
    return 0
  }

  const currentMonth = now.getMonth() + 1
  const cutoffDay = Math.min(Math.max(Number(diaLimitePago) || 1, 1), 31)
  const hasPastDueCurrentMonth = month === currentMonth && now.getDate() > cutoffDay

  if (month > currentMonth) {
    return 0
  }

  const laggedMonths = Math.max(currentMonth - month, 0)
  return hasPastDueCurrentMonth ? laggedMonths + 1 : laggedMonths
}

function sumPaid(items: Array<{ monto?: number | null; anulado?: boolean }>) {
  return items.reduce((total, item) => {
    if (item.anulado) {
      return total
    }
    return total + (item.monto ?? 0)
  }, 0)
}

function countAnnulled(items: Array<{ anulado?: boolean }>) {
  return items.reduce((total, item) => total + (item.anulado ? 1 : 0), 0)
}

type CajaHistorialItem = {
  key: string
  tipo: 'Taller' | 'Matrícula' | 'Mensualidad'
  titulo: string
  numeroRecibo: string
  detalle: string
  monto?: number | null
  fecha?: string | null
  metodoPago?: string | null
  estado?: string | null
  anulado?: boolean
  motivoAnulacion?: string | null
  cajero?: string
  pagoCupoId?: number
  pagoMatriculaId?: number
  mensualidadId?: number
  mes?: string
  anioLectivo?: string
  montoRecibido?: number | null
  cambioDevuelto?: number | null
}

function buildCajaHistorialFromParts(
  pagosTaller: CajaPagoTallerItem[],
  pagosMatricula: CajaPagoMatriculaItem[],
  mensualidades: CajaMensualidadItem[],
): CajaHistorialItem[] {
  const historialTaller = pagosTaller.map((item) => ({
    key: `taller-${item.pagoCupoId}`,
    tipo: 'Taller' as const,
    titulo: item.taller || 'Taller',
    numeroRecibo: item.numeroRecibo || `T-${item.pagoCupoId}`,
    detalle: item.participante || 'Sin nombre',
    monto: item.monto,
    fecha: item.fechaPago,
    metodoPago: item.metodoPago,
    estado: item.estado,
    anulado: item.anulado,
    motivoAnulacion: item.motivoAnulacion,
    cajero: (item as any).cajero,
    pagoCupoId: item.pagoCupoId,
    montoRecibido: item.montoRecibido,
    cambioDevuelto: item.cambioDevuelto,
  }))

  const historialMatricula = pagosMatricula.map((item) => ({
    key: `matricula-${item.pagoMatriculaId}`,
    tipo: 'Matrícula' as const,
    titulo: item.estudiante || 'Matrícula',
    numeroRecibo: item.numeroRecibo || `M-${item.pagoMatriculaId}`,
    detalle: item.detalle || 'Cobro de matrícula',
    monto: item.monto,
    fecha: item.fechaPago,
    metodoPago: item.metodoPago,
    estado: item.estado,
    anulado: item.anulado,
    motivoAnulacion: item.motivoAnulacion,
    cajero: (item as any).cajero,
    pagoMatriculaId: item.pagoMatriculaId,
    anioLectivo: item.anioLectivo,
    montoRecibido: item.montoRecibido,
    cambioDevuelto: item.cambioDevuelto,
  }))

  const historialMensualidad = mensualidades.map((item) => ({
    key: `mensualidad-${item.mensualidadId}`,
    tipo: 'Mensualidad' as const,
    titulo: item.estudiante || 'Mensualidad',
    numeroRecibo: item.numeroRecibo || `ME-${item.mensualidadId}`,
    detalle: item.detalle || 'Cobro mensualidad',
    monto: item.monto,
    fecha: item.fechaPago,
    metodoPago: item.metodoPago,
    estado: item.estado,
    anulado: item.anulado,
    motivoAnulacion: item.motivoAnulacion,
    cajero: (item as any).cajero,
    mensualidadId: item.mensualidadId,
    mes: item.mes,
    montoRecibido: item.montoRecibido,
    cambioDevuelto: item.cambioDevuelto,
  }))

  return [...historialTaller, ...historialMatricula, ...historialMensualidad].sort((a, b) => {
    const fechaA = a.fecha ? new Date(a.fecha as string).getTime() : 0
    const fechaB = b.fecha ? new Date(b.fecha as string).getTime() : 0
    return fechaB - fechaA
  })
}

function TalleresTab({
  pendientes,
  pagos,
  onPay,
  onAnnul,
  metodoPagoId,
  onMetodoPagoChange,
  metodosPago,
  busy,
  search,
  pendingAnnulIds,
}: {
  pendientes: CajaTallerPendienteItem[]
  pagos: CajaPagoTallerItem[]
  onPay: (cupoId: number, monto: number, montoRecibido: number, cambioDevuelto: number) => void
  onAnnul: (pagoCupoId: number, numeroRecibo: string, monto: number) => void
  metodoPagoId: string
  onMetodoPagoChange: (value: string) => void
  metodosPago: MetodoPagoOption[]
  busy: boolean
  search?: string
  pendingAnnulIds: number[]
}) {
  const [selectedPendiente, setSelectedPendiente] = useState<CajaTallerPendienteItem | null>(null)
  const [selectedPago, setSelectedPago] = useState<CajaPagoTallerItem | null>(null)
  const [montoCobro, setMontoCobro] = useState('')
  const [montoRecibido, setMontoRecibido] = useState('')

  const montoCobroNumber = Number(montoCobro) || 0
  const montoRecibidoNumber = Number(montoRecibido) || 0
  const vuelto = montoRecibidoNumber - montoCobroNumber
  const puedeCobrar = !!selectedPendiente && montoCobroNumber > 0 && !!metodoPagoId && vuelto >= 0 && !busy && Number(selectedPendiente?.montoEsperado ?? 0) > 0

  const pagosFiltrados = useMemo(() => {
    const term = (search || '').trim().toLocaleLowerCase('es-NI')
    if (!term) {
      return pagos
    }
    return pagos.filter((item) => {
      return [item.participante, item.taller, item.numeroRecibo, item.metodoPago, item.estado]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase('es-NI').includes(term))
    })
  }, [pagos, search])

  const abrirModal = (item: CajaTallerPendienteItem) => {
    setSelectedPago(null)
    setSelectedPendiente(item)
    setMontoCobro(String(Number(item.montoEsperado ?? 0)))
    setMontoRecibido('')
  }

  const abrirDetallePago = (item: CajaPagoTallerItem) => {
    setSelectedPendiente(null)
    setMontoCobro('')
    setMontoRecibido('')
    setSelectedPago(item)
  }

  const cerrarModal = () => {
    setSelectedPendiente(null)
    setSelectedPago(null)
    setMontoCobro('')
    setMontoRecibido('')
  }

  const confirmarCobro = async () => {
    if (!selectedPendiente) {
      return
    }

    await onPay(selectedPendiente.cupoId, montoCobroNumber, montoRecibidoNumber, vuelto >= 0 ? vuelto : 0)
    cerrarModal()
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">Inscripciones en espera de pago</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-[180px_1fr]">
          <MetodoPagoSelect value={metodoPagoId} onChange={onMetodoPagoChange} metodosPago={metodosPago} />
          <p className="text-xs text-slate-500">Selecciona el metodo cargado por el sistema antes de cobrar.</p>
        </div>
        <div className="mt-4 grid gap-3">
          {pendientes
            .filter((item) => {
              const term = (search || '').trim().toLocaleLowerCase('es-NI')
              if (!term) return true
              return (
                (item.participante || '').toLocaleLowerCase('es-NI').includes(term) ||
                (item.taller || '').toLocaleLowerCase('es-NI').includes(term)
              )
            })
            .map((item) => (
              <article key={item.cupoId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 transition-all hover:border-teal-300 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                    <ReceiptText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{item.participante || 'Sin nombre'}</p>
                    <p className="text-xs text-slate-500">{item.taller}</p>
                    <p className="mt-1 text-sm font-semibold text-teal-700">{formatMoney(item.montoEsperado)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <button type="button" onClick={() => abrirModal(item)} className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-teal-700">
                    Cobrar
                  </button>
                </div>
              </article>
            ))}
          {pendientes.length === 0 ? <EmptyState message="No hay inscripciones de talleres pendientes de pago." /> : null}
        </div>
      </section>

      {selectedPendiente ? createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={cerrarModal} />
          <div className="relative w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">Cobro de taller</h4>
                <p className="text-sm text-slate-600">{selectedPendiente.taller} | {selectedPendiente.participante || 'Sin nombre'}</p>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm sm:col-span-2">
                <p className="text-slate-500">Taller</p>
                <p className="font-semibold text-slate-900">{selectedPendiente.taller}</p>
                <p className="mt-1 text-slate-600">Participante: {selectedPendiente.participante || 'Sin nombre'}</p>
                <p className="mt-1 text-slate-600">Fecha inscripción: {formatDate(selectedPendiente.fechaInscripcion)}</p>
                <p className="mt-1 text-slate-600">Monto esperado: {formatMoney(selectedPendiente.montoEsperado)}</p>
              </div>
              <input
                value={montoCobro}
                readOnly
                placeholder="Monto a cobrar"
                type="number"
                step="0.01"
                min="0"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none"
              />
              <input
                value={montoRecibido}
                onChange={(event) => setMontoRecibido(event.target.value)}
                placeholder="Monto recibido"
                type="number"
                step="0.01"
                min="0"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
              <div className="sm:col-span-2">
                <MetodoPagoSelect value={metodoPagoId} onChange={onMetodoPagoChange} metodosPago={metodosPago} />
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-slate-700">Total a pagar: <span className="font-semibold">{formatMoney(montoCobroNumber)}</span></p>
              <p className="text-slate-700">Monto recibido: <span className="font-semibold">{formatMoney(montoRecibidoNumber)}</span></p>
              {vuelto >= 0 ? (
                <p className="text-emerald-700">Vuelto: <span className="font-semibold">{formatMoney(vuelto)}</span></p>
              ) : (
                <p className="text-rose-700">Faltante: <span className="font-semibold">{formatMoney(Math.abs(vuelto))}</span></p>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={cerrarModal}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!puedeCobrar}
                onClick={confirmarCobro}
                className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Procesando...' : 'Confirmar cobro'}
              </button>
            </div>
          </div>
        </div>
      , document.body) : null}

      {selectedPago ? createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={cerrarModal} />
          <div className="relative w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">Detalle de pago de taller</h4>
                <p className="text-sm text-slate-600">{selectedPago.taller} | {selectedPago.participante || 'Sin nombre'}</p>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">Recibo</p>
                <p className="font-semibold text-slate-900">{selectedPago.numeroRecibo || '-'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">Monto</p>
                <p className="font-semibold text-slate-900">{formatMoney(selectedPago.monto)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">Recibido</p>
                <p className="font-semibold text-slate-900">{formatMoney(selectedPago.montoRecibido)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">Cambio devuelto</p>
                <p className="font-semibold text-slate-900">{formatMoney(selectedPago.cambioDevuelto)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">Método de pago</p>
                <p className="font-semibold text-slate-900">{selectedPago.metodoPago || '-'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">Fecha de pago</p>
                <p className="font-semibold text-slate-900">{formatDate(selectedPago.fechaPago)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm sm:col-span-2">
                <p className="text-slate-500">Estado</p>
                <p className="font-semibold text-slate-900">{selectedPago.estado || '-'}</p>
              </div>
              {selectedPago.anulado && selectedPago.motivoAnulacion ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm sm:col-span-2">
                  <p className="text-slate-500">Motivo de anulación</p>
                  <p className="font-semibold text-rose-800">{selectedPago.motivoAnulacion}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={cerrarModal}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      , document.body) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">Pagos de talleres recientes</h3>
        <div className="mt-4 space-y-3">
          {pagosFiltrados.map((item) => (
            <article key={item.pagoCupoId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 transition-all hover:border-teal-300 hover:bg-white hover:shadow-md">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{item.taller}</p>
                <p className="text-sm text-slate-600">Participante: {item.participante || 'Sin nombre'}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md bg-white px-2 py-1 text-slate-600 ring-1 ring-inset ring-slate-200">Recibo: {item.numeroRecibo || '-'}</span>
                  <span className="rounded-md bg-white px-2 py-1 text-slate-600 ring-1 ring-inset ring-slate-200">{item.metodoPago || '-'}</span>
                  <span className="rounded-md bg-white px-2 py-1 text-slate-600 ring-1 ring-inset ring-slate-200">{formatDate(item.fechaPago)}</span>
                  <span className="rounded-md bg-white px-2 py-1 text-slate-600 ring-1 ring-inset ring-slate-200">{item.estado || '-'}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">Monto: {formatMoney(item.monto)}</p>
              </div>
              <div className="flex items-center gap-2 sm:shrink-0">
                  <button
                    type="button"
                    onClick={() => abrirDetallePago(item)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Ver
                  </button>
                  {!item.anulado ? (
                    pendingAnnulIds.includes(item.pagoCupoId) ? (
                      <span className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">En espera</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAnnul(item.pagoCupoId, item.numeroRecibo || '', item.monto ?? 0)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        Anular
                      </button>
                    )
                  ) : (
                    <span className="rounded-xl bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-800 ring-1 ring-inset ring-rose-200">Anulado</span>
                  )}
              </div>
            </article>
          ))}
          {pagosFiltrados.length === 0 ? <EmptyState message="No hay pagos de talleres que coincidan con la búsqueda." /> : null}
        </div>
      </section>
    </div>
  )
}

function MatriculaTab({
  pendientes,
  pagos,
  onPay,
  onAnnul,
  metodosPago,
  busy,
  externalBusqueda,
  onPreviewMatricula,
  montoBaseSugerido,
  pendingAnnulIds,
}: {
  pendientes: CajaMatriculaPendienteItem[]
  pagos: CajaPagoMatriculaItem[]
  onPay: (payload: { matriculaId: number; monto: number; metodoPagoId: number; detalle: string; montoRecibido: number; cambioDevuelto: number }) => Promise<void>
  onAnnul: (pagoMatriculaId: number, numeroRecibo: string, monto: number) => void
  metodosPago: MetodoPagoOption[]
  busy: boolean
  externalBusqueda?: string
  onPreviewMatricula?: (estudianteId: number) => Promise<import('./caja.api').MatriculaPreviewResponse | null>
  montoBaseSugerido?: number | null
  pendingAnnulIds: number[]
}) {
  const [busqueda, setBusqueda] = useState('')
  const [selectedMatricula, setSelectedMatricula] = useState<CajaMatriculaPendienteItem | null>(null)
  const [selectedPagoMatricula, setSelectedPagoMatricula] = useState<CajaPagoMatriculaItem | null>(null)
  const [montoCobro, setMontoCobro] = useState('')
  const [precioBaseConsultado, setPrecioBaseConsultado] = useState(0)
  const [montoRecibido, setMontoRecibido] = useState('')
  const [metodoPagoId, setMetodoPagoId] = useState('')
  const [detalle, setDetalle] = useState('Cobro de matrícula en caja')
  const [isMatriculaModalVisible, setIsMatriculaModalVisible] = useState(false)

  useEffect(() => {
    if (!metodosPago.length) {
      setMetodoPagoId('')
      return
    }

    setMetodoPagoId((current) => (metodosPago.some((item) => String(item.id) === current) ? current : String(metodosPago[0].id)))
  }, [metodosPago])

  useEffect(() => {
    if (selectedMatricula) {
      const frame = requestAnimationFrame(() => setIsMatriculaModalVisible(true))
      return () => cancelAnimationFrame(frame)
    } else {
      setIsMatriculaModalVisible(false)
    }
  }, [selectedMatricula])

  const pendientesFiltradas = useMemo(() => {
    const term = (externalBusqueda ?? busqueda).trim().toLocaleLowerCase('es-NI')
    if (!term) {
      return pendientes
    }
    return pendientes.filter((item) => (item.estudiante || '').toLocaleLowerCase('es-NI').includes(term))
  }, [busqueda, pendientes, externalBusqueda])

  const pagosFiltrados = useMemo(() => {
    const term = (externalBusqueda ?? busqueda).trim().toLocaleLowerCase('es-NI')
    if (!term) {
      return pagos
    }
    return pagos.filter((item) => {
      return [item.estudiante, item.numeroRecibo, item.detalle, item.metodoPago, item.estado]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase('es-NI').includes(term))
    })
  }, [pagos, busqueda, externalBusqueda])

  const montoCobroNumber = Number(montoCobro) || 0
  const montoRecibidoNumber = Number(montoRecibido) || 0
  const saldoCaja = montoRecibidoNumber - montoCobroNumber
  const puedeCobrar = !!selectedMatricula && montoCobroNumber > 0 && !!metodoPagoId && saldoCaja >= 0 && !busy

  const abrirModal = (item: CajaMatriculaPendienteItem) => {
    setSelectedMatricula(item)
    setSelectedPagoMatricula(null)
    const initialAmount = Number(montoBaseSugerido ?? item.montoEsperado ?? 0)
    setMontoCobro(String(initialAmount))
    setPrecioBaseConsultado(initialAmount)
    setMontoRecibido('')
    setDetalle(`Cobro matrícula ${item.anioLectivo || ''}`.trim())
    // fetch preview monto si contamos con estudianteId
    if ((item as any).estudianteId && typeof onPreviewMatricula === 'function') {
      void (async () => {
        try {
          const resp = await onPreviewMatricula((item as any).estudianteId)
          if (resp) {
            const previewMonto = resp.montoBase ?? resp.monto
            if (previewMonto != null) {
              setMontoCobro(String(Number(previewMonto)))
              setPrecioBaseConsultado(Number(previewMonto))
            }
          }
        } catch (e) {
          // ignore preview errors, user can enter monto manualmente
        }
      })()
    }
  }

  const abrirDetallePago = (item: CajaPagoMatriculaItem) => {
    setSelectedMatricula(null)
    setSelectedPagoMatricula(item)
  }

  const cerrarModal = () => {
    setSelectedMatricula(null)
    setSelectedPagoMatricula(null)
    setMontoRecibido('')
  }

  const confirmarCobro = async () => {
    if (!selectedMatricula) {
      return
    }
    await onPay({
      matriculaId: selectedMatricula.matriculaId,
      monto: montoCobroNumber,
      metodoPagoId: Number(metodoPagoId),
      detalle,
      montoRecibido: montoRecibidoNumber,
      cambioDevuelto: saldoCaja >= 0 ? saldoCaja : 0,
    })
    cerrarModal()
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">Lista de matrículas pendientes</h3>
        <p className="mt-1 text-xs text-slate-600">Filtra por estudiante y abre el modal para procesar el cobro y el vuelto.</p>
        <div className="mt-3">
          <input
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por nombre del estudiante"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
        </div>
        <div className="mt-4 grid gap-3">
          {pendientesFiltradas.map((item) => (
            <article key={item.matriculaId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 transition-all hover:border-teal-300 hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{item.estudiante || 'Sin nombre'}</p>
                  <div className="mt-1 flex gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">Año lectivo: {item.anioLectivo || '-'}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">Estado: {item.estado || '-'}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-teal-700">{formatMoney(montoBaseSugerido ?? item.montoEsperado)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:shrink-0">
                <button type="button" onClick={() => abrirModal(item)} className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-teal-700">Cobrar</button>
              </div>
            </article>
          ))}
          {pendientesFiltradas.length === 0 ? <EmptyState message="No hay matrículas que coincidan con la búsqueda." /> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">Pagos de matrícula recientes</h3>
        <div className="mt-4 space-y-3">
          {pagosFiltrados.map((item) => (
            <article key={item.pagoMatriculaId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 transition-all hover:border-teal-300 hover:bg-white hover:shadow-md">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{item.estudiante || 'Sin nombre'}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md bg-white px-2 py-1 text-slate-600 ring-1 ring-inset ring-slate-200">{item.metodoPago || '-'}</span>
                  <span className="rounded-md bg-white px-2 py-1 text-slate-600 ring-1 ring-inset ring-slate-200">{formatDate(item.fechaPago)}</span>
                  <span className="rounded-md bg-white px-2 py-1 text-slate-600 ring-1 ring-inset ring-slate-200">{item.estado || '-'}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">Monto: {formatMoney(item.monto)}</p>
              </div>
              <div className="flex items-center gap-2 sm:shrink-0">
                  <button
                    type="button"
                    onClick={() => abrirDetallePago(item)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Ver
                  </button>
                  {!item.anulado ? (
                    pendingAnnulIds.includes(item.pagoMatriculaId) ? (
                      <span className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">En espera</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAnnul(item.pagoMatriculaId, item.numeroRecibo || '', item.monto ?? 0)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        Anular
                      </button>
                    )
                  ) : (
                    <span className="rounded-xl bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-800 ring-1 ring-inset ring-rose-200">Anulado</span>
                  )}
              </div>
            </article>
          ))}
          {pagosFiltrados.length === 0 ? <EmptyState message="No hay pagos de matrícula que coincidan con la búsqueda." /> : null}
        </div>
      </section>

      {selectedMatricula ? createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
          <div 
            className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${isMatriculaModalVisible ? 'opacity-100' : 'opacity-0'}`} 
            onClick={cerrarModal} 
          />
          
          <div className={`relative w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl transition-all duration-300 ${isMatriculaModalVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-8 scale-95 opacity-0'}`}>
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Cobro de Matrícula</h2>
                  <p className="text-sm text-slate-500">Registra el pago de matrícula del estudiante</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={cerrarModal} 
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_1fr]">
              
              {/* Left Column */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-slate-400" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Estudiante seleccionado</p>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{selectedMatricula.estudiante || 'Sin nombre'}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">Año lectivo: {selectedMatricula.anioLectivo || '-'}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Precio base consultado</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{formatMoney(precioBaseConsultado)}</p>
                  <p className="mt-2 text-sm text-slate-500">Monto consultado automáticamente desde la configuración del sistema para este año lectivo.</p>
                </div>
              </div>

              {/* Right Column */}
              <div className="flex h-full flex-col space-y-4">
                <div className="flex-1 rounded-2xl border border-teal-100 bg-teal-50/50 p-5">
                  <div className="mb-5 flex items-center gap-2 border-b border-teal-100 pb-4">
                    <Wallet className="h-5 w-5 text-teal-600" />
                    <p className="text-sm font-bold uppercase tracking-wider text-teal-800">Detalle de Cobro</p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Monto a cobrar (C$)</label>
                      <input
                        type="number"
                        value={montoCobro}
                        onChange={(e) => setMontoCobro(e.target.value)}
                        step="0.01"
                        min="0"
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                    
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Método de pago</label>
                      <select
                        value={metodoPagoId}
                        onChange={(e) => setMetodoPagoId(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      >
                        <option value="">Seleccionar método de pago</option>
                        {metodosPago.map((m) => (
                          <option key={m.id} value={String(m.id)}>
                            {m.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Efectivo recibido (C$)</label>
                      <input
                        type="number"
                        value={montoRecibido}
                        onChange={(e) => setMontoRecibido(e.target.value)}
                        placeholder="Monto entregado por el cliente"
                        step="0.01"
                        min="0"
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Detalle</label>
                      <input
                        value={detalle}
                        onChange={(e) => setDetalle(e.target.value)}
                        placeholder="Detalle (ej. Cobro de matrícula)"
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-end justify-between border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total a cobrar</p>
                      <p className="text-4xl font-black text-slate-900">C$ {montoCobroNumber.toFixed(2)}</p>
                    </div>
                    {montoRecibidoNumber > 0 && (
                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Vuelto</p>
                        <p className={`text-2xl font-bold ${saldoCaja >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          C$ {saldoCaja >= 0 ? saldoCaja.toFixed(2) : Math.abs(saldoCaja).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={cerrarModal}
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={!puedeCobrar}
                      onClick={confirmarCobro}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />} Confirmar cobro
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      , document.body) : null}

      {selectedPagoMatricula ? createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={cerrarModal} />
          <div className="relative w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">Detalle de pago de matrícula</h4>
                <p className="text-sm text-slate-600">{selectedPagoMatricula.estudiante || 'Sin nombre'}</p>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">Monto</p>
                <p className="font-semibold text-slate-900">{formatMoney(selectedPagoMatricula.monto)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">Recibido</p>
                <p className="font-semibold text-slate-900">{formatMoney(selectedPagoMatricula.montoRecibido)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">Cambio devuelto</p>
                <p className="font-semibold text-slate-900">{formatMoney(selectedPagoMatricula.cambioDevuelto)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">Método de pago</p>
                <p className="font-semibold text-slate-900">{selectedPagoMatricula.metodoPago || '-'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">Fecha de pago</p>
                <p className="font-semibold text-slate-900">{formatDate(selectedPagoMatricula.fechaPago)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">Estado</p>
                <p className="font-semibold text-slate-900">{selectedPagoMatricula.estado || '-'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm sm:col-span-2">
                <p className="text-slate-500">Detalle</p>
                <p className="font-semibold text-slate-900">{selectedPagoMatricula.detalle || '-'}</p>
              </div>
              {selectedPagoMatricula.anulado && selectedPagoMatricula.motivoAnulacion ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm sm:col-span-2">
                  <p className="text-slate-500">Motivo de anulación</p>
                  <p className="font-semibold text-rose-800">{selectedPagoMatricula.motivoAnulacion}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={cerrarModal}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      , document.body) : null}
    </div>
  )
}

function MensualidadTab({
  mensualidades,
  mensualidadesPendientes,
  estudianteId,
  mesDePago,
  montoBase,
  montoMora,
  metodoPagoId,
  buscarEstudiante,
  filtroEstado,
  onEstudianteIdChange,
  onMesDePagoChange,
  onMontoBaseChange,
  onMontoMoraChange,
  onMetodoPagoChange,
  onMoraAutomaticaChange,
  onBuscarEstudianteChange,
  onFiltroEstadoChange,
  onPay,
  onAnnul,
  metodosPago,
  pendientesMensualidadesList,
  mensualidadMesesPagados,
  mensualidadMesActual,
  estudiantesActivos,
  estudiantesPendientesMensualidad,
  globalSearchTerm,
  onBuscarPendientes,
  pendingAnnulIds,
}: {
  mensualidades: CajaMensualidadItem[]
  mensualidadesPendientes: number
  estudianteId: string
  mesDePago: string
  montoBase: string
  montoMora: string
  metodoPagoId: string
  buscarEstudiante: string
  filtroEstado: 'todos' | 'activos' | 'anulados'
  onEstudianteIdChange: (value: string) => void
  onMesDePagoChange: (value: string) => void
  onMontoBaseChange: (value: string) => void
  onMontoMoraChange: (value: string) => void
  onMetodoPagoChange: (value: string) => void
  onMoraAutomaticaChange: (value: boolean) => void
  onBuscarEstudianteChange: (value: string) => void
  onFiltroEstadoChange: (value: 'todos' | 'activos' | 'anulados') => void
                    onPay: (montoRecibido: number, cambioDevuelto: number) => void
  onAnnul: (mensualidadId: number, numeroRecibo: string, monto: number) => void
  metodosPago: MetodoPagoOption[]
  pendientesMensualidadesList?: Array<import('./caja.api').PendienteMensualidadResponse>
  mensualidadMesesPagados?: number[]
  mensualidadMesActual?: number
  estudiantesActivos?: EstudianteItem[]
  estudiantesPendientesMensualidad?: ResumenPendientesMensualidadResponse[]
  globalSearchTerm?: string
  onBuscarPendientes?: (estudianteId: string) => void
  pendingAnnulIds: number[]
}) {
  const [selectedMensualidad, setSelectedMensualidad] = useState<CajaMensualidadItem | null>(null)
  const [showMensualidadPanel, setShowMensualidadPanel] = useState(false)
  const [selectedEstudianteNombre, setSelectedEstudianteNombre] = useState('')
  const [selectedMesesPendientes, setSelectedMesesPendientes] = useState(0)

  const pendientesPorEstudiante = useMemo(() => {
    const map = new Map<number, ResumenPendientesMensualidadResponse>()
    for (const item of estudiantesPendientesMensualidad ?? []) {
      map.set(item.estudianteId, item)
    }
    return map
  }, [estudiantesPendientesMensualidad])

  const estudiantesFiltrados = (estudiantesActivos ?? []).filter((item) => {
    const term = buscarEstudiante.trim().toLocaleLowerCase('es-NI')
    if (!term) {
      return true
    }
    const nombreCompleto = `${item.nombre ?? ''} ${item.apellido ?? ''}`.trim().toLocaleLowerCase('es-NI')
    return nombreCompleto.includes(term) || String(item.id).includes(term)
  })

  const mensualidadesFiltradas = mensualidades.filter((item) => {
    const matchEstado =
      filtroEstado === 'todos' || (filtroEstado === 'anulados' ? item.anulado : !item.anulado)
    const termLocal = buscarEstudiante.trim().toLocaleLowerCase('es-NI')
    const termGlobal = (globalSearchTerm ?? '').trim().toLocaleLowerCase('es-NI')
    const haystack = [item.estudiante, item.numeroRecibo, item.detalle, item.metodoPago, item.estado, item.mes]
      .filter(Boolean)
      .map((value) => String(value).toLocaleLowerCase('es-NI'))
      .join(' ')

    if (!termLocal && !termGlobal) {
      return matchEstado
    }

    const matchLocal = !termLocal || haystack.includes(termLocal)
    const matchGlobal = !termGlobal || haystack.includes(termGlobal)
    return matchEstado && matchLocal && matchGlobal
  })

  const mensualidadesActivas = mensualidades.filter((item) => !item.anulado)
  const cobradoMensualidades = sumPaid(mensualidades)
  const anuladasMensualidad = countAnnulled(mensualidades)

  const abrirDetalleMensualidad = (item: CajaMensualidadItem) => {
    setSelectedMensualidad(item)
  }

  const cerrarDetalleMensualidad = () => {
    setSelectedMensualidad(null)
  }

  const abrirCobroEstudiante = (estudianteIdSeleccionado: number) => {
    onEstudianteIdChange(String(estudianteIdSeleccionado))
    const estudiante = estudiantesActivos?.find((item) => item.id === estudianteIdSeleccionado)
    setSelectedEstudianteNombre(`${estudiante?.nombre ?? ''} ${estudiante?.apellido ?? ''}`.trim())
    setSelectedMesesPendientes(pendientesPorEstudiante.get(estudianteIdSeleccionado)?.mesesPendientes ?? 0)
    void onBuscarPendientes?.(String(estudianteIdSeleccionado))
    setShowMensualidadPanel(true)
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">Pagos de mensualidad</h3>
        <p className="mt-1 text-xs text-slate-600">
          Define política de mora y aplica el cobro con desglose para que caja trabaje con reglas claras.
        </p>

        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <input
            value={buscarEstudiante}
            onChange={(event) => onBuscarEstudianteChange(event.target.value)}
            placeholder="Buscar estudiante activo"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />

          <div className="mt-3 grid gap-2">
            {estudiantesFiltrados.length > 0 ? (
              estudiantesFiltrados.map((item) => {
                const pendiente = pendientesPorEstudiante.get(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => abrirCobroEstudiante(item.id)}
                    className="group flex w-full flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left transition-all hover:border-teal-300 hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600 transition-colors group-hover:bg-teal-100 group-hover:text-teal-700">
                        {(item.nombre?.[0] ?? 'U').toUpperCase()}{(item.apellido?.[0] ?? '').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{`${item.nombre ?? ''} ${item.apellido ?? ''}`.trim() || `Estudiante ${item.id}`}</p>
                        <p className="text-xs text-slate-500">ID: {item.id} • Año activo</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {pendiente ? (
                            <span className="inline-flex rounded-md bg-rose-50 px-2 py-1 text-[10px] font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20">{pendiente.mesesPendientes} pendiente(s)</span>
                          ) : (
                            <span className="inline-flex rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Al día</span>
                          )}
                          {pendiente && pendiente.mesesPagados > 0 ? (
                            <span className="inline-flex rounded-md bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20">{pendiente.mesesPagados} pagados</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors group-hover:bg-teal-50 group-hover:text-teal-600">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                No hay estudiantes activos que coincidan con la búsqueda.
              </div>
            )}
          </div>
        </div>

        {/** lista de meses adeudados retornada por el backend */}
        {typeof (pendientesMensualidadesList ?? []) !== 'undefined' && (pendientesMensualidadesList ?? []).length > 0 ? (
          <div className="mt-3">
            <p className="text-sm text-slate-600">Meses adeudados (click para seleccionar)</p>
            <div className="mt-2 grid gap-2">
              {(pendientesMensualidadesList ?? []).map((p) => (
                <button 
                  key={p.mensualidadId} 
                  type="button" 
                  onClick={() => { 
                    onMesDePagoChange(String(p.mes)); 
                    onMontoBaseChange(String(montoBase ? Number(montoBase) : (p.monto ?? 0))); 
                    onMontoMoraChange('0'); 
                  }} 
                  className="text-left rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                >{`Mes ${p.mes} — ${formatMoney(montoBase ? Number(montoBase) : (p.monto ?? 0))}`}</button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <SectionCard title="Pendientes" value={`${mensualidadesPendientes}`} detail="Cuotas aún por cobrar" />
          <SectionCard title="Cobrado" value={formatMoney(cobradoMensualidades)} detail="Total de mensualidades activas" />
          <SectionCard title="Anuladas" value={`${anuladasMensualidad}`} detail="Registros anulados en historial" />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">Historial de mensualidades</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_220px]">
          <input
            value={buscarEstudiante}
            onChange={(event) => onBuscarEstudianteChange(event.target.value)}
            placeholder="Buscar por estudiante"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
          <select
            value={filtroEstado}
            onChange={(event) => onFiltroEstadoChange(event.target.value as 'todos' | 'activos' | 'anulados')}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          >
            <option value="todos">Todos</option>
            <option value="activos">Solo activos</option>
            <option value="anulados">Solo anulados</option>
          </select>
        </div>

        {globalSearchTerm?.trim() ? (
          <p className="mt-2 text-xs text-slate-500">Aplicando búsqueda global por recibo/estudiante: "{globalSearchTerm.trim()}"</p>
        ) : null}

        <p className="mt-3 text-xs text-slate-600">
          Mensualidades activas: <span className="font-semibold">{mensualidadesActivas.length}</span> de{' '}
          <span className="font-semibold">{mensualidades.length}</span> registros.
        </p>

        <div className="mt-4 space-y-3">
          {mensualidadesFiltradas.map((item) => (
            <article key={item.mensualidadId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 transition-all hover:border-teal-300 hover:bg-white hover:shadow-md">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{item.estudiante || 'Sin nombre'}</p>
                <p className="text-sm font-medium text-slate-600">Mes: {item.mes || '-'}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md bg-white px-2 py-1 text-slate-600 ring-1 ring-inset ring-slate-200">{item.metodoPago || '-'}</span>
                  <span className="rounded-md bg-white px-2 py-1 text-slate-600 ring-1 ring-inset ring-slate-200">{formatDate(item.fechaPago)}</span>
                  <span className="rounded-md bg-white px-2 py-1 text-slate-600 ring-1 ring-inset ring-slate-200">{item.estado || '-'}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">Monto: {formatMoney(item.monto)}</p>
              </div>
              <div className="flex items-center gap-2 sm:shrink-0">
                  <button
                    type="button"
                    onClick={() => abrirDetalleMensualidad(item)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Ver
                  </button>
                  {!item.anulado ? (
                    pendingAnnulIds.includes(item.mensualidadId) ? (
                      <span className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">En espera</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAnnul(item.mensualidadId, item.numeroRecibo || '', item.monto ?? 0)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        Anular
                      </button>
                    )
                  ) : (
                    <span className="rounded-xl bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-800 ring-1 ring-inset ring-rose-200">Anulado</span>
                  )}
              </div>
            </article>
          ))}
          {mensualidadesFiltradas.length === 0 ? <EmptyState message="No hay mensualidades con los filtros seleccionados." /> : null}
        </div>
      </section>

      {selectedMensualidad ? createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={cerrarDetalleMensualidad} />
          <div className="relative w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">Detalle de mensualidad</h4>
                <p className="text-sm text-slate-600">{selectedMensualidad!.estudiante || 'Sin nombre'}</p>
              </div>
              <button
                type="button"
                onClick={cerrarDetalleMensualidad}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">Mes</p>
                <p className="font-semibold text-slate-900">{selectedMensualidad!.mes || '-'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">Monto</p>
                <p className="font-semibold text-slate-900">{formatMoney(selectedMensualidad!.monto)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">Recibido</p>
                <p className="font-semibold text-slate-900">{formatMoney(selectedMensualidad!.montoRecibido)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">Cambio devuelto</p>
                <p className="font-semibold text-slate-900">{formatMoney(selectedMensualidad!.cambioDevuelto)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">Método de pago</p>
                <p className="font-semibold text-slate-900">{selectedMensualidad!.metodoPago || '-'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">Fecha de pago</p>
                <p className="font-semibold text-slate-900">{formatDate(selectedMensualidad!.fechaPago)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm sm:col-span-2">
                <p className="text-slate-500">Estado</p>
                <p className="font-semibold text-slate-900">{selectedMensualidad!.estado || '-'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm sm:col-span-2">
                <p className="text-slate-500">Detalle</p>
                <p className="font-semibold text-slate-900">{selectedMensualidad!.detalle || '-'}</p>
              </div>
              {selectedMensualidad!.anulado && selectedMensualidad!.motivoAnulacion ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm sm:col-span-2">
                  <p className="text-slate-500">Motivo de anulación</p>
                  <p className="font-semibold text-rose-800">{selectedMensualidad!.motivoAnulacion}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={cerrarDetalleMensualidad}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      , document.body) : null}
      {/* Mensualidad payment panel modal */}
      <MensualidadPaymentPanel
        open={showMensualidadPanel}
        onClose={() => setShowMensualidadPanel(false)}
        estudianteId={estudianteId}
        estudianteNombre={selectedEstudianteNombre}
        mesesPendientes={selectedMesesPendientes}
        pendientes={pendientesMensualidadesList ?? []}
        mesesPagados={mensualidadMesesPagados}
        mesActual={mensualidadMesActual}
        onMoraAutomaticaChange={onMoraAutomaticaChange}
        mesDePago={mesDePago}
        montoBase={montoBase}
        montoMora={montoMora}
        metodoPagoId={metodoPagoId}
        metodosPago={metodosPago}
        onMesDePagoChange={onMesDePagoChange}
        onMontoBaseChange={onMontoBaseChange}
        onMontoMoraChange={onMontoMoraChange}
        onMetodoPagoChange={onMetodoPagoChange}
        onPay={(montoRecibido, cambioDevuelto) => onPay(montoRecibido, cambioDevuelto)}
      />
    </div>
  )
}

export function CajaDashboardPanel() {
  const { token, user,  } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [tab, setTab] = useState<CajaTab>('talleres')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CajaDashboardResponse | null>(null)
  const [generalHistorialData, setGeneralHistorialData] = useState<CajaHistorialResponse | null>(null)
  const [activeSession, setActiveSession] = useState<CajaSessionInfo | null>(null)
  const [metodosPago, setMetodosPago] = useState<MetodoPagoOption[]>([])
  const [tarifas, setTarifas] = useState<CajaTarifasResponse | null>(null)
  const [estudiantesActivos, setEstudiantesActivos] = useState<EstudianteItem[]>([])
  const [mensualidadesPendientesEstudiantes, setMensualidadesPendientesEstudiantes] = useState<ResumenPendientesMensualidadResponse[]>([])
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [openSaldo, setOpenSaldo] = useState('0')
  const [openObservacion, setOpenObservacion] = useState('')
  const [closeObservacion, setCloseObservacion] = useState('')
  const [mensualidadEstudianteId, setMensualidadEstudianteId] = useState('')
  const [pendientesMensualidadesList, setPendientesMensualidadesList] = useState<Array<import('./caja.api').PendienteMensualidadResponse>>([])
  const [mensualidadMesesResumen, setMensualidadMesesResumen] = useState<MensualidadMesesResumenResponse>({ mesesPagados: [], mesActual: new Date().getMonth() + 1 })
  const [mensualidadMes, setMensualidadMes] = useState(String(new Date().getMonth() + 1))
  const [mensualidadMontoBase, setMensualidadMontoBase] = useState('')
  const [mensualidadMontoMora, setMensualidadMontoMora] = useState('0')
  const [mensualidadMoraAutomatica, setMensualidadMoraAutomatica] = useState(true)
  const [mensualidadMoraPorPeriodo, setMensualidadMoraPorPeriodo] = useState('0')
  const [mensualidadDiaLimitePago, setMensualidadDiaLimitePago] = useState('5')
  const [mensualidadBuscarEstudiante, setMensualidadBuscarEstudiante] = useState('')
  const [mensualidadFiltroEstado, setMensualidadFiltroEstado] = useState<'todos' | 'activos' | 'anulados'>('todos')
  const [mensualidadMetodoPagoId, setMensualidadMetodoPagoId] = useState('1')
  const [tallerMetodoPagoId, setTallerMetodoPagoId] = useState('1')
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null)
  const [annulModal, setAnnulModal] = useState<AnnulModalState | null>(null)
  const [annulReason, setAnnulReason] = useState('')
  const [historialModalOpen, setHistorialModalOpen] = useState(false)
  const [showPreCloseModal, setShowPreCloseModal] = useState(false)
  const [cortePreCierre, setCortePreCierre] = useState<CorteSessionResponse | null>(null)
  const [pendingAnnulments, setPendingAnnulments] = useState<PendingAnnulment[]>([])
  const [isResumenModalOpen, setIsResumenModalOpen] = useState(false)
  const [showPendingAnnulmentsModal, setShowPendingAnnulmentsModal] = useState(false)
  const [preCloseCounted, setPreCloseCounted] = useState('')
  const [showOpenSessionModal, setShowOpenSessionModal] = useState(false)
  const [openPassword, setOpenPassword] = useState('')
  const [showOpenPassword, setShowOpenPassword] = useState(false)
  const [periodFilter, setPeriodFilter] = useState<'mi_caja' | 'hoy_todos' | 'todo'>('mi_caja')
  const [historialTipoFiltro, setHistorialTipoFiltro] = useState<'todos' | 'Taller' | 'Matrícula' | 'Mensualidad'>('todos')
  const [historialCajeroFiltro, ] = useState<string>('todos')
  //const [cajeroFilter, setCajeroFilter] = useState<string>('todos')
  const [historialSearchTerm, setHistorialSearchTerm] = useState('')
  const [historialFechaFiltro, setHistorialFechaFiltro] = useState('')

  const selfRequestedIdsRef = useRef<Set<string>>(new Set())
  const initialPendingLoadRef = useRef(false)
  const prevPendingIdsRef = useRef<string[]>([])
  const [waitingAnnulmentId, setWaitingAnnulmentId] = useState<string | null>(null)
  const waitingAnnulmentIdRef = useRef<string | null>(null)

  const setWaitingId = (id: string | null) => {
    setWaitingAnnulmentId(id)
    waitingAnnulmentIdRef.current = id
  }

  const loadPendingAnnulments = async () => {
    if (!token) return
    try {
      const url = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api') + '/admin/caja/anulaciones-temporales'
      const res = await axios.get<PendingAnnulment[]>(url, { headers: { Authorization: `Bearer ${token}` } })
      let currentData = res.data

      const currentWaitingId = waitingAnnulmentIdRef.current
      if (currentWaitingId) {
        const waitingItem = currentData.find(p => p.idUnico === currentWaitingId)
        if (waitingItem) {
          if (waitingItem.status === 'AUTORIZADO') {
            setWaitingId(null)
            await syncRemoveAnnulment(waitingItem.idUnico)
            setAnnulReason('')
            setAnnulModal({ type: waitingItem.type, id: waitingItem.idElemento, label: waitingItem.label, monto: waitingItem.monto })
            currentData = currentData.filter(p => p.idUnico !== currentWaitingId)
          } else if (waitingItem.status === 'RECHAZADO') {
            setWaitingId(null)
            await syncRemoveAnnulment(waitingItem.idUnico)
            toast.error('La anulación fue rechazada por el administrador.')
            currentData = currentData.filter(p => p.idUnico !== currentWaitingId)
          }
        } else {
          setWaitingId(null)
        }
      }

      if (initialPendingLoadRef.current) {
        const oldIds = prevPendingIdsRef.current
        const newItems = currentData.filter(item => !oldIds.includes(item.idUnico) && !selfRequestedIdsRef.current.has(item.idUnico))
        
        const adminCheck = Boolean(user?.roles?.some((role) => ['ADMIN', 'DEVELOPER'].includes(role.toUpperCase())))
        if (newItems.length > 0 && adminCheck) {
          toast('🔔 Nueva solicitud de anulación en espera', { 
            duration: 6000,
            style: { background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', fontWeight: 'bold' }
          })
        }
      } else {
        initialPendingLoadRef.current = true
      }

      prevPendingIdsRef.current = currentData.map(p => p.idUnico)
      setPendingAnnulments(currentData.filter(p => p.status === 'PENDIENTE' || !p.status))
    } catch (e) {
      // Silencioso para el polling en fondo
    }
  }

  useEffect(() => {
    void loadPendingAnnulments()
    const interval = setInterval(() => { void loadPendingAnnulments() }, 5000)
    return () => clearInterval(interval)
  }, [token])

  const syncAddAnnulment = async (item: PendingAnnulment) => {
    try {
      const url = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api') + '/admin/caja/anulaciones-temporales'
      selfRequestedIdsRef.current.add(item.idUnico)
      await axios.post(url, { ...item, status: 'PENDIENTE' }, { headers: { Authorization: `Bearer ${token}` } })
      setWaitingId(item.idUnico)
      await loadPendingAnnulments()
    } catch (e) {
      toast.error('Error al enviar la solicitud.')
    }
  }

  const syncUpdateAnnulmentStatus = async (idUnico: string, status: string) => {
    try {
      const url = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api') + `/admin/caja/anulaciones-temporales/${idUnico}/status`
      await axios.put(url, { status }, { headers: { Authorization: `Bearer ${token}` } })
      await loadPendingAnnulments()
    } catch (e) {
      toast.error('Error al actualizar estado.')
    }
  }

  const syncRemoveAnnulment = async (idUnico: string) => {
    try {
      const url = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api') + `/admin/caja/anulaciones-temporales/${idUnico}`
      await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } })
      await loadPendingAnnulments()
    } catch (e) {
      toast.error('Error al procesar la solicitud.')
    }
  }

  const moraPeriodosSugeridos = useMemo(
    () => calculateMoraPeriods(mensualidadMes, mensualidadDiaLimitePago),
    [mensualidadMes, mensualidadDiaLimitePago],
  )

  const moraSugerida = useMemo(
    () => moraPeriodosSugeridos * (Number(mensualidadMoraPorPeriodo) || 0),
    [moraPeriodosSugeridos, mensualidadMoraPorPeriodo],
  )

  const moraAplicadaFormulario = mensualidadMoraAutomatica ? moraSugerida : Number(mensualidadMontoMora)

  const isCajaAdmin = Boolean(user?.roles?.some((role) => ['ADMIN', 'DEVELOPER'].includes(role.toUpperCase())))

  const pagosTallerSourceCompleto = generalHistorialData?.pagosTaller ?? data?.pagosTaller ?? []
  const pagosMatriculaSourceCompleto = generalHistorialData?.pagosMatricula ?? data?.pagosMatricula ?? []
  const mensualidadesSourceCompleto = generalHistorialData?.mensualidades ?? data?.mensualidades ?? []

  const pagosDelTurno = useMemo(() => {
    if (!activeSession) return { taller: 0, matricula: 0, mensualidad: 0, total: 0 }
    const aperturaTime = new Date(activeSession.fechaApertura as string).getTime()
    const filterAndSum = (items: Array<{ fechaPago?: string | null; monto?: number | null; anulado?: boolean }>) => {
      return items.reduce((acc, item) => {
        if (item.anulado) return acc
        const time = item.fechaPago ? new Date(item.fechaPago as string).getTime() : 0
        return time >= aperturaTime ? acc + (item.monto ?? 0) : acc
      }, 0)
    }
    return { taller: filterAndSum(pagosTallerSourceCompleto), matricula: filterAndSum(pagosMatriculaSourceCompleto), mensualidad: filterAndSum(mensualidadesSourceCompleto), total: filterAndSum(pagosTallerSourceCompleto) + filterAndSum(pagosMatriculaSourceCompleto) + filterAndSum(mensualidadesSourceCompleto) }
  }, [activeSession, pagosTallerSourceCompleto, pagosMatriculaSourceCompleto, mensualidadesSourceCompleto])

  const anulacionesTurno = useMemo(() => {
    if (!activeSession) return 0
    const aperturaTime = new Date(activeSession.fechaApertura as string).getTime()
    const filterAndCount = (items: Array<{ fechaPago?: string | null; anulado?: boolean }>) => {
      return items.reduce((acc, item) => {
        if (!item.anulado) return acc
        const time = item.fechaPago ? new Date(item.fechaPago as string).getTime() : 0
        return time >= aperturaTime ? acc + 1 : acc
      }, 0)
    }
    return filterAndCount(pagosTallerSourceCompleto) + filterAndCount(pagosMatriculaSourceCompleto) + filterAndCount(mensualidadesSourceCompleto)
  }, [activeSession, pagosTallerSourceCompleto, pagosMatriculaSourceCompleto, mensualidadesSourceCompleto])

  const totalCobradoGeneralPreClose = cortePreCierre ? cortePreCierre.totalCobrado : pagosDelTurno.total
  const aperturaSesion = Number(activeSession?.saldoInicial ?? 0)
  const efectivoEsperadoPreCierre = aperturaSesion + totalCobradoGeneralPreClose
  const efectivoContadoPreCierre = Number(preCloseCounted) || 0
  const diferenciaPreCierre = efectivoContadoPreCierre - efectivoEsperadoPreCierre

  const pagosDelTurnoTaller = cortePreCierre ? cortePreCierre.desglose.talleres.cobrado : pagosDelTurno.taller
  const pagosDelTurnoMatricula = cortePreCierre ? cortePreCierre.desglose.matriculas.cobrado : pagosDelTurno.matricula
  const pagosDelTurnoMensualidad = cortePreCierre ? cortePreCierre.desglose.mensualidades.cobrado : pagosDelTurno.mensualidad
  const totalAnulacionesTurno = cortePreCierre ? cortePreCierre.cantidadAnulaciones : anulacionesTurno

  const pagosTallerSource = useMemo(() => {
    if (periodFilter !== 'mi_caja') {
      return generalHistorialData?.pagosTaller ?? []
    }
    return data?.pagosTaller ?? []
  }, [data, generalHistorialData, periodFilter])

  const pagosMatriculaSource = useMemo(() => {
    if (periodFilter !== 'mi_caja') {
      return generalHistorialData?.pagosMatricula ?? []
    }
    return data?.pagosMatricula ?? []
  }, [data, generalHistorialData, periodFilter])

  const mensualidadesSource = useMemo(() => {
    if (periodFilter !== 'mi_caja') {
      return generalHistorialData?.mensualidades ?? []
    }
    return data?.mensualidades ?? []
  }, [data, generalHistorialData, periodFilter])

  const historialGeneral = useMemo(() => {
    const full = buildCajaHistorialFromParts(pagosTallerSource, pagosMatriculaSource, mensualidadesSource)
    if (periodFilter === 'todo') {
      return full
    }
    return full.filter((item) => isSameLocalDay(item.fecha))
  }, [pagosTallerSource, pagosMatriculaSource, mensualidadesSource, periodFilter])

  // const uniqueHistorialCajeros = useMemo(() => {
  //   const cajeros = new Set<string>()
  //   historialGeneral.forEach(item => item.cajero && cajeros.add(item.cajero))
  //   return Array.from(cajeros).sort()
  // }, [historialGeneral])

  const pagosTallerFiltradosPeriodo = useMemo(() => {
    const items = pagosTallerSource
    if (periodFilter === 'todo') {
      return items
    }
    return items.filter((item) => isSameLocalDay(item.fechaPago))
  }, [pagosTallerSource, periodFilter])

  const pagosMatriculaFiltradosPeriodo = useMemo(() => {
    const items = pagosMatriculaSource
    if (periodFilter === 'todo') {
      return items
    }
    return items.filter((item) => isSameLocalDay(item.fechaPago))
  }, [pagosMatriculaSource, periodFilter])

  const mensualidadesFiltradasPeriodo = useMemo(() => {
    const items = mensualidadesSource
    if (periodFilter === 'todo') {
      return items
    }
    return items.filter((item) => isSameLocalDay(item.fechaPago))
  }, [mensualidadesSource, periodFilter])

  const historialFiltrado = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase('es-NI')
    return historialGeneral.filter((item) => {
      const matchTipo = historialTipoFiltro === 'todos' || item.tipo === historialTipoFiltro
      if (!matchTipo) {
        return false
      }

      if (historialCajeroFiltro !== 'todos' && item.cajero !== historialCajeroFiltro) {
        return false
      }

      if (!isSameLocalDateValue(item.fecha, historialFechaFiltro)) {
        return false
      }

      if (!term) {
        return true
      }

      return [item.tipo, item.titulo, item.numeroRecibo, item.detalle, item.metodoPago, item.estado, item.cajero]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase('es-NI').includes(term))
    })
  }, [historialGeneral, searchTerm, historialTipoFiltro, historialFechaFiltro])


  const loadData = async (silent = false) => {
    if (!silent) {
      setIsLoading(true)
      setError(null)
    }

    try {
      const currentYear = String(new Date().getFullYear())
      
      console.log('🔄 Iniciando carga de datos de Caja...');

      const pDashboard = getCajaDashboard(token, 25).catch(e => { console.error("❌ Error en getCajaDashboard:", e); throw e; });
      const pSession = getActiveCajaSession(token).catch(e => { console.error("❌ Error en getActiveCajaSession:", e); throw e; });
      const pMethods = getMetodosPago(token).catch(e => { console.error("❌ Error en getMetodosPago:", e); throw e; });
      const pStudents = listEstudiantesActivos(token, currentYear).catch(e => { console.error("❌ Error en listEstudiantesActivos:", e); throw e; });
      const pTarifas = getCajaTarifas(token).catch(e => { console.error("❌ Error en getCajaTarifas:", e); throw e; });
      const pPending = getResumenPendientesMensualidad(token).catch(e => { console.error("❌ Error en getResumenPendientesMensualidad:", e); throw e; });

      const [dashboard, session, methods, activeStudents, tarifasResponse, pendingStudents] = await Promise.all([
        pDashboard, pSession, pMethods, pStudents, pTarifas, pPending
      ])

      console.log('✅ Datos de caja cargados exitosamente');

      setData(dashboard)
      setActiveSession(session)
      setMetodosPago(methods)
      setTarifas(tarifasResponse)
      setEstudiantesActivos(activeStudents)
      setMensualidadesPendientesEstudiantes(pendingStudents)
      setMensualidadMontoBase(String(Number(tarifasResponse.montoMensualidadBase ?? 0)))
      setMensualidadMoraPorPeriodo(String(Number(tarifasResponse.montoMora ?? 0)))
      setMensualidadDiaLimitePago(String(Number(tarifasResponse.diasGracia ?? 5)))
      const firstMethodId = methods[0] ? String(methods[0].id) : ''
      setTallerMetodoPagoId((current) => (methods.some((method) => String(method.id) === current) ? current : firstMethodId))
      setMensualidadMetodoPagoId((current) => (methods.some((method) => String(method.id) === current) ? current : firstMethodId))

      return dashboard
    } catch (error) {
      console.error("🔥 Error crítico al cargar el dashboard de caja:", error);
      if (axios.isAxiosError(error)) {
        console.error("📍 Endpoint que falló (RAIZ):", error.config?.url);
        console.error("📍 Código HTTP:", error.response?.status);
        console.error("📍 Respuesta del servidor:", error.response?.data);
      }

      setError('No se pudo cargar la información de caja. Verifica tu conexión o que hayas iniciado sesión nuevamente para renovar tus permisos.')
      const emptyData: CajaDashboardResponse = {
        metricas: { talleresPendientesPago: 0, matriculasPendientes: 0, pagosMatriculaPendientes: 0, mensualidadesPendientes: 0, registrosTaller: 0, registrosMatricula: 0, registrosMensualidad: 0 },
        totalCobradoTalleres: 0,
        totalCobradoMatriculas: 0,
        totalCobradoMensualidades: 0,
        totalCobradoGeneral: 0,
        talleresPendientes: [],
        matriculasPendientes: [],
        pagosTaller: [],
        pagosMatricula: [],
        mensualidades: []
      }
      setData(emptyData)
      return emptyData
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
    }
  }

  const loadGeneralHistorialData = async () => {
    try {
      const payload = await getCajaHistorialGeneral(token)
      setGeneralHistorialData(payload)
    } catch {
      toast.error('No se pudo cargar el historial general completo de caja.')
      setGeneralHistorialData(null)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    if (periodFilter === 'mi_caja') {
      return
    }
    if (generalHistorialData) {
      return
    }
    void loadGeneralHistorialData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodFilter, token, generalHistorialData])

  const refreshAll = async (silent = false) => {
    const newData = await loadData(silent)
    if (!silent) setGeneralHistorialData(null)
    if (periodFilter !== 'mi_caja') {
      await loadGeneralHistorialData()
    }
    return newData
  }

  const runAction = async (action: string, executor: () => Promise<CajaOperacionResult>) => {
    setBusyAction(action)
    setPaymentMessage(null)
    const oldData = data
    try {
      const response = await executor()
      toast.success(response.mensaje)
      setPaymentMessage(response.mensaje)
        const newData = await refreshAll(true)
      return { success: true, oldData, newData }
        } catch (err: any) {
          const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.response?.data || err.message) : (err instanceof Error ? err.message : 'No se pudo completar la operacion.')
          const finalMsg = typeof message === 'string' ? message : 'Error en la operación'
          toast.error(finalMsg)
          setPaymentMessage(finalMsg)
      return { success: false, oldData: null, newData: null }
    } finally {
      setBusyAction(null)
    }
  }

  const handleOpenSession = async () => {
    setOpenPassword('')
    setShowOpenSessionModal(true)
  }

  const confirmOpenSession = async () => {
    if (!openPassword.trim()) {
      toast.error('Debes confirmar tu contraseña para abrir la caja.')
      return
    }

      const result = await runAction('open-session', () => openCajaSession(token, { 
        saldoInicial: readNumber(openSaldo), 
        observacion: openObservacion,
        password: openPassword 
      }))

      if (result.success) {
        setShowOpenSessionModal(false)
        setOpenPassword('')
      }
  }

  const handleCloseAllOpenCajas = async () => {
    setBusyAction('close-all-open-cajas')
    setPaymentMessage(null)
    try {
      await closeAllOpenCajas(token)
      const message = 'Todas las cajas abiertas fueron cerradas.'
      toast.success(message)
      setPaymentMessage(message)
      await refreshAll()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo completar la operacion.'
      toast.error(message)
      setPaymentMessage(message)
    } finally {
      setBusyAction(null)
    }
  }

  const handleCloseSession = async () => {
    if (!activeSession) return
    const toastId = toast.loading('Calculando totales del turno...')
    try {
      const corte = await getCorteSession(token, activeSession.id)
      setCortePreCierre(corte)
      const esperado = (Number(activeSession.saldoInicial ?? 0)) + corte.totalCobrado
      setPreCloseCounted(String(esperado > 0 ? esperado : 0))
      setShowPreCloseModal(true)
    } catch (err: any) {
      toast.error('No se pudieron obtener los totales para el pre-cierre.')
    } finally {
      toast.dismiss(toastId)
    }
  }

  const confirmCloseSession = async () => {
    setShowPreCloseModal(false)
    await runAction('close-session', () => closeCajaSession(token, { saldoCierre: readNumber(preCloseCounted), observacion: closeObservacion }))
  }

  const handlePayTaller = async (cupoId: number, monto: number, montoRecibido: number, cambioDevuelto: number) => {
    const result = await runAction(`pay-taller-${cupoId}`, () => payTaller(token, {
      cupoId,
      monto,
      metodoPagoId: Number(tallerMetodoPagoId),
      detalle: 'Cobro desde caja',
      montoRecibido,
      cambioDevuelto,
    }))

    if (result.success && result.newData && result.oldData) {
      const oldIds = new Set(result.oldData.pagosTaller?.map((p) => p.pagoCupoId) || [])
      const newPayment = result.newData.pagosTaller?.find((p) => !oldIds.has(p.pagoCupoId))
      
      if (newPayment) {
        const item = buildCajaHistorialFromParts([newPayment], [], [])[0]
        if (item) openReceipt(item)
      }
    }
  }

  const handlePayMatricula = async (payload: { matriculaId: number; monto: number; metodoPagoId: number; detalle: string; montoRecibido: number; cambioDevuelto: number }) => {
    const result = await runAction('pay-matricula', () => payMatricula(token, {
      matriculaId: payload.matriculaId,
      monto: payload.monto,
      metodoPagoId: payload.metodoPagoId,
      detalle: payload.detalle,
      montoRecibido: payload.montoRecibido,
      cambioDevuelto: payload.cambioDevuelto,
    }))

    if (result.success && result.newData && result.oldData) {
      const oldIds = new Set(result.oldData.pagosMatricula?.map((p) => p.pagoMatriculaId) || [])
      const newPayment = result.newData.pagosMatricula?.find((p) => !oldIds.has(p.pagoMatriculaId))
      
      if (newPayment) {
        const item = buildCajaHistorialFromParts([], [newPayment], [])[0]
        if (item) openReceipt(item)
      }
    }
  }

  const refreshStudentPendingList = async (estId: string) => {
    if (!token || !estId) return
    try {
      const [list, resumen] = await Promise.all([
        getPendientesMensualidades(token, Number(estId)),
        getMensualidadMesesResumen(token, Number(estId)),
      ])
      setPendientesMensualidadesList(list)
      setMensualidadMesesResumen(resumen)
    } catch (e) {
      setPendientesMensualidadesList([])
      setMensualidadMesesResumen({ mesesPagados: [], mesActual: new Date().getMonth() + 1 })
    }
  }

  const handlePayMensualidad = async (montoRecibido: number, cambioDevuelto: number) => {
    const result = await runAction('pay-mensualidad', () => payMensualidad(token, {
      estudianteId: Number(mensualidadEstudianteId),
      mesDePago: Number(mensualidadMes),
      montoBase: Number(mensualidadMontoBase),
      montoMora: Number.isFinite(moraAplicadaFormulario) ? moraAplicadaFormulario : 0,
      metodoPagoId: Number(mensualidadMetodoPagoId),
      detalle: 'Cobro desde caja',
      montoRecibido,
      cambioDevuelto,
    }))

    if (result.success) {
      void refreshStudentPendingList(mensualidadEstudianteId)
    }

    if (result.success && result.newData && result.oldData) {
      const oldIds = new Set(result.oldData.mensualidades?.map((p) => p.mensualidadId) || [])
      const newPayment = result.newData.mensualidades?.find((p) => !oldIds.has(p.mensualidadId))
      
      if (newPayment) {
        const item = buildCajaHistorialFromParts([], [], [newPayment])[0]
        if (item) openReceipt(item)
      }
    }
  }

  const handleAnnulTaller = async (pagoCupoId: number, motivo: string) => {
    await runAction(`annul-taller-${pagoCupoId}`, () => annulPagoTaller(token, pagoCupoId, { motivo }))
  }

  const handleAnnulMatricula = async (pagoMatriculaId: number, motivo: string) => {
    await runAction(`annul-matricula-${pagoMatriculaId}`, () => annulPagoMatricula(token, pagoMatriculaId, { motivo }))
  }

  const handleAnnulMensualidad = async (mensualidadId: number, motivo: string) => {
    await runAction(`annul-mensualidad-${mensualidadId}`, () => annulPagoMensualidad(token, mensualidadId, { motivo }))
  }

  const requestAnnulTaller = async (pagoCupoId: number, numeroRecibo: string, monto: number) => {
    await syncAddAnnulment({ idUnico: `taller-${pagoCupoId}`, type: 'taller', idElemento: pagoCupoId, label: numeroRecibo || String(pagoCupoId), monto, timestamp: new Date().toISOString() })
  }

  const requestAnnulMatricula = async (pagoMatriculaId: number, numeroRecibo: string, monto: number) => {
    await syncAddAnnulment({ idUnico: `matricula-${pagoMatriculaId}`, type: 'matricula', idElemento: pagoMatriculaId, label: numeroRecibo || String(pagoMatriculaId), monto, timestamp: new Date().toISOString() })
  }

  const requestAnnulMensualidad = async (mensualidadId: number, numeroRecibo: string, monto: number) => {
    await syncAddAnnulment({ idUnico: `mensualidad-${mensualidadId}`, type: 'mensualidad', idElemento: mensualidadId, label: numeroRecibo || String(mensualidadId), monto, timestamp: new Date().toISOString() })
  }

  const closeAnnulModal = () => {
    setAnnulModal(null)
    setAnnulReason('')
  }

  const confirmAnnul = async () => {
    if (!annulModal) {
      return
    }

    const motivo = annulReason.trim()
    if (!motivo) {
      toast.error('Debes ingresar un motivo de anulación.')
      return
    }

    if (annulModal.type === 'taller') {
      await handleAnnulTaller(annulModal.id, motivo)
      closeAnnulModal()
      return
    }

    if (annulModal.type === 'matricula') {
      await handleAnnulMatricula(annulModal.id, motivo)
      closeAnnulModal()
      return
    }

    await handleAnnulMensualidad(annulModal.id, motivo)
    closeAnnulModal()
  }

  const isAnnulBusy = annulModal ? busyAction === `annul-${annulModal.type}-${annulModal.id}` : false

  const metricas = data?.metricas
  
  const pendingTallerIds = useMemo(() => pendingAnnulments.filter(p => p.type === 'taller').map(p => p.idElemento), [pendingAnnulments])
  const pendingMatriculaIds = useMemo(() => pendingAnnulments.filter(p => p.type === 'matricula').map(p => p.idElemento), [pendingAnnulments])
  const pendingMensualidadIds = useMemo(() => pendingAnnulments.filter(p => p.type === 'mensualidad').map(p => p.idElemento), [pendingAnnulments])

  const tabs = useMemo(
    () => [
      { id: 'talleres' as const, label: 'Talleres', icon: ReceiptText },
      { id: 'matricula' as const, label: 'Matrícula', icon: CreditCard },
      { id: 'mensualidad' as const, label: 'Mensualidad', icon: CreditCard },
    ],
    [],
  )

  const openHistorialModal = () => setHistorialModalOpen(true)
  const closeHistorialModal = () => setHistorialModalOpen(false)

  const buildReceiptHtml = (item: CajaHistorialItem) => {
    const anuladoBadge = item.anulado ? `<div style="color: #b91c1c; font-weight:700; text-align: center; margin-top: 10px; border: 2px dashed #b91c1c; padding: 10px; border-radius: 8px;">RECIBO ANULADO<br><span style="font-size: 12px; font-weight: normal;">Motivo: ${item.motivoAnulacion || 'Sin motivo'}</span><br><span style="font-size: 13px; font-weight: 600;">Monto devuelto al cliente: ${formatMoney(item.cambioDevuelto)}</span></div>` : ''
    const cashierName = user?.nombre ? `${user.nombre} ${user.apellido || ''}`.trim() : 'Caja Principal'
    const logoHtml = `<div style="width: 100px; height: auto;">${logoSvg}</div>`

    let tableBodyHtml = ''
    const itemDescription = item.detalle || '-'

    if (item.tipo === 'Mensualidad') {
      const monthName = item.mes ? getMonthName(item.mes) : getMonthName(itemDescription)
      tableBodyHtml = `
        <tr>
          <td><span class="item-desc">Pago de Mensualidad</span><span class="item-meta">Correspondiente al mes de ${monthName}</span></td>
          <td class="text-right">1</td>
          <td class="text-right">${formatMoney(item.monto)}</td>
          <td class="text-right total-col">${formatMoney(item.monto)}</td>
        </tr>
      `
    } else if (item.tipo === 'Matrícula') {
      const anioText = item.anioLectivo ? ` · Año lectivo ${item.anioLectivo}` : ''
      tableBodyHtml = `
        <tr>
          <td><span class="item-desc">Pago de Matrícula</span><span class="item-meta">${itemDescription}${anioText}</span></td>
          <td class="text-right">1</td>
          <td class="text-right">${formatMoney(item.monto)}</td>
          <td class="text-right total-col">${formatMoney(item.monto)}</td>
        </tr>
      `
    } else { // Taller
      tableBodyHtml = `
        <tr>
          <td><span class="item-desc">Inscripción a Taller: ${item.titulo}</span><span class="item-meta">Participante: ${itemDescription}</span></td>
          <td class="text-right">1</td>
          <td class="text-right">${formatMoney(item.monto)}</td>
          <td class="text-right total-col">${formatMoney(item.monto)}</td>
        </tr>
      `
    }

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Recibo ${item.numeroRecibo || 'Pendiente'}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Inter', system-ui, sans-serif; padding: 0; margin: 0; color: #0f172a; background-color: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .receipt-container { max-width: 800px; margin: 40px auto; background: #fff; padding: 50px; border-radius: 20px; box-shadow: 0 10px 30px rgba(15,23,42,0.04); border: 1px solid #e2e8f0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f766e; padding-bottom: 25px; margin-bottom: 30px; }
    .header-left { display: flex; flex-direction: column; gap: 8px; }
    .school-info { font-size: 12px; color: #64748b; margin-top: 5px; line-height: 1.5; font-weight: 500; }
    .header-right { text-align: right; }
    .receipt-title { font-size: 26px; font-weight: 800; color: #0f766e; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1.5px; }
    .receipt-number { font-size: 15px; color: #475569; font-weight: 700; }
    .date-info { font-size: 13px; color: #64748b; margin-top: 6px; font-weight: 500; }
    .customer-section { margin-bottom: 30px; padding: 18px 22px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; border-left: 4px solid #0f766e; }
    .customer-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 1px; margin-bottom: 4px; }
    .customer-name { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0; }
    .details-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .details-table th { padding: 12px 16px; background-color: #0f172a; color: #ffffff; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
    .details-table th:first-child { text-align: left; border-top-left-radius: 6px; border-bottom-left-radius: 6px; }
    .details-table th:last-child { text-align: right; border-top-right-radius: 6px; border-bottom-right-radius: 6px; }
    .details-table td { padding: 16px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 13px; }
    .text-right { text-align: right; }
    .item-desc { font-weight: 600; color: #0f172a; display: block; margin-bottom: 4px; font-size: 14px; }
    .item-meta { font-size: 12px; color: #64748b; font-weight: 400; }
    .total-col { font-weight: 600; color: #0f172a; }
    .totals-section { display: flex; justify-content: flex-end; margin-bottom: 40px; }
    .totals-box { width: 320px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px 0; background-color: #f8fafc; }
    .total-line { display: flex; justify-content: space-between; padding: 8px 16px; font-size: 13px; color: #475569; font-weight: 500; }
    .total-line.grand-total { background-color: #0f766e; color: white; font-weight: 700; font-size: 16px; border-radius: 8px; margin: 4px 8px 0 8px; padding: 12px 14px; }
    .payment-info { display: flex; justify-content: space-between; padding-top: 20px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #64748b; line-height: 1.5; font-weight: 500; }
    .payment-info div { flex: 1; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 1.5; }
    @media print {
      body { background-color: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .receipt-container { box-shadow: none; border: none; margin: 0; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <div class="header-left">
        ${logoHtml}
        <div class="school-info">Centro Integral de Estimulación Temprana<br>Managua, Nicaragua</div>
      </div>
      <div class="header-right">
        <h1 class="receipt-title">RECIBO</h1>
        <div class="receipt-number">Nº ${item.numeroRecibo || 'Pendiente'}</div>
        <div class="date-info">Fecha: ${formatDate(item.fecha) || 'No registrada'}</div>
      </div>
    </div>
    ${anuladoBadge}
    <div class="customer-section">
      <div class="customer-label">Recibí de / Estudiante:</div>
      <h2 class="customer-name">${item.titulo || 'Cliente General'}</h2>
    </div>
    <table class="details-table">
      <thead>
        <tr>
          <th>Descripción</th>
          <th class="text-right">Cantidad</th>
          <th class="text-right">Precio Unit.</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${tableBodyHtml}
      </tbody>
    </table>
    <div class="totals-section">
      <div class="totals-box">
        <div class="total-line"><span>Subtotal:</span><span>${formatMoney(item.monto)}</span></div>
        <div class="total-line"><span>Impuestos:</span><span>${formatMoney(0)}</span></div>
        <div class="total-line grand-total"><span>TOTAL:</span><span>${formatMoney(item.monto)}</span></div>
      </div>
    </div>
    <div class="payment-info">
      <div><strong>Método de pago:</strong><br>${item.metodoPago || 'No especificado'}</div>
      <div><strong>Recibido:</strong><br>${formatMoney(item.montoRecibido)}</div>
      <div><strong>Cambio devuelto:</strong><br>${formatMoney(item.cambioDevuelto)}</div>
      <div><strong>Estado:</strong><br>${item.estado || 'Procesado'}</div>
      <div style="text-align: right;"><strong>Atendido por:</strong><br>${cashierName}</div>
    </div>
    <div class="footer">
      ¡Gracias por confiar en Mi Casita!<br>Este documento es un comprobante de pago válido.<br>Generado el ${new Date().toLocaleString('es-NI')}
    </div>
  </div>
</body>
</html>`
  }

  const openReceipt = (item: CajaHistorialItem) => {
    // 1. Descargar copia de respaldo automáticamente en formato HTML
    downloadReceipt(item)

    const html = buildReceiptHtml(item)
    const w = window.open('', '_blank')
    if (!w) {
      toast.error('No se pudo abrir la ventana de impresión. Permite popups.')
      return
    }
    w.document.write(html)
    w.document.close()
    // give browser a moment to render then call print
    setTimeout(() => {
      try {
        w.focus()
        w.print()
      } catch (e) {
        // ignore
      }
    }, 300)
  }

  const downloadReceipt = (item: CajaHistorialItem) => {
    const html = buildReceiptHtml(item)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recibo-${item.numeroRecibo || item.key}.html`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const printHistorialGeneral = () => {
    const filterLabel = periodFilter === 'mi_caja' ? 'Mi caja (Hoy)' : periodFilter === 'hoy_todos' ? 'General (Hoy todas las cajas)' : 'Histórico completo'
    const logoHtml = `<div style="width: 150px; margin: 0 auto 10px;">${logoSvg}</div>`

    const totalCobrado = historialFiltrado.filter(h => !h.anulado).reduce((acc, curr) => acc + (curr.monto || 0), 0)
    const totalAnulado = historialFiltrado.filter(h => h.anulado).reduce((acc, curr) => acc + (curr.monto || 0), 0)

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Historial General de Caja</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @page { size: A4 landscape; margin: 15mm 10mm; }
          body { font-family: 'Inter', system-ui, sans-serif; color: #0f172a; background-color: #fff; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .header-container { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0f766e; padding-bottom: 20px; margin-bottom: 25px; }
          .logo-wrapper { max-width: 140px; }
          .header-info { text-align: right; }
          h1 { color: #0f766e; font-size: 20px; font-weight: 700; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: 0.5px; }
          .meta-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 1px; }
          .meta-value { font-size: 14px; font-weight: 500; color: #1e293b; margin: 2px 0 10px 0; }
          
          .summary-cards { display: grid; grid-template-cols: 1fr 1fr 1fr 1fr; gap: 15px; margin-bottom: 25px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; font-size: 12px; }
          .card-title { color: #64748b; font-weight: 500; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
          .card-value { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 4px; }
          .card-value.highlight { color: #0f766e; }
          .card-value.danger { color: #b91c1c; }

          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          th { background-color: #0f172a; color: #ffffff; text-transform: uppercase; font-size: 9px; font-weight: 600; letter-spacing: 1px; padding: 10px 12px; text-align: left; }
          td { border-bottom: 1px solid #e2e8f0; padding: 10px 12px; color: #334155; }
          tr:nth-child(even) { background-color: #f8fafc; }
          tr.anulado-row { background-color: #fef2f2 !important; color: #991b1b; }
          tr.anulado-row td { color: #991b1b; }
          .text-right { text-align: right; }
          .anulado-text { font-weight: 700; color: #b91c1c; text-transform: uppercase; font-size: 9px; }
          .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 35px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          tr { page-break-inside: avoid; }
          @media print {
            body { background-color: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="logo-wrapper">${logoHtml}</div>
          <div class="header-info">
            <h1>Historial General de Caja</h1>
            <div class="meta-label">Fecha de Reporte</div>
            <div class="meta-value">${new Date().toLocaleString('es-NI')}</div>
          </div>
        </div>

        <div class="summary-cards">
          <div class="card">
            <div class="card-title">Período Seleccionado</div>
            <div class="card-value">${filterLabel}</div>
          </div>
          <div class="card">
            <div class="card-title">Ingreso Neto (Cobrado)</div>
            <div class="card-value highlight">${formatMoney(totalCobrado)}</div>
          </div>
          <div class="card">
            <div class="card-title">Monto Anulado</div>
            <div class="card-value danger">${formatMoney(totalAnulado)}</div>
          </div>
          <div class="card">
            <div class="card-title">Responsable</div>
            <div class="card-value">${user?.nombre || ''} ${user?.apellido || ''}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="border-top-left-radius: 6px; border-bottom-left-radius: 6px;">Fecha</th>
              <th>Recibo</th>
              <th>Tipo</th>
              <th>Título / Estudiante</th>
              <th>Detalle</th>
              <th>Cajero</th>
              <th>Método</th>
              <th>Estado</th>
              <th class="text-right" style="border-top-right-radius: 6px; border-bottom-right-radius: 6px;">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${historialFiltrado.map(item => `
              <tr class="${item.anulado ? 'anulado-row' : ''}">
                <td>${formatDate(item.fecha)}</td>
                <td style="font-weight: 600;">${item.numeroRecibo || '-'}</td>
                <td><span style="font-weight: 500;">${item.tipo}</span></td>
                <td style="font-weight: 500;">${item.titulo}</td>
                <td style="color: #64748b;">${item.detalle}</td>
                <td>${item.cajero || '-'}</td>
                <td>${item.metodoPago || '-'}</td>
                <td>${item.anulado ? '<span class="anulado-text">Anulado</span>' : (item.estado || '-')}</td>
                <td class="text-right" style="font-weight: 600;">${formatMoney(item.monto)}</td>
              </tr>
            `).join('')}
            ${historialFiltrado.length === 0 ? '<tr><td colspan="9" style="text-align:center; padding: 20px;">No hay registros</td></tr>' : ''}
          </tbody>
        </table>

        <div class="footer">
          Centro Integral de Estimulación Temprana "Mi Casita" · Reporte Oficial
        </div>
      </body>
      </html>
    `

    const w = window.open('', '_blank')
    if (!w) {
      toast.error('Permite las ventanas emergentes para poder imprimir el reporte.')
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
    <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Finanzas</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Caja</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
            Panel operativo para el rol CAJA. Aquí puedes revisar lo pendiente de talleres, matrícula y mensualidad.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 flex items-center justify-center rounded-full ${activeSession ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {activeSession ? <Check /> : <X />}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{activeSession ? `Caja Abierta (${activeSession.codigo})` : 'Caja Cerrada'}</p>
                <p className="text-xs text-slate-500">{activeSession ? `Abierta por ${user?.nombre}` : 'Inicia sesión para cobrar.'}</p>
                {activeSession ? (
                  <p className="mt-1 text-[10px] text-slate-400">Apertura: {formatDateTime(activeSession.fechaApertura)}</p>
                ) : null}
                {activeSession?.fechaCierre ? (
                  <p className="text-[10px] text-slate-400">Cierre: {formatDateTime(activeSession.fechaCierre)}</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {activeSession ? (
                <button type="button" onClick={handleCloseSession} disabled={busyAction === 'close-session'} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">
                  {busyAction === 'close-session' ? '...' : 'Cerrar'}
                </button>
              ) : (
                <button type="button" onClick={handleOpenSession} disabled={busyAction === 'open-session'} className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">
                  {busyAction === 'open-session' ? '...' : 'Abrir'}
                </button>
              )}
            </div>
          </div>
          {isCajaAdmin && (
            <button
              type="button"
              onClick={handleCloseAllOpenCajas}
              disabled={busyAction === 'close-all-open-cajas'}
              className="mt-2 w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60"
            >
              Forzar Cierre de Cajas
            </button>
          )}
        </div>
      </div>

      {paymentMessage ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {paymentMessage}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar en pendientes por estudiante, tutor o recibo..."
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-teal-500"
        />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button onClick={() => setIsResumenModalOpen(true)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Ver Resumen
          </button>
          <button onClick={openHistorialModal} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Ver Historial
          </button>
          {pendingAnnulments.length > 0 && (
            <button
              onClick={() => setShowPendingAnnulmentsModal(true)}
              className={`inline-flex items-center rounded-xl border px-4 py-2 text-sm font-bold shadow-sm transition-colors ${
                isCajaAdmin 
                  ? 'border-rose-400 bg-rose-50 text-rose-700 hover:bg-rose-100'
                  : 'border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <span className="relative flex h-3 w-3 mr-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCajaAdmin ? 'bg-rose-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isCajaAdmin ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
              </span>
              Anulaciones ({pendingAnnulments.length})
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {activeSession ? (
          tabs.map(({ id, label, icon: Icon }) => {
            const count = id === 'talleres' ? metricas?.talleresPendientesPago ?? 0 : id === 'matricula' ? metricas?.matriculasPendientes ?? 0 : metricas?.mensualidadesPendientes ?? 0
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`inline-flex items-center rounded-xl border px-3 py-2 text-sm font-semibold transition ${tab === id ? 'border-teal-500 bg-teal-100 text-teal-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
              >
                <Icon className="mr-2 h-4 w-4" />
                {label}
                <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-700">
                  {count}
                </span>
              </button>
            )
          })
        ) : <div />}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-slate-600">
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            Cargando caja...
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        {!isLoading && data ? (
          <>
                    {!activeSession ? (
                      <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                          <Wallet className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">La caja está cerrada</h3>
                        <p className="mt-2 max-w-md text-sm text-slate-500">
                          Para registrar nuevos cobros, consultar deudas o realizar anulaciones, necesitas abrir una sesión de caja desde el panel superior.
                        </p>
                      </div>
                    ) : (
                      <>
                {tab === 'talleres' ? (
                  <TalleresTab
                    pendientes={data.talleresPendientes}
                    pagos={pagosTallerFiltradosPeriodo}
                    onPay={handlePayTaller}
                    onAnnul={requestAnnulTaller}
                    metodoPagoId={tallerMetodoPagoId}
                    onMetodoPagoChange={setTallerMetodoPagoId}
                    metodosPago={metodosPago}
                    busy={busyAction?.startsWith('pay-taller-') || busyAction?.startsWith('annul-taller-') || false}
                    search={searchTerm}
                      pendingAnnulIds={pendingTallerIds}
                  />
                ) : null}

                {tab === 'matricula' ? (
                  <MatriculaTab
                    pendientes={data.matriculasPendientes}
                    pagos={pagosMatriculaFiltradosPeriodo}
                    onPay={handlePayMatricula}
                    onAnnul={requestAnnulMatricula}
                    metodosPago={metodosPago}
                    busy={busyAction === 'pay-matricula' || (busyAction?.startsWith('annul-matricula-') ?? false)}
                    externalBusqueda={searchTerm}
                    onPreviewMatricula={async (estudianteId: number) => {
                      try {
                        const resp = await previewMatricula(token ?? null, estudianteId)
                        return resp
                      } catch (e) {
                        return null
                      }
                    }}
                    montoBaseSugerido={tarifas?.montoMatriculaBase ?? null}
                      pendingAnnulIds={pendingMatriculaIds}
                  />
                ) : null}

                {tab === 'mensualidad' ? (
                  <MensualidadTab
                    mensualidades={mensualidadesFiltradasPeriodo}
                    mensualidadesPendientes={metricas?.mensualidadesPendientes ?? 0}
                    estudianteId={mensualidadEstudianteId}
                    mesDePago={mensualidadMes}
                    montoBase={mensualidadMontoBase}
                    montoMora={mensualidadMontoMora}
                    metodoPagoId={mensualidadMetodoPagoId}
                    buscarEstudiante={mensualidadBuscarEstudiante}
                    filtroEstado={mensualidadFiltroEstado}
                    onEstudianteIdChange={setMensualidadEstudianteId}
                    onMesDePagoChange={setMensualidadMes}
                    onMontoBaseChange={setMensualidadMontoBase}
                    onMontoMoraChange={setMensualidadMontoMora}
                    onMetodoPagoChange={setMensualidadMetodoPagoId}
                    onMoraAutomaticaChange={setMensualidadMoraAutomatica}
                    onBuscarEstudianteChange={setMensualidadBuscarEstudiante}
                    onFiltroEstadoChange={setMensualidadFiltroEstado}
                    pendientesMensualidadesList={pendientesMensualidadesList}
                    mensualidadMesesPagados={mensualidadMesesResumen.mesesPagados}
                    mensualidadMesActual={mensualidadMesesResumen.mesActual}
                    estudiantesActivos={estudiantesActivos}
                    estudiantesPendientesMensualidad={mensualidadesPendientesEstudiantes}
                    globalSearchTerm={searchTerm}
                    onBuscarPendientes={refreshStudentPendingList}
                    onPay={handlePayMensualidad}
                    onAnnul={requestAnnulMensualidad}
                    metodosPago={metodosPago}
                    pendingAnnulIds={pendingMensualidadIds}
                  />
                ) : null}
                      </>
                    )}
          </>
        ) : null}

        {isResumenModalOpen && createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setIsResumenModalOpen(false)} />
            <div className="relative w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">Resumen de Caja</h4>
                  <p className="text-sm text-slate-600">Métricas de cobros pendientes.</p>
                </div>
                <button onClick={() => setIsResumenModalOpen(false)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">Cerrar</button>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-2">
                <SectionCard title="Talleres pendiente" value={`${metricas?.talleresPendientesPago ?? 0}`} detail="Inscripciones en espera de pago" />
                <SectionCard title="Matrículas pendiente" value={`${metricas?.matriculasPendientes ?? 0}`} detail="Estudiantes pendientes en caja" />
                <SectionCard title="Pago matrícula pendiente" value={`${metricas?.pagosMatriculaPendientes ?? 0}`} detail="Registros en estado pendiente" />
                <SectionCard title="Mensualidades pendiente" value={`${metricas?.mensualidadesPendientes ?? 0}`} detail="Cuotas por cobrar" />
              </div>
            </div>
          </div>,
          document.body
        )}

        {annulModal ? createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={closeAnnulModal} />
            <div className="relative w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">Motivo de anulación</h4>
                  <p className="text-sm text-slate-600">
                    {annulModal.type === 'taller'
                      ? `Recibo: ${annulModal.label}`
                      : annulModal.type === 'matricula'
                        ? `Pago de matrícula: ${annulModal.label}`
                        : `Mensualidad: ${annulModal.label}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeAnnulModal}
                  disabled={isAnnulBusy}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cerrar
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm font-semibold text-rose-800">Atención: Devolución de dinero</p>
                <p className="mt-1 text-sm text-rose-700">
                  Al anular este recibo, deberás devolver <strong>{formatMoney(annulModal.monto)}</strong> al cliente. 
                  Este monto será restado automáticamente del ingreso neto de tu turno de caja.
                </p>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="annul-reason">
                  Escribe el motivo
                </label>
                <textarea
                  id="annul-reason"
                  value={annulReason}
                  onChange={(event) => setAnnulReason(event.target.value)}
                  rows={4}
                  placeholder="Ejemplo: pago registrado por error, se emitirá nuevamente"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAnnulModal}
                  disabled={isAnnulBusy}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmAnnul}
                  disabled={isAnnulBusy || !annulReason.trim()}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAnnulBusy ? 'Procesando...' : 'Confirmar anulación'}
                </button>
              </div>
            </div>
          </div>
        , document.body) : null}

        {showOpenSessionModal ? createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setShowOpenSessionModal(false)} />
            <div className="relative w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">Apertura de caja</h4>
                  <p className="text-sm text-slate-600">Ingresa los datos de apertura para esta sesión.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOpenSessionModal(false)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  Cerrar
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Monto de apertura</label>
                  <input
                    value={openSaldo}
                    onChange={(e) => setOpenSaldo(e.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ej. 2500"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Observación de apertura</label>
                  <input
                    value={openObservacion}
                    onChange={(e) => setOpenObservacion(e.target.value)}
                    placeholder="Caja inicial del turno"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Contraseña de confirmación</label>
                  <div className="flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500">
                    <input
                      value={openPassword}
                      onChange={(e) => setOpenPassword(e.target.value)}
                      type={showOpenPassword ? 'text' : 'password'}
                      placeholder="Ingresa tu contraseña para autorizar"
                      className="w-full bg-transparent outline-none"
                    />
                    <button type="button" onClick={() => setShowOpenPassword(!showOpenPassword)} className="text-slate-400 hover:text-slate-600">
                      {showOpenPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOpenSessionModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmOpenSession}
                  disabled={busyAction === 'open-session'}
                  className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busyAction === 'open-session' ? 'Procesando...' : 'Confirmar apertura'}
                </button>
              </div>
            </div>
          </div>
        , document.body) : null}

        {showPreCloseModal ? createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setShowPreCloseModal(false)} />
            <div className="relative flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">Pre-cierre de caja</h4>
                  <p className="text-sm text-slate-600">Revise los totales y confirme el cierre del turno.</p>
                </div>
                <button type="button" onClick={() => setShowPreCloseModal(false)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Cerrar</button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                      <p className="text-sm text-slate-600">Arqueo sugerido</p>
                      <p className="mt-1 font-semibold text-slate-900">Efectivo esperado: {formatMoney(efectivoEsperadoPreCierre)}</p>
                      {activeSession ? (
                        <p className="mt-1 text-xs text-slate-500">Apertura: {formatDateTime(activeSession.fechaApertura)}</p>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                        <p className="text-xs text-slate-500">Talleres</p>
                        <p className="font-semibold text-slate-900">{formatMoney(pagosDelTurnoTaller)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                        <p className="text-xs text-slate-500">Matrícula</p>
                        <p className="font-semibold text-slate-900">{formatMoney(pagosDelTurnoMatricula)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                        <p className="text-xs text-slate-500">Mensualidad</p>
                        <p className="font-semibold text-slate-900">{formatMoney(pagosDelTurnoMensualidad)}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm">
                      <p className="text-xs text-rose-700">Anulaciones en turno</p>
                      <p className="font-semibold text-rose-800">{totalAnulacionesTurno}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                        <p className="text-xs text-slate-500">Apertura de caja</p>
                        <p className="font-semibold text-slate-900">{formatMoney(aperturaSesion)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                        <p className="text-xs text-slate-500">Dinero ingresado (cobrado)</p>
                        <p className="font-semibold text-slate-900">{formatMoney(totalCobradoGeneralPreClose)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Efectivo físico contado en caja</label>
                      <input 
                        value={preCloseCounted} 
                        onChange={(e) => setPreCloseCounted(e.target.value)} 
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 font-medium" 
                        placeholder="Ingrese monto contado" 
                      />
                      <p className="mt-1 text-xs text-slate-500">Monto total de billetes y monedas contados en el cajón.</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
                      <div className="flex justify-between text-slate-650">
                        <span>Efectivo esperado (Apertura + Cobros):</span>
                        <span className="font-semibold text-slate-900">{formatMoney(efectivoEsperadoPreCierre)}</span>
                      </div>
                      <div className="flex justify-between text-slate-650">
                        <span>Efectivo contado ingresado:</span>
                        <span className="font-semibold text-slate-900">{formatMoney(efectivoContadoPreCierre)}</span>
                      </div>
                      <hr className="border-slate-200 my-1" />
                      <div className="flex justify-between items-center pt-1 font-semibold text-sm">
                        <span>Resultado de Arqueo:</span>
                        {diferenciaPreCierre > 0 ? (
                          <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-800 font-bold border border-emerald-200">
                            Sobrante de {formatMoney(diferenciaPreCierre)}
                          </span>
                        ) : diferenciaPreCierre < 0 ? (
                          <span className="inline-flex rounded-lg bg-rose-50 px-2.5 py-1 text-rose-800 font-bold border border-rose-200">
                            Faltante de {formatMoney(Math.abs(diferenciaPreCierre))}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 font-bold border border-slate-200">
                            Cuadrado (Sin diferencia)
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Descripción / Observación de cierre</label>
                      <input
                        value={closeObservacion}
                        onChange={(e) => setCloseObservacion(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                        placeholder="Ej. Cierre de turno sin incidencias"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 p-5 sm:p-6">
                <button type="button" onClick={() => setShowPreCloseModal(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
                <button type="button" onClick={confirmCloseSession} className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Confirmar cierre</button>
              </div>
            </div>
          </div>
        , document.body) : null}

        {historialModalOpen ? createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={closeHistorialModal} />
            <div className="relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
              
              {/* Encabezado Fijo */}
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-white p-5 sm:p-6">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">Historial completo</h4>
                  <p className="text-sm text-slate-600">Listado cronológico de pagos con filtros por período, tipo y recibo.</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" onClick={printHistorialGeneral} className="rounded-lg border border-teal-300 bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-sm hover:bg-teal-50">Imprimir lista</button>
                  <button type="button" onClick={closeHistorialModal} className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-200">
                    ✕ Cerrar
                  </button>
                </div>
              </div>

              {/* Buscador Fijo */}
              <div className="shrink-0 border-b border-slate-100 bg-slate-50/50 p-4 sm:px-6">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <input
                    value={historialSearchTerm}
                    onChange={(e) => setHistorialSearchTerm(e.target.value)}
                    placeholder="Buscar en historial..."
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none shadow-sm focus:border-teal-500"
                  />
                  <select
                    value={periodFilter}
                    onChange={(e) => setPeriodFilter(e.target.value as 'mi_caja' | 'hoy_todos' | 'todo')}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                  >
                    <option value="mi_caja">Mi caja (Hoy)</option>
                    <option value="hoy_todos">General (Hoy todas las cajas)</option>
                    <option value="todo">General (Histórico completo)</option>
                  </select>
                  <select
                    value={historialTipoFiltro}
                    onChange={(e) => setHistorialTipoFiltro(e.target.value as 'todos' | 'Taller' | 'Matrícula' | 'Mensualidad')}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                  >
                    <option value="todos">Todos los tipos</option>
                    <option value="Taller">Taller</option>
                    <option value="Matrícula">Matrícula</option>
                    <option value="Mensualidad">Mensualidad</option>
                  </select>
                  <input
                    value={historialFechaFiltro}
                    onChange={(e) => setHistorialFechaFiltro(e.target.value)}
                    type="date"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Área Desplazable */}
              <div className="flex-1 overflow-y-auto bg-slate-50/30 p-4 sm:p-6">
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3 font-semibold">Tipo</th>
                        <th className="px-4 py-3 font-semibold">Título</th>
                        <th className="px-4 py-3 font-semibold">Recibo</th>
                        <th className="px-4 py-3 font-semibold">Detalle</th>
                        <th className="px-4 py-3 font-semibold">Cajero</th>
                        <th className="px-4 py-3 font-semibold">Monto</th>
                        <th className="px-4 py-3 font-semibold">Fecha</th>
                        <th className="px-4 py-3 font-semibold">Método</th>
                        <th className="px-4 py-3 font-semibold">Estado</th>
                      <th className="px-4 py-3 text-left font-semibold">Cajero</th>
                        <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historialFiltrado.map((item) => (
                        <tr key={item.key} className={`transition-colors hover:bg-slate-50 ${item.anulado ? 'bg-rose-50/50' : 'bg-white'}`}>
                          <td className="whitespace-nowrap px-4 py-3">{item.tipo}</td>
                          <td className="px-4 py-3">{item.titulo}</td>
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">{item.numeroRecibo}</td>
                          <td className="max-w-[200px] truncate px-4 py-3" title={item.detalle}>{item.detalle}</td>
                          <td className="whitespace-nowrap px-4 py-3">{item.cajero || '-'}</td>
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">{formatMoney(item.monto)}</td>
                          <td className="whitespace-nowrap px-4 py-3">{formatDate(item.fecha)}</td>
                          <td className="whitespace-nowrap px-4 py-3">{item.metodoPago || '-'}</td>
                          <td className="whitespace-nowrap px-4 py-3">{item.anulado ? `Anulado` : (item.estado || '-')}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <div className="inline-flex gap-2">
                              <button type="button" onClick={() => openReceipt(item)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">Imprimir</button>
                              <button type="button" onClick={() => downloadReceipt(item)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">Descargar</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {historialFiltrado.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    No hay registros en el historial con los filtros seleccionados.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        , document.body) : null}

        {showPendingAnnulmentsModal ? createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setShowPendingAnnulmentsModal(false)} />
            <div className="relative w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">Anulaciones en Espera</h4>
                  <p className="text-sm text-slate-600">
                    {isCajaAdmin ? 'Confirma o rechaza las anulaciones solicitadas por caja.' : 'Solicitudes enviadas esperando la aprobación de un administrador.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPendingAnnulmentsModal(false)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cerrar
                </button>
              </div>

              <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto">
            {pendingAnnulments.map((req) => (
              <article key={req.idUnico} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <div>
                      <p className="font-bold text-slate-900">Recibo: {req.label}</p>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tipo: {req.type}</p>
                      <p className="mt-1 font-semibold text-rose-700">Monto a devolver: {formatMoney(req.monto)}</p>
                    </div>
                    <div className="flex gap-2 sm:shrink-0">
                      {isCajaAdmin ? (
                        <>
                          <button 
                            onClick={async () => {
                              await syncUpdateAnnulmentStatus(req.idUnico, 'AUTORIZADO');
                              toast.success('Anulación autorizada');
                            }}
                            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                          >
                            Autorizar
                          </button>
                          <button 
                            onClick={async () => {
                              await syncUpdateAnnulmentStatus(req.idUnico, 'RECHAZADO');
                              toast.success('Anulación rechazada');
                            }}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Rechazar
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center rounded-xl bg-white/50 px-4 py-2 text-sm font-medium text-amber-800 border border-amber-200">
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Esperando revisión...
                        </div>
                      )}
                    </div>
                  </article>
                ))}
                {pendingAnnulments.length === 0 && (
                  <p className="text-center text-sm text-slate-500 py-4">No hay anulaciones en espera.</p>
                )}
              </div>
            </div>
          </div>
        , document.body) : null}

        {waitingAnnulmentId ? createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />
            <div className="relative w-full max-w-sm rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-8 shadow-2xl text-center">
              <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-amber-500 mb-4" />
              <h4 className="text-xl font-bold text-slate-900">Esperando autorización</h4>
              <p className="mt-2 text-sm text-slate-600">
                El administrador debe confirmar esta anulación. Por favor espera...
              </p>
              <button
                type="button"
                onClick={async () => {
                  await syncRemoveAnnulment(waitingAnnulmentId);
                  setWaitingId(null);
                }}
                className="mt-6 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar solicitud
              </button>
            </div>
          </div>
        , document.body) : null}
      </div>
    </section>
  )
}
