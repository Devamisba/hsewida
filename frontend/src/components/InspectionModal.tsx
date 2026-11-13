import { useState, useMemo, useEffect } from "react";
import { X, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { api } from "@/services/api";

interface CategoryOption {
  label: string;
  isPass: boolean;
}

interface CategoryQuestion {
  id: string;
  code: string;
  label: string;
  question: string;
  options: CategoryOption[];
  defaultAnswer: string;
}

interface InspectionCategoryConfig {
  category: string;
  name: string;
  badge: string;
  bannerTitle: string;
  isConsumable: boolean;
  questions: CategoryQuestion[];
}

const CATEGORY_INSPECTION_CONFIGS: Record<string, InspectionCategoryConfig> = {
  apar: {
    category: "apar",
    name: "APAR",
    badge: "APAR",
    bannerTitle: "Checklist APAR (Tabung & Media Pemadam)",
    isConsumable: true,
    questions: [
      {
        id: "segel_pin",
        code: "Sgl",
        label: "Segel & Safety Pin",
        question: "1. Segel & safety pin pengaman masih utuh terpasang?",
        options: [
          { label: "Utuh", isPass: true },
          { label: "Putus", isPass: false },
        ],
        defaultAnswer: "Utuh",
      },
      {
        id: "fisik_tabung",
        code: "Tbg",
        label: "Kondisi Fisik Tabung",
        question: "2. Fisik tabung bebas karat, penyok & keropos?",
        options: [
          { label: "Ya", isPass: true },
          { label: "Tidak", isPass: false },
        ],
        defaultAnswer: "Ya",
      },
      {
        id: "selang_nozzle",
        code: "Slg",
        label: "Selang & Corong Nozzle",
        question: "3. Selang (hose) & nozzle bersih, fleksibel, tidak buntu?",
        options: [
          { label: "Ya", isPass: true },
          { label: "Tidak", isPass: false },
        ],
        defaultAnswer: "Ya",
      },
      {
        id: "tekanan_indikator",
        code: "Tek",
        label: "Tekanan Indikator APAR",
        question: "4. Tekanan jarum indikator APAR berada di zona hijau?",
        options: [
          { label: "Normal", isPass: true },
          { label: "Rendah", isPass: false },
          { label: "Tinggi", isPass: false },
        ],
        defaultAnswer: "Normal",
      },
      {
        id: "aksesibilitas",
        code: "Aks",
        label: "Aksesibilitas APAR",
        question: "5. Aksesibilitas penempatan bebas rintangan / tidak terhalang?",
        options: [
          { label: "Ya", isPass: true },
          { label: "Tidak", isPass: false },
        ],
        defaultAnswer: "Ya",
      },
    ],
  },
  p3k: {
    category: "p3k",
    name: "Kotak P3K",
    badge: "Kotak P3K",
    bannerTitle: "Checklist Kotak P3K (Kelengkapan & Higienitas)",
    isConsumable: true,
    questions: [
      {
        id: "fisik_kotak",
        code: "Box",
        label: "Fisik Kotak P3K",
        question: "1. Kondisi fisik kotak P3K bersih, kokoh, tidak pecah / rusak?",
        options: [
          { label: "Ya", isPass: true },
          { label: "Tidak", isPass: false },
        ],
        defaultAnswer: "Ya",
      },
      {
        id: "kerapian_tata_letak",
        code: "Rapi",
        label: "Kerapian Tata Letak",
        question: "2. Kerapian tata letak obat & peralatan medis tertata rapi?",
        options: [
          { label: "Ya", isPass: true },
          { label: "Tidak", isPass: false },
        ],
        defaultAnswer: "Ya",
      },
      {
        id: "kelengkapan_isi",
        code: "Isi",
        label: "Kelengkapan Isi & Obat",
        question: "3. Kelengkapan isi & obat sesuai daftar standar kotak P3K?",
        options: [
          { label: "Ya", isPass: true },
          { label: "Tidak", isPass: false },
        ],
        defaultAnswer: "Ya",
      },
      {
        id: "masa_kadaluarsa",
        code: "Exp",
        label: "Masa Kadaluarsa Obat",
        question: "4. Masa kadaluarsa seluruh obat & antiseptik masih berlaku (belum expired)?",
        options: [
          { label: "Aman", isPass: true },
          { label: "Expired", isPass: false },
        ],
        defaultAnswer: "Aman",
      },
      {
        id: "aksesibilitas",
        code: "Aks",
        label: "Aksesibilitas & Kunci",
        question: "5. Aksesibilitas mudah dijangkau darurat & kunci/segel siap buka?",
        options: [
          { label: "Ya", isPass: true },
          { label: "Tidak", isPass: false },
        ],
        defaultAnswer: "Ya",
      },
    ],
  },
  hydrant: {
    category: "hydrant",
    name: "Hydrant",
    badge: "Hydrant",
    bannerTitle: "Checklist Hydrant (Box, Selang & Main Valve)",
    isConsumable: false,
    questions: [
      {
        id: "box_pilar",
        code: "Box",
        label: "Box / Pilar Hydrant",
        question: "1. Box / pilar hydrant bersih, tertutup rapi & tidak terhalang?",
        options: [
          { label: "Baik", isPass: true },
          { label: "Rusak", isPass: false },
        ],
        defaultAnswer: "Baik",
      },
      {
        id: "selang_pemadam",
        code: "Slg",
        label: "Selang Pemadam (Hose)",
        question: "2. Selang pemadam (hose) tergulung rapi, fleksibel & tidak bocor?",
        options: [
          { label: "Baik", isPass: true },
          { label: "Rusak", isPass: false },
        ],
        defaultAnswer: "Baik",
      },
      {
        id: "nozzle_coupling",
        code: "Nozz",
        label: "Nozzle & Coupling",
        question: "3. Nozzle & coupling kopling terpasang presisi & siap pakai?",
        options: [
          { label: "Baik", isPass: true },
          { label: "Rusak", isPass: false },
        ],
        defaultAnswer: "Baik",
      },
      {
        id: "kran_utama",
        code: "Vlv",
        label: "Kran Utama (Valve)",
        question: "4. Kran utama (main valve) dapat diputar lancar & tidak rembes?",
        options: [
          { label: "Lancar", isPass: true },
          { label: "Macet", isPass: false },
        ],
        defaultAnswer: "Lancar",
      },
      {
        id: "tekanan_air",
        code: "Tek",
        label: "Tekanan Air (Pressure)",
        question: "5. Tekanan air siap pakai & indikator tekanan normal?",
        options: [
          { label: "Normal", isPass: true },
          { label: "Drop", isPass: false },
        ],
        defaultAnswer: "Normal",
      },
    ],
  },
  assembly_point: {
    category: "assembly_point",
    name: "Titik Kumpul",
    badge: "Titik Kumpul",
    bannerTitle: "Checklist Titik Kumpul (Area Evakuasi & Rambu)",
    isConsumable: false,
    questions: [
      {
        id: "papan_rambu",
        code: "Rmb",
        label: "Papan Rambu Kumpul",
        question: "1. Papan rambu titik kumpul tegak kokoh & jelas terbaca?",
        options: [
          { label: "Jelas", isPass: true },
          { label: "Rusak", isPass: false },
        ],
        defaultAnswer: "Jelas",
      },
      {
        id: "jalur_akses",
        code: "Jlr",
        label: "Jalur Akses Evakuasi",
        question: "2. Jalur akses evakuasi menuju area bebas material atau kendaraan?",
        options: [
          { label: "Bebas", isPass: true },
          { label: "Terhalang", isPass: false },
        ],
        defaultAnswer: "Bebas",
      },
      {
        id: "kebersihan_area",
        code: "Area",
        label: "Kebersihan Area Kumpul",
        question: "3. Kebersihan permukaan area rata, bersih, bebas genangan / licin?",
        options: [
          { label: "Bersih", isPass: true },
          { label: "Kotor", isPass: false },
        ],
        defaultAnswer: "Bersih",
      },
      {
        id: "penerangan_darurat",
        code: "Lmp",
        label: "Lampu Penerangan",
        question: "4. Lampu penerangan darurat / malam hari berfungsi menyala terang?",
        options: [
          { label: "Menyala", isPass: true },
          { label: "Mati", isPass: false },
        ],
        defaultAnswer: "Menyala",
      },
      {
        id: "marka_batas",
        code: "Mrk",
        label: "Marka Batas Kumpul",
        question: "5. Marka & garis batas kumpul cat hijau/kuning terlihat jelas?",
        options: [
          { label: "Jelas", isPass: true },
          { label: "Pudar", isPass: false },
        ],
        defaultAnswer: "Jelas",
      },
    ],
  },
  safety_mirror: {
    category: "safety_mirror",
    name: "Safety Mirror",
    badge: "Safety Mirror",
    bannerTitle: "Checklist Safety Mirror (Cermin Cembung Tikungan)",
    isConsumable: false,
    questions: [
      {
        id: "kebersihan_cermin",
        code: "Kca",
        label: "Kebersihan Kaca Cermin",
        question: "1. Kebersihan kaca cermin bening, bebas debu pekat, lumpur & minyak?",
        options: [
          { label: "Bening", isPass: true },
          { label: "Buram", isPass: false },
        ],
        defaultAnswer: "Bening",
      },
      {
        id: "sudut_pandang",
        code: "Sdt",
        label: "Sudut Pandang (Angle)",
        question: "2. Sudut pandang (angle) cermin mengarah tepat ke blindspot?",
        options: [
          { label: "Tepat", isPass: true },
          { label: "Bergeser", isPass: false },
        ],
        defaultAnswer: "Tepat",
      },
      {
        id: "tiang_braket",
        code: "Brk",
        label: "Braket & Tiang Penyangga",
        question: "3. Tiang penyangga & braket baut kencang, kokoh, tidak goyang?",
        options: [
          { label: "Kokoh", isPass: true },
          { label: "Goyang", isPass: false },
        ],
        defaultAnswer: "Kokoh",
      },
      {
        id: "fisik_cermin",
        code: "Bnk",
        label: "Fisik Cermin & Topi",
        question: "4. Fisik cermin & topi pelindung utuh, tidak retak / pecah / karat?",
        options: [
          { label: "Utuh", isPass: true },
          { label: "Retak", isPass: false },
        ],
        defaultAnswer: "Utuh",
      },
      {
        id: "bebas_halangan",
        code: "Hlg",
        label: "Bebas Halangan Pandang",
        question: "5. Pandangan bebas halangan (tidak tertutup dahan/pohon/barang)?",
        options: [
          { label: "Bebas", isPass: true },
          { label: "Terhalang", isPass: false },
        ],
        defaultAnswer: "Bebas",
      },
    ],
  },
  emergency_door: {
    category: "emergency_door",
    name: "Pintu Darurat",
    badge: "Pintu Darurat",
    bannerTitle: "Checklist Pintu Darurat (Jalur Evakuasi Darurat)",
    isConsumable: false,
    questions: [
      {
        id: "panic_bar",
        code: "Bar",
        label: "Mekanisme Panic Bar",
        question: "1. Mekanisme panic bar terbuka lancar sekali tekan dari arah dalam?",
        options: [
          { label: "Lancar", isPass: true },
          { label: "Macet", isPass: false },
        ],
        defaultAnswer: "Lancar",
      },
      {
        id: "bebas_gembok",
        code: "Knc",
        label: "Bebas Gembok & Kunci",
        question: "2. Bebas gembok & kunci (tidak digembok saat jam operasional)?",
        options: [
          { label: "Bebas", isPass: true },
          { label: "Terkunci", isPass: false },
        ],
        defaultAnswer: "Bebas",
      },
      {
        id: "exit_sign",
        code: "Sgn",
        label: "Lampu Exit Sign",
        question: "3. Lampu exit sign / tanda darurat hijau menyala terang?",
        options: [
          { label: "Menyala", isPass: true },
          { label: "Mati", isPass: false },
        ],
        defaultAnswer: "Menyala",
      },
      {
        id: "akses_keluar",
        code: "Jlr",
        label: "Akses Koridor Keluar",
        question: "4. Akses koridor jalan keluar bebas rintangan dan tumpukan barang?",
        options: [
          { label: "Lapang", isPass: true },
          { label: "Terhalang", isPass: false },
        ],
        defaultAnswer: "Lapang",
      },
      {
        id: "daun_pintu_closer",
        code: "Pnt",
        label: "Daun Pintu & Door Closer",
        question: "5. Daun pintu & door closer menutup rapat secara otomatis?",
        options: [
          { label: "Rapat", isPass: true },
          { label: "Rusak", isPass: false },
        ],
        defaultAnswer: "Rapat",
      },
    ],
  },
};

const getInspectionConfig = (cat?: string, fallbackType?: string): InspectionCategoryConfig => {
  const c = (cat || "").toLowerCase().trim();
  if (c.includes("p3k") || c.includes("first_aid")) return CATEGORY_INSPECTION_CONFIGS.p3k;
  if (c.includes("hydrant")) return CATEGORY_INSPECTION_CONFIGS.hydrant;
  if (c.includes("assembly") || c.includes("titik_kumpul") || c.includes("kumpul")) return CATEGORY_INSPECTION_CONFIGS.assembly_point;
  if (c.includes("mirror") || c.includes("cermin")) return CATEGORY_INSPECTION_CONFIGS.safety_mirror;
  if (c.includes("door") || c.includes("pintu")) return CATEGORY_INSPECTION_CONFIGS.emergency_door;
  if (c.includes("apar")) return CATEGORY_INSPECTION_CONFIGS.apar;

  const t = (fallbackType || "").toLowerCase().trim();
  if (t.includes("p3k") || t.includes("first_aid")) return CATEGORY_INSPECTION_CONFIGS.p3k;
  if (t.includes("hydrant")) return CATEGORY_INSPECTION_CONFIGS.hydrant;
  if (t.includes("kumpul") || t.includes("assembly")) return CATEGORY_INSPECTION_CONFIGS.assembly_point;
  if (t.includes("mirror") || t.includes("cermin")) return CATEGORY_INSPECTION_CONFIGS.safety_mirror;
  if (t.includes("pintu") || t.includes("door")) return CATEGORY_INSPECTION_CONFIGS.emergency_door;
  if (t.includes("apar")) return CATEGORY_INSPECTION_CONFIGS.apar;

  return CATEGORY_INSPECTION_CONFIGS.apar;
};

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

  const config = useMemo(() => {
    return getInspectionConfig(item?.category, type);
  }, [item?.category, type]);

  // Answers state mapped by question ID
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Reset or initialize answers when modal opens or item changes
  useEffect(() => {
    if (isOpen && item) {
      const initial: Record<string, string> = {};
      config.questions.forEach((q) => {
        initial[q.id] = q.defaultAnswer;
      });
      setAnswers(initial);
      setStep("detail");
      setError("");
      setFindingNotes("");
      setActionPlan("");
    }
  }, [isOpen, item, config]);

  // Evaluated failed questions
  const failedQuestions = useMemo(() => {
    return config.questions.filter((q) => {
      const currentVal = answers[q.id] ?? q.defaultAnswer;
      const opt = q.options.find((o) => o.label === currentVal);
      return opt ? !opt.isPass : false;
    });
  }, [config, answers]);

  const isFailed = failedQuestions.length > 0;

  const conditionStatus = useMemo(() => {
    if (config.isConsumable) {
      if (isFailed) return { status: "PERLU_TINDAKAN", label: "PERLU TINDAKAN / REFILL", color: "text-rose-700 bg-rose-50 border-rose-200" };
      return { status: "AMAN", label: "KONDISI AMAN", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    } else {
      if (isFailed) return { status: "RUSAK", label: "PERLU PERBAIKAN", color: "text-rose-700 bg-rose-50 border-rose-200" };
      return { status: "BAIK", label: "KONDISI BAIK", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    }
  }, [config.isConsumable, isFailed]);

  if (!isOpen || !item) return null;

  const handleStart = () => {
    setError("");
    setStep("inspect");
  };

  const handleSubmitInspection = async () => {
    setSubmitting(true);
    setError("");

    try {
      const checklistResults = config.questions.map((q) => {
        const currentVal = answers[q.id] ?? q.defaultAnswer;
        const opt = q.options.find((o) => o.label === currentVal);
        return {
          id: q.id,
          code: q.code,
          item: q.label,
          label: q.label,
          jawaban: currentVal,
          passed: opt ? opt.isPass : true,
        };
      });

      if (isFailed && step === "inspect") {
        const failedLabels = failedQuestions.map((q) => q.label).join(", ");
        setFindingNotes(`Terdapat ketidaksesuaian pada parameter ${config.name}: ${failedLabels}.`);
        setStep("finding");
        setSubmitting(false);
        return;
      }

      const res = await api.submitInspection({
        facility_id: item.rawId || item.id,
        tipe_checklist: config.isConsumable ? "CONSUMABLE_CHECK" : "KONDISI_CHECK",
        checklist_results: checklistResults,
        notes: `Semua 5 parameter checklist ${config.name} terverifikasi baik dan aman sesuai standar teknis K3.`,
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
      const checklistResults = config.questions.map((q) => {
        const currentVal = answers[q.id] ?? q.defaultAnswer;
        const opt = q.options.find((o) => o.label === currentVal);
        return {
          id: q.id,
          code: q.code,
          item: q.label,
          label: q.label,
          jawaban: currentVal,
          passed: opt ? opt.isPass : true,
        };
      });

      const res = await api.submitInspection({
        facility_id: item.rawId || item.id,
        tipe_checklist: config.isConsumable ? "CONSUMABLE_CHECK" : "KONDISI_CHECK",
        checklist_results: checklistResults,
        notes: findingNotes,
        finding_description: findingNotes,
        severity: "Kritis",
        action_plan: actionPlan || `Perbaikan / penggantian komponen ${config.name} segera oleh tim penanggung jawab`,
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
                config.isConsumable ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
              }`}>
                {config.isConsumable ? `Jalur A: Consumable (${config.badge})` : `Jalur B: Kondisi Fisik (${config.badge})`}
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">{item.code || item.id}</span>
            </div>
            <h2 className="text-base font-extrabold text-slate-900 mt-1">{item.nama_item || item.jenis || type}</h2>
            <p className="text-xs text-slate-500">{item.lokasi || item.location?.name || "Lokasi Pabrik"} • QR: {item.qr_code_id || item.code || item.id}</p>
          </div>
          <button onClick={handleClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer">
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

                {config.isConsumable ? (
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-slate-600">Batas Kadaluarsa Media / Masa Berlaku:</span>
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

          {/* STEP 2: CHECKLIST BERDASARKAN KATEGORI */}
          {step === "inspect" && (
            <div className="space-y-4">
              {/* Header Banner Kategori */}
              <div className={`p-3 rounded-xl flex items-center justify-between border ${
                config.isConsumable ? "bg-purple-50 border-purple-200" : "bg-blue-50 border-blue-200"
              }`}>
                <div>
                  <span className={`font-bold block text-sm ${config.isConsumable ? "text-purple-900" : "text-blue-900"}`}>
                    {config.bannerTitle}
                  </span>
                  <span className="text-[11px] text-slate-500">5 Poin Standar Teknis K3 PT Widatra Bhakti</span>
                </div>
                <span className={`px-2.5 py-1 rounded-lg border font-extrabold text-xs ${conditionStatus.color}`}>
                  {conditionStatus.label}
                </span>
              </div>

              {/* Pertanyaan 5 Parameter */}
              <div className="space-y-3">
                {config.questions.map((q) => {
                  const currentVal = answers[q.id] ?? q.defaultAnswer;
                  return (
                    <div key={q.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <span className="font-bold text-slate-800 block text-xs">{q.question}</span>
                      <div className="flex gap-2">
                        {q.options.map((opt) => {
                          const isSelected = currentVal === opt.label;
                          const btnColor = opt.isPass
                            ? isSelected
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                            : isSelected
                            ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300";

                          return (
                            <button
                              key={opt.label}
                              type="button"
                              onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.label }))}
                              className={`flex-1 py-1.5 rounded-lg font-bold border text-xs transition-all cursor-pointer ${btnColor}`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-100 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep("detail")}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
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

          {/* STEP 3: LAPORAN TEMUAN (JIKA ADA PARAMETER FAIL) */}
          {step === "finding" && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4">
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl flex items-center gap-2 font-bold">
                <AlertTriangle size={16} /> Ada Temuan Masalah pada {config.name} Ini
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
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Kembali ke Checklist
                </button>
                <button
                  type="button"
                  onClick={() => setStep("capa")}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
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
                  placeholder={`Contoh: Perbaikan / penggantian komponen ${config.name} segera oleh tim penanggung jawab...`}
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
                  <option value="Vendor Rekanan K3">Vendor Rekanan K3</option>
                  <option value="Supervisor Area Pabrik">Supervisor Area Pabrik</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep("finding")}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
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
