import { Users, Plus, Trash2, UploadCloud } from "lucide-react";


export function Step3TenagaKerja({ data, updateData }: { data: any, updateData: any }) {
  
  const addWorker = () => {
    updateData({ 
      pekerja: [...data.pekerja, { id: Date.now(), nama: "", jabatan: "", alamat: "", file: null }] 
    });
  };

  const removeWorker = (id: number) => {
    updateData({
      pekerja: data.pekerja.filter((p: any) => p.id !== id)
    });
  };

  const updateWorker = (id: number, field: string, value: any) => {
    updateData({
      pekerja: data.pekerja.map((p: any) => p.id === id ? { ...p, [field]: value } : p)
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start gap-4 mb-6 bg-primary-container/30 p-4 rounded-xl border border-primary-container">
        <div className="p-2 bg-primary-container text-on-primary-container rounded-lg">
          <Users size={24} />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Data Tenaga Kerja</h3>
              <p className="text-sm text-gray-500">Penting: Seluruh personel yang terlibat dalam pekerjaan ini WAJIB didaftarkan di sini.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table (Card fallback for mobile) */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-12 text-center">No</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Lengkap</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Jabatan</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Alamat</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-40 text-center">ID Card/Foto</th>
              <th className="px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {data.pekerja.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  Belum ada data pekerja. Klik "Tambah Pekerja" untuk memulai.
                </td>
              </tr>
            ) : (
              data.pekerja.map((p: any, idx: number) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-500 text-center">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <input type="text" value={p.nama} onChange={(e) => updateWorker(p.id, 'nama', e.target.value)} className="w-full px-3 py-1.5 rounded border border-gray-300 text-sm focus:ring-1 focus:ring-primary" placeholder="Nama..." />
                  </td>
                  <td className="px-4 py-3">
                    <input type="text" value={p.jabatan} onChange={(e) => updateWorker(p.id, 'jabatan', e.target.value)} className="w-full px-3 py-1.5 rounded border border-gray-300 text-sm focus:ring-1 focus:ring-primary" placeholder="Jabatan..." />
                  </td>
                  <td className="px-4 py-3">
                    <input type="text" value={p.alamat} onChange={(e) => updateWorker(p.id, 'alamat', e.target.value)} className="w-full px-3 py-1.5 rounded border border-gray-300 text-sm focus:ring-1 focus:ring-primary" placeholder="Alamat..." />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <label className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-container text-on-primary-container text-xs font-medium rounded cursor-pointer hover:opacity-90 border border-primary-container">
                      <UploadCloud size={14} /> Upload
                      <input type="file" className="hidden" accept="image/*,.pdf" />
                    </label>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => removeWorker(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="sm:hidden space-y-4">
        {data.pekerja.length === 0 && (
          <div className="p-8 text-center text-gray-500 border border-gray-200 border-dashed rounded-xl">
            Belum ada data pekerja.
          </div>
        )}
        {data.pekerja.map((p: any, idx: number) => (
          <div key={p.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative space-y-3">
            <div className="absolute top-4 right-4 flex items-center gap-2">
               <button onClick={() => removeWorker(p.id)} className="p-2 text-red-500 bg-red-50 rounded-lg">
                 <Trash2 size={16} />
               </button>
            </div>
            <h4 className="font-bold text-gray-900 text-sm">Pekerja #{idx + 1}</h4>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Nama Lengkap</label>
              <input type="text" value={p.nama} onChange={(e) => updateWorker(p.id, 'nama', e.target.value)} className="w-full px-3 py-2 rounded border border-gray-300 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Jabatan</label>
              <input type="text" value={p.jabatan} onChange={(e) => updateWorker(p.id, 'jabatan', e.target.value)} className="w-full px-3 py-2 rounded border border-gray-300 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Alamat</label>
              <input type="text" value={p.alamat} onChange={(e) => updateWorker(p.id, 'alamat', e.target.value)} className="w-full px-3 py-2 rounded border border-gray-300 text-sm" />
            </div>
            <div className="pt-2">
              <label className="flex items-center justify-center gap-2 w-full p-2 bg-primary-container text-on-primary-container text-sm font-medium rounded-lg border border-primary-container border-dashed hover:opacity-90 cursor-pointer">
                <UploadCloud size={16} /> Upload ID Card
                <input type="file" className="hidden" accept="image/*,.pdf" />
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Unified Add Worker Button at bottom */}
      <div className="pt-4 flex justify-end">
        <button 
          onClick={addWorker}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-medium hover:opacity-90 transition-colors shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus size={16} />
          Tambah Pekerja
        </button>
      </div>

    </div>
  );
}
