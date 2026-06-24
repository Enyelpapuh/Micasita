import { useState, useEffect } from 'react'
import { Database, DownloadCloud, FileText, LoaderCircle, Server, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../auth/AuthContext'
import { PanelShell } from './DashboardPanels'
import { triggerManualBackup, listBackups, downloadBackup, type BackupFile } from './backup.api'

export function BackupPanel() {
  const { token } = useAuth()
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [backups, setBackups] = useState<BackupFile[]>([])

  const fetchBackups = async () => {
    setIsLoadingList(true)
    try {
      const data = await listBackups(token)
      setBackups(data)
    } catch (error) {
      toast.error('No se pudo cargar la lista de respaldos.')
    } finally {
      setIsLoadingList(false)
    }
  }

  useEffect(() => {
    void fetchBackups()
  }, [token])

  const handleManualBackup = async () => {
    setIsBackingUp(true)
    try {
      const response = await triggerManualBackup(token)
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success(response.mensaje || 'Backup generado con éxito')
        await fetchBackups() // Refrescar la lista de archivos
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error inesperado')
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleDownload = async (fileName: string) => {
    const toastId = toast.loading(`Descargando ${fileName}...`)
    try {
      await downloadBackup(fileName, token)
      toast.success('Descarga iniciada', { id: toastId })
    } catch (error) {
      toast.error('Error al descargar el archivo', { id: toastId })
    }
  }

  const bytesToMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2)

  return (
    <PanelShell
      title="Copias de Seguridad"
      subtitle="Gestiona el resguardo de la base de datos del sistema para prevenir pérdida de información."
    >
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Automático */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Respaldos Automáticos</h3>
              <p className="text-sm text-slate-500">Configuración de servidor</p>
            </div>
          </div>
          <div className="mt-6 space-y-4 text-sm text-slate-700">
            <p>El sistema realiza de forma automática una <strong>copia de seguridad programada</strong> todos los días a las 02:00 AM.</p>
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <ul className="list-inside list-disc space-y-2 text-sky-900">
                <li>Frecuencia: Diaria</li>
                <li>Retención de archivos: 30 días</li>
              </ul>
            </div>
            <p className="text-xs text-slate-500">Cualquier cambio en la política de retención automática debe ser realizado por soporte técnico.</p>
          </div>
        </section>

        {/* Manual */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Respaldo Manual</h3>
              <p className="text-sm text-slate-500">Ejecución a demanda</p>
            </div>
          </div>
          <div className="mt-6 space-y-4 text-sm text-slate-700">
            <p>Fuerza la creación de un archivo de copia de seguridad (<code>.bak</code>) en este instante. Ideal antes de cierres o auditorías.</p>
            <button type="button" onClick={handleManualBackup} disabled={isBackingUp} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70">
              {isBackingUp ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <DownloadCloud className="h-5 w-5" />}
              {isBackingUp ? 'Generando copia en el servidor...' : 'Generar Backup Ahora'}
            </button>
          </div>
        </section>
      </div>

      {/* Lista de Backups */}
      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Historial de Respaldos (Archivos .bak)</h3>
            <p className="text-sm text-slate-500">Ubicación en el servidor: <code>C:\Backups\</code></p>
          </div>
          <button type="button" onClick={fetchBackups} disabled={isLoadingList} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${isLoadingList ? 'animate-spin' : ''}`} />
            Refrescar lista
          </button>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-white text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Nombre del archivo</th>
                <th className="px-4 py-3 font-semibold">Fecha de creación</th>
                <th className="px-4 py-3 font-semibold">Tamaño</th>
                <th className="px-4 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoadingList && backups.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500"><LoaderCircle className="mx-auto h-6 w-6 animate-spin" /></td></tr>
              ) : backups.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">No hay copias de seguridad en la carpeta.</td></tr>
              ) : (
                backups.map((file) => (
                  <tr key={file.fileName} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-slate-900 font-medium">
                        <FileText className="h-4 w-4 text-slate-400" />
                        {file.fileName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{new Date(file.lastModified).toLocaleString('es-NI')}</td>
                    <td className="px-4 py-3 text-slate-600">{bytesToMB(file.size)} MB</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownload(file.fileName)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-100"
                      >
                        <DownloadCloud className="h-3.5 w-3.5" />
                        Descargar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </PanelShell>
  )
}