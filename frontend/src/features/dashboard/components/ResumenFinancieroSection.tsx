function formatMoney(value?: number | null) {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' }).format(Number.isFinite(amount) ? amount : 0)
}

export type ResumenFinancieroData = {
  validTaller: any[]
  validMatricula: any[]
  validMensualidad: any[]
  totalTaller: number
  totalMatricula: number
  totalMensualidad: number
  cantidadAnulados: number
  totalAnulado: number
  combined: any[]
  total: number
}

type ResumenFinancieroSectionProps = {
  data: ResumenFinancieroData
}

export function ResumenFinancieroSection({ data }: ResumenFinancieroSectionProps) {
  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Resumen Financiero</p>
      <p className="mt-1 text-sm text-slate-600">Ingresos generales según el periodo seleccionado.</p>
      
      <div className="mt-4 flex-1 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-white text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Concepto</th>
              <th className="px-4 py-3 text-right font-semibold">Pagos</th>
              <th className="px-4 py-3 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="px-4 py-3">Talleres</td>
              <td className="px-4 py-3 text-right">{data.validTaller.length}</td>
              <td className="px-4 py-3 text-right font-medium">{formatMoney(data.totalTaller)}</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Matrícula</td>
              <td className="px-4 py-3 text-right">{data.validMatricula.length}</td>
              <td className="px-4 py-3 text-right font-medium">{formatMoney(data.totalMatricula)}</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Mensualidad</td>
              <td className="px-4 py-3 text-right">{data.validMensualidad.length}</td>
              <td className="px-4 py-3 text-right font-medium">{formatMoney(data.totalMensualidad)}</td>
            </tr>
            <tr className="bg-slate-50 text-rose-700">
              <td className="px-4 py-3">Anulaciones</td>
              <td className="px-4 py-3 text-right">{data.cantidadAnulados}</td>
              <td className="px-4 py-3 text-right font-medium">-{formatMoney(data.totalAnulado)}</td>
            </tr>
            <tr className="bg-white font-semibold text-slate-900">
              <td className="px-4 py-3">TOTAL NETO</td>
              <td className="px-4 py-3 text-right">{data.combined.length}</td>
              <td className="px-4 py-3 text-right text-teal-700">{formatMoney(data.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  )
}