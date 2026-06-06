import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { BookOpen, CalendarDays, ChevronRight, Mail, Phone, Search, Users, UserPlus, X, LoaderCircle, FileText, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { normalizeApiError, useAuth } from '../../auth/AuthContext'
import {
  getEstudianteDetail,
  listEstudiantes,
  listTutores,
  updateEstudianteInformacionDocente,
  vincularEstudianteTutor,
  desvincularEstudianteTutor,
  createTutor,
  type EstudianteDetailItem,
  type EstudianteItem,
  type TutorItem,
} from './academico.api'
import { getAdminTiposDocumento } from '../../admision/admision.api'

function formatDate(value?: string | null) {
  if (!value) {
    return 'No disponible'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-NI', { year: 'numeric', month: 'short', day: '2-digit' }).format(date)
}

function StudentMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  )
}

function TutorManagementModal({
  tutoresDisponibles,
  estudianteNombre,
  onClose,
  onVincular,
  onCreateVincular,
}: {
  tutoresDisponibles: TutorItem[]
  estudianteNombre: string
  onClose: () => void
  onVincular: (tutorId: number) => Promise<void>
  onCreateVincular: (data: { nombre: string; apellido: string; correo: string; telefono: string; cedula: string; direccion: string }) => Promise<void>
}) {
  const [mode, setMode] = useState<'search' | 'create'>('search')
  const [search, setSearch] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  const [newTutor, setNewTutor] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    cedula: '',
    direccion: '',
  })

  const filteredTutores = useMemo(() => {
    const term = search.toLocaleLowerCase('es-NI')
    if (!term) return tutoresDisponibles
    return tutoresDisponibles.filter(t => 
      `${t.nombre ?? ''} ${t.apellido ?? ''}`.toLocaleLowerCase('es-NI').includes(term) ||
      (t.correo ?? '').toLocaleLowerCase('es-NI').includes(term) ||
      (t.telefono ?? '').includes(term)
    )
  }, [search, tutoresDisponibles])

  const handleVincularExistente = async (tutorId: number) => {
    setIsSaving(true)
    try {
      await onVincular(tutorId)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const handleCrearYVincular = async () => {
    if (!newTutor.nombre.trim() || !newTutor.apellido.trim()) {
      toast.error('El nombre y apellido son obligatorios')
      return
    }
    setIsSaving(true)
    try {
      await onCreateVincular(newTutor)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm sm:p-6">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Gestionar Tutor</h2>
            <p className="text-sm text-slate-500">Para: {estudianteNombre}</p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 flex gap-4 border-b border-slate-200">
            <button
              onClick={() => setMode('search')}
              className={`pb-2 text-sm font-semibold transition-colors ${mode === 'search' ? 'border-b-2 border-teal-600 text-teal-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Buscar Existente
            </button>
            <button
              onClick={() => setMode('create')}
              className={`pb-2 text-sm font-semibold transition-colors ${mode === 'create' ? 'border-b-2 border-teal-600 text-teal-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Crear Nuevo
            </button>
          </div>

          {mode === 'search' ? (
            <div className="space-y-4">
              <div className="flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm ring-teal-300 focus-within:ring">
                <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, correo o teléfono..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
                <ul className="divide-y divide-slate-100">
                  {filteredTutores.map((tutor) => (
                    <li key={tutor.id} className="flex items-center justify-between p-3 hover:bg-slate-50">
                      <div>
                        <p className="font-semibold text-slate-900">{tutor.nombre} {tutor.apellido}</p>
                        <p className="text-xs text-slate-500">{tutor.correo || 'Sin correo'} • {tutor.telefono || 'Sin teléfono'}</p>
                      </div>
                      <button
                        onClick={() => handleVincularExistente(tutor.id)}
                        disabled={isSaving}
                        className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 disabled:opacity-50"
                      >
                        Vincular
                      </button>
                    </li>
                  ))}
                  {filteredTutores.length === 0 && (
                    <li className="p-4 text-center text-sm text-slate-500">No se encontraron tutores.</li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Nombre *</label>
                  <input
                    value={newTutor.nombre}
                    onChange={(e) => setNewTutor({ ...newTutor, nombre: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                    placeholder="Ej. Juan"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Apellido *</label>
                  <input
                    value={newTutor.apellido}
                    onChange={(e) => setNewTutor({ ...newTutor, apellido: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                    placeholder="Ej. Pérez"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Correo</label>
                  <input
                    value={newTutor.correo}
                    onChange={(e) => setNewTutor({ ...newTutor, correo: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                    placeholder="Ej. juan@correo.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Teléfono</label>
                  <input
                    value={newTutor.telefono}
                    onChange={(e) => setNewTutor({ ...newTutor, telefono: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                    placeholder="Ej. 88888888"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Cédula</label>
                  <input
                    value={newTutor.cedula}
                    onChange={(e) => setNewTutor({ ...newTutor, cedula: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Dirección</label>
                  <input
                    value={newTutor.direccion}
                    onChange={(e) => setNewTutor({ ...newTutor, direccion: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleCrearYVincular}
                  disabled={isSaving || !newTutor.nombre.trim() || !newTutor.apellido.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Crear y Vincular
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  , document.body)
}

export function StudentDirectoryPanel() {
  const { token, user } = useAuth()
  const [students, setStudents] = useState<EstudianteItem[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<EstudianteDetailItem | null>(null)
  const [tutoresDisponibles, setTutoresDisponibles] = useState<TutorItem[]>([])
  const [studentAlergiasDraft, setStudentAlergiasDraft] = useState('')
  const [studentObservacionDraft, setStudentObservacionDraft] = useState('')
  const [savingStudentDescription, setSavingStudentDescription] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'general' | 'admin' | 'documentos'>('general')
  const [isTutorModalOpen, setIsTutorModalOpen] = useState(false)
  const [tutorToUnlink, setTutorToUnlink] = useState<number | null>(null)
  const [isUnlinking, setIsUnlinking] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 12

  type TipoDocumento = { id: number; nombre: string; obligatorio: boolean }
  type DocumentoEstudiante = { id: number; tipoDocumentoId: number; tipoDocumentoNombre: string; rutaArchivo: string; fechaRegistro: string }

  const [documentos, setDocumentos] = useState<DocumentoEstudiante[]>([])
  const [tiposDoc, setTiposDoc] = useState<TipoDocumento[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)
  const [docFile, setDocFile] = useState<File | null>(null)
  const [selectedTipoDoc, setSelectedTipoDoc] = useState('')
  const [previewDoc, setPreviewDoc] = useState<DocumentoEstudiante | null>(null)
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null)
  const [previewDocLoading, setPreviewDocLoading] = useState(false)

  const canEditStudentNotes = useMemo(
    () => (user?.roles ?? []).some((role) => ['ADMIN', 'DEVELOPER', 'ADMINISTRACION', 'ADMIN_DIRECCION', 'DIRECTOR'].includes(role?.toUpperCase?.() ?? role)),
    [user?.roles],
  )

  useEffect(() => {
    if (!canEditStudentNotes) {
      setActiveTab('general')
    }
  }, [canEditStudentNotes])

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es-NI')
    let result = [...students]
    
    if (term) {
      result = result.filter((student) => {
        const fullName = `${student.nombre ?? ''} ${student.apellido ?? ''}`.toLocaleLowerCase('es-NI')
        const idText = `${student.id}`
        return fullName.includes(term) || idText.includes(term)
      })
    }

    return result.sort((a, b) => {
      const nameA = `${a.nombre ?? ''} ${a.apellido ?? ''}`.trim()
      const nameB = `${b.nombre ?? ''} ${b.apellido ?? ''}`.trim()
      return nameA.localeCompare(nameB, 'es-NI')
    })
  }, [search, students])

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredStudents, currentPage])

  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      setLoadingList(true)
      try {
        const [studentsResult, tutoresResult] = await Promise.all([
          listEstudiantes(token),
          listTutores(token),
        ])
        if (cancelled) {
          return
        }

        setStudents(studentsResult)
        setTutoresDisponibles(tutoresResult)
      } catch (error) {
        if (!cancelled) {
          toast.error(normalizeApiError(error, 'No se pudo cargar la lista de estudiantes'))
        }
      } finally {
        if (!cancelled) {
          setLoadingList(false)
        }
      }
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!selectedStudentId) {
      setSelectedStudent(null)
      return
    }

    let cancelled = false

    const loadDetail = async () => {
      setLoadingDetail(true)
      try {
        const detail = await getEstudianteDetail(token, selectedStudentId)
        if (!cancelled) {
          setSelectedStudent(detail)
          setStudentAlergiasDraft(detail.alergiasGraves ?? '')
          setStudentObservacionDraft(detail.observacionMedicaCorta ?? '')
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(normalizeApiError(error, 'No se pudo cargar el detalle del estudiante'))
        }
      } finally {
        if (!cancelled) {
          setLoadingDetail(false)
        }
      }
    }

    loadDetail()
    return () => {
      cancelled = true
    }
  }, [selectedStudentId, token])

  useEffect(() => {
    if (selectedStudent) {
      setStudentAlergiasDraft(selectedStudent.alergiasGraves ?? '')
      setStudentObservacionDraft(selectedStudent.observacionMedicaCorta ?? '')
    }
  }, [selectedStudent])

  useEffect(() => {
    if (activeTab === 'documentos' && selectedStudentId && token) {
      let cancelled = false
      setLoadingDocs(true)
      const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'
      
      Promise.all([
        getAdminTiposDocumento(token).catch(() => []),
        axios.get(`${baseUrl}/admin/estudiantes/${selectedStudentId}/documentos`, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => res.data)
          .catch((e) => {
            toast.error(normalizeApiError(e, 'Hubo un error en el servidor al cargar los documentos.'))
            return []
          })
      ]).then(([tiposData, docsData]) => {
        if (!cancelled) {
          setTiposDoc(tiposData || [])
          setDocumentos(docsData || [])
          setLoadingDocs(false)
        }
      })
      return () => { cancelled = true }
    }
  }, [activeTab, selectedStudentId, token])

  const handleUploadDocument = async () => {
    if (!docFile || !selectedTipoDoc || !selectedStudentId) {
      toast.error('Selecciona un tipo de documento y un archivo')
      return
    }
    setIsUploadingDoc(true)
    const formData = new FormData()
    formData.append('file', docFile)
    formData.append('tipoDocumentoId', selectedTipoDoc)

    const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'
    try {
      await axios.post(`${baseUrl}/admin/estudiantes/${selectedStudentId}/documentos`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Documento subido exitosamente')
      setDocFile(null)
      setSelectedTipoDoc('')
      const fileInput = document.getElementById('doc-file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
      const docsRes = await axios.get(`${baseUrl}/admin/estudiantes/${selectedStudentId}/documentos`, { headers: { Authorization: `Bearer ${token}` } })
      setDocumentos(docsRes.data || [])
    } catch (e) {
      toast.error(normalizeApiError(e, 'Error al subir el documento (Verifica el tamaño o que la carpeta exista en el servidor)'))
    } finally {
      setIsUploadingDoc(false)
    }
  }

  const handleDeleteDocument = async (docId: number) => {
    const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'
    try {
      await axios.delete(`${baseUrl}/admin/estudiantes/documentos/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Documento eliminado')
      setDocumentos(prev => prev.filter(d => d.id !== docId))
    } catch (e) {
      toast.error(normalizeApiError(e, 'Hubo un error interno al intentar eliminar el documento'))
    }
  }

  const resolveDocUrl = (path: string) => {
    if (!path) return '#'
    if (path.startsWith('http')) return path
    const base = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:8080'
    return `${base}${path.startsWith('/') ? path : '/' + path}`
  }

  const isImageDoc = (rutaArchivo: string) => /\.(png|jpe?g|webp|gif)$/i.test(rutaArchivo)
  const isPdfDoc = (rutaArchivo: string) => /\.pdf$/i.test(rutaArchivo)

  useEffect(() => {
    if (!previewDoc) return

    let cancelled = false
    let objectUrl: string | null = null

    setPreviewDocLoading(true)

    const fetchDoc = async () => {
      try {
        const targetUrl = resolveDocUrl(previewDoc.rutaArchivo)
        const response = await fetch(targetUrl, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (!response.ok) throw new Error('No se pudo cargar el documento')
        
        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)
        
        if (!cancelled) setPreviewDocUrl(objectUrl)
      } catch (err) {
        if (!cancelled) setPreviewDocUrl(null)
      } finally {
        if (!cancelled) setPreviewDocLoading(false)
      }
    }

    void fetchDoc()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      setPreviewDocUrl(null)
    }
  }, [previewDoc, token])

  const handleGuardarInformacionDocente = async () => {
    if (!selectedStudent) {
      return
    }

    setSavingStudentDescription(true)
    try {
      const updated = await updateEstudianteInformacionDocente(token, selectedStudent.id, {
        alergiasGraves: studentAlergiasDraft,
        observacionMedicaCorta: studentObservacionDraft,
      })
      setSelectedStudent(updated)
      setStudentAlergiasDraft(updated.alergiasGraves ?? '')
      setStudentObservacionDraft(updated.observacionMedicaCorta ?? '')
      toast.success('La información del estudiante se actualizó')
    } catch (error) {
      toast.error(normalizeApiError(error, 'No se pudo actualizar la información del estudiante'))
    } finally {
      setSavingStudentDescription(false)
    }
  }

  const handleVincularTutor = async (tutorId: number) => {
    if (!selectedStudent || !tutorId) {
      toast.error('Selecciona un tutor para vincular')
      return
    }

    try {
      await vincularEstudianteTutor(token, { estudianteId: selectedStudent.id, tutorId })
      const detail = await getEstudianteDetail(token, selectedStudent.id)
      setSelectedStudent(detail)
      toast.success('Tutor vinculado al estudiante')
    } catch (error) {
      toast.error(normalizeApiError(error, 'No se pudo vincular el tutor'))
      throw error
    }
  }

  const handleConfirmDesvincularTutor = async () => {
    if (!selectedStudent || !tutorToUnlink) return
    setIsUnlinking(true)

    try {
      await desvincularEstudianteTutor(token, selectedStudent.id, tutorToUnlink)
      const detail = await getEstudianteDetail(token, selectedStudent.id)
      setSelectedStudent(detail)
      toast.success('Tutor desvinculado correctamente')
    } catch (error) {
      toast.error(normalizeApiError(error, 'No se pudo desvincular el tutor'))
    } finally {
      setIsUnlinking(false)
      setTutorToUnlink(null)
    }
  }

  const handleCrearYVincularTutor = async (data: { nombre: string; apellido: string; correo: string; telefono: string; cedula: string; direccion: string }) => {
    if (!selectedStudent) return
    try {
      let createdTutor: TutorItem;
      if (typeof createTutor === 'function') {
        createdTutor = await createTutor(token, data)
      } else {
        toast.error('La creación de tutores no está soportada por el API actualmente.')
        return
      }
      await vincularEstudianteTutor(token, { estudianteId: selectedStudent.id, tutorId: createdTutor.id })
      const detail = await getEstudianteDetail(token, selectedStudent.id)
      setSelectedStudent(detail)
      const tutoresResult = await listTutores(token)
      setTutoresDisponibles(tutoresResult)
      toast.success('Tutor creado y vinculado exitosamente')
    } catch (error) {
      toast.error(normalizeApiError(error, 'No se pudo crear o vincular el tutor'))
      throw error
    }
  }

  const selectedSummary = selectedStudent ?? null

  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Lista General</p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Estudiantes y vínculos familiares</h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Consulta todos los estudiantes, abre su ficha y revisa sus tutores, grupo asignado y datos de contacto.
        </p>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre o ID..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="mt-6 flex items-center justify-between px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <span>Estudiantes registrados ({filteredStudents.length})</span>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {loadingList ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Cargando estudiantes...
            </div>
          ) : filteredStudents.length > 0 ? (
            paginatedStudents.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => setSelectedStudentId(student.id)}
                className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left transition-all hover:border-teal-300 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600 transition-colors group-hover:bg-teal-100 group-hover:text-teal-700">
                    {(student.nombre?.[0] ?? 'U').toUpperCase()}{(student.apellido?.[0] ?? '').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {student.nombre ?? 'Sin nombre'} {student.apellido ?? ''}
                    </p>
                    <p className="text-xs text-slate-500">ID estudiante: {student.id}</p>
                  </div>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors group-hover:bg-teal-50 group-hover:text-teal-600">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              No hay estudiantes que coincidan con la búsqueda.
            </div>
          )}
        </div>

        {totalPages > 1 ? (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm font-medium text-slate-600">
              Página {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        ) : null}
      </div>

      {selectedStudentId !== null ? createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm sm:p-6">
          <div className="absolute inset-0" onClick={() => setSelectedStudentId(null)} />
          <div className="relative flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-slate-50 shadow-2xl">
            <div className="shrink-0 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur-md">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Ficha del estudiante</h3>
                <p className="text-sm text-slate-500">Detalles y administración</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentId(null)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingDetail ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  Cargando detalle del estudiante...
                </div>
              ) : selectedSummary ? (
                <div className="space-y-6">
                  <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,_rgba(13,148,136,0.10),_rgba(14,165,233,0.08),_rgba(255,255,255,1))] p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Ficha del estudiante</p>
                        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                          {selectedSummary.nombre ?? 'Sin nombre'} {selectedSummary.apellido ?? ''}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">ID interno {selectedSummary.id}</p>
                      </div>
                      {canEditStudentNotes && activeTab === 'admin' ? (
                        <div className="flex flex-col items-end gap-3">
                          <div className="rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Identificador</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{selectedSummary.identificador ?? 'No registrado'}</p>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {canEditStudentNotes ? (
                      <div className="mt-6 flex gap-6 border-b border-teal-200/50">
                        <button
                          onClick={() => setActiveTab('general')}
                          className={`pb-2 text-sm font-semibold transition-colors ${activeTab === 'general' ? 'border-b-2 border-teal-600 text-teal-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Información General
                        </button>
                        <button
                          onClick={() => setActiveTab('admin')}
                          className={`pb-2 text-sm font-semibold transition-colors ${activeTab === 'admin' ? 'border-b-2 border-teal-600 text-teal-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Administración
                        </button>
                        <button
                          onClick={() => setActiveTab('documentos')}
                          className={`pb-2 text-sm font-semibold transition-colors ${activeTab === 'documentos' ? 'border-b-2 border-teal-600 text-teal-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Documentos
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {activeTab === 'general' ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <section className="rounded-2xl border border-slate-200 bg-white p-4">
                        <SectionTitle title="Grupos" subtitle="Grupos donde aparece inscrito y su docente asignado" />
                        <div className="mt-4 space-y-3">
                          {selectedSummary.grupos.length > 0 ? (
                            selectedSummary.grupos.map((grupo) => (
                              <article key={grupo.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
                                <div className="flex items-start gap-3">
                                  <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                                    <BookOpen className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-slate-900">{grupo.nombre ?? 'Sin nombre'}</p>
                                    <div className="mt-2 grid gap-2 text-sm text-slate-600">
                                      <p className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-slate-400" />Inscrito: {formatDate(grupo.fechaInscripcion)}</p>
                                      <p>Código función: {grupo.codigoFuncion ?? 'No definido'}</p>
                                      <p>
                                        Profesor:{' '}
                                        {grupo.profesorNombre || grupo.profesorApellido
                                          ? `${grupo.profesorNombre ?? ''} ${grupo.profesorApellido ?? ''}`.trim()
                                          : 'Sin profesor asignado'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </article>
                            ))
                          ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                              No hay grupos asociados.
                            </div>
                          )}
                        </div>
                      </section>

                      <section className="rounded-2xl border border-slate-200 bg-white p-4">
                        <SectionTitle title="Información médica y notas" subtitle="Alergias graves y observación médica (Solo lectura)" />
                        <div className="mt-4 space-y-3">
                          {selectedSummary.alergiasGraves || selectedSummary.observacionMedicaCorta ? (
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
                              {selectedSummary.alergiasGraves ? (
                                <div className="mb-4">
                                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">Alergias Graves</p>
                                  <p className="mt-1 text-sm text-slate-700">{selectedSummary.alergiasGraves}</p>
                                </div>
                              ) : null}
                              {selectedSummary.observacionMedicaCorta ? (
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">Observación Médica</p>
                                  <p className="mt-1 text-sm text-slate-700">{selectedSummary.observacionMedicaCorta}</p>
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                              No hay información médica registrada para este estudiante.
                            </div>
                          )}
                        </div>
                      </section>
                    </div>
                ) : activeTab === 'admin' ? (
                    <div className="space-y-6">
                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                        <StudentMeta label="Fecha de nacimiento" value={formatDate(selectedSummary.fechaNacimiento)} />
                        <StudentMeta label="Teléfono" value={selectedSummary.telefono ?? 'No registrado'} />
                        <StudentMeta label="Correo" value={selectedSummary.correo ?? 'No registrado'} />
                        <StudentMeta label="Persona" value={selectedSummary.personaId ? `#${selectedSummary.personaId}` : 'Sin persona'} />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <section className="rounded-2xl border border-slate-200 bg-white p-4">
                          <SectionTitle title="Tutores / Padres" subtitle="Relaciones registradas para este estudiante" />
                          <div className="mt-4 space-y-3">
                            {selectedSummary.tutores.length > 0 ? (
                              selectedSummary.tutores.map((tutor) => (
                                <article key={tutor.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
                                  <div className="flex items-start gap-3">
                                    <div className="rounded-2xl bg-teal-50 p-3 text-teal-700">
                                      <Users className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold text-slate-900">
                                        {tutor.nombre ?? 'Sin nombre'} {tutor.apellido ?? ''}
                                      </p>
                                      <div className="mt-2 grid gap-2 text-sm text-slate-600">
                                        <p className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" />{tutor.correo ?? 'Sin correo'}</p>
                                        <p className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" />{tutor.telefono ?? 'Sin teléfono'}</p>
                                      </div>
                                    </div>
                                    {canEditStudentNotes && activeTab === 'admin' ? (
                                      <button
                                        type="button"
                                        onClick={() => setTutorToUnlink(tutor.id)}
                                        title="Desvincular tutor"
                                        className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    ) : null}
                                  </div>
                                </article>
                              ))
                            ) : (
                              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                                No hay tutores vinculados.
                              </div>
                            )}
                          </div>
                        </section>

                        <section className="space-y-4">
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <SectionTitle title="Editar notas médicas" subtitle="Alergias graves y observación médica (visible para docentes)" />
                            <div className="mt-4 grid gap-3">
                              <textarea
                                value={studentAlergiasDraft}
                                onChange={(event) => setStudentAlergiasDraft(event.target.value)}
                                rows={2}
                                placeholder="Ej. Alergia grave al maní / penicilina"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                              />
                              <textarea
                                value={studentObservacionDraft}
                                onChange={(event) => setStudentObservacionDraft(event.target.value)}
                                rows={4}
                                placeholder="Ej. Requiere supervisión al salir, avisar a tutor si presenta malestar..."
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                              />
                              <div className="flex items-center justify-end">
                                <button
                                  type="button"
                                  onClick={handleGuardarInformacionDocente}
                                  disabled={savingStudentDescription}
                                  className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
                                >
                                  {savingStudentDescription ? 'Guardando...' : 'Guardar notas médicas'}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <SectionTitle title="Gestionar tutores" subtitle="Asigna un tutor existente o crea uno nuevo" />
                            <div className="mt-4 flex items-center justify-start">
                              <button
                                type="button"
                                onClick={() => setIsTutorModalOpen(true)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 transition-colors"
                              >
                                <UserPlus className="h-4 w-4" />
                                Gestionar Tutor
                              </button>
                            </div>
                          </div>
                        </section>
                      </div>
                    </div>
                  ) : ( // Cierre de activeTab === 'admin'
                    <div className="space-y-6">
                      {canEditStudentNotes && (
                        <section className="rounded-2xl border border-slate-200 bg-white p-4">
                          <SectionTitle title="Subir nuevo documento" subtitle="Adjunta un archivo (PDF, JPG, PNG) al expediente del estudiante" />
                          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] items-end">
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-slate-600">Tipo de documento</label>
                              <select
                                value={selectedTipoDoc}
                                onChange={e => setSelectedTipoDoc(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                              >
                                <option value="">Seleccione un tipo</option>
                                {tiposDoc.map(t => (
                                  <option key={t.id} value={t.id}>{t.nombre} {t.obligatorio ? '(Obligatorio)' : ''}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-slate-600">Archivo</label>
                              <input
                                id="doc-file-input"
                                type="file"
                                accept=".pdf,image/*"
                                onChange={e => setDocFile(e.target.files?.[0] || null)}
                                className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-teal-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-teal-700 hover:file:bg-teal-100"
                              />
                            </div>
                            <button
                              onClick={handleUploadDocument}
                              disabled={isUploadingDoc || !docFile || !selectedTipoDoc}
                              className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 h-[38px] flex items-center justify-center min-w-[120px]"
                            >
                              {isUploadingDoc ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Subir archivo'}
                            </button>
                          </div>
                        </section>
                      )}

                      <section className="rounded-2xl border border-slate-200 bg-white p-4">
                        <SectionTitle title="Documentos adjuntos" subtitle="Archivos guardados en el expediente" />
                        {loadingDocs ? (
                          <div className="mt-4 py-8 text-center text-sm text-slate-500"><LoaderCircle className="mx-auto h-5 w-5 animate-spin" /></div>
                        ) : documentos.length > 0 ? (
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {documentos.map(doc => (
                              <article key={doc.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 shadow-sm">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                                    <FileText className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate font-semibold text-slate-900">{doc.tipoDocumentoNombre}</p>
                                    <p className="text-xs text-slate-500">Subido el {formatDate(doc.fechaRegistro)}</p>
                                  </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <button onClick={() => setPreviewDoc(doc)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 transition-colors">
                                    Ver
                                  </button>
                                  {canEditStudentNotes && (
                                    <button onClick={() => handleDeleteDocument(doc.id)} className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 transition-colors" title="Eliminar documento">
                                      <X className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </article>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                            No hay documentos adjuntos.
                          </div>
                        )}
                      </section>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                  No se pudo cargar la información del estudiante.
                </div>
              )}
            </div>
          </div>
        </div>
      , document.body) : null}

      {selectedSummary && isTutorModalOpen ? (
        <TutorManagementModal
          tutoresDisponibles={tutoresDisponibles}
          estudianteNombre={`${selectedSummary.nombre ?? ''} ${selectedSummary.apellido ?? ''}`.trim()}
          onClose={() => setIsTutorModalOpen(false)}
          onVincular={handleVincularTutor}
          onCreateVincular={handleCrearYVincularTutor}
        />
      ) : null}

      {tutorToUnlink !== null ? createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => !isUnlinking && setTutorToUnlink(null)} 
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">Desvincular Tutor</h3>
            <p className="mt-2 text-sm text-slate-600">
              ¿Estás seguro de que deseas desvincular a este tutor del estudiante <strong>{selectedSummary?.nombre} {selectedSummary?.apellido}</strong>? Esta acción se puede deshacer volviendo a vincularlo en el futuro.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setTutorToUnlink(null)}
                disabled={isUnlinking}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDesvincularTutor}
                disabled={isUnlinking}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                {isUnlinking ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                Desvincular
              </button>
            </div>
          </div>
        </div>
      , document.body) : null}

      {previewDoc ? createPortal(
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Vista de documento</p>
                <p className="text-xs text-slate-500">{previewDoc.tipoDocumentoNombre}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDocUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 ${!previewDocUrl ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <ExternalLink className="mr-1 h-3.5 w-3.5" />
                  Abrir aparte
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[calc(90vh-64px)] overflow-auto bg-slate-50 p-3">
              {previewDocLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <LoaderCircle className="mb-2 h-8 w-8 animate-spin" />
                  <p className="text-sm">Cargando documento...</p>
                </div>
              ) : previewDocUrl ? (
                <>
                  {isImageDoc(previewDoc.rutaArchivo) ? (
                    <img src={previewDocUrl} alt={previewDoc.tipoDocumentoNombre} className="mx-auto max-h-[75vh] rounded-lg border border-slate-200 object-contain" />
                  ) : null}
                  {isPdfDoc(previewDoc.rutaArchivo) ? (
                    <iframe src={previewDocUrl} title={previewDoc.tipoDocumentoNombre} className="h-[75vh] w-full rounded-lg border border-slate-200 bg-white" />
                  ) : null}
                  {!isImageDoc(previewDoc.rutaArchivo) && !isPdfDoc(previewDoc.rutaArchivo) ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">No se puede previsualizar este formato aquí. Usa "Abrir aparte".</div>
                  ) : null}
                </>
              ) : (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-10 text-center text-rose-800">
                  <p className="font-semibold text-lg">No tiene documento</p>
                  <p className="mt-1 text-sm">El archivo no se encontró en el servidor o no tienes permisos para verlo.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      , document.body) : null}
    </section>
  )
}