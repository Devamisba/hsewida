import { useState, useMemo } from "react";
import { X, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [findingNotes, setFindingNotes] = useState("");
  const [actionPlan, setActionPlan] = useState("");
  const [pic, setPic] = useState("Tim K3 / HSE");

  // Consumable checklist state (§4.1)
  const [consumableAnswers, setConsumableAnswers] = useState<Record<string, string>>({
    segel_utuh: "Ya",
    fisik_tabung: "Ya",
    label_terbaca: "Ya",
    tekanan: "Normal",
    aksesibilitas: "Ya",
  });

  // Kondisi checklist state (§4.2)
  const [kondisiAnswers, setKondisiAnswers] = useState<Record<string, string>>({
    fisik_komponen: "OK",
    fungsi_mekanis: "OK",
    kebocoran: "OK",
    kelengkapan: "OK",
    kebersihan: "OK",
  });

  const isConsumable = item?.tipe_item === "CONSUMABLE";

  // Real-time calculation for Jalur B (Kondisi)
  const calculatedConditionStatus = useMemo(() => {
    let max = 0;
    Object.values(kondisiAnswers).forEach((val) => {
      if (val === "Kritis") max = Math.max(max, 2);
      else if (val === "Minor") max = Math.max(max, 1);
    });

    if (max === 2) return { status: "RUSAK", label: "RUSAK / PERLU TINDAKAN", color: "text-rose-700 bg-rose-50 border-rose-200" };
    if (max === 1) return { status: "PERLU_PERHATIAN", label: "PERLU PERHATIAN", color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { status: "BAIK", label: "KONDISI BAIK", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  }, [kondisiAnswers]);

  if (!isOpen || !item) return null;

  const handleStart = () => {
    setError("");
    setStep("inspect");
  };

  const handleSubmitInspection = async () => {
    setSubmitting(true);
    setError("");

    try {
      let checklistResults: any[] = [];
      let checklistType = isConsumable ? "CONSUMABLE_CHECK" : "KONDISI_CHECK";

      if (isConsumable) {
        checklistResults = [
          { item: "Segel/pin masih utuh?", jawaban: consumableAnswers.segel_utuh, passed: consumableAnswers.segel_utuh === "Ya" },
          { item: "Fisik tabung/kemasan tidak rusak/korosi?", jawaban: consumableAnswers.fisik_tabung, passed: consumableAnswers.fisik_tabung === "Ya" },
          { item: "Label & tanggal kadaluarsa terbaca jelas?", jawaban: consumableAnswers.label_terbaca, passed: consumableAnswers.label_terbaca === "Ya" },
          { item: "Tekanan sesuai indikator?", jawaban: consumableAnswers.tekanan, passed: consumableAnswers.tekanan === "Normal" },
          { item: "Aksesibilitas (tidak terhalang barang)?", jawaban: consumableAnswers.aksesibilitas, passed: consumableAnswers.aksesibilitas === "Ya" },
        ];
      } else {
        checklistResults = [
          { item: "Kondisi fisik komponen (retak/getas/korosi)", jawaban: kondisiAnswers.fisik_komponen },
          { item: "Fungsi mekanis (dapat dioperasikan normal)", jawaban: kondisiAnswers.fungsi_mekanis },
          { item: "Kebocoran / rembesan fluida", jawaban: kondisiAnswers.kebocoran },
          { item: "Kelengkapan aksesoris (nozzle/bracket)", jawaban: kondisiAnswers.kelengkapan },
          { item: "Kebersihan & area bebas obstruksi", jawaban: kondisiAnswers.kebersihan },
        ];
      }

      // Check if there are critical issues requiring finding/capa
      const isFailed = isConsumable
        ? checklistResults.some((c) => !c.passed)
        : calculatedConditionStatus.status !== "BAIK";

      if (isFailed && step === "inspect") {
        setFindingNotes(
          isConsumable
            ? "Terdapat ketidaksesuaian pada checklist fisik atau tekanan APD/APAR."
            : `Hasil inspeksi menunjukkan status ${calculatedConditionStatus.label}.`
        );
        setStep("finding");
        setSubmitting(false);
        return;
      }

      // Submit direct pass
      const res = await api.submitInspection({
        facility_id: item.rawId || item.id,
        tipe_checklist: checklistType,
        checklist_results: checklistResults,
        notes: "Semua poin checklist terverifikasi baik dan aman sesuai SOP pabrik.",
      });

      if (res.success) {
        setStep("done");
        onSuccess?.();
      } else {
        setError(res.message || "Gagal menyimpan hasil inspeksi.");
      }
    } catch (err: any) {
      setError(err.message || "Gagal menghubungi server backend.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCapaSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const checklistType = isConsumable ? "CONSUMABLE_CHECK" : "KONDISI_CHECK";
      const checklistResults = isConsumable
        ? [
            { item: "Segel/pin masih utuh?", jawaban: consumableAnswers.segel_utuh, passed: consumableAnswers.segel_utuh === "Ya" },
            { item: "Fisik tabung/kemasan tidak rusak/korosi?", jawaban: consumableAnswers.fisik_tabung, passed: consumableAnswers.fisik_tabung === "Ya" },
            { item: "Label & tanggal kadaluarsa terbaca jelas?", jawaban: consumableAnswers.label_terbaca, passed: consumableAnswers.label_terbaca === "Ya" },
            { item: "Tekanan sesuai indikator?", jawaban: consumableAnswers.tekanan, passed: consumableAnswers.tekanan === "Normal" },
            { item: "Aksesibilitas (tidak terhalang barang)?", jawaban: consumableAnswers.aksesibilitas, passed: consumableAnswers.aksesibilitas === "Ya" },
          ]
        : [
            { item: "Kondisi fisik komponen", jawaban: kondisiAnswers.fisik_komponen },
            { item: "Fungsi mekanis", jawaban: kondisiAnswers.fungsi_mekanis },
            { item: "Kebocoran / rembesan", jawaban: kondisiAnswers.kebocoran },
            { item: "Kelengkapan aksesoris", jawaban: kondisiAnswers.kelengkapan },
            { item: "Kebersihan & bebas obstruksi", jawaban: kondisiAnswers.kebersihan },
          ];

      const res = await api.submitInspection({
        facility_id: item.rawId || item.id,
        tipe_checklist: checklistType,
        checklist_results: checklistResults,
        notes: findingNotes,
        finding_description: findingNotes,
        severity: calculatedConditionStatus.status === "RUSAK" ? "Kritis" : "Minor",
        action_plan: actionPlan || "Perbaikan / penggantian fasilitas segera oleh tim penanggung jawab",
        pic_name: pic,
      });

      if (res.success) {
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
    setError("");
    setFindingNotes("");
    setActionPlan("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-100 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                isConsumable ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
              }`}>
                {isConsumable ? "Jalur A: Consumable" : "Jalur B: Kondisi Fisik"}
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">{item.id || item.code}</span>
            </div>
            <h2 className="text-base font-extrabold text-slate-900 mt-1">{item.nama_item || item.jenis || type}</h2>
            <p className="text-xs text-slate-500">{item.lokasi} • QR: {item.qr_code_id || item.id}</p>
          </div>
          <button onClick={handleClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" /> {error}
          </div>
        )}

        {/* Body */}
        <div className="p-5 md:p-6 overflow-y-auto flex-1 text-xs">
          
          {/* STEP 1: DETAIL RINGKAS */}
          {step === "detail" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider">Status Kesiapan Unit:</span>
                  <span className={`px-2.5 py-1 rounded-full font-extrabold text-xs ${
                    item.calculated_status === 'AMAN' || item.calculated_status === 'BAIK' ? 'bg-emerald-100 text-emerald-800' :
                    item.calculated_status === 'MENDEKATI_KADALUARSA' || item.calculated_status === 'PERLU_PERHATIAN' ? 'bg-amber-100 text-amber-800' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {item.calculated_status || item.status || "BAIK"}
                  </span>
                </div>

                {isConsumable ? (
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-slate-600">Batas Kadaluarsa Media:</span>
                    <strong className="font-mono text-slate-900">{item.expired || item.consumableCycle?.expired_at || "-"}</strong>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-slate-600">Interval Rutin Inspeksi:</span>
                    <strong className="text-slate-900">Tiap {item.conditionSchedule?.interval_pemeriksaan_hari || 30} Hari</strong>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleStart}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <span>Mulai Checklist Inspeksi</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CHECKLIST DUAL-MODE */}
          {step === "inspect" && (
            <div className="space-y-5">
              {/* JALUR A: CONSUMABLE CHECKLIST (§4.1) */}
              {isConsumable ? (
                <div className="space-y-4">
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                    <span className="font-bold text-purple-900">Checklist Consumable (Media & Tabung)</span>
                    <span className="text-[11px] text-purple-700 font-semibold">5 Poin Standar K3</span>
                  </div>

                  {/* 1. Segel/pin */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 block">1. Segel / pin pengaman masih utuh?</span>
                    <div className="flex gap-2">
                      {["Ya", "Tidak"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setConsumableAnswers({ ...consumableAnswers, segel_utuh: opt })}
                          className={`flex-1 py-1.5 rounded-lg font-bold border transition-all ${
                            consumableAnswers.segel_utuh === opt
                              ? opt === "Ya" ? "bg-emerald-600 text-white border-emerald-600" : "bg-rose-600 text-white border-rose-600"
                              : "bg-white text-slate-700 border-slate-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Fisik tabung */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 block">2. Fisik tabung / kemasan tidak rusak / korosi?</span>
                    <div className="flex gap-2">
                      {["Ya", "Tidak"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setConsumableAnswers({ ...consumableAnswers, fisik_tabung: opt })}
                          className={`flex-1 py-1.5 rounded-lg font-bold border transition-all ${
                            consumableAnswers.fisik_tabung === opt
                              ? opt === "Ya" ? "bg-emerald-600 text-white border-emerald-600" : "bg-rose-600 text-white border-rose-600"
                              : "bg-white text-slate-700 border-slate-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Label & tanggal */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 block">3. Label & tanggal kadaluarsa terbaca jelas?</span>
                    <div className="flex gap-2">
                      {["Ya", "Tidak"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setConsumableAnswers({ ...consumableAnswers, label_terbaca: opt })}
                          className={`flex-1 py-1.5 rounded-lg font-bold border transition-all ${
                            consumableAnswers.label_terbaca === opt
                              ? opt === "Ya" ? "bg-emerald-600 text-white border-emerald-600" : "bg-rose-600 text-white border-rose-600"
                              : "bg-white text-slate-700 border-slate-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Tekanan */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 block">4. Tekanan jarum indikator APAR:</span>
                    <div className="flex gap-2">
                      {["Normal", "Rendah", "Tinggi"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setConsumableAnswers({ ...consumableAnswers, tekanan: opt })}
                          className={`flex-1 py-1.5 rounded-lg font-bold border transition-all ${
                            consumableAnswers.tekanan === opt
                              ? opt === "Normal" ? "bg-emerald-600 text-white border-emerald-600" : "bg-rose-600 text-white border-rose-600"
                              : "bg-white text-slate-700 border-slate-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. Aksesibilitas */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 block">5. Aksesibilitas bebas rintangan / tidak terhalang?</span>
                    <div className="flex gap-2">
                      {["Ya", "Tidak"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setConsumableAnswers({ ...consumableAnswers, aksesibilitas: opt })}
                          className={`flex-1 py-1.5 rounded-lg font-bold border transition-all ${
                            consumableAnswers.aksesibilitas === opt
                              ? opt === "Ya" ? "bg-emerald-600 text-white border-emerald-600" : "bg-rose-600 text-white border-rose-600"
                              : "bg-white text-slate-700 border-slate-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* JALUR B: KONDISI CHECKLIST (§4.2) */
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-blue-900 block">Checklist Kondisi Fisik & Mekanis</span>
                      <span className="text-[10px] text-blue-700">Skor MAX: OK (0), Minor (1), Kritis (2)</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg border font-extrabold text-xs ${calculatedConditionStatus.color}`}>
                      {calculatedConditionStatus.label}
                    </span>
                  </div>

                  {/* 1. Fisik komponen */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 block">1. Kondisi fisik komponen (retak, getas, korosi, penyok)?</span>
                    <div className="flex gap-2">
                      {["OK", "Minor", "Kritis"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setKondisiAnswers({ ...kondisiAnswers, fisik_komponen: opt })}
                          className={`flex-1 py-1.5 rounded-lg font-bold border transition-all ${
                            kondisiAnswers.fisik_komponen === opt
                              ? opt === "OK" ? "bg-emerald-600 text-white border-emerald-600" : opt === "Minor" ? "bg-amber-600 text-white border-amber-600" : "bg-rose-600 text-white border-rose-600"
                              : "bg-white text-slate-700 border-slate-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Fungsi mekanis */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 block">2. Fungsi mekanis (bisa dibuka / dioperasikan normal)?</span>
                    <div className="flex gap-2">
                      {["OK", "Minor", "Kritis"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setKondisiAnswers({ ...kondisiAnswers, fungsi_mekanis: opt })}
                          className={`flex-1 py-1.5 rounded-lg font-bold border transition-all ${
                            kondisiAnswers.fungsi_mekanis === opt
                              ? opt === "OK" ? "bg-emerald-600 text-white border-emerald-600" : opt === "Minor" ? "bg-amber-600 text-white border-amber-600" : "bg-rose-600 text-white border-rose-600"
                              : "bg-white text-slate-700 border-slate-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Kebocoran */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 block">3. Kebocoran / rembesan air atau fluida?</span>
                    <div className="flex gap-2">
                      {["OK", "Minor", "Kritis"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setKondisiAnswers({ ...kondisiAnswers, kebocoran: opt })}
                          className={`flex-1 py-1.5 rounded-lg font-bold border transition-all ${
                            kondisiAnswers.kebocoran === opt
                              ? opt === "OK" ? "bg-emerald-600 text-white border-emerald-600" : opt === "Minor" ? "bg-amber-600 text-white border-amber-600" : "bg-rose-600 text-white border-rose-600"
                              : "bg-white text-slate-700 border-slate-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Kelengkapan */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 block">4. Kelengkapan aksesoris (nozzle, kunci, selang, bracket)?</span>
                    <div className="flex gap-2">
                      {["OK", "Minor", "Kritis"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setKondisiAnswers({ ...kondisiAnswers, kelengkapan: opt })}
                          className={`flex-1 py-1.5 rounded-lg font-bold border transition-all ${
                            kondisiAnswers.kelengkapan === opt
                              ? opt === "OK" ? "bg-emerald-600 text-white border-emerald-600" : opt === "Minor" ? "bg-amber-600 text-white border-amber-600" : "bg-rose-600 text-white border-rose-600"
                              : "bg-white text-slate-700 border-slate-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. Kebersihan & Bebas Obstruksi */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 block">5. Kebersihan & area sekitar bebas obstruksi / rintangan?</span>
                    <div className="flex gap-2">
                      {["OK", "Minor", "Kritis"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setKondisiAnswers({ ...kondisiAnswers, kebersihan: opt })}
                          className={`flex-1 py-1.5 rounded-lg font-bold border transition-all ${
                            kondisiAnswers.kebersihan === opt
                              ? opt === "OK" ? "bg-emerald-600 text-white border-emerald-600" : opt === "Minor" ? "bg-amber-600 text-white border-amber-600" : "bg-rose-600 text-white border-rose-600"
                              : "bg-white text-slate-700 border-slate-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-100 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep("detail")}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmitInspection}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  <CheckCircle2 size={15} /> {submitting ? "Memproses..." : "Simpan Hasil Inspeksi"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: LAPORAN TEMUAN (JIKA ADA MINOR/KRITIS/FAIL) */}
          {step === "finding" && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4">
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl flex items-center gap-2 font-bold">
                <AlertTriangle size={16} /> Ada Temuan Masalah pada Alat K3 Ini
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Uraian / Deskripsi Temuan Masalah *
                </label>
                <textarea
                  rows={3}
                  value={findingNotes}
                  onChange={(e) => setFindingNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep("inspect")}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Kembali ke Checklist
                </button>
                <button
                  type="button"
                  onClick={() => setStep("capa")}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  Lanjut ke Tindakan Perbaikan (CAPA) <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: FORM CAPA */}
          {step === "capa" && (
            <div className="space-y-4 animate-in slide-in-from-right-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Tiket Rencana Tindakan Perbaikan (CAPA)</h3>
                <p className="text-[11px] text-slate-500">Tugaskan PIC untuk menindaklanjuti perbaikan fisik alat K3.</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Rencana Tindakan (Action Plan)</label>
                <textarea
                  rows={2}
                  value={actionPlan}
                  onChange={(e) => setActionPlan(e.target.value)}
                  placeholder="Contoh: Ganti selang hydrant yang retak / ganti isi media tabung APAR segera..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Penanggung Jawab (PIC)</label>
                <select
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-semibold"
                >
                  <option value="Tim K3 / HSE">Tim K3 / HSE</option>
                  <option value="Tim Maintenance / GA">Tim Maintenance / GA</option>
                  <option value="Vendor Rekanan APAR">Vendor Rekanan APAR</option>
                  <option value="Supervisor Area Pabrik">Supervisor Area Pabrik</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep("finding")}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleCapaSubmit}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  <CheckCircle2 size={15} /> {submitting ? "Menyimpan..." : "Kirim Laporan & Buat Tiket CAPA"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: SELESAI */}
          {step === "done" && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Inspeksi Berhasil Disimpan di Sistem</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Hasil inspeksi terverifikasi dan status terkini fasilitas K3 telah disinkronkan ke database.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleClose}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Selesai & Tutup
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
