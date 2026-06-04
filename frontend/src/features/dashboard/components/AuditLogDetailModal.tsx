import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import type { AuditLogEntry } from './DashboardPanels' // Importa el tipo desde DashboardPanels

type AuditLogDetailModalProps = {
  log: AuditLogEntry | null
  onClose: () => void
}

function formatAuditDate(value?: string | null) {
  if (!value) return 'Fecha desconocida'
  try {
    return new Intl.DateTimeFormat('es-NI', {
      dateStyle: 'full',
      timeStyle: 'long',
    }).format(new Date(value))
  } catch {
    return 'Fecha inválida'
  }
}

function parseJsonSafely(str?: string | null) {
  if (!str) return null
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

export function AuditLogDetailModal({ log, onClose }: AuditLogDetailModalProps) {
  if (!log) return null

  const before = parseJsonSafely(log.valorAnterior)
  const after = parseJsonSafely(log.valorNuevo)
  const changedFieldsObj = parseJsonSafely(log.camposModificados)

  // Extraemos todos los keys involucrados en la acción
  const keysToDisplay = Array.from(new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {})
  ])).filter(key => {
    if (log.accion === 'CREAR') return true;
    if (log.accion === 'ELIMINAR') return true;
    
    // Si es un UPDATE y tenemos metadata del trigger, filtramos sólo lo modificado
    if (changedFieldsObj && Object.keys(changedFieldsObj).length > 0) return !!changedFieldsObj[key];
    
    // Fallback si no hay metadata: comparar manualmente string a string
    return JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key]);
  });

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm sm:p-6">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-900">Detalles del Registro de Auditoría</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">ID del Log</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{log.id}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fecha y Hora</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{formatAuditDate(log.fecha)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Usuario (Email)</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{log.usuarioEmail || 'N/A'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Usuario (Nombre)</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{log.usuarioNombre || 'N/A'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Acción</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{log.accion}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Entidad Afectada</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{log.entidad || 'N/A'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">ID de Entidad</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{log.entidadId || 'N/A'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dirección IP</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{log.ip || 'N/A'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Navegador/Cliente</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{log.navegador || 'N/A'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Descripción del Evento</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{log.descripcion}</p>
            </div>

            {keysToDisplay.length > 0 && (
              <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Detalle de Cambios en Base de Datos</p>
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-2.5 font-semibold">Campo Afectado</th>
                        {log.accion !== 'CREAR' && <th className="px-4 py-2.5 font-semibold">Valor Anterior</th>}
                        {log.accion !== 'ELIMINAR' && <th className="px-4 py-2.5 font-semibold">Valor Nuevo</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {keysToDisplay.map(key => {
                        const oldVal = before?.[key]
                        const newVal = after?.[key]
                        return (
                          <tr key={key} className="transition-colors hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-medium text-slate-800">{key}</td>
                            {log.accion !== 'CREAR' && (
                              <td className="px-4 py-2.5 text-rose-600 line-through decoration-rose-300">
                                {oldVal !== undefined && oldVal !== null ? String(oldVal) : <span className="italic text-slate-400 no-underline">null</span>}
                              </td>
                            )}
                            {log.accion !== 'ELIMINAR' && (
                              <td className="px-4 py-2.5 font-medium text-emerald-600">
                                {newVal !== undefined && newVal !== null ? String(newVal) : <span className="italic text-slate-400 font-normal">null</span>}
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}