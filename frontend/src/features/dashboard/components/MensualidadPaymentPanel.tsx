import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarRange, Check, CreditCard, UserCircle, Wallet, X } from 'lucide-react'
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
  const [isVisible, setIsVisible] = useState(false)

  const mesActualNumero = mesActual ?? (new Date().getMonth() + 1)
  const mesActualTexto = new Date(2026, Math.max(mesActualNumero - 1, 0), 1).toLocaleString('es-NI', { month: 'long' })
  const mesesPagadosSet = new Set(mesesPagados ?? [])
  const pendientesMap = new Map((pendientes ?? []).map((p) => [p.mes, p]))

  useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => setIsVisible(true))
      return () => cancelAnimationFrame(frame)
    } else {
      setIsVisible(false)
    }
  }, [open])

  const total = useMemo(() => {
    const base = Number(montoBase || 0)
    const mora = Number(useMora ? montoMora || 0 : 0)
    return (base + mora).toFixed(2)
  }, [montoBase, montoMora, useMora])

  const totalNumber = Number(total)
  const recibidoNumber = Number(recibido) || 0
  const vuelto = recibidoNumber - totalNumber

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
      <div 
        className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose} 
      />
      
      <div className={`relative w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl transition-all duration-300 ${isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-8 scale-95 opacity-0'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Cobro de Mensualidad</h2>
              <p className="text-sm text-slate-500">Selecciona el mes y registra el pago del estudiante</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
          
          {/* Left Column: Student & Months */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-slate-400" />
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Estudiante seleccionado</p>
              </div>
              <p className="text-xl font-bold text-slate-900">{estudianteNombre || 'Sin nombre'}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">ID: {estudianteId}</span>
                <span className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm">Debe: {mesesPendientes ?? pendientes.length} mes(es)</span>
                <span className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-sm">Mes actual: {mesActualTexto}</span>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-slate-400" />
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Selección de mes</p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => {
                  const paid = mesesPagadosSet.has(mes)
                  const pendiente = pendientesMap.has(mes)
                  const selected = String(mes) === String(mesDePago)
                  const isCurrent = mes === mesActualNumero
                  const canSelect = !paid

                  let stateClass = 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  let badge = ''

                  if (paid) {
                    stateClass = 'border-emerald-200 bg-emerald-50 text-emerald-800 opacity-60'
                    badge = 'Pagado'
                  } else if (pendiente) {
                    stateClass = 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 hover:border-rose-300'
                    badge = 'Debe'
                  } else if (isCurrent) {
                    stateClass = 'border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 hover:border-sky-300'
                    badge = 'Actual'
                  } else if (mes > mesActualNumero) {
                    stateClass = 'border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 hover:border-indigo-300'
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
                      className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all duration-200 ${stateClass} ${selected ? 'ring-2 ring-teal-500 ring-offset-2 scale-105 shadow-md border-teal-500' : ''} ${!canSelect ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className="text-sm font-bold uppercase tracking-wide">{new Date(2026, mes - 1, 1).toLocaleString('es-NI', { month: 'short' })}</span>
                      <span className="mt-1 text-[10px] font-semibold opacity-90">{badge || '-'}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Payment */}
          <div className="flex h-full flex-col space-y-4">
            <div className="flex-1 rounded-2xl border border-teal-100 bg-teal-50/50 p-5">
              <div className="mb-5 flex items-center justify-between border-b border-teal-100 pb-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-teal-600" />
                  <p className="text-sm font-bold uppercase tracking-wider text-teal-800">Detalle de Cobro</p>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-teal-800 transition hover:text-teal-900">
                  <input
                    type="checkbox"
                    checked={useMora}
                    onChange={(e) => {
                      setUseMora(e.target.checked)
                      onMoraAutomaticaChange?.(e.target.checked)
                    }}
                    className="h-4 w-4 rounded border-teal-300 text-teal-600 focus:ring-teal-500"
                  />
                  Mora automática
                </label>
              </div>

              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Base mensual (C$)</label>
                    <input
                      type="number"
                      value={montoBase}
                      onChange={(e) => onMontoBaseChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Mora aplicada (C$)</label>
                    <input
                      type="number"
                      value={useMora ? montoMora : '0'}
                      onChange={(e) => onMontoMoraChange(e.target.value)}
                      disabled={!useMora}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Método de pago</label>
                  <select
                    value={metodoPagoId}
                    onChange={(e) => onMetodoPagoChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  >
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
                    value={recibido}
                    onChange={(e) => setRecibido(e.target.value)}
                    placeholder="Monto entregado por el cliente"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-end justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total a cobrar</p>
                  <p className="text-4xl font-black text-slate-900">C$ {total}</p>
                </div>
                {recibidoNumber > 0 && (
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Vuelto</p>
                    <p className={`text-2xl font-bold ${vuelto >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      C$ {vuelto >= 0 ? vuelto.toFixed(2) : Math.abs(vuelto).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onPay}
                  disabled={!mesDePago || !metodoPagoId}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check className="h-5 w-5" /> Confirmar cobro
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  , document.body)
}
