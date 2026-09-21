import { useState, useEffect } from "react";
import { Users, Plus, Trash2, UploadCloud, CheckCircle2, Eye, X, Image as ImageIcon } from "lucide-react";

export function Step3TenagaKerja({ data, updateData }: { data: any, updateData: any }) {
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  // Sinkronisasi otomatis: memastikan jumlah baris pekerja selalu sesuai dengan 'totalTenagaKerja' dari Step 1
  useEffect(() => {
    const rawVal = data.totalTenagaKerja;
    // Jika nilai kosong (misal pengguna sedang menghapus untuk mengetik angka baru), jangan timpa
    if (rawVal === "" || rawVal === undefined || rawVal === null) {
      return;
    }
    const parsed = parseInt(String(rawVal), 10);
    if (isNaN(parsed) || parsed < 1) {
      return;
    }
    const targetCount = parsed;
    const current = data.pekerja || [];
    if (current.length !== targetCount) {
      if (current.length < targetCount) {
        const additions = Array.from(
          { length: targetCount - current.length },
          (_, i) => ({
            id: Date.now() + Math.floor(Math.random() * 1000) + current.length + i + 1,
            nama: "",
            jabatan: "",
            alamat: "",
            id_card_photo: null,
            photoName: ""
          })
        );
        updateData({
          pekerja: [...current, ...additions]
        });
      } else {
        updateData({
          pekerja: current.slice(0, targetCount)
        });
      }
    }
  }, [data.totalTenagaKerja]);
  
  const addWorker = () => {
    const newWorkers = [
      ...data.pekerja, 
      { id: Date.now() + Math.floor(Math.random() * 1000), nama: "", jabatan: "", alamat: "", id_card_photo: null, photoName: "" }
    ];
    updateData({ 
      pekerja: newWorkers,
      totalTenagaKerja: String(newWorkers.length)
    });
  };

  const removeWorker = (id: number) => {
    if (data.pekerja.length <= 1) {
      alert("Minimal harus ada 1 tenaga kerja.");
      return;
    }
    const newWorkers = data.pekerja.filter((p: any) => p.id !== id);
    updateData({
      pekerja: newWorkers,
      totalTenagaKerja: String(newWorkers.length)
    });
  };

  const updateWorker = (id: number, field: string, value: any) => {
    updateData({
      pekerja: data.pekerja.map((p: any) => p.id === id ? { ...p, [field]: value } : p)
    });
  };

  const handleFileUpload = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Maksimal 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      updateData({
        pekerja: data.pekerja.map((p: any) => 
          p.id === id ? { ...p, id_card_photo: result, photoName: file.name } : p
        )
      });
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (id: number) => {
    updateData({
      pekerja: data.pekerja.map((p: any) => 
        p.id === id ? { ...p, id_card_photo: null, photoName: "" } : p
      )
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-blue-50/60 p-4 rounded-xl border border-blue-100">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Data Tenaga Kerja</h3>
            <p className="text-sm text-gray-500">Penting: Seluruh personel yang terlibat dalam pekerjaan ini WAJIB didaftarkan beserta foto KTP / Kartu Identitas.</p>
          </div>
        </div>

        {/* Counter Badge & Quick Controls */}
        <div className="flex items-center gap-3 self-start sm:self-center bg-white px-3.5 py-2 rounded-xl border border-blue-200 shadow-sm shrink-0">
          <div className="text-xs">
            <span className="text-gray-500 block">Total Tenaga Kerja:</span>
            <span className="font-bold text-blue-900 text-sm">{data.pekerja?.length || 0} Orang</span>
          </div>
          <div className="flex items-center gap-1 border-l border-gray-200 pl-3">
            <button
              type="button"
              disabled={data.pekerja.length <= 1}
              onClick={() => {
                if (data.pekerja.length > 1) {
                  const newWorkers = data.pekerja.slice(0, data.pekerja.length - 1);
                  updateData({ pekerja: newWorkers, totalTenagaKerja: String(newWorkers.length) });
                }
              }}
              className="w-7 h-7 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-gray-700 transition-colors cursor-pointer"
              title="Kurangi 1 Baris Pekerja"
            >
              -
            </button>
            <button
              type="button"
              disabled={data.pekerja.length >= 50}
              onClick={addWorker}
              className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center font-bold transition-colors shadow-sm cursor-pointer"
              title="Tambah 1 Baris Pekerja"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Table (Desktop) */}
      <div id="workers-section" className="hidden sm:block overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-12 text-center">No</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Lengkap</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Jabatan</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Alamat</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-56 text-center">ID Card / Foto</th>
              <th className="px-4 py-3 w-14"></th>
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
                  <td className="px-4 py-3 text-sm text-gray-500 text-center font-medium">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <input 
                      id={`pekerja-nama-${idx}`}
                      type="text" 
                      required
                      value={p.nama} 
                      onChange={(e) => updateWorker(p.id, 'nama', e.target.value)} 
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                      placeholder={`Nama pekerja #${idx + 1}...`} 
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      id={`pekerja-jabatan-${idx}`}
                      type="text" 
                      required
                      value={p.jabatan} 
                      onChange={(e) => updateWorker(p.id, 'jabatan', e.target.value)} 
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                      placeholder={`Jabatan pekerja #${idx + 1}...`} 
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="text" 
                      value={p.alamat} 
                      onChange={(e) => updateWorker(p.id, 'alamat', e.target.value)} 
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                      placeholder="Alamat domisili..." 
                    />
                  </td>
                  <td className="px-4 py-3">
                    {p.id_card_photo ? (
                      <div className="flex items-center justify-between gap-2 p-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="flex items-center gap-2 overflow-hidden">
                          {p.id_card_photo.startsWith("data:image") ? (
                            <img 
                              src={p.id_card_photo} 
                              alt="Foto" 
                              onClick={() => setPreviewModalImg(p.id_card_photo)}
                              className="w-8 h-8 rounded object-cover border border-emerald-300 cursor-pointer shrink-0 hover:opacity-80 transition-opacity" 
                              title="Klik untuk melihat foto penuh"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                              <ImageIcon size={16} />
                            </div>
                          )}
                          <div className="text-left overflow-hidden">
                            <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 size={11} className="text-emerald-600" /> Terunggah
                            </span>
                            <span className="text-[10px] text-gray-500 truncate block max-w-[100px]">
                              {p.photoName || "Foto Identitas"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {p.id_card_photo.startsWith("data:image") && (
                            <button
                              type="button"
                              onClick={() => setPreviewModalImg(p.id_card_photo)}
                              className="p-1 text-emerald-700 hover:text-emerald-900 rounded"
                              title="Lihat Foto"
                            >
                              <Eye size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removePhoto(p.id)}
                            className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50"
                            title="Hapus / Ganti Foto"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors border border-blue-200 shadow-sm">
                        <UploadCloud size={14} />
                        <span>Upload Foto</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*,.pdf" 
                          onChange={(e) => handleFileUpload(p.id, e)} 
                        />
                      </label>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      type="button"
                      onClick={() => removeWorker(p.id)} 
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Baris"
                    >
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
          <div className="p-8 text-center text-gray-500 border border-gray-200 border-dashed rounded-xl bg-white">
            Belum ada data pekerja. Klik tombol di bawah untuk menambahkan.
          </div>
        )}
        {data.pekerja.map((p: any, idx: number) => (
          <div key={p.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative space-y-3">
            <div className="absolute top-4 right-4 flex items-center gap-2">
               <button 
                 type="button"
                 onClick={() => removeWorker(p.id)} 
                 className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                 title="Hapus"
               >
                 <Trash2 size={16} />
               </button>
            </div>
            <h4 className="font-bold text-gray-900 text-sm">Pekerja #{idx + 1}</h4>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Nama Lengkap *</label>
              <input 
                type="text" 
                required
                value={p.nama} 
                onChange={(e) => updateWorker(p.id, 'nama', e.target.value)} 
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Jabatan *</label>
              <input 
                type="text" 
                required
                value={p.jabatan} 
                onChange={(e) => updateWorker(p.id, 'jabatan', e.target.value)} 
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Alamat</label>
              <input 
                type="text" 
                value={p.alamat} 
                onChange={(e) => updateWorker(p.id, 'alamat', e.target.value)} 
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
            <div className="pt-2">
              {p.id_card_photo ? (
                <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    {p.id_card_photo.startsWith("data:image") && (
                      <img 
                        src={p.id_card_photo} 
                        alt="Foto" 
                        className="w-10 h-10 rounded object-cover border border-emerald-300" 
                      />
                    )}
                    <div>
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 size={13} className="text-emerald-600" /> Foto Terunggah
                      </span>
                      <span className="text-[11px] text-gray-500 truncate block max-w-[180px]">
                        {p.photoName || "Foto Identitas"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhoto(p.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                    title="Hapus"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 w-full p-2.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg border border-blue-200 border-dashed hover:bg-blue-100 transition-colors cursor-pointer">
                  <UploadCloud size={18} />
                  <span>Upload Foto / Kartu Identitas</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*,.pdf" 
                    onChange={(e) => handleFileUpload(p.id, e)} 
                  />
                </label>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Information & Add Worker Button */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600 bg-blue-50/50 p-4 rounded-xl border border-blue-200">
        <div className="flex items-center gap-2">
          <span className="text-base">ℹ️</span>
          <span>
            Baris data pekerja dibuat otomatis sesuai <strong>Total Tenaga Kerja ({data.pekerja?.length || 0} Orang)</strong>.
          </span>
        </div>
        <button 
          type="button"
          onClick={addWorker}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors shadow-sm w-full sm:w-auto justify-center cursor-pointer shrink-0"
        >
          <Plus size={14} />
          <span>Tambah Baris Pekerja</span>
        </button>
      </div>

      {/* Full Photo Preview Modal */}
      {previewModalImg && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setPreviewModalImg(null)}
        >
          <div 
            className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <h4 className="text-sm font-bold text-gray-800">Preview Foto / Kartu Identitas</h4>
              <button 
                type="button"
                onClick={() => setPreviewModalImg(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden max-h-[70vh]">
              <img src={previewModalImg} alt="Preview Identitas" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm" />
            </div>
            <div className="pt-3 text-right">
              <button 
                type="button"
                onClick={() => setPreviewModalImg(null)}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
