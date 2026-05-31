import { useEffect, useMemo, useState } from 'react'
import { CreditCard, LoaderCircle, ReceiptText } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../auth/AuthContext'
import { listEstudiantesActivos, type EstudianteItem } from './academico.api'
import {
  annulPagoMatricula,
  annulPagoMensualidad,
  annulPagoTaller,
  closeAllOpenCajas,
  closeCajaSession,
  getActiveCajaSession,
  getCajaDashboard,
  getCajaHistorialGeneral,
  getCajaTarifas,
  getMensualidadMesesResumen,
  getMetodosPago,
  getResumenPendientesMensualidad,
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

type AnnulModalState = {
  type: AnnulTargetType
  id: number
  label: string
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
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-600">{detail}</p>
    </article>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
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
  pagoCupoId?: number
  pagoMatriculaId?: number
  mensualidadId?: number
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
    pagoCupoId: item.pagoCupoId,
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
    pagoMatriculaId: item.pagoMatriculaId,
  }))

  const historialMensualidad = mensualidades.map((item) => ({
    key: `mensualidad-${item.mensualidadId}`,
    tipo: 'Mensualidad' as const,
    titulo: item.estudiante || 'Mensualidad',
    numeroRecibo: item.numeroRecibo || `ME-${item.mensualidadId}`,
    detalle: item.detalle || item.mes || 'Cobro mensualidad',
    monto: item.monto,
    fecha: item.fechaPago,
    metodoPago: item.metodoPago,
    estado: item.estado,
    anulado: item.anulado,
    motivoAnulacion: item.motivoAnulacion,
    mensualidadId: item.mensualidadId,
  }))

  return [...historialTaller, ...historialMatricula, ...historialMensualidad].sort((a, b) => {
    const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0
    const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0
    return fechaB - fechaA
  })
}

function CompactSessionBar({
  session,
  onOpenSession,
  onCloseSession,
  busy,
  showAdminAction,
  onCloseAllOpenCajas,
}: {
  session: CajaSessionInfo | null
  onOpenSession: () => void
  onCloseSession: () => void
  busy: boolean
  showAdminAction: boolean
  onCloseAllOpenCajas: () => void
}) {
  return (
    <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_auto] xl:items-end">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sesión de caja</p>
          {session ? (
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <p className="text-base font-semibold text-slate-900">Caja activa {session.codigo}</p>
              <p>Estado: {session.estado}</p>
              <p>Apertura: {formatDate(session.fechaApertura)}</p>
              <p>Saldo inicial: {formatMoney(session.saldoInicial)}</p>
              {session.observacionApertura ? <p>Observación: {session.observacionApertura}</p> : null}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-600">
              Presiona "Abrir caja" para ingresar monto de apertura y observación en el modal.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-950">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Acción principal</p>
          <p className="mt-2 font-semibold">{session ? 'Cerrar la caja activa cuando termine el turno.' : 'Abrir una nueva sesión para registrar cobros.'}</p>
          <p className="mt-1 text-teal-800/80">Los cambios se guardan al instante y el historial queda ordenado por recibo.</p>
        </div>

        <div className="flex flex-col gap-2">
          {session ? (
            <button
              type="button"
              onClick={onCloseSession}
              disabled={busy}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Procesando...' : 'Cerrar caja'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenSession}
              disabled={busy}
              className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Procesando...' : 'Abrir caja'}
            </button>
          )}

          {showAdminAction ? (
            <button
              type="button"
              onClick={onCloseAllOpenCajas}
              disabled={busy}
              className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cerrar todas las cajas abiertas
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
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
}: {
  pendientes: CajaTallerPendienteItem[]
  pagos: CajaPagoTallerItem[]
  onPay: (cupoId: number, monto: number) => void
  onAnnul: (pagoCupoId: number, numeroRecibo: string) => void
  metodoPagoId: string
  onMetodoPagoChange: (value: string) => void
  metodosPago: MetodoPagoOption[]
  busy: boolean
  search?: string
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

    await onPay(selectedPendiente.cupoId, montoCobroNumber)
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
        <div className="mt-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-2 py-2">Estudiante</th>
                  <th className="px-2 py-2">Concepto</th>
                  <th className="px-2 py-2">Monto</th>
                  <th className="px-2 py-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
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
                    <tr key={item.cupoId} className="border-b border-slate-100">
                      <td className="px-2 py-3">{item.participante || 'Sin nombre'}</td>
                      <td className="px-2 py-3">{item.taller}</td>
                      <td className="px-2 py-3">{formatMoney(item.montoEsperado)}</td>
                      <td className="px-2 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <button type="button" onClick={() => abrirModal(item)} className="rounded-xl border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700">Ver</button>
                          <button type="button" disabled={!puedeCobrar} onClick={() => abrirModal(item)} className="rounded-xl bg-teal-600 px-3 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">Cobrar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {pendientes.length === 0 ? <div className="mt-3"><EmptyState message="No hay inscripciones de talleres pendientes de pago." /></div> : null}
          </div>
        </div>
      </section>

      {selectedPendiente ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
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
      ) : null}

      {selectedPago ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
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
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">Pagos de talleres recientes</h3>
        <div className="mt-3 space-y-2">
          {pagosFiltrados.map((item) => (
            <article key={item.pagoCupoId} className="rounded-xl border border-slate-200 p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.taller}</p>
                  <p className="text-slate-600">Participante: {item.participante || 'Sin nombre'}</p>
                  <p className="text-slate-600">Recibo: {item.numeroRecibo || '-'}</p>
                  <p className="text-slate-600">Monto: {formatMoney(item.monto)}</p>
                  <p className="text-slate-500">{item.metodoPago || '-'} | {formatDate(item.fechaPago)} | {item.estado || '-'}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => abrirDetallePago(item)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Ver
                  </button>
                  {!item.anulado ? (
                    <button
                      type="button"
                      onClick={() => onAnnul(item.pagoCupoId, item.numeroRecibo)}
                      className="rounded-xl border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                      Anular
                    </button>
                  ) : (
                    <span className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">Anulado</span>
                  )}
                </div>
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
}: {
  pendientes: CajaMatriculaPendienteItem[]
  pagos: CajaPagoMatriculaItem[]
  onPay: (payload: { matriculaId: number; monto: number; metodoPagoId: number; detalle: string }) => Promise<void>
  onAnnul: (pagoMatriculaId: number) => void
  metodosPago: MetodoPagoOption[]
  busy: boolean
  externalBusqueda?: string
  onPreviewMatricula?: (estudianteId: number) => Promise<import('./caja.api').MatriculaPreviewResponse | null>
  montoBaseSugerido?: number | null
}) {
  const [busqueda, setBusqueda] = useState('')
  const [selectedMatricula, setSelectedMatricula] = useState<CajaMatriculaPendienteItem | null>(null)
  const [selectedPagoMatricula, setSelectedPagoMatricula] = useState<CajaPagoMatriculaItem | null>(null)
  const [montoCobro, setMontoCobro] = useState('')
  const [montoRecibido, setMontoRecibido] = useState('')
  const [metodoPagoId, setMetodoPagoId] = useState('')
  const [detalle, setDetalle] = useState('Cobro de matrícula en caja')

  useEffect(() => {
    if (!metodosPago.length) {
      setMetodoPagoId('')
      return
    }

    setMetodoPagoId((current) => (metodosPago.some((item) => String(item.id) === current) ? current : String(metodosPago[0].id)))
  }, [metodosPago])

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
    setMontoCobro(String(Number(item.montoEsperado ?? montoBaseSugerido ?? 0)))
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
        <div className="mt-3 space-y-2">
          {pendientesFiltradas.map((item) => (
            <article key={item.matriculaId} className="rounded-xl border border-slate-200 p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.estudiante || 'Sin nombre'}</p>
                  <p className="text-slate-600">Año lectivo: {item.anioLectivo || '-'}</p>
                  <p className="text-slate-500">Estado: {item.estado || '-'} | {formatDate(item.fechaMatricula)}</p>
                  <p className="text-slate-500">Monto base: {formatMoney(item.montoEsperado)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => abrirModal(item)}
                  className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-700"
                >
                  Cobrar
                </button>
              </div>
            </article>
          ))}
          {pendientesFiltradas.length === 0 ? <EmptyState message="No hay matrículas que coincidan con la búsqueda." /> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">Pagos de matrícula recientes</h3>
        <div className="mt-3 space-y-2">
          {pagosFiltrados.map((item) => (
            <article key={item.pagoMatriculaId} className="rounded-xl border border-slate-200 p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.estudiante || 'Sin nombre'}</p>
                  <p className="text-slate-600">Monto: {formatMoney(item.monto)}</p>
                  <p className="text-slate-500">{item.metodoPago || '-'} | {formatDate(item.fechaPago)} | {item.estado || '-'}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => abrirDetallePago(item)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Ver
                  </button>
                  {!item.anulado ? (
                    <button
                      type="button"
                      onClick={() => onAnnul(item.pagoMatriculaId)}
                      className="rounded-xl border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                      Anular
                    </button>
                  ) : (
                    <span className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">Anulado</span>
                  )}
                </div>
              </div>
            </article>
          ))}
          {pagosFiltrados.length === 0 ? <EmptyState message="No hay pagos de matrícula que coincidan con la búsqueda." /> : null}
        </div>
      </section>

      {selectedMatricula ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">Cobro de matrícula</h4>
                <p className="text-sm text-slate-600">{selectedMatricula.estudiante || 'Sin nombre'} | {selectedMatricula.anioLectivo || '-'}</p>
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
              <input
                value={montoCobro}
                onChange={(event) => setMontoCobro(event.target.value)}
                placeholder="Monto a cobrar"
                type="number"
                step="0.01"
                min="0"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
              <input
                value={montoRecibido}
                onChange={(event) => setMontoRecibido(event.target.value)}
                placeholder="Monto entregado por el cliente"
                type="number"
                step="0.01"
                min="0"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
              <MetodoPagoSelect value={metodoPagoId} onChange={setMetodoPagoId} metodosPago={metodosPago} />
              <input
                value={detalle}
                onChange={(event) => setDetalle(event.target.value)}
                placeholder="Detalle"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-slate-500">Precio base de matrícula consultado desde API</p>
              <p className="text-lg font-semibold text-slate-900">{formatMoney(selectedMatricula!.montoEsperado)}</p>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-slate-700">Total a pagar: <span className="font-semibold">{formatMoney(montoCobroNumber)}</span></p>
              <p className="text-slate-700">Monto recibido: <span className="font-semibold">{formatMoney(montoRecibidoNumber)}</span></p>
              {saldoCaja >= 0 ? (
                <p className="text-emerald-700">Vuelto: <span className="font-semibold">{formatMoney(saldoCaja)}</span></p>
              ) : (
                <p className="text-rose-700">Faltante: <span className="font-semibold">{formatMoney(Math.abs(saldoCaja))}</span></p>
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
      ) : null}

      {selectedPagoMatricula ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
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
      ) : null}
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
  onPay: () => void
  onAnnul: (mensualidadId: number) => void
  metodosPago: MetodoPagoOption[]
  pendientesMensualidadesList?: Array<import('./caja.api').PendienteMensualidadResponse>
  mensualidadMesesPagados?: number[]
  mensualidadMesActual?: number
  estudiantesActivos?: EstudianteItem[]
  estudiantesPendientesMensualidad?: ResumenPendientesMensualidadResponse[]
  globalSearchTerm?: string
  onBuscarPendientes?: (estudianteId: string) => void
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
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-teal-300 hover:bg-teal-50/40"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{`${item.nombre ?? ''} ${item.apellido ?? ''}`.trim() || `Estudiante ${item.id}`}</p>
                    <p className="text-xs text-slate-600">Año activo • ID: {item.id}</p>
                    {pendiente ? (
                      <p className="text-xs text-slate-500">Pagados: {pendiente.mesesPagados} • Pendientes: {pendiente.mesesPendientes}</p>
                    ) : (
                      <p className="text-xs text-slate-500">Pagados: 0 • Pendientes: 0</p>
                    )}
                  </div>
                  {pendiente ? (
                    <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800">
                      {pendiente.mesesPendientes} pendiente(s)
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                      Al día
                    </span>
                  )}
                </button>
                )
              })
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
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
                <button key={p.mensualidadId} type="button" onClick={() => { onMesDePagoChange(String(p.mes)); onMontoBaseChange(String(p.monto ?? 0)); onMontoMoraChange('0'); }} className="text-left rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">{`Mes ${p.mes} — ${formatMoney(p.monto ?? 0)}`}</button>
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

        <div className="mt-3 space-y-2">
          {mensualidadesFiltradas.map((item) => (
            <article key={item.mensualidadId} className="rounded-xl border border-slate-200 p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.estudiante || 'Sin nombre'}</p>
                  <p className="text-slate-600">Mes: {item.mes || '-'} | Monto: {formatMoney(item.monto)}</p>
                  <p className="text-slate-500">{item.metodoPago || '-'} | {formatDate(item.fechaPago)} | {item.estado || '-'}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => abrirDetalleMensualidad(item)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Ver
                  </button>
                  {!item.anulado ? (
                    <button
                      type="button"
                      onClick={() => onAnnul(item.mensualidadId)}
                      className="rounded-xl border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                      Anular
                    </button>
                  ) : (
                    <span className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">Anulado</span>
                  )}
                </div>
              </div>
            </article>
          ))}
          {mensualidadesFiltradas.length === 0 ? <EmptyState message="No hay mensualidades con los filtros seleccionados." /> : null}
        </div>
      </section>

      {selectedMensualidad ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
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
      ) : null}
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
        onPay={onPay}
      />
    </div>
  )
}

export function CajaDashboardPanel() {
  const { token, user } = useAuth()
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
  const [mensualidadMoraPorPeriodo] = useState('50')
  const [mensualidadDiaLimitePago] = useState('10')
  const [mensualidadBuscarEstudiante, setMensualidadBuscarEstudiante] = useState('')
  const [mensualidadFiltroEstado, setMensualidadFiltroEstado] = useState<'todos' | 'activos' | 'anulados'>('todos')
  const [mensualidadMetodoPagoId, setMensualidadMetodoPagoId] = useState('1')
  const [tallerMetodoPagoId, setTallerMetodoPagoId] = useState('1')
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null)
  const [annulModal, setAnnulModal] = useState<AnnulModalState | null>(null)
  const [annulReason, setAnnulReason] = useState('')
  const [historialModalOpen, setHistorialModalOpen] = useState(false)
  const [showPreCloseModal, setShowPreCloseModal] = useState(false)
  const [preCloseCounted, setPreCloseCounted] = useState('')
  const [preCloseCambioDevuelto, setPreCloseCambioDevuelto] = useState('0')
  const [showOpenSessionModal, setShowOpenSessionModal] = useState(false)
  const [periodFilter, setPeriodFilter] = useState<'hoy' | 'todo'>('hoy')
  const [historialTipoFiltro, setHistorialTipoFiltro] = useState<'todos' | 'Taller' | 'Matrícula' | 'Mensualidad'>('todos')
  const [historialFechaFiltro, setHistorialFechaFiltro] = useState('')

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
  const totalCobradoGeneralPreClose =
    sumPaid(data?.pagosTaller ?? []) +
    sumPaid(data?.pagosMatricula ?? []) +
    sumPaid(data?.mensualidades ?? [])
  const aperturaSesion = Number(activeSession?.saldoInicial ?? 0)
  const cambioDevuelto = Number(preCloseCambioDevuelto) || 0
  const ingresoNetoTurno = totalCobradoGeneralPreClose - cambioDevuelto
  const efectivoEsperadoPreCierre = aperturaSesion + ingresoNetoTurno
  const efectivoContadoPreCierre = Number(preCloseCounted) || 0
  const diferenciaPreCierre = efectivoContadoPreCierre - efectivoEsperadoPreCierre

  const pagosTallerSource = useMemo(() => {
    if (periodFilter === 'todo') {
      return generalHistorialData?.pagosTaller ?? []
    }
    return data?.pagosTaller ?? []
  }, [data, generalHistorialData, periodFilter])

  const pagosMatriculaSource = useMemo(() => {
    if (periodFilter === 'todo') {
      return generalHistorialData?.pagosMatricula ?? []
    }
    return data?.pagosMatricula ?? []
  }, [data, generalHistorialData, periodFilter])

  const mensualidadesSource = useMemo(() => {
    if (periodFilter === 'todo') {
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

      if (!isSameLocalDateValue(item.fecha, historialFechaFiltro)) {
        return false
      }

      if (!term) {
        return true
      }

      return [item.tipo, item.titulo, item.numeroRecibo, item.detalle, item.metodoPago, item.estado]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase('es-NI').includes(term))
    })
  }, [historialGeneral, searchTerm, historialTipoFiltro, historialFechaFiltro])

  const totalCobradoTalleres = sumPaid(data?.pagosTaller ?? [])
  const totalCobradoMatriculas = sumPaid(data?.pagosMatricula ?? [])
  const totalCobradoMensualidades = sumPaid(data?.mensualidades ?? [])
  // totalCobradoGeneral available if needed: totalCobradoTalleres + totalCobradoMatriculas + totalCobradoMensualidades
  const anulacionesTotales =
    countAnnulled(data?.pagosTaller ?? []) +
    countAnnulled(data?.pagosMatricula ?? []) +
    countAnnulled(data?.mensualidades ?? [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const currentYear = String(new Date().getFullYear())
      const [dashboard, session, methods, activeStudents, tarifasResponse] = await Promise.all([
        getCajaDashboard(token, 25),
        getActiveCajaSession(token),
        getMetodosPago(token),
        listEstudiantesActivos(token, currentYear),
        getCajaTarifas(token),
      ])
      const pendingStudents = await getResumenPendientesMensualidad(token)
      setData(dashboard)
      setActiveSession(session)
      setMetodosPago(methods)
      setTarifas(tarifasResponse)
      setEstudiantesActivos(activeStudents)
      setMensualidadesPendientesEstudiantes(pendingStudents)
      setMensualidadMontoBase(String(Number(tarifasResponse.montoMensualidadBase ?? 0)))
      const firstMethodId = methods[0] ? String(methods[0].id) : ''
      setTallerMetodoPagoId((current) => (methods.some((method) => String(method.id) === current) ? current : firstMethodId))
      setMensualidadMetodoPagoId((current) => (methods.some((method) => String(method.id) === current) ? current : firstMethodId))
    } catch {
      setError('No se pudo cargar la información de caja.')
    } finally {
      setIsLoading(false)
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
    if (periodFilter !== 'todo') {
      return
    }
    if (generalHistorialData) {
      return
    }
    void loadGeneralHistorialData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodFilter, token, generalHistorialData])

  const refreshAll = async () => {
    await loadData()
    setGeneralHistorialData(null)
    if (periodFilter === 'todo') {
      await loadGeneralHistorialData()
    }
  }

  const runAction = async (action: string, executor: () => Promise<CajaOperacionResult>) => {
    setBusyAction(action)
    setPaymentMessage(null)
    try {
      const response = await executor()
      toast.success(response.mensaje)
      setPaymentMessage(response.mensaje)
      await refreshAll()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo completar la operacion.'
      toast.error(message)
      setPaymentMessage(message)
    } finally {
      setBusyAction(null)
    }
  }

  const handleOpenSession = async () => {
    setShowOpenSessionModal(true)
  }

  const confirmOpenSession = async () => {
    setShowOpenSessionModal(false)
    await runAction('open-session', () => openCajaSession(token, { saldoInicial: readNumber(openSaldo), observacion: openObservacion }))
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
    // open pre-close modal first
    setPreCloseCambioDevuelto('0')
    setPreCloseCounted(String(efectivoEsperadoPreCierre > 0 ? efectivoEsperadoPreCierre : 0))
    setShowPreCloseModal(true)
  }

  const confirmCloseSession = async () => {
    setShowPreCloseModal(false)
    await runAction('close-session', () => closeCajaSession(token, { saldoCierre: readNumber(preCloseCounted), observacion: closeObservacion }))
  }

  const handlePayTaller = async (cupoId: number, monto: number) => {
    await runAction(`pay-taller-${cupoId}`, () => payTaller(token, {
      cupoId,
      monto,
      metodoPagoId: Number(tallerMetodoPagoId),
      detalle: 'Cobro desde caja',
    }))
  }

  const handlePayMatricula = async (payload: { matriculaId: number; monto: number; metodoPagoId: number; detalle: string }) => {
    await runAction('pay-matricula', () => payMatricula(token, {
      matriculaId: payload.matriculaId,
      monto: payload.monto,
      metodoPagoId: payload.metodoPagoId,
      detalle: payload.detalle,
    }))
  }

  const handlePayMensualidad = async () => {
    await runAction('pay-mensualidad', () => payMensualidad(token, {
      estudianteId: Number(mensualidadEstudianteId),
      mesDePago: Number(mensualidadMes),
      montoBase: Number(mensualidadMontoBase),
      montoMora: Number.isFinite(moraAplicadaFormulario) ? moraAplicadaFormulario : 0,
      metodoPagoId: Number(mensualidadMetodoPagoId),
      detalle: 'Cobro desde caja',
    }))
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

  const requestAnnulTaller = (pagoCupoId: number, numeroRecibo: string) => {
    setAnnulReason('')
    setAnnulModal({
      type: 'taller',
      id: pagoCupoId,
      label: numeroRecibo || String(pagoCupoId),
    })
  }

  const requestAnnulMatricula = (pagoMatriculaId: number) => {
    setAnnulReason('')
    setAnnulModal({
      type: 'matricula',
      id: pagoMatriculaId,
      label: String(pagoMatriculaId),
    })
  }

  const requestAnnulMensualidad = (mensualidadId: number) => {
    setAnnulReason('')
    setAnnulModal({
      type: 'mensualidad',
      id: mensualidadId,
      label: String(mensualidadId),
    })
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

  function buildReceiptHtml(item: CajaHistorialItem) {
    const anuladoBadge = item.anulado ? `<div style="color: #b91c1c; font-weight:700;">ANULADO: ${item.motivoAnulacion || 'Sin motivo'}</div>` : ''
    return `<!doctype html><html><head><meta charset="utf-8"><title>Recibo ${item.numeroRecibo}</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#111} .header{display:flex;justify-content:space-between;align-items:center} .meta{margin-top:12px;color:#444} .line{margin:8px 0;padding:8px;border-bottom:1px solid #eee}</style></head><body><div class="header"><h2>Recibo - ${item.numeroRecibo}</h2><div>${formatDate(item.fecha) || ''}</div></div><div class="meta">Tipo: ${item.tipo} • ${item.titulo}</div>${anuladoBadge}<div style="margin-top:16px"> <div class="line"><strong>Detalle:</strong> ${item.detalle || '-'}</div><div class="line"><strong>Monto:</strong> ${formatMoney(item.monto)}</div><div class="line"><strong>Método:</strong> ${item.metodoPago || '-'}</div><div class="line"><strong>Estado:</strong> ${item.estado || '-'}</div></div><footer style="margin-top:28px;color:#666;font-size:12px">Generado desde Micasita • ${new Date().toLocaleString()}</footer></body></html>`
  }

  const openReceipt = (item: CajaHistorialItem) => {
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

  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Finanzas</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Caja</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Panel operativo para el rol CAJA. Aquí puedes revisar lo pendiente de talleres, matrícula y mensualidad,
          además de ver los pagos recientes de cada tipo.
        </p>
      </div>

      <CompactSessionBar
        session={activeSession}
        onOpenSession={handleOpenSession}
        onCloseSession={handleCloseSession}
        busy={busyAction === 'open-session' || busyAction === 'close-session' || busyAction === 'close-all-open-cajas'}
        showAdminAction={isCajaAdmin}
        onCloseAllOpenCajas={handleCloseAllOpenCajas}
      />

      {paymentMessage ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {paymentMessage}
        </div>
      ) : null}
      <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SectionCard title="Talleres pendiente" value={`${metricas?.talleresPendientesPago ?? 0}`} detail="Inscripciones en espera de pago" />
        <SectionCard title="Matrículas pendiente" value={`${metricas?.matriculasPendientes ?? 0}`} detail="Estudiantes pendientes en caja" />
        <SectionCard title="Pago matrícula pendiente" value={`${metricas?.pagosMatriculaPendientes ?? 0}`} detail="Registros en estado pendiente" />
        <SectionCard title="Mensualidades pendiente" value={`${metricas?.mensualidadesPendientes ?? 0}`} detail="Cuotas por cobrar" />
        <SectionCard title="Pagos talleres" value={`${metricas?.registrosTaller ?? 0}`} detail="Últimos registros cargados" />
        <SectionCard title="Pagos matr./mens." value={`${(metricas?.registrosMatricula ?? 0) + (metricas?.registrosMensualidad ?? 0)}`} detail="Actividad reciente de caja" />
      </div>

      {/* Search central */}
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px_220px]">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por estudiante, tutor o número de recibo"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-teal-500"
        />

        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value as 'hoy' | 'todo')}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
        >
          <option value="hoy">Movimientos de hoy</option>
          <option value="todo">Todo el tiempo</option>
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

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon }) => {
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
        })}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-slate-600">
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            Cargando caja...
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        {!isLoading && !error && data ? (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
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
                    onBuscarPendientes={async (estId: string) => {
                      if (!token || !estId) return
                      try {
                        const [list, resumen] = await Promise.all([
                          (await import('./caja.api')).getPendientesMensualidades(token ?? null, Number(estId)),
                          getMensualidadMesesResumen(token ?? null, Number(estId)),
                        ])
                        setPendientesMensualidadesList(list)
                        setMensualidadMesesResumen(resumen)
                      } catch (e) {
                        setPendientesMensualidadesList([])
                        setMensualidadMesesResumen({ mesesPagados: [], mesActual: new Date().getMonth() + 1 })
                      }
                    }}
                    onPay={handlePayMensualidad}
                    onAnnul={requestAnnulMensualidad}
                    metodosPago={metodosPago}
                  />
                ) : null}
              </div>

              <aside className="lg:col-span-1">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">Historial general</h3>
                      <div className="flex items-center justify-between">
                        <p className="mt-1 text-xs text-slate-600">Un solo listado cronológico para talleres, matrícula y mensualidad.</p>
                        <div>
                          <button type="button" onClick={openHistorialModal} className="rounded-xl border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">Ver todos</button>
                        </div>
                      </div>
                      {historialFechaFiltro ? (
                        <p className="mt-2 text-xs text-slate-500">Filtrando por fecha de pago: {historialFechaFiltro}</p>
                      ) : null}
                  <div className="mt-3 space-y-2">
                    {historialFiltrado.map((item) => (
                      <article
                        key={item.key}
                        className={`rounded-xl border p-3 text-sm ${item.anulado ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{item.titulo}</p>
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{item.tipo}</p>
                            <p className="mt-1 text-slate-600">Recibo: {item.numeroRecibo}</p>
                            <p className="text-slate-600">{item.detalle}</p>
                            <p className="text-slate-500">{formatMoney(item.monto)} | {item.metodoPago || '-'} | {formatDate(item.fecha)} | {item.estado || '-'}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                                <div className="flex flex-col gap-2">
                                  <button type="button" onClick={() => openReceipt(item)} className="rounded-xl border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">Ver recibo</button>
                                  <button type="button" onClick={() => downloadReceipt(item)} className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Descargar</button>
                                  {!item.anulado ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (item.pagoCupoId) {
                                          requestAnnulTaller(item.pagoCupoId, item.numeroRecibo)
                                        } else if (item.pagoMatriculaId) {
                                          requestAnnulMatricula(item.pagoMatriculaId)
                                        } else if (item.mensualidadId) {
                                          requestAnnulMensualidad(item.mensualidadId)
                                        }
                                      }}
                                      className="rounded-xl border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                                    >
                                      Anular
                                    </button>
                                  ) : (
                                    <span className="rounded-xl bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Anulado</span>
                                  )}
                                </div>
                          </div>
                        </div>
                      </article>
                    ))}
                    {historialFiltrado.length === 0 ? <EmptyState message="No hay movimientos que coincidan con la búsqueda." /> : null}
                  </div>
                </div>
              </aside>
            </div>
          </>
        ) : null}

        {annulModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
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
        ) : null}

        {showOpenSessionModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
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
        ) : null}

        {showPreCloseModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">Pre-cierre de caja</h4>
                  <p className="text-sm text-slate-600">Revise los totales y confirme el cierre del turno.</p>
                </div>
                <button type="button" onClick={() => setShowPreCloseModal(false)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">Cerrar</button>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p className="text-sm text-slate-600">Arqueo sugerido</p>
                  <p className="mt-1 font-semibold text-slate-900">Efectivo esperado: {formatMoney(efectivoEsperadoPreCierre)}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                    <p className="text-xs text-slate-500">Talleres</p>
                    <p className="font-semibold text-slate-900">{formatMoney(totalCobradoTalleres)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                    <p className="text-xs text-slate-500">Matrícula</p>
                    <p className="font-semibold text-slate-900">{formatMoney(totalCobradoMatriculas)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                    <p className="text-xs text-slate-500">Mensualidad</p>
                    <p className="font-semibold text-slate-900">{formatMoney(totalCobradoMensualidades)}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm">
                  <p className="text-xs text-rose-700">Anulaciones en turno</p>
                  <p className="font-semibold text-rose-800">{anulacionesTotales}</p>
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

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Sencillo devuelto estimado</label>
                  <input
                    value={preCloseCambioDevuelto}
                    onChange={(e) => setPreCloseCambioDevuelto(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                    placeholder="Ingrese sencillo devuelto"
                  />
                  <p className="mt-1 text-xs text-slate-500">Se restará del ingreso para estimar el efectivo neto antes de confirmar cierre.</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p className="text-slate-700">Ingreso neto estimado: <span className="font-semibold">{formatMoney(ingresoNetoTurno)}</span></p>
                  {diferenciaPreCierre > 0 ? (
                    <p className="text-emerald-700">Sobrante estimado: <span className="font-semibold">{formatMoney(diferenciaPreCierre)}</span></p>
                  ) : diferenciaPreCierre < 0 ? (
                    <p className="text-rose-700">Faltante estimado: <span className="font-semibold">{formatMoney(Math.abs(diferenciaPreCierre))}</span></p>
                  ) : (
                    <p className="text-slate-700">Sin diferencia estimada.</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Cantidad física contada</label>
                  <input value={preCloseCounted} onChange={(e) => setPreCloseCounted(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500" placeholder="Ingrese monto contado" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Descripción/observación de cierre</label>
                  <input
                    value={closeObservacion}
                    onChange={(e) => setCloseObservacion(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                    placeholder="Ej. Cierre de turno sin incidencias"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowPreCloseModal(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancelar</button>
                <button type="button" onClick={confirmCloseSession} className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white">Confirmar cierre</button>
              </div>
            </div>
          </div>
        ) : null}

        {historialModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">Historial completo</h4>
                  <p className="text-sm text-slate-600">Listado cronológico de pagos con filtros por período, tipo y recibo.</p>
                </div>
                <button type="button" onClick={closeHistorialModal} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">Cerrar</button>
              </div>

              <div className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-500">
                        <th className="px-2 py-2">Tipo</th>
                        <th className="px-2 py-2">Título</th>
                        <th className="px-2 py-2">Recibo</th>
                        <th className="px-2 py-2">Detalle</th>
                        <th className="px-2 py-2">Monto</th>
                        <th className="px-2 py-2">Fecha</th>
                        <th className="px-2 py-2">Método</th>
                        <th className="px-2 py-2">Estado</th>
                        <th className="px-2 py-2 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historialFiltrado.map((item) => (
                        <tr key={item.key} className={`border-b ${item.anulado ? 'bg-rose-50' : ''}`}>
                          <td className="px-2 py-3">{item.tipo}</td>
                          <td className="px-2 py-3">{item.titulo}</td>
                          <td className="px-2 py-3">{item.numeroRecibo}</td>
                          <td className="px-2 py-3">{item.detalle}</td>
                          <td className="px-2 py-3">{formatMoney(item.monto)}</td>
                          <td className="px-2 py-3">{formatDate(item.fecha)}</td>
                          <td className="px-2 py-3">{item.metodoPago || '-'}</td>
                          <td className="px-2 py-3">{item.anulado ? `Anulado` : (item.estado || '-')}</td>
                          <td className="px-2 py-3 text-right">
                            <div className="inline-flex gap-2">
                              <button type="button" onClick={() => openReceipt(item)} className="rounded-xl border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100">Imprimir</button>
                              <button type="button" onClick={() => downloadReceipt(item)} className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">Descargar</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {historialFiltrado.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    No hay registros en el historial con los filtros seleccionados.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

