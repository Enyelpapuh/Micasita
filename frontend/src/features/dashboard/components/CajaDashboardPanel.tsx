import { useEffect, useMemo, useState } from 'react'
import { CreditCard, LoaderCircle, ReceiptText } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../auth/AuthContext'
import {
  annulPagoMatricula,
  annulPagoMensualidad,
  annulPagoTaller,
  closeCajaSession,
  getActiveCajaSession,
  getCajaDashboard,
  getMetodosPago,
  openCajaSession,
  payMatricula,
  payMensualidad,
  payTaller,
  type CajaSessionInfo,
  type CajaDashboardResponse,
  type CajaMatriculaPendienteItem,
  type CajaMensualidadItem,
  type CajaOperacionResult,
  type CajaPagoMatriculaItem,
  type CajaPagoTallerItem,
  type CajaTallerPendienteItem,
  type MetodoPagoOption,
} from './caja.api'

type CajaTab = 'talleres' | 'matricula' | 'mensualidad'

function formatDate(value?: string | null) {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
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

function SessionSection({
  session,
  openSaldo,
  openObservacion,
  closeSaldo,
  closeObservacion,
  onOpenSaldoChange,
  onOpenObservacionChange,
  onCloseSaldoChange,
  onCloseObservacionChange,
  onOpenSession,
  onCloseSession,
  busy,
}: {
  session: CajaSessionInfo | null
  openSaldo: string
  openObservacion: string
  closeSaldo: string
  closeObservacion: string
  onOpenSaldoChange: (value: string) => void
  onOpenObservacionChange: (value: string) => void
  onCloseSaldoChange: (value: string) => void
  onCloseObservacionChange: (value: string) => void
  onOpenSession: () => void
  onCloseSession: () => void
  busy: boolean
}) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">Sesión de caja</h3>
          <p className="mt-1 text-sm text-slate-600">Apertura y cierre del turno físico de caja.</p>
        </div>
        {session ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <p className="font-semibold">Sesión activa: {session.codigo}</p>
            <p>Estado: {session.estado}</p>
            <p>Apertura: {formatDate(session.fechaApertura)}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No hay caja abierta para este usuario.
          </div>
        )}
      </div>

      {!session ? (
        <div className="mt-4 grid gap-3 md:grid-cols-[180px_1fr_auto]">
          <input
            value={openSaldo}
            onChange={(event) => onOpenSaldoChange(event.target.value)}
            type="number"
            min="0"
            step="0.01"
            placeholder="Saldo inicial"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
          <input
            value={openObservacion}
            onChange={(event) => onOpenObservacionChange(event.target.value)}
            placeholder="Observacion apertura"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
          <button
            type="button"
            disabled={busy}
            onClick={onOpenSession}
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Procesando...' : 'Abrir caja'}
          </button>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-[180px_1fr_auto]">
          <input
            value={closeSaldo}
            onChange={(event) => onCloseSaldoChange(event.target.value)}
            type="number"
            min="0"
            step="0.01"
            placeholder="Saldo cierre"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
          <input
            value={closeObservacion}
            onChange={(event) => onCloseObservacionChange(event.target.value)}
            placeholder="Observacion cierre"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
          <button
            type="button"
            disabled={busy}
            onClick={onCloseSession}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Procesando...' : 'Cerrar caja'}
          </button>
        </div>
      )}
    </section>
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
}: {
  pendientes: CajaTallerPendienteItem[]
  pagos: CajaPagoTallerItem[]
  onPay: (cupoId: number, monto: number) => void
  onAnnul: (pagoCupoId: number, numeroRecibo: string) => void
  metodoPagoId: string
  onMetodoPagoChange: (value: string) => void
  metodosPago: MetodoPagoOption[]
  busy: boolean
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">Inscripciones en espera de pago</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-[180px_1fr]">
          <MetodoPagoSelect value={metodoPagoId} onChange={onMetodoPagoChange} metodosPago={metodosPago} />
          <p className="text-xs text-slate-500">Selecciona el metodo cargado por el sistema antes de cobrar.</p>
        </div>
        <div className="mt-3 space-y-2">
          {pendientes.map((item) => (
            <article key={item.cupoId} className="rounded-xl border border-slate-200 p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.taller}</p>
                  <p className="text-slate-600">Participante: {item.participante || 'Sin nombre'}</p>
                  <p className="text-slate-600">Monto esperado: {formatMoney(item.montoEsperado)}</p>
                  <p className="text-slate-500">Fecha inscripción: {formatDate(item.fechaInscripcion)}</p>
                </div>
                <button
                  type="button"
                  disabled={busy || !metodoPagoId}
                  onClick={() => onPay(item.cupoId, Number(item.montoEsperado ?? 0))}
                  className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cobrar
                </button>
              </div>
            </article>
          ))}
          {pendientes.length === 0 ? <EmptyState message="No hay inscripciones de talleres pendientes de pago." /> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">Pagos de talleres recientes</h3>
        <div className="mt-3 space-y-2">
          {pagos.map((item) => (
            <article key={item.pagoCupoId} className="rounded-xl border border-slate-200 p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.taller}</p>
                  <p className="text-slate-600">Participante: {item.participante || 'Sin nombre'}</p>
                  <p className="text-slate-600">Recibo: {item.numeroRecibo || '-'}</p>
                  <p className="text-slate-600">Monto: {formatMoney(item.monto)}</p>
                  <p className="text-slate-500">{item.metodoPago || '-'} | {formatDate(item.fechaPago)} | {item.estado || '-'}</p>
                </div>
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
            </article>
          ))}
          {pagos.length === 0 ? <EmptyState message="No hay pagos de talleres registrados todavía." /> : null}
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
}: {
  pendientes: CajaMatriculaPendienteItem[]
  pagos: CajaPagoMatriculaItem[]
  onPay: (payload: { matriculaId: number; monto: number; metodoPagoId: number; detalle: string }) => Promise<void>
  onAnnul: (pagoMatriculaId: number) => void
  metodosPago: MetodoPagoOption[]
  busy: boolean
}) {
  const [busqueda, setBusqueda] = useState('')
  const [selectedMatricula, setSelectedMatricula] = useState<CajaMatriculaPendienteItem | null>(null)
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
    const term = busqueda.trim().toLocaleLowerCase('es-NI')
    if (!term) {
      return pendientes
    }
    return pendientes.filter((item) => item.estudiante?.toLocaleLowerCase('es-NI').includes(term))
  }, [busqueda, pendientes])

  const montoCobroNumber = Number(montoCobro) || 0
  const montoRecibidoNumber = Number(montoRecibido) || 0
  const saldoCaja = montoRecibidoNumber - montoCobroNumber
  const puedeCobrar = !!selectedMatricula && montoCobroNumber > 0 && !!metodoPagoId && saldoCaja >= 0 && !busy

  const abrirModal = (item: CajaMatriculaPendienteItem) => {
    setSelectedMatricula(item)
    setMontoCobro((current) => (current.trim() ? current : '0'))
    setMontoRecibido('')
    setDetalle(`Cobro matrícula ${item.anioLectivo || ''}`.trim())
  }

  const cerrarModal = () => {
    setSelectedMatricula(null)
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
    <div className="grid gap-6 xl:grid-cols-2">
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
          {pagos.map((item) => (
            <article key={item.pagoMatriculaId} className="rounded-xl border border-slate-200 p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.estudiante || 'Sin nombre'}</p>
                  <p className="text-slate-600">Monto: {formatMoney(item.monto)}</p>
                  <p className="text-slate-500">{item.metodoPago || '-'} | {formatDate(item.fechaPago)} | {item.estado || '-'}</p>
                </div>
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
            </article>
          ))}
          {pagos.length === 0 ? <EmptyState message="No hay pagos de matrícula registrados todavía." /> : null}
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
  detalle,
  moraAutomatica,
  moraPorPeriodo,
  diaLimitePago,
  buscarEstudiante,
  filtroEstado,
  onEstudianteIdChange,
  onMesDePagoChange,
  onMontoBaseChange,
  onMontoMoraChange,
  onMetodoPagoChange,
  onDetalleChange,
  onMoraAutomaticaChange,
  onMoraPorPeriodoChange,
  onDiaLimitePagoChange,
  onBuscarEstudianteChange,
  onFiltroEstadoChange,
  onPay,
  onAnnul,
  metodosPago,
  busy,
}: {
  mensualidades: CajaMensualidadItem[]
  mensualidadesPendientes: number
  estudianteId: string
  mesDePago: string
  montoBase: string
  montoMora: string
  metodoPagoId: string
  detalle: string
  moraAutomatica: boolean
  moraPorPeriodo: string
  diaLimitePago: string
  buscarEstudiante: string
  filtroEstado: 'todos' | 'activos' | 'anulados'
  onEstudianteIdChange: (value: string) => void
  onMesDePagoChange: (value: string) => void
  onMontoBaseChange: (value: string) => void
  onMontoMoraChange: (value: string) => void
  onMetodoPagoChange: (value: string) => void
  onDetalleChange: (value: string) => void
  onMoraAutomaticaChange: (value: boolean) => void
  onMoraPorPeriodoChange: (value: string) => void
  onDiaLimitePagoChange: (value: string) => void
  onBuscarEstudianteChange: (value: string) => void
  onFiltroEstadoChange: (value: 'todos' | 'activos' | 'anulados') => void
  onPay: () => void
  onAnnul: (mensualidadId: number) => void
  metodosPago: MetodoPagoOption[]
  busy: boolean
}) {
  const periods = calculateMoraPeriods(mesDePago, diaLimitePago)
  const moraSugerida = periods * (Number(moraPorPeriodo) || 0)
  const moraAplicada = moraAutomatica ? moraSugerida : Number(montoMora || 0)
  const totalEstimado = (Number(montoBase) || 0) + moraAplicada

  const mensualidadesFiltradas = mensualidades.filter((item) => {
    const matchEstado =
      filtroEstado === 'todos' || (filtroEstado === 'anulados' ? item.anulado : !item.anulado)
    const term = buscarEstudiante.trim().toLocaleLowerCase('es-NI')
    if (!term) {
      return matchEstado
    }
    return matchEstado && item.estudiante?.toLocaleLowerCase('es-NI').includes(term)
  })

  const mensualidadesActivas = mensualidades.filter((item) => !item.anulado)
  const cobradoMensualidades = sumPaid(mensualidades)
  const anuladasMensualidad = countAnnulled(mensualidades)

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">Pagos de mensualidad</h3>
        <p className="mt-1 text-xs text-slate-600">
          Define política de mora y aplica el cobro con desglose para que caja trabaje con reglas claras.
        </p>

        <div className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
            <input
              type="checkbox"
              checked={moraAutomatica}
              onChange={(event) => onMoraAutomaticaChange(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-teal-600"
            />
            Aplicar mora automática según atraso
          </label>
          <input
            value={diaLimitePago}
            onChange={(event) => onDiaLimitePagoChange(event.target.value)}
            placeholder="Día límite de pago"
            type="number"
            min="1"
            max="31"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
          <input
            value={moraPorPeriodo}
            onChange={(event) => onMoraPorPeriodoChange(event.target.value)}
            placeholder="Mora por período"
            type="number"
            step="0.01"
            min="0"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
          <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {periods > 0
              ? `Atraso estimado: ${periods} período(s). Mora sugerida: ${formatMoney(moraSugerida)}.`
              : 'Sin atraso para el mes seleccionado según la configuración actual.'}
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input value={estudianteId} onChange={(event) => onEstudianteIdChange(event.target.value)} placeholder="ID estudiante" className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500" />
          <input value={mesDePago} onChange={(event) => onMesDePagoChange(event.target.value)} placeholder="Mes de pago (1-12)" type="number" min="1" max="12" className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500" />
          <input value={montoBase} onChange={(event) => onMontoBaseChange(event.target.value)} placeholder="Monto base" type="number" step="0.01" className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500" />
          <input value={montoMora} onChange={(event) => onMontoMoraChange(event.target.value)} disabled={moraAutomatica} placeholder={moraAutomatica ? 'Mora automática' : 'Monto mora'} type="number" step="0.01" className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100" />
          <MetodoPagoSelect value={metodoPagoId} onChange={onMetodoPagoChange} metodosPago={metodosPago} />
          <input value={detalle} onChange={(event) => onDetalleChange(event.target.value)} placeholder="Detalle" className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500" />
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 lg:col-span-3">
            Base: <span className="font-semibold">{formatMoney(Number(montoBase) || 0)}</span> | Mora aplicada:{' '}
            <span className="font-semibold">{formatMoney(moraAplicada)}</span> | Total a cobrar:{' '}
            <span className="font-semibold text-teal-700">{formatMoney(totalEstimado)}</span>
          </div>
          <button type="button" disabled={busy} onClick={onPay} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 lg:col-span-3">{busy ? 'Procesando...' : 'Cobrar mensualidad'}</button>
        </div>

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
            </article>
          ))}
          {mensualidadesFiltradas.length === 0 ? <EmptyState message="No hay mensualidades con los filtros seleccionados." /> : null}
        </div>
      </section>
    </div>
  )
}

export function CajaDashboardPanel() {
  const { token } = useAuth()
  const [tab, setTab] = useState<CajaTab>('talleres')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CajaDashboardResponse | null>(null)
  const [activeSession, setActiveSession] = useState<CajaSessionInfo | null>(null)
  const [metodosPago, setMetodosPago] = useState<MetodoPagoOption[]>([])
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [openSaldo, setOpenSaldo] = useState('0')
  const [openObservacion, setOpenObservacion] = useState('')
  const [closeSaldo, setCloseSaldo] = useState('0')
  const [closeObservacion, setCloseObservacion] = useState('')
  const [mensualidadEstudianteId, setMensualidadEstudianteId] = useState('')
  const [mensualidadMes, setMensualidadMes] = useState(String(new Date().getMonth() + 1))
  const [mensualidadMontoBase, setMensualidadMontoBase] = useState('')
  const [mensualidadMontoMora, setMensualidadMontoMora] = useState('0')
  const [mensualidadMoraAutomatica, setMensualidadMoraAutomatica] = useState(true)
  const [mensualidadMoraPorPeriodo, setMensualidadMoraPorPeriodo] = useState('50')
  const [mensualidadDiaLimitePago, setMensualidadDiaLimitePago] = useState('10')
  const [mensualidadBuscarEstudiante, setMensualidadBuscarEstudiante] = useState('')
  const [mensualidadFiltroEstado, setMensualidadFiltroEstado] = useState<'todos' | 'activos' | 'anulados'>('todos')
  const [mensualidadMetodoPagoId, setMensualidadMetodoPagoId] = useState('1')
  const [mensualidadDetalle, setMensualidadDetalle] = useState('')
  const [tallerMetodoPagoId, setTallerMetodoPagoId] = useState('1')
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null)

  const moraPeriodosSugeridos = useMemo(
    () => calculateMoraPeriods(mensualidadMes, mensualidadDiaLimitePago),
    [mensualidadMes, mensualidadDiaLimitePago],
  )

  const moraSugerida = useMemo(
    () => moraPeriodosSugeridos * (Number(mensualidadMoraPorPeriodo) || 0),
    [moraPeriodosSugeridos, mensualidadMoraPorPeriodo],
  )

  const moraAplicadaFormulario = mensualidadMoraAutomatica ? moraSugerida : Number(mensualidadMontoMora)

  const totalCobradoTalleres = sumPaid(data?.pagosTaller ?? [])
  const totalCobradoMatriculas = sumPaid(data?.pagosMatricula ?? [])
  const totalCobradoMensualidades = sumPaid(data?.mensualidades ?? [])
  const totalCobradoGeneral = totalCobradoTalleres + totalCobradoMatriculas + totalCobradoMensualidades
  const anulacionesTotales =
    countAnnulled(data?.pagosTaller ?? []) +
    countAnnulled(data?.pagosMatricula ?? []) +
    countAnnulled(data?.mensualidades ?? [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [dashboard, session, methods] = await Promise.all([
        getCajaDashboard(token, 25),
        getActiveCajaSession(token),
        getMetodosPago(token),
      ])
      setData(dashboard)
      setActiveSession(session)
      setMetodosPago(methods)
      const firstMethodId = methods[0] ? String(methods[0].id) : ''
      setTallerMetodoPagoId((current) => (methods.some((method) => String(method.id) === current) ? current : firstMethodId))
      setMensualidadMetodoPagoId((current) => (methods.some((method) => String(method.id) === current) ? current : firstMethodId))
    } catch {
      setError('No se pudo cargar la información de caja.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const refreshAll = async () => {
    await loadData()
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
    await runAction('open-session', () => openCajaSession(token, { saldoInicial: readNumber(openSaldo), observacion: openObservacion }))
  }

  const handleCloseSession = async () => {
    await runAction('close-session', () => closeCajaSession(token, { saldoCierre: readNumber(closeSaldo), observacion: closeObservacion }))
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
      detalle: mensualidadDetalle,
    }))
  }

  const handleAnnulTaller = async (pagoCupoId: number, numeroRecibo: string) => {
    const motivo = window.prompt(`Motivo para anular el recibo ${numeroRecibo || pagoCupoId}`)
    if (!motivo?.trim()) {
      return
    }
    await runAction(`annul-taller-${pagoCupoId}`, () => annulPagoTaller(token, pagoCupoId, { motivo }))
  }

  const handleAnnulMatricula = async (pagoMatriculaId: number) => {
    const motivo = window.prompt(`Motivo para anular la matrícula ${pagoMatriculaId}`)
    if (!motivo?.trim()) {
      return
    }
    await runAction(`annul-matricula-${pagoMatriculaId}`, () => annulPagoMatricula(token, pagoMatriculaId, { motivo }))
  }

  const handleAnnulMensualidad = async (mensualidadId: number) => {
    const motivo = window.prompt(`Motivo para anular la mensualidad ${mensualidadId}`)
    if (!motivo?.trim()) {
      return
    }
    await runAction(`annul-mensualidad-${mensualidadId}`, () => annulPagoMensualidad(token, mensualidadId, { motivo }))
  }

  const metricas = data?.metricas

  const tabs = useMemo(
    () => [
      { id: 'talleres' as const, label: 'Talleres', icon: ReceiptText },
      { id: 'matricula' as const, label: 'Matrícula', icon: CreditCard },
      { id: 'mensualidad' as const, label: 'Mensualidad', icon: CreditCard },
    ],
    [],
  )

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

      <SessionSection
        session={activeSession}
        openSaldo={openSaldo}
        openObservacion={openObservacion}
        closeSaldo={closeSaldo}
        closeObservacion={closeObservacion}
        onOpenSaldoChange={setOpenSaldo}
        onOpenObservacionChange={setOpenObservacion}
        onCloseSaldoChange={setCloseSaldo}
        onCloseObservacionChange={setCloseObservacion}
        onOpenSession={handleOpenSession}
        onCloseSession={handleCloseSession}
        busy={busyAction === 'open-session' || busyAction === 'close-session'}
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

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SectionCard title="Recaudado talleres" value={formatMoney(totalCobradoTalleres)} detail="Solo pagos no anulados" />
        <SectionCard title="Recaudado matrícula" value={formatMoney(totalCobradoMatriculas)} detail="Solo pagos no anulados" />
        <SectionCard title="Recaudado mensualidad" value={formatMoney(totalCobradoMensualidades)} detail="Incluye mora aplicada" />
        <SectionCard title="Total operativo" value={formatMoney(totalCobradoGeneral)} detail={`Anulaciones registradas: ${anulacionesTotales}`} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center rounded-xl border px-3 py-2 text-sm font-semibold transition ${tab === id ? 'border-teal-500 bg-teal-100 text-teal-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
          >
            <Icon className="mr-2 h-4 w-4" />
            {label}
          </button>
        ))}
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
            {tab === 'talleres' ? (
              <TalleresTab
                pendientes={data.talleresPendientes}
                pagos={data.pagosTaller}
                onPay={handlePayTaller}
                onAnnul={handleAnnulTaller}
                metodoPagoId={tallerMetodoPagoId}
                onMetodoPagoChange={setTallerMetodoPagoId}
                metodosPago={metodosPago}
                busy={busyAction?.startsWith('pay-taller-') || busyAction?.startsWith('annul-taller-') || false}
              />
            ) : null}

            {tab === 'matricula' ? (
              <MatriculaTab
                pendientes={data.matriculasPendientes}
                pagos={data.pagosMatricula}
                onPay={handlePayMatricula}
                onAnnul={handleAnnulMatricula}
                metodosPago={metodosPago}
                busy={busyAction === 'pay-matricula' || (busyAction?.startsWith('annul-matricula-') ?? false)}
              />
            ) : null}

            {tab === 'mensualidad' ? (
              <MensualidadTab
                mensualidades={data.mensualidades}
                mensualidadesPendientes={metricas?.mensualidadesPendientes ?? 0}
                estudianteId={mensualidadEstudianteId}
                mesDePago={mensualidadMes}
                montoBase={mensualidadMontoBase}
                montoMora={mensualidadMontoMora}
                metodoPagoId={mensualidadMetodoPagoId}
                detalle={mensualidadDetalle}
                moraAutomatica={mensualidadMoraAutomatica}
                moraPorPeriodo={mensualidadMoraPorPeriodo}
                diaLimitePago={mensualidadDiaLimitePago}
                buscarEstudiante={mensualidadBuscarEstudiante}
                filtroEstado={mensualidadFiltroEstado}
                onEstudianteIdChange={setMensualidadEstudianteId}
                onMesDePagoChange={setMensualidadMes}
                onMontoBaseChange={setMensualidadMontoBase}
                onMontoMoraChange={setMensualidadMontoMora}
                onMetodoPagoChange={setMensualidadMetodoPagoId}
                onDetalleChange={setMensualidadDetalle}
                onMoraAutomaticaChange={setMensualidadMoraAutomatica}
                onMoraPorPeriodoChange={setMensualidadMoraPorPeriodo}
                onDiaLimitePagoChange={setMensualidadDiaLimitePago}
                onBuscarEstudianteChange={setMensualidadBuscarEstudiante}
                onFiltroEstadoChange={setMensualidadFiltroEstado}
                onPay={handlePayMensualidad}
                onAnnul={handleAnnulMensualidad}
                metodosPago={metodosPago}
                busy={busyAction === 'pay-mensualidad' || (busyAction?.startsWith('annul-mensualidad-') ?? false)}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  )
}

