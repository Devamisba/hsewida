import { useState, useEffect } from "react";
import { format, addDays, isBefore, startOfToday } from "date-fns";
import { 
  ClipboardList, 
  HardHat, 
  Building2, 
  CalendarClock, 
  FilePlus2, 
  CalendarPlus, 
  AlertTriangle, 
  RotateCcw, 
  CheckCircle2, 
  Loader2 
} from "lucide-react";
import { calculateInclusiveDays, formatDateDDMMYY, cn } from "@/lib/utils";
import { DateInputDDMMYY } from "@/components/DateInputDDMMYY";
import { api } from "@/services/api";
import { auth } from "@/lib/auth";

export function Step1DataKontraktor({ data, updateData }: { data: any, updateData: any }) {
  const [minStartDate, setMinStartDate] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [maxPermitDays, setMaxPermitDays] = useState(6);
  const [minLeadDays, setMinLeadDays] = useState(3);
  const [eligiblePermits, setEligiblePermits] = useState<any[]>([]);
  const [loadingEligible, setLoadingEligible] = useState<boolean>(false);
  const [selectedParentId, setSelectedParentId] = useState<string | number>(data.parentPermitId || "");

  useEffect(() => {
    const today = startOfToday();

    // 1. Fetch policy settings from Master Data
    api.getSettings().then(res => {
      if (res?.success && res.data?.map) {
        const map = res.data.map;
        const rawMaxDays = map.max_permit_duration_days;
        const maxDays = (rawMaxDays !== undefined && rawMaxDays !== null && !isNaN(Number(rawMaxDays)))
          ? Number(rawMaxDays)
          : 6;
        const leadDays = typeof map.min_lead_time_days === "number" ? map.min_lead_time_days : 3;
        setMaxPermitDays(maxDays);
        setMinLeadDays(leadDays);

        if (data.requestType === "Perpanjangan") {
          setMinStartDate(format(today, 'yyyy-MM-dd'));
        } else {
          setMinStartDate(format(addDays(today, leadDays), 'yyyy-MM-dd'));
        }
      }
    }).catch(err => {
      console.warn("Could not fetch policy settings, fallback to defaults (6 days, H-3):", err);
      if (data.requestType === "Perpanjangan") {
        setMinStartDate(format(today, 'yyyy-MM-dd'));
      } else {
        setMinStartDate(format(addDays(today, 3), 'yyyy-MM-dd'));
      }
    });

    // 2. Pre-fill vendor name and default shift/hse if available
    try {
      const user = auth.getUser();
      const updates: any = {};
      if (user && user.company_name && !data.namaKontraktor) {
        updates.namaKontraktor = user.company_name;
      }
      if (!data.jamKerjaMulai) updates.jamKerjaMulai = "08:00";
      if (!data.jamKerjaAkhir) updates.jamKerjaAkhir = "17:00";
      if (!data.pengawasHse) updates.pengawasHse = "Ahli K3 Umum";
      if (!data.noHpHse) updates.noHpHse = "085566778899";
      if (data.totalTenagaKerja === undefined || data.totalTenagaKerja === null) updates.totalTenagaKerja = "1";
      if (Object.keys(updates).length > 0) {
        updateData(updates);
      }
    } catch {}

    // 3. Load locations from master data
    api.getLocations().then(res => {
      if (res.success && Array.isArray(res.data)) {
        setLocations(res.data.filter((l: any) => l.is_active !== false).map((l: any) => l.name));
      }
    }).catch(err => console.error("Error fetching locations:", err));

    // 4. Fetch eligible extension permits
    setLoadingEligible(true);
    api.getEligibleExtensions().then(res => {
      if (res?.success && Array.isArray(res.data)) {
        setEligiblePermits(res.data);
        if (data.parentPermitId) {
          setSelectedParentId(data.parentPermitId);
        }
      }
    }).catch(err => {
      console.warn("Could not fetch eligible extension permits:", err);
    }).finally(() => {
      setLoadingEligible(false);
    });
  }, []);

  const getCleanNewPermitState = () => {
    const user = auth.getUser();
    return {
      requestType: "Baru",
      parentPermitId: null,
      parentPermitNumber: "",
      rootPermitId: null,
      rootPermitNumber: "",
      rootStartDate: "",
      cumulativeStartDate: "",
      extensionPhase: 0,
      namaKontraktor: user?.company_name || "",
      jenisPekerjaan: "",
      mulaiKerja: "",
      selesaiKerja: "",
      projectEndDate: "",
      penanggungJawab: "",
      noHpPJ: "",
      pengawasPekerjaan: "",
      noHpPengawas: "",
      pengawasHse: "Ahli K3 Umum",
      noHpHse: "085566778899",
      totalTenagaKerja: "1",
      jamKerjaMulai: "08:00",
      jamKerjaAkhir: "17:00",
      lokasi: "",
      permitTypes: [] as string[],
      otherPermitType: "",
      ppe: [] as string[],
      otherPpe: "",
      workEquipment: ["", "", ""],
      pekerja: [
        {
          id: Date.now(),
          nama: "",
          jabatan: "",
          alamat: "",
          id_card_photo: null,
          photoName: ""
        }
      ],
      jsa: [
        {
          id: Date.now(),
          tahapan: "",
          peralatan: "",
          potensi: "",
          pengendalian: "",
          tanggapDarurat: ""
        }
      ],
      disclaimerAccepted: false
    };
  };

  const handleTypeSelect = (type: "Baru" | "Perpanjangan") => {
    if (type === "Baru") {
      setSelectedParentId("");
      updateData(getCleanNewPermitState());
      setMinStartDate(format(addDays(startOfToday(), minLeadDays), 'yyyy-MM-dd'));
    } else {
      updateData({
        requestType: "Perpanjangan",
      });
      setMinStartDate(format(startOfToday(), 'yyyy-MM-dd'));
      if (eligiblePermits.length === 1 && !data.parentPermitId) {
        handleApplyParentPermit(eligiblePermits[0]);
      }
    }
  };

  const handleApplyParentPermit = (parent: any) => {
    if (!parent) return;
    setSelectedParentId(parent.id);

    const nextStart = parent.suggested_start_date || (parent.end_date ? format(addDays(new Date(parent.end_date), 1), 'yyyy-MM-dd') : "");
    const nextEnd = parent.suggested_end_date || (nextStart ? format(addDays(new Date(nextStart), 5), 'yyyy-MM-dd') : "");
    const nextPhase = parent.next_phase || ((parent.extension_phase || 0) + 1);

    const mappedWorkers = (parent.workers || []).map((w: any, idx: number) => ({
      id: Date.now() + idx,
      nama: w.worker_name || w.nama || "",
      jabatan: w.position || w.jabatan || "",
      alamat: w.address || w.alamat || "",
      id_card_photo: w.id_card_photo || null,
      photoName: w.id_card_photo ? "KTP Tersimpan (Dari Izin Sebelumnya)" : "",
    }));

    const mappedJsa = (parent.jsas || []).map((j: any, idx: number) => ({
      id: Date.now() + idx,
      tahapan: j.work_step || j.tahapan || "",
      peralatan: j.equipment_used || j.peralatan || "",
      potensi: j.hazard_potential || j.potensi || "",
      pengendalian: j.mitigation_control || j.pengendalian || "",
      tanggapDarurat: j.emergency_response || j.tanggapDarurat || "",
    }));

    updateData({
      requestType: "Perpanjangan",
      parentPermitId: parent.id,
      parentPermitNumber: parent.permit_number,
      rootPermitId: parent.root_permit_id || parent.id,
      rootPermitNumber: parent.root_permit_number || parent.permit_number,
      rootStartDate: parent.cumulative_start_date || parent.start_date,
      cumulativeStartDate: parent.cumulative_start_date || parent.start_date,
      extensionPhase: nextPhase,
      namaKontraktor: parent.vendor?.company_name || parent.namaKontraktor || data.namaKontraktor,
      jenisPekerjaan: parent.job_title || data.jenisPekerjaan,
      lokasi: parent.location?.name || (typeof parent.location === 'string' ? parent.location : data.lokasi),
      mulaiKerja: nextStart,
      selesaiKerja: nextEnd,
      projectEndDate: parent.project_end_date || parent.end_date,
      jamKerjaMulai: parent.daily_start_time || "08:00",
      jamKerjaAkhir: parent.daily_end_time || "17:00",
      penanggungJawab: parent.pic_name || data.penanggungJawab,
      noHpPJ: parent.pic_phone || data.noHpPJ,
      pengawasPekerjaan: parent.supervisor_name || data.pengawasPekerjaan,
      noHpPengawas: parent.supervisor_phone || data.noHpPengawas,
      pengawasHse: parent.hse_officer_name || data.pengawasHse || "Ahli K3 Umum",
      noHpHse: parent.hse_officer_phone || data.noHpHse || "085566778899",
      totalTenagaKerja: String(mappedWorkers.length > 0 ? mappedWorkers.length : (data.totalTenagaKerja || "1")),
      permitTypes: parent.permit_types || [],
      ppe: parent.ppes || [],
      pekerja: mappedWorkers.length > 0 ? mappedWorkers : data.pekerja,
      jsa: mappedJsa.length > 0 ? mappedJsa : data.jsa,
    });
  };
  
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    updateData({ mulaiKerja: newStart });
    
    // Ensure selesaiKerja does not precede start date
    if (newStart) {
      const start = new Date(newStart);
      if (data.selesaiKerja) {
        const currentEnd = new Date(data.selesaiKerja);
        if (isBefore(currentEnd, start)) {
          updateData({ selesaiKerja: newStart });
        }
      } else {
        updateData({ selesaiKerja: format(addDays(start, 5), 'yyyy-MM-dd') });
      }
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateData({ selesaiKerja: e.target.value });
  };

  const maxEndDate = undefined; // Selesai kerja bebas/fleksibel (bisa 1 minggu, bulan, atau tahun)
  const minEndDate = data.mulaiKerja ? data.mulaiKerja : undefined;

  const totalProjectDays = (data.mulaiKerja && data.selesaiKerja) 
    ? calculateInclusiveDays(data.mulaiKerja, data.selesaiKerja) 
    : 0;
  const isMultiCycle = totalProjectDays > 6;
  const cycleEndDate = (data.mulaiKerja) 
    ? format(addDays(new Date(data.mulaiKerja), 5), 'yyyy-MM-dd') 
    : '';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start gap-4 mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <ClipboardList size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Izin Kerja & Data Vendor</h3>
          <p className="text-sm text-gray-500">Data dasar pengajuan izin kerja. Harap isi dengan lengkap dan sesuai dengan kontrak.</p>
        </div>
      </div>

      {/* Pilihan Tipe Pengajuan Izin Kerja: Baru vs Perpanjangan */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-gray-800">
          Tipe Pengajuan Izin Kerja <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Izin Kerja Baru */}
          <button
            type="button"
            onClick={() => handleTypeSelect("Baru")}
            className={cn(
              "flex items-start gap-3.5 p-4 rounded-xl border-2 text-left transition-all cursor-pointer relative",
              data.requestType !== "Perpanjangan"
                ? "border-blue-600 bg-blue-50/60 shadow-xs ring-2 ring-blue-500/20"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
            )}
          >
            <div className={cn(
              "p-2.5 rounded-lg shrink-0 mt-0.5",
              data.requestType !== "Perpanjangan" ? "bg-blue-600 text-white shadow-xs" : "bg-gray-100 text-gray-500"
            )}>
              <FilePlus2 size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={cn(
                  "font-bold text-sm",
                  data.requestType !== "Perpanjangan" ? "text-blue-900" : "text-gray-900"
                )}>
                  Izin Kerja Baru
                </span>
                <span className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                  data.requestType !== "Perpanjangan" ? "border-blue-600 bg-blue-600" : "border-gray-300"
                )}>
                  {data.requestType !== "Perpanjangan" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Pengajuan izin kerja awal untuk pekerjaan baru atau proyek terpisah dari awal.
              </p>
            </div>
          </button>

          {/* Card 2: Perpanjangan Izin Kerja */}
          <button
            type="button"
            onClick={() => handleTypeSelect("Perpanjangan")}
            className={cn(
              "flex items-start gap-3.5 p-4 rounded-xl border-2 text-left transition-all cursor-pointer relative",
              data.requestType === "Perpanjangan"
                ? "border-amber-500 bg-amber-50/60 shadow-xs ring-2 ring-amber-500/20"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
            )}
          >
            <div className={cn(
              "p-2.5 rounded-lg shrink-0 mt-0.5",
              data.requestType === "Perpanjangan" ? "bg-amber-600 text-white shadow-xs" : "bg-gray-100 text-gray-500"
            )}>
              <CalendarPlus size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={cn(
                    "font-bold text-sm",
                    data.requestType === "Perpanjangan" ? "text-amber-900" : "text-gray-900"
                  )}>
                    Perpanjangan Izin
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    eligiblePermits.length > 0 
                      ? "bg-amber-100 text-amber-800 border border-amber-200" 
                      : "bg-gray-100 text-gray-500 border border-gray-200"
                  )}>
                    {loadingEligible ? "Memuat..." : `${eligiblePermits.length} Tersedia`}
                  </span>
                </div>
                <span className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                  data.requestType === "Perpanjangan" ? "border-amber-500 bg-amber-500" : "border-gray-300"
                )}>
                  {data.requestType === "Perpanjangan" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Melanjutkan izin kerja aktif yang mendekati masa berakhir (periode H-3).
              </p>
            </div>
          </button>
        </div>

        {/* Dropdown / Alert saat Mode Perpanjangan */}
        {data.requestType === "Perpanjangan" && (
          <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
            {loadingEligible ? (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3 text-sm text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                <span>Memeriksa daftar izin kerja yang dapat diperpanjang...</span>
              </div>
            ) : eligiblePermits.length === 0 ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-rose-900 text-sm shadow-xs">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <AlertTriangle size={18} className="text-rose-600 shrink-0" />
                  <span>Tidak Ada Izin Kerja yang Memenuhi Syarat untuk Diperpanjang</span>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Syarat perpanjangan izin: Dokumen izin kerja berstatus <strong>Disetujui</strong>, berada dalam rentang masa berlaku <strong>H-3 sebelum berakhir</strong>, dan <strong>belum memiliki pengajuan perpanjangan aktif</strong>. Saat ini tidak ditemukan izin kerja yang memenuhi kriteria tersebut pada akun Anda.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleTypeSelect("Baru")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <RotateCcw size={14} /> Beralih ke Izin Kerja Baru
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-3 text-amber-950 text-sm shadow-xs">
                <div>
                  <label htmlFor="parentPermitSelect" className="block text-xs font-bold text-amber-900 mb-1.5">
                    Pilih Dokumen Izin Kerja yang Akan Diperpanjang <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="parentPermitSelect"
                    value={selectedParentId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) {
                        setSelectedParentId("");
                        updateData({
                          ...getCleanNewPermitState(),
                          requestType: "Perpanjangan",
                        });
                        return;
                      }
                      const found = eligiblePermits.find(p => String(p.id) === String(val));
                      if (found) {
                        handleApplyParentPermit(found);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-xs cursor-pointer font-medium"
                  >
                    <option value="">-- Pilih Dokumen Izin Kerja Acuan --</option>
                    {eligiblePermits.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.permit_number} - {p.job_title} | Berakhir: {formatDateDDMMYY(p.end_date)} (Sisa {p.days_remaining} Hari) | Lanjut ke Fase {p.next_phase}
                      </option>
                    ))}
                  </select>
                </div>

                {data.parentPermitId ? (
                  <div className="flex items-start gap-2.5 p-2.5 bg-white/90 border border-amber-200 rounded-lg text-xs text-amber-900">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        Izin acuan terpilih: <span className="font-mono text-amber-800 font-bold">{data.parentPermitNumber || data.parentPermitId}</span> (Fase {data.extensionPhase || 1})
                      </p>
                      <p className="text-gray-600 mt-0.5">
                        Data vendor, personel, jenis izin, APD, pekerja, dan JSA telah dimuat otomatis. Periode lanjutan kerja disesuaikan ke <strong>{formatDateDDMMYY(data.mulaiKerja)} s/d {formatDateDDMMYY(data.selesaiKerja)}</strong>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-700 italic">
                    * Silakan pilih salah satu izin kerja di atas untuk memuat data acuan secara otomatis.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {data.requestType === "Perpanjangan" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-900 text-sm shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-200/90 text-amber-900 rounded-lg shrink-0">
                <CalendarClock size={20} />
              </div>
              <div>
                <p className="font-bold text-amber-950 text-sm">
                  Permohonan Perpanjangan Izin Kerja &mdash; Fase {data.extensionPhase || 1}
                </p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Mengacu pada Izin Induk: <strong className="font-mono text-slate-900">{data.rootPermitNumber || data.parentPermitNumber || "Izin Sebelumnya"}</strong>
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 self-start sm:self-auto">
              Perpanjangan Ke-{data.extensionPhase || 1}
            </span>
          </div>
        )}

        {/* 1. Detail Pekerjaan & Jadwal */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h4 className="text-base sm:text-lg font-bold text-gray-900">Informasi Umum & Jadwal Pekerjaan</h4>
            <p className="text-xs text-gray-500 mt-0.5">Informasi instansi vendor pelaksana dan waktu pelaksanaan kerja.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Nama Perusahaan Vendor <span className="text-red-500">*</span></label>
              <input 
                id="namaKontraktor"
                type="text" 
                value={data.namaKontraktor}
                onChange={(e) => updateData({ namaKontraktor: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="PT. Nama Perusahaan"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Jenis Pekerjaan <span className="text-red-500">*</span></label>
              <input 
                id="jenisPekerjaan"
                type="text" 
                value={data.jenisPekerjaan}
                onChange={(e) => updateData({ jenisPekerjaan: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Ex: Perbaikan pipa boiler"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Mulai Kerja {data.requestType === "Perpanjangan" ? "(Lanjutan)" : `(min. H-${minLeadDays})`} <span className="text-red-500">*</span>
              </label>
              <DateInputDDMMYY 
                id="mulaiKerja"
                min={minStartDate}
                value={data.mulaiKerja}
                onChange={handleStartDateChange}
                placeholder="dd/mm/yy"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Target Selesai Pekerjaan / Proyek <span className="text-red-500">*</span>
              </label>
              <DateInputDDMMYY 
                id="selesaiKerja"
                min={minEndDate}
                max={maxEndDate}
                value={data.selesaiKerja}
                onChange={handleEndDateChange}
                placeholder="dd/mm/yy"
              />
            </div>

            {/* Banner Edukasi Regulasi K3: Proyek Durasi Panjang & Siklus Tiket 6 Hari */}
            {isMultiCycle && data.requestType !== "Perpanjangan" && (
              <div className="md:col-span-2 p-3.5 bg-blue-50/90 border border-blue-200 rounded-xl space-y-2 animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-200 text-blue-900 rounded-lg shrink-0">
                    <CalendarClock size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                      Regulasi K3: Siklus Masa Berlaku Tiket Izin Kerja (Maks. 6 Hari Kalender)
                    </h5>
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Target pekerjaan proyek Anda adalah <strong>{totalProjectDays} hari kalender</strong> ({formatDateDDMMYY(data.mulaiKerja)} s/d {formatDateDDMMYY(data.selesaiKerja)}). Sesuai standar K3 PT Widatra Bhakti, lembar tiket izin kerja aktif berlaku maksimal <strong>6 hari per siklus</strong>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-blue-200/80 text-xs">
                  <div className="bg-white/90 p-2 rounded-lg border border-blue-200">
                    <span className="text-[10px] uppercase font-bold text-blue-700 block">Masa Berlaku Tiket Fase 1:</span>
                    <strong className="text-blue-950 font-mono text-xs block">
                      {formatDateDDMMYY(data.mulaiKerja)} s/d {formatDateDDMMYY(cycleEndDate)}
                    </strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Berlaku sah selama 6 hari pertama</span>
                  </div>
                  <div className="bg-amber-50/90 p-2 rounded-lg border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-amber-800 block">Kewajiban Perpanjangan:</span>
                    <strong className="text-amber-950 text-xs block">
                      Wajib diperpanjang berkala setiap 6 hari
                    </strong>
                    <span className="text-[10px] text-amber-700 block mt-0.5">Tombol perpanjang aktif pada H-3 sebelum tiket kedaluwarsa</span>
                  </div>
                </div>
              </div>
            )}

            {data.requestType === "Perpanjangan" && (
              <div className="md:col-span-2 p-4 bg-amber-50/90 border border-amber-200 rounded-xl space-y-3 animate-in fade-in duration-300">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-amber-200 text-amber-900 rounded-lg shrink-0 mt-0.5">
                    <CalendarClock size={18} />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                      Regulasi K3: Perpanjangan Izin Kerja {data.extensionPhase ? `Ke-${data.extensionPhase} (Fase ${data.extensionPhase})` : "Lanjutan"}
                    </h5>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Berdasarkan standar K3 PT Widatra Bhakti, tiap 1 surat izin kerja berlaku maksimal <strong>{maxPermitDays > 0 ? `${maxPermitDays} hari kalender` : "fleksibel"}</strong> per lembar pengajuan. Proyek ini dapat diperpanjang berfase-fase, dan sistem menghitung akumulasi total hari kalender sejak Izin Induk pertama secara otomatis.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-200/80">
                  <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">
                      {data.extensionPhase && data.extensionPhase > 1 ? "Izin Induk & Acuan" : "Izin Acuan Induk"}
                    </span>
                    <strong className="text-slate-800 font-mono text-xs block truncate">
                      {data.rootPermitNumber || data.parentPermitNumber || "Izin Sebelumnya"}
                    </strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {data.extensionPhase && data.extensionPhase > 1 && data.parentPermitNumber && data.parentPermitNumber !== data.rootPermitNumber
                        ? `Lanjutan dari: ${data.parentPermitNumber}`
                        : (data.parentStartDate ? `Masa Awal: ${formatDateDDMMYY(data.rootStartDate || data.parentStartDate)}` : "Telah diverifikasi")}
                    </span>
                  </div>

                  <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">
                      Periode Aktif {data.extensionPhase ? `Fase ${data.extensionPhase}` : "Lanjutan"}
                    </span>
                    <strong className="text-blue-900 text-xs block">
                      {data.mulaiKerja ? `${formatDateDDMMYY(data.mulaiKerja)} s/d ${formatDateDDMMYY(data.selesaiKerja)}` : 'Pilih tanggal'}
                    </strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Durasi Izin: <span className="font-semibold text-blue-700">{calculateInclusiveDays(data.mulaiKerja, data.selesaiKerja)} Hari</span> {maxPermitDays > 0 ? `(Maks. ${maxPermitDays} Hari)` : "(Tanpa Batas)"}
                    </span>
                  </div>

                  <div className="bg-amber-100/90 p-2.5 rounded-lg border border-amber-300">
                    <span className="text-[10px] uppercase font-bold text-amber-900 block">Rentang Kumulatif Proyek</span>
                    <strong className="text-amber-950 text-xs font-bold font-mono block">
                      {formatDateDDMMYY(data.rootStartDate || data.parentStartDate || data.mulaiKerja)} s/d {formatDateDDMMYY(data.selesaiKerja)}
                    </strong>
                    <span className="text-[10px] text-amber-800 font-semibold block mt-0.5">
                      Total Akumulasi: {calculateInclusiveDays(data.rootStartDate || data.parentStartDate || data.mulaiKerja, data.selesaiKerja)} Hari Kalender
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Jam Kerja Mulai <span className="text-red-500">*</span></label>
              <input 
                id="jamKerjaMulai"
                type="time" 
                required
                value={data.jamKerjaMulai || "08:00"}
                onChange={(e) => updateData({ jamKerjaMulai: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Jam Kerja Selesai <span className="text-red-500">*</span></label>
              <input 
                id="jamKerjaAkhir"
                type="time" 
                required
                value={data.jamKerjaAkhir || "17:00"}
                onChange={(e) => updateData({ jamKerjaAkhir: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Lokasi Pekerjaan <span className="text-red-500">*</span></label>
              <input 
                id="lokasi"
                type="text" 
                list="master-locations-list"
                value={data.lokasi}
                onChange={(e) => updateData({ lokasi: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Pilih atau ketik lokasi kerja..."
              />
              <datalist id="master-locations-list">
                {locations.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Total Tenaga Kerja <span className="text-red-500">*</span></label>
              <input 
                id="totalTenagaKerja"
                type="number" 
                min={1}
                max={50}
                required
                value={data.totalTenagaKerja ?? ""}
                onChange={(e) => {
                  updateData({ totalTenagaKerja: e.target.value });
                }}
                onBlur={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (isNaN(val) || val < 1) {
                    updateData({ totalTenagaKerja: "1" });
                  }
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                placeholder="Jumlah orang (misal: 3)"
              />
            </div>
          </div>
        </div>

        {/* 2. Penanggung Jawab Pihak Vendor (Pihak Eksternal) */}
        <div className="bg-gradient-to-br from-blue-50/50 to-sky-50/30 p-5 rounded-xl border border-blue-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/70 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
                <HardHat size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Penanggung Jawab Vendor</h4>
                <p className="text-xs text-gray-500">Perwakilan rekanan/vendor pelaksana yang bertanggung jawab di lapangan.</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              Pihak Vendor / Kontraktor (Eksternal)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Nama Penanggung Jawab Vendor <span className="text-red-500">*</span>
              </label>
              <input 
                id="penanggungJawab"
                type="text" 
                required
                value={data.penanggungJawab}
                onChange={(e) => updateData({ penanggungJawab: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                placeholder="Nama lengkap PIC Vendor / Mandor"
              />
              <p className="text-[11px] text-gray-500">PIC vendor yang bertindak sebagai pemohon & penanggung jawab fisik pekerjaan.</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                No. HP Penanggung Jawab Vendor <span className="text-red-500">*</span>
              </label>
              <input 
                id="noHpPJ"
                type="tel" 
                required
                value={data.noHpPJ}
                onChange={(e) => updateData({ noHpPJ: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                placeholder="08xxxxxxxxxx"
              />
              <p className="text-[11px] text-gray-500">Nomor WhatsApp / telepon aktif PIC vendor yang dapat dihubungi setiap saat.</p>
            </div>
          </div>
        </div>

        {/* 3. Tim Pengawas Internal PT Widatra Bhakti */}
        <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-5 rounded-xl border border-emerald-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/70 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-sm">
                <Building2 size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Tim Pengawas Internal PT Widatra Bhakti</h4>
                <p className="text-xs text-gray-500">Petugas resmi internal PT Widatra Bhakti untuk pengawasan pekerjaan dan K3 di pabrik.</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              Internal PT Widatra Bhakti
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Row 1: Pengawas Pekerjaan */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Pengawas Pekerjaan (User Widatra) <span className="text-red-500">*</span>
              </label>
              <input 
                id="pengawasPekerjaan"
                type="text" 
                required
                value={data.pengawasPekerjaan}
                onChange={(e) => updateData({ pengawasPekerjaan: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                placeholder="Contoh: Bpk. Bambang (Dept. Produksi/Teknis)"
              />
              <p className="text-[11px] text-gray-500">User / PIC departemen internal PT Widatra Bhakti yang meminta pekerjaan ini.</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                No. HP Pengawas Pekerjaan <span className="text-red-500">*</span>
              </label>
              <input 
                id="noHpPengawas"
                type="tel" 
                required
                value={data.noHpPengawas}
                onChange={(e) => updateData({ noHpPengawas: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                placeholder="08xxxxxxxxxx"
              />
              <p className="text-[11px] text-gray-500">Nomor kontak PIC internal pengawas unit kerja Widatra.</p>
            </div>

            {/* Row 2: Pengawas K3/HSE */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Pengawas K3 / HSE Lapangan <span className="text-red-500">*</span>
              </label>
              <input 
                id="pengawasHse"
                type="text" 
                required
                value={data.pengawasHse || ""}
                onChange={(e) => updateData({ pengawasHse: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                placeholder="Contoh: Ahli K3 Umum / Safety Officer"
              />
              <p className="text-[11px] text-gray-500">Petugas K3 internal PT Widatra Bhakti yang memverifikasi kepatuhan JSA & APD.</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                No. HP Pengawas K3 / HSE <span className="text-red-500">*</span>
              </label>
              <input 
                id="noHpHse"
                type="tel" 
                required
                value={data.noHpHse || ""}
                onChange={(e) => updateData({ noHpHse: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                placeholder="085566778899"
              />
              <p className="text-[11px] text-gray-500">Nomor kontak darurat / tim K3 internal PT Widatra Bhakti.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
