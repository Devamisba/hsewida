import { useEffect } from "react";
import { AlertTriangle, Plus, Trash2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const createEmptyJsaRow = (idx: number = 1) => ({
  id: Date.now() + Math.floor(Math.random() * 1000) + idx,
  tahapan: "",
  peralatan: "",
  potensi: "",
  pengendalian: "",
  tanggapDarurat: "",
});

export function Step4JSA({ data, updateData }: { data: any, updateData: any }) {
  // Pastikan saat masuk ke Step 4, minimal ada 1 baris tahapan JSA otomatis siap diisi
  useEffect(() => {
    if (!data.jsa || data.jsa.length === 0) {
      updateData({
        jsa: [createEmptyJsaRow(1)],
      });
    }
  }, [data.jsa]);

  const addJsaRow = () => {
    const nextIdx = (data.jsa?.length || 0) + 1;
    updateData({ 
      jsa: [...(data.jsa || []), createEmptyJsaRow(nextIdx)] 
    });
  };

  const removeJsaRow = (id: number) => {
    if ((data.jsa?.length || 0) <= 1) {
      alert("Job Safety Analysis (JSA) wajib diisi minimal 1 tahapan kerja dan tidak dapat dihapus.");
      return;
    }
    updateData({
      jsa: data.jsa.filter((j: any) => j.id !== id)
    });
  };

  const updateJsaRow = (id: number, field: string, value: string) => {
    updateData({
      jsa: (data.jsa || []).map((j: any) => j.id === id ? { ...j, [field]: value } : j)
    });
  };

  const jsaList = data.jsa || [];

  return (
    <div id="jsa-section" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Banner Peringatan K3: JSA Wajib Diisi */}
      <div className="flex items-start gap-4 mb-6 bg-amber-50/80 p-4 sm:p-5 rounded-xl border border-amber-200 shadow-xs">
        <div className="p-2.5 bg-amber-100 text-amber-800 rounded-lg shrink-0">
          <AlertTriangle size={24} />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900">Job Safety Analysis (JSA)</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
              Wajib Diisi (Min. 1 Tahapan) *
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Identifikasi seluruh tahapan pekerjaan, potensi bahaya, dan langkah mitigasi keselamatan kerja. Minimal 1 baris tahapan kerja wajib diisi lengkap.
          </p>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-gray-200 shadow-2xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/90 border-b border-gray-200">
              <th className="px-3 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider w-12 text-center">No</th>
              <th className="px-3 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[200px]">
                Tahapan Pekerjaan <span className="text-rose-600">*</span>
              </th>
              <th className="px-3 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[150px]">
                Mesin / Peralatan
              </th>
              <th className="px-3 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[200px]">
                Potensi Bahaya/Risiko <span className="text-rose-600">*</span>
              </th>
              <th className="px-3 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[200px]">
                Pengendalian Bahaya <span className="text-rose-600">*</span>
              </th>
              <th className="px-3 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[200px]">
                Tanggap Darurat <span className="text-rose-600">*</span>
              </th>
              <th className="px-3 py-3 w-12 text-center text-xs font-bold text-gray-500">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {jsaList.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  <p className="font-semibold text-gray-700 mb-1">Belum ada baris JSA.</p>
                  <p className="text-xs text-gray-500 mb-3">Klik tombol &ldquo;Tambah JSA&rdquo; di bawah untuk menambahkan langkah kerja.</p>
                  <button
                    type="button"
                    onClick={addJsaRow}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 cursor-pointer"
                  >
                    <Plus size={14} /> Tambah Baris JSA
                  </button>
                </td>
              </tr>
            ) : (
              jsaList.map((j: any, idx: number) => (
                <tr key={j.id} className="hover:bg-gray-50/50">
                  <td className="px-2 py-3 text-sm text-gray-500 text-center align-top pt-5 font-bold">{idx + 1}</td>
                  <td className="px-2 py-2 align-top">
                    <textarea 
                      id={`jsa-tahapan-${idx}`} 
                      rows={3} 
                      value={j.tahapan} 
                      onChange={(e) => updateJsaRow(j.id, 'tahapan', e.target.value)} 
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-all" 
                      placeholder="Uraian langkah kerja... *" 
                    />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <textarea 
                      id={`jsa-peralatan-${idx}`} 
                      rows={3} 
                      value={j.peralatan} 
                      onChange={(e) => updateJsaRow(j.id, 'peralatan', e.target.value)} 
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-all" 
                      placeholder="Alat / mesin (opsional)..." 
                    />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <textarea 
                      id={`jsa-potensi-${idx}`} 
                      rows={3} 
                      value={j.potensi} 
                      onChange={(e) => updateJsaRow(j.id, 'potensi', e.target.value)} 
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-all" 
                      placeholder="Bahaya yang mungkin timbul... *" 
                    />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <textarea 
                      id={`jsa-pengendalian-${idx}`} 
                      rows={3} 
                      value={j.pengendalian} 
                      onChange={(e) => updateJsaRow(j.id, 'pengendalian', e.target.value)} 
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-all" 
                      placeholder="Tindakan pencegahan... *" 
                    />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <textarea 
                      id={`jsa-tanggapDarurat-${idx}`} 
                      rows={3} 
                      value={j.tanggapDarurat} 
                      onChange={(e) => updateJsaRow(j.id, 'tanggapDarurat', e.target.value)} 
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-all" 
                      placeholder="Jika terjadi insiden... *" 
                    />
                  </td>
                  <td className="px-2 py-2 align-top pt-4 text-center">
                    <button 
                      type="button"
                      onClick={() => removeJsaRow(j.id)} 
                      disabled={jsaList.length <= 1}
                      title={jsaList.length <= 1 ? "Minimal 1 baris JSA wajib ada" : "Hapus tahapan JSA"}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        jsaList.length <= 1 
                          ? "text-gray-300 cursor-not-allowed opacity-50" 
                          : "text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      )}
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

      {/* Mobile/Tablet Card Layout */}
      <div className="lg:hidden space-y-4">
        {jsaList.length === 0 && (
          <div className="p-6 text-center text-gray-500 border border-gray-200 border-dashed rounded-xl bg-gray-50">
            <p className="font-semibold text-gray-700 mb-1">Belum ada data JSA.</p>
            <p className="text-xs text-gray-500 mb-3">Minimal 1 baris tahapan kerja wajib diisi.</p>
            <button
              type="button"
              onClick={addJsaRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 cursor-pointer"
            >
              <Plus size={14} /> Tambah Baris JSA
            </button>
          </div>
        )}
        {jsaList.map((j: any, idx: number) => (
          <div key={j.id} className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-xs relative space-y-3.5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                Tahapan Kerja #{idx + 1}
              </h4>
              <button 
                type="button"
                onClick={() => removeJsaRow(j.id)} 
                disabled={jsaList.length <= 1}
                title={jsaList.length <= 1 ? "Minimal 1 baris JSA wajib ada" : "Hapus tahapan"}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  jsaList.length <= 1
                    ? "text-gray-300 cursor-not-allowed opacity-50"
                    : "text-red-500 hover:bg-red-50 cursor-pointer"
                )}
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                Tahapan Pekerjaan <span className="text-rose-600">*</span>
              </label>
              <textarea 
                id={`jsa-tahapan-${idx}-mobile`} 
                rows={2} 
                value={j.tahapan} 
                onChange={(e) => updateJsaRow(j.id, 'tahapan', e.target.value)} 
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary" 
                placeholder="Uraian langkah kerja... *" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Mesin / Peralatan</label>
              <input 
                id={`jsa-peralatan-${idx}-mobile`} 
                type="text" 
                value={j.peralatan} 
                onChange={(e) => updateJsaRow(j.id, 'peralatan', e.target.value)} 
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary" 
                placeholder="Alat / mesin (opsional)..." 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                Potensi Bahaya / Risiko <span className="text-rose-600">*</span>
              </label>
              <textarea 
                id={`jsa-potensi-${idx}-mobile`} 
                rows={2} 
                value={j.potensi} 
                onChange={(e) => updateJsaRow(j.id, 'potensi', e.target.value)} 
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary" 
                placeholder="Bahaya yang mungkin timbul... *" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                Pengendalian Bahaya <span className="text-rose-600">*</span>
              </label>
              <textarea 
                id={`jsa-pengendalian-${idx}-mobile`} 
                rows={2} 
                value={j.pengendalian} 
                onChange={(e) => updateJsaRow(j.id, 'pengendalian', e.target.value)} 
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary" 
                placeholder="Tindakan pencegahan... *" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                Tanggap Darurat / Evakuasi <span className="text-rose-600">*</span>
              </label>
              <textarea 
                id={`jsa-tanggapDarurat-${idx}-mobile`} 
                rows={2} 
                value={j.tanggapDarurat} 
                onChange={(e) => updateJsaRow(j.id, 'tanggapDarurat', e.target.value)} 
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary" 
                placeholder="Jika terjadi insiden... *" 
              />
            </div>
          </div>
        ))}
      </div>

      {/* Unified Add JSA Button at bottom */}
      <div className="pt-2 flex justify-end">
        <button 
          type="button"
          onClick={addJsaRow}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm w-full sm:w-auto justify-center cursor-pointer active:scale-98"
        >
          <Plus size={16} />
          Tambah Baris JSA
        </button>
      </div>

      {/* Pernyataan & Disclaimer Keselamatan (K3) Pemohon (Wajib Dicentang) */}
      <div className="pt-6 border-t border-gray-200">
        <label className="flex items-start gap-3.5 p-4 sm:p-5 rounded-xl border-2 border-blue-200 bg-blue-50/70 hover:border-blue-300 transition-colors cursor-pointer select-none">
          <input
            type="checkbox"
            id="contractor-disclaimer-checkbox"
            checked={Boolean(data.disclaimerAccepted)}
            onChange={(e) => updateData({ disclaimerAccepted: e.target.checked })}
            className="w-4 h-4 mt-1 text-primary border-blue-300 rounded focus:ring-primary cursor-pointer shrink-0"
          />
          <div className="text-xs text-slate-800 leading-relaxed">
            <strong className="block text-blue-900 mb-1 text-sm font-bold flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-blue-700 shrink-0" />
              Pernyataan &amp; Disclaimer Keselamatan Kerja (K3) Pemohon (Wajib Dicentang)
            </strong>
            Saya menyatakan dengan sadar dan bertanggung jawab bahwa seluruh informasi, identifikasi potensi bahaya pekerjaan (Job Safety Analysis / JSA), data personel tenaga kerja, serta kelengkapan Alat Pelindung Diri (APD) yang diajukan dalam formulir ini telah sesuai dengan kondisi aktual di lapangan. Seluruh pekerja bersedia mematuhi Standard Operating Procedure (SOP) dan peraturan K3 PT Widatra Bhakti.
          </div>
        </label>
      </div>

    </div>
  );
}
