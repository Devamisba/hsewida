import { useState } from "react";
import { X, CheckCircle2, XCircle, AlertTriangle, User, History, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";

interface InspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  type: string;
  onSuccess?: () => void;
}

export function InspectionModal({ isOpen, onClose, item, type, onSuccess }: InspectionModalProps) {
  const [step, setStep] = useState<"detail" | "inspect" | "finding" | "capa" | "done">("detail");
  const [isPass, setIsPass] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [findingNotes, setFindingNotes] = useState("");
  const [actionPlan, setActionPlan] = useState("");
  const [pic, setPic] = useState("Tim Maintenance / GA");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  if (!isOpen || !item) return null;

  const handleStart = () => {
    setError("");
    setStep("inspect");
  };

  const toggleCheck = (check: string) => {
    setCheckedItems(prev => ({ ...prev, [check]: !prev[check] }));
  };

  const handlePass = async () => {
    setSubmitting(true);
    setError("");
    try {
      const checklist = getChecklistForType(type).map(check => ({
        item: check,
        passed: !!checkedItems[check] || true,
      }));

      const res = await api.submitInspection({
        facility_id: item.rawId,
        checklist_results: checklist,
        result_status: "Pass",
        notes: "Semua checklist terverifikasi baik dan aman.",
      });

      if (res.success) {
        setIsPass(true);
        setStep("done");
        onSuccess?.();
      } else {
        setError(res.message || "Gagal menyimpan hasil inspeksi.");
      }
    } catch (err: any) {
      setError(err.message || "Gagal menghubungi server.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFail = () => {
    setIsPass(false);
    setStep("finding");
  };

  const handleFindingSubmit = () => {
    if (!findingNotes.trim()) {
      setError("Catatan temuan wajib diisi.");
      return;
    }
    setError("");
    setStep("capa");
  };

  const handleCapaSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const checklist = getChecklistForType(type).map(check => ({
        item: check,
        passed: !!checkedItems[check],
      }));

      const res = await api.submitInspection({
        facility_id: item.rawId,
        checklist_results: checklist,
        result_status: "Fail",
        notes: findingNotes,
        finding_description: findingNotes,
        severity: "Mayor",
        action_plan: actionPlan || "Perbaikan fasilitas segera oleh PIC",
        pic_name: pic,
      });

      if (res.success) {
        setIsPass(false);
        setStep("done");
        onSuccess?.();
      } else {
        setError(res.message || "Gagal menyimpan tiket CAPA.");
      }
    } catch (err: any) {
      setError(err.message || "Gagal menghubungi server.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep("detail");
    setIsPass(null);
    setError("");
    setFindingNotes("");
    setActionPlan("");
    setCheckedItems({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Inspeksi {type}</h2>
            <p className="text-sm text-gray-500 mt-1">ID: <span className="font-semibold text-primary">{item.id}</span> • {item.lokasi}</p>
          </div>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-error-container/20 border border-error-container text-error rounded-lg flex items-center gap-2 text-xs font-semibold">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* Body */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          
          {step === "detail" && (
            <div className="space-y-6">
              <div className="bg-info-container/30 border border-info-container p-4 rounded-xl flex items-start gap-3">
                <History className="text-info mt-0.5" size={20} />
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Riwayat Terakhir</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Inspeksi terakhir: <span className="font-semibold">{item.maintenance || item.expired || "2026-08-20"}</span>. 
                    Status: <span className="font-semibold">{item.status || "Good"}</span>.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(item).filter(([key]) => key !== 'id' && key !== 'rawId' && key !== 'status').map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">{key}</p>
                    <p className="text-sm font-medium text-gray-900">{String(value)}</p>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button onClick={handleClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                <button onClick={handleStart} className="px-4 py-2 text-sm font-bold text-white bg-primary hover:opacity-90 rounded-lg flex items-center gap-2 shadow-sm">
                  Mulai Inspeksi <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === "inspect" && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-4">Checklist Pemeriksaan</h3>
                <div className="space-y-3">
                  {getChecklistForType(type).map((check, i) => (
                    <label key={i} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={!!checkedItems[check]}
                        onChange={() => toggleCheck(check)}
                        className="mt-0.5 w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" 
                      />
                      <span className="text-sm font-medium text-gray-700">{check}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button 
                  disabled={submitting}
                  onClick={handleFail} 
                  className="flex-1 px-4 py-3 text-sm font-bold text-error bg-error-container/30 border border-error-container hover:bg-error-container/50 rounded-lg flex justify-center items-center gap-2"
                >
                  <XCircle size={18} /> Ada Temuan (Fail)
                </button>
                <button 
                  disabled={submitting}
                  onClick={handlePass} 
                  className="flex-1 px-4 py-3 text-sm font-bold text-success bg-success-container/30 border border-success-container hover:bg-success-container/50 rounded-lg flex justify-center items-center gap-2"
                >
                  <CheckCircle2 size={18} /> {submitting ? "Menyimpan..." : "Kondisi Aman (Pass)"}
                </button>
              </div>
            </div>
          )}

          {step === "finding" && (
            <div className="space-y-5 animate-in slide-in-from-bottom-4">
              <div className="bg-error-container/20 text-error p-3 rounded-lg flex items-center gap-2 text-sm font-bold">
                <AlertTriangle size={18} /> Form Laporan Temuan Kritis
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan Temuan <span className="text-error">*</span></label>
                <textarea 
                  rows={3} 
                  value={findingNotes}
                  onChange={(e) => setFindingNotes(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                  placeholder="Deskripsikan kerusakan atau masalah yang ditemukan..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button onClick={() => setStep("inspect")} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Kembali</button>
                <button onClick={handleFindingSubmit} className="px-4 py-2 text-sm font-bold text-white bg-error hover:opacity-90 rounded-lg shadow-sm">
                  Lanjut ke Tindakan (CAPA)
                </button>
              </div>
            </div>
          )}

          {step === "capa" && (
            <div className="space-y-5 animate-in slide-in-from-right-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Corrective Action (Tindakan Perbaikan)</h3>
                <p className="text-xs text-gray-500 mb-4">Buat tiket perbaikan real untuk segera ditindaklanjuti.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tindakan yang Diperlukan</label>
                <textarea 
                  rows={2} 
                  value={actionPlan}
                  onChange={(e) => setActionPlan(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                  placeholder="Contoh: Segera ganti selang hydrant yang bocor / isi ulang tabung APAR..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Assign PIC (Penanggung Jawab)</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <select 
                    value={pic}
                    onChange={(e) => setPic(e.target.value)}
                    className="w-full pl-9 p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none bg-white"
                  >
                    <option value="Tim Maintenance / GA">Tim Maintenance / GA</option>
                    <option value="Vendor Eksternal APAR">Vendor Eksternal APAR</option>
                    <option value="Tim K3 / HSE">Tim K3 / HSE</option>
                    <option value="Tim Produksi">Tim Produksi</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button onClick={() => setStep("finding")} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Kembali</button>
                <button 
                  disabled={submitting}
                  onClick={handleCapaSubmit} 
                  className="px-4 py-2 text-sm font-bold text-white bg-primary hover:opacity-90 rounded-lg shadow-sm"
                >
                  {submitting ? "Menyimpan..." : "Submit Laporan & Tiket"}
                </button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="py-8 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
              <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg", isPass ? "bg-success text-white" : "bg-warning text-white")}>
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Inspeksi Berhasil Disimpan di Database</h3>
              <p className="text-sm text-gray-500 max-w-sm mb-6">
                {isPass 
                  ? "Peralatan dalam kondisi baik dan status fasilitas berhasil diperbarui menjadi Aman." 
                  : "Laporan temuan dan tiket perbaikan (CAPA) tersimpan secara real di database."}
              </p>
              <button onClick={handleClose} className="px-6 py-2.5 text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 rounded-lg shadow-sm">
                Selesai & Tutup
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function getChecklistForType(type: string) {
  switch (type) {
    case 'APAR':
      return ['Check Pressure', 'Check Seal', 'Check Pin', 'Check Hose', 'Check Nozzle', 'Check Body', 'Check Expiry', 'Check Signage', 'Check Accessibility'];
    case 'Hydrant':
      return ['Check Hose', 'Check Nozzle', 'Check Valve', 'Check Pressure', 'Check Glass', 'Check Box', 'Check Signage', 'Check Accessibility'];
    case 'Pintu Emergency':
      return ['Check Door', 'Check Lock', 'Check Panic Bar', 'Check Exit Sign', 'Check Emergency Light', 'Check Access'];
    case 'P3K':
      return ['Check Box', 'Check Cleanliness', 'Check Inventory', 'Check Expired Items', 'Check Quantity', 'Check Accessibility'];
    case 'Safety Mirror':
      return ['Check Visibility', 'Check Mirror Condition', 'Check Cleanliness', 'Check Position', 'Check Mounting'];
    case 'Assembly Point':
      return ['Check Signage', 'Check Accessibility', 'Check Area', 'Check Capacity', 'Check Lighting', 'Check Evacuation Route', 'Check Obstruction'];
    default:
      return ['Check condition', 'Check accessibility'];
  }
}
