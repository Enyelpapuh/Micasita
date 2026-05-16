import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { getFinanzasConfig, updateFinanzasConfig, type ConfiguracionFinanzasDto } from './caja.api'

export function AdminFinanzasPanel() {
  const { token } = useAuth()
  const [config, setConfig] = useState<ConfiguracionFinanzasDto | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!token) {
        if (!cancelled) setError('No hay sesión válida')
        return
      }
      try {
        setLoading(true)
        setError(null)
        const data = await getFinanzasConfig(token)
        if (!cancelled) {
          setConfig(data)
          setError(null)
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'No fue posible cargar la configuración financiera'
          setError(msg)
          console.error('Error al cargar configuración:', e)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [token])

  const onChange = (k: keyof ConfiguracionFinanzasDto, v: any) => {
    setConfig((c) => ({ ...(c ?? {}), [k]: v }))
  }

  const save = async () => {
    if (!token || !config) return
    setBusy(true)
    setError(null)
    try {
      const result = await updateFinanzasConfig(token, config)
      setConfig(result)
      setError(null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo guardar la configuración'
      setError(msg)
      console.error('Error al guardar configuración:', e)
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">Cargando configuración...</p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Configuración financiera</h3>
      <p className="mt-1 text-sm text-slate-600">Ajusta los importes base y la política de mora/descuento familiar.</p>

      {error ? <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      {!config ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          No se pudo cargar la configuración. Verifica tu conexión e intenta recargar la página.
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm text-slate-700">
              Monto matrícula base
              <input value={config?.montoMatriculaBase ?? ''} onChange={(e) => onChange('montoMatriculaBase', Number(e.target.value) || 0)} type="number" step="0.01" className="mt-1 w-full rounded-md border px-2 py-1" />
            </label>

            <label className="text-sm text-slate-700">
              Monto mensualidad base
              <input value={config?.montoMensualidadBase ?? ''} onChange={(e) => onChange('montoMensualidadBase', Number(e.target.value) || 0)} type="number" step="0.01" className="mt-1 w-full rounded-md border px-2 py-1" />
            </label>

            <label className="text-sm text-slate-700">
              Monto mora fija
              <input value={config?.montoMoraFija ?? ''} onChange={(e) => onChange('montoMoraFija', Number(e.target.value) || 0)} type="number" step="0.01" className="mt-1 w-full rounded-md border px-2 py-1" />
            </label>

            <label className="text-sm text-slate-700">
              % descuento familiar
              <input value={config?.porcentajeDescuentoFamiliar ?? ''} onChange={(e) => onChange('porcentajeDescuentoFamiliar', Number(e.target.value) || 0)} type="number" step="0.01" className="mt-1 w-full rounded-md border px-2 py-1" />
            </label>

            <label className="text-sm text-slate-700">
              Máximo descuento familiar
              <input value={config?.maximoDescuentoFamiliar ?? ''} onChange={(e) => onChange('maximoDescuentoFamiliar', Number(e.target.value) || 0)} type="number" step="0.01" className="mt-1 w-full rounded-md border px-2 py-1" />
            </label>

            <label className="text-sm text-slate-700">
              Días límite mora
              <input value={config?.diasLimiteMora ?? ''} onChange={(e) => onChange('diasLimiteMora', Number(e.target.value) || 0)} type="number" className="mt-1 w-full rounded-md border px-2 py-1" />
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
              <input type="checkbox" checked={!!config?.aplicarMoraAutomatica} onChange={(e) => onChange('aplicarMoraAutomatica', e.target.checked)} className="h-4 w-4" />
              Aplicar mora automática
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
              <input type="checkbox" checked={!!config?.activo} onChange={(e) => onChange('activo', e.target.checked)} className="h-4 w-4" />
              Activo
            </label>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button onClick={save} disabled={busy} className="rounded-md bg-teal-600 px-4 py-2 text-white disabled:opacity-60">
              {busy ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </div>
        </>
      )}
    </section>
  )
}
