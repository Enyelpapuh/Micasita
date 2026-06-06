import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  History,
  LoaderCircle,
  LogIn,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../../auth/AuthContext'
import { AuditLogDetailModal } from './AuditLogDetailModal'
import { PanelShell } from './DashboardPanels'

export type AuditLogEntry = {
  id: number
  fecha: string
  usuarioEmail: string
  usuarioNombre: string
  accion: 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR' | 'LOGIN_EXITOSO' | 'LOGIN_FALLIDO'
  entidad?: string
  entidadId?: string | number
  descripcion: string
  ip?: string
  navegador?: string
  valorAnterior?: string
  valorNuevo?: string
  camposModificados?: string
}

function formatAuditDate(value?: string | null) {
  if (!value) return 'Fecha desconocida'
  try {
    return new Intl.DateTimeFormat('es-NI', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return 'Fecha inválida'
  }
}

function getActionMeta(action: AuditLogEntry['accion']) {
  switch (action) {
    case 'CREAR':
      return { Icon: PlusCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' }
    case 'ACTUALIZAR':
      return { Icon: Pencil, color: 'text-sky-600', bg: 'bg-sky-50' }
    case 'ELIMINAR':
      return { Icon: Trash2, color: 'text-rose-600', bg: 'bg-rose-50' }
    case 'LOGIN_EXITOSO':
      return { Icon: LogIn, color: 'text-teal-600', bg: 'bg-teal-50' }
    case 'LOGIN_FALLIDO':
      return { Icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' }
    default:
      return { Icon: History, color: 'text-slate-600', bg: 'bg-slate-100' }
  }
}

export function AuditoriaPanel() {
  const { token } = useAuth()
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'7' | '30' | '90'>('7')
  const [search, setSearch] = useState('')
  const [specificDate, setSpecificDate] = useState('')
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<AuditLogEntry | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('todas')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        const res = await axios.get<AuditLogEntry[]>('/admin/auditoria/log', {
          baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
          headers: { Authorization: `Bearer ${token}` },
          params: { days: period },
        })
        if (!cancelled) setLogs(res.data ?? [])
      } catch (err) {
        if (!cancelled) setError('No fue posible cargar el registro de auditoría.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [token, period])

  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>()
    logs.forEach(log => {
      if (log.entidad) categories.add(log.entidad)
    })
    return Array.from(categories).sort()
  }, [logs])

  const filteredLogs = useMemo(() => {
    let result = logs
    if (selectedCategory !== 'todas') {
      result = result.filter(log => log.entidad === selectedCategory)
    }
    if (specificDate) {
      result = result.filter(log => log.fecha && log.fecha.startsWith(specificDate))
    }

    const term = search.trim().toLowerCase()
    if (!term) return result
    return result.filter(log => {
      const haystack = [
        log.usuarioEmail,
        log.usuarioNombre,
        log.accion,
        log.entidad,
        String(log.entidadId),
        log.descripcion,
        log.ip,
      ].join(' ').toLowerCase()
      return haystack.includes(term)
    })
  }, [logs, search, specificDate, selectedCategory])

  const openDetailModal = (log: AuditLogEntry) => {
    setSelectedLogForDetail(log)
    setIsDetailModalOpen(true)
  }

  const closeDetailModal = () => {
    setSelectedLogForDetail(null)
    setIsDetailModalOpen(false)
  }

  return (
    <PanelShell title="Auditoría del Sistema" subtitle="Registro de cambios y eventos importantes en la plataforma.">
      <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm ring-teal-300 focus-within:ring">
          <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por usuario, acción, entidad..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-700">Categoría:</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500">
              <option value="todas">Todas</option>
              {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-700">Día:</label>
            <input type="date" value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-700">Periodo:</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value as '7' | '30' | '90')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500">
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-slate-600"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Cargando registros...</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">{error}</div>
        ) : filteredLogs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">No hay registros de auditoría para el periodo y filtro seleccionados.</div>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map((log) => {
              const { Icon, color, bg } = getActionMeta(log.accion)
              return (
                <button key={log.id} type="button" onClick={() => openDetailModal(log)} className="flex w-full items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg} ${color}`}><Icon className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">{log.descripcion}</p>
                    <p className="mt-1 text-xs text-slate-500">Por <span className="font-medium text-slate-700">{log.usuarioNombre || 'N/A'}</span> ({log.usuarioEmail || 'N/A'}){log.ip ? ` desde la IP ${log.ip}` : ''}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{formatAuditDate(log.fecha)}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-600">{log.accion}</span>
                </button>
              )
            })} 
          </div>
        )}
      </div>
      {isDetailModalOpen && selectedLogForDetail ? <AuditLogDetailModal log={selectedLogForDetail} onClose={closeDetailModal} /> : null}
    </PanelShell>
  )
}