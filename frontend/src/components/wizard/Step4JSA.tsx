import { AlertTriangle, Plus, Trash2 } from "lucide-react";


export function Step4JSA({ data, updateData }: { data: any, updateData: any }) {
  
  const addJsaRow = () => {
    updateData({ 
      jsa: [...data.jsa, { 
        id: Date.now(), 
        tahapan: "", 
        peralatan: "", 
        potensi: "", 
        pengendalian: "",
        tanggapDarurat: "" 
      }] 
    });
  };

  const removeJsaRow = (id: number) => {
    updateData({
      jsa: data.jsa.filter((j: any) => j.id !== id)
    });
  };

  const updateJsaRow = (id: number, field: string, value: string) => {
    updateData({
      jsa: data.jsa.map((j: any) => j.id === id ? { ...j, [field]: value } : j)
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start gap-4 mb-6 bg-warning-container/30 p-4 rounded-xl border border-warning-container">
        <div className="p-2 bg-warning-container text-on-warning-container rounded-lg">
          <AlertTriangle size={24} />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Job Safety Analysis (JSA)</h3>
              <p className="text-sm text-gray-600">Identifikasi seluruh tahapan pekerjaan, potensi bahaya, dan langkah mitigasi.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div id="jsa-section" className="hidden lg:block overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-10 text-center">No</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[200px]">Tahapan Pekerjaan</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[150px]">Mesin / Peralatan</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[200px]">Potensi Bahaya/Resiko</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[200px]">Pengendalian Bahaya</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[200px]">Tanggap Darurat</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {data.jsa.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  Belum ada data JSA.
                </td>
              </tr>
            ) : (
              data.jsa.map((j: any, idx: number) => (
                <tr key={j.id} className="hover:bg-gray-50/50">
                  <td className="px-2 py-3 text-sm text-gray-500 text-center align-top pt-5">{idx + 1}</td>
                  <td className="px-2 py-2 align-top">
                    <textarea id={`jsa-tahapan-${idx}`} rows={3} value={j.tahapan} onChange={(e) => updateJsaRow(j.id, 'tahapan', e.target.value)} className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:ring-1 focus:ring-primary resize-none" placeholder="Uraian langkah kerja..." />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <textarea rows={3} value={j.peralatan} onChange={(e) => updateJsaRow(j.id, 'peralatan', e.target.value)} className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:ring-1 focus:ring-primary resize-none" placeholder="Alat..." />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <textarea rows={3} value={j.potensi} onChange={(e) => updateJsaRow(j.id, 'potensi', e.target.value)} className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:ring-1 focus:ring-primary resize-none" placeholder="Bahaya yang mungkin timbul..." />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <textarea rows={3} value={j.pengendalian} onChange={(e) => updateJsaRow(j.id, 'pengendalian', e.target.value)} className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:ring-1 focus:ring-primary resize-none" placeholder="Tindakan pencegahan..." />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <textarea rows={3} value={j.tanggapDarurat} onChange={(e) => updateJsaRow(j.id, 'tanggapDarurat', e.target.value)} className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:ring-1 focus:ring-primary resize-none" placeholder="Jika terjadi insiden..." />
                  </td>
                  <td className="px-2 py-2 align-top pt-4 text-center">
                    <button onClick={() => removeJsaRow(j.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Card Layout */}
      <div className="lg:hidden space-y-4">
        {data.jsa.length === 0 && (
          <div className="p-8 text-center text-gray-500 border border-gray-200 border-dashed rounded-xl">
            Belum ada data JSA.
          </div>
        )}
        {data.jsa.map((j: any, idx: number) => (
          <div key={j.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="font-bold text-gray-900 text-sm">Langkah #{idx + 1}</h4>
              <button onClick={() => removeJsaRow(j.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Tahapan Pekerjaan</label>
              <textarea rows={2} value={j.tahapan} onChange={(e) => updateJsaRow(j.id, 'tahapan', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Mesin / Peralatan</label>
              <input type="text" value={j.peralatan} onChange={(e) => updateJsaRow(j.id, 'peralatan', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Potensi Bahaya / Resiko</label>
              <textarea rows={2} value={j.potensi} onChange={(e) => updateJsaRow(j.id, 'potensi', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Pengendalian Bahaya</label>
              <textarea rows={2} value={j.pengendalian} onChange={(e) => updateJsaRow(j.id, 'pengendalian', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Tanggap Darurat / Evakuasi</label>
              <textarea rows={2} value={j.tanggapDarurat} onChange={(e) => updateJsaRow(j.id, 'tanggapDarurat', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-primary" />
            </div>
          </div>
        ))}
      </div>

      {/* Unified Add JSA Button at bottom */}
      <div className="pt-4 flex justify-end">
        <button 
          onClick={addJsaRow}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-medium hover:opacity-90 transition-colors shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus size={16} />
          Tambah JSA
        </button>
      </div>

    </div>
  );
}
