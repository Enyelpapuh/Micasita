import { useMemo, useState } from 'react'
import type { PendienteMensualidadResponse, MetodoPagoOption } from './caja.api'

type Props = {
  open: boolean
  onClose: () => void
  estudianteId: string
  estudianteNombre?: string
  mesesPendientes?: number
  mesesPagados?: number[]
  mesActual?: number
  pendientes: PendienteMensualidadResponse[]
  onMoraAutomaticaChange?: (value: boolean) => void
  mesDePago: string
  montoBase: string
  montoMora: string
  metodoPagoId: string
  metodosPago: MetodoPagoOption[]
  onMesDePagoChange: (v: string) => void
  onMontoBaseChange: (v: string) => void
  onMontoMoraChange: (v: string) => void
  onMetodoPagoChange: (v: string) => void
  onPay: () => void
}

export default function MensualidadPaymentPanel({
  open,
  onClose,
  estudianteId,
  estudianteNombre,
  mesesPendientes,
  mesesPagados,
  mesActual,
  pendientes,
  onMoraAutomaticaChange,
  mesDePago,
  montoBase,
  montoMora,
  metodoPagoId,
  metodosPago,
  onMesDePagoChange,
  onMontoBaseChange,
  onMontoMoraChange,
  onMetodoPagoChange,
  onPay,
}: Props) {
  const [useMora, setUseMora] = useState(Boolean(Number(montoMora)))
  const [recibido, setRecibido] = useState('')
  const mesActualNumero = mesActual ?? (new Date().getMonth() + 1)
  const mesActualTexto = new Date(2026, Math.max(mesActualNumero - 1, 0), 1).toLocaleString('es-NI', { month: 'long' })
  const mesesPagadosSet = new Set(mesesPagados ?? [])
  const pendientesMap = new Map((pendientes ?? []).map((p) => [p.mes, p]))

  const total = useMemo(() => {
    const base = Number(montoBase || 0)
    const mora = Number(useMora ? montoMora || 0 : 0)
    return (base + mora).toFixed(2)
  }, [montoBase, montoMora, useMora])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-lg bg-white p-4 shadow-lg border border-gray-200">
        <h2 className="font-bold text-gray-800 mb-4">NUEVO COBRO - Mensualidad</h2>

        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Estudiante seleccionado</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{estudianteNombre || 'Sin nombre'}</p>
          <p className="text-sm text-slate-600">ID: {estudianteId}</p>
          <p className="text-sm text-slate-600">Meses pendientes: {mesesPendientes ?? pendientes.length}</p>
          <p className="text-sm text-slate-600">Mes actual: {mesActualTexto}</p>
          <p className="mt-2 text-sm font-semibold text-teal-700">Base mensual consultada: C${Number(montoBase || 0).toFixed(2)}</p>
        </div>

        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3">
          <label className="block text-xs font-semibold text-slate-500 mb-2">Cuadro de meses</label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => {
              const paid = mesesPagadosSet.has(mes)
              const pendiente = pendientesMap.has(mes)
              const selected = String(mes) === String(mesDePago)
              const isCurrent = mes === mesActualNumero
              const canSelect = !paid

              let stateClass = 'border-slate-200 bg-white text-slate-700'
              let badge = ''

              if (paid) {
                stateClass = 'border-emerald-200 bg-emerald-50 text-emerald-800'
                badge = 'Pagado'
              } else if (pendiente) {
                stateClass = 'border-rose-200 bg-rose-50 text-rose-800'
                badge = 'Debe'
              } else if (isCurrent) {
                stateClass = 'border-sky-200 bg-sky-50 text-sky-800'
                badge = 'Actual'
              } else if (mes > mesActualNumero) {
                stateClass = 'border-indigo-200 bg-indigo-50 text-indigo-800'
                badge = 'Adelantar'
              }

              return (
                <button
                  key={mes}
                  type="button"
                  disabled={!canSelect}
                  onClick={() => {
                    onMesDePagoChange(String(mes))
                    const pendienteMes = pendientesMap.get(mes)
                    if (pendienteMes?.monto != null) {
                      onMontoBaseChange(String(pendienteMes.monto))
                    }
                  }}
                  className={`rounded-xl border px-2 py-2 text-left text-xs transition ${stateClass} ${selected ? 'ring-2 ring-teal-300' : ''} ${!canSelect ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}
                >
                  <p className="font-semibold">{new Date(2026, mes - 1, 1).toLocaleString('es-NI', { month: 'short' })}</p>
                  <p>{badge || '-'}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-teal-100 bg-teal-50 p-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal-700">Pago</p>
              <p className="text-sm text-teal-900">Configura el método y el monto recibido</p>
            </div>
            <input
              type="checkbox"
              checked={useMora}
              onChange={(e) => {
                setUseMora(e.target.checked)
                onMoraAutomaticaChange?.(e.target.checked)
              }}
              className="h-4 w-4"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="number"
              value={montoMora}
              onChange={(e) => onMontoMoraChange(e.target.value)}
              placeholder="Mora"
              className="rounded-xl border border-slate-300 px-3 py-2 text-right text-sm outline-none focus:border-teal-500"
            />
            <select
              value={metodoPagoId}
              onChange={(e) => onMetodoPagoChange(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 bg-white"
            >
              {metodosPago.map((m) => (
                <option key={m.id} value={String(m.id)}>
                  {m.nombre}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={recibido}
              onChange={(e) => setRecibido(e.target.value)}
              placeholder="Recibido"
              className="rounded-xl border border-slate-300 px-3 py-2 text-right text-sm outline-none focus:border-teal-500 sm:col-span-2"
            />
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex justify-between font-bold text-lg text-gray-800 border-b pb-2 mb-2">
            <span>Total a Cobrar:</span>
            <span>C${total}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={() => onPay()}
            className="flex-1 bg-teal-600 text-white font-bold py-2 rounded shadow hover:bg-teal-700 transition"
          >
            Confirmar y Cobrar
          </button>
        </div>
      </div>
    </div>
  )
}
