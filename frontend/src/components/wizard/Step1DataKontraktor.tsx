import { useState, useEffect } from "react";
import { format, addDays, isBefore, startOfToday } from "date-fns";
import { ClipboardList, HardHat, Building2, CalendarClock } from "lucide-react";
import { cn, calculateInclusiveDays } from "@/lib/utils";
import { api } from "@/services/api";
import { auth } from "@/lib/auth";

export function Step1DataKontraktor({ data, updateData }: { data: any, updateData: any }) {
  const [minStartDate, setMinStartDate] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [maxPermitDays, setMaxPermitDays] = useState(6);
  const [minLeadDays, setMinLeadDays] = useState(3);

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
      if (!data.pengawasHse) updates.pengawasHse = "Tim K3 Widatra / HSE Lapangan";
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
  }, []);
  
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    updateData({ mulaiKerja: newStart });
    
    // Auto adjust end date if it's invalid or empty
    if (newStart) {
      const start = new Date(newStart);
      if (maxPermitDays > 0) {
        const maxEnd = addDays(start, Math.max(0, maxPermitDays - 1));
        
        if (data.selesaiKerja) {
          const currentEnd = new Date(data.selesaiKerja);
          if (isBefore(maxEnd, currentEnd) || isBefore(currentEnd, start)) {
            updateData({ selesaiKerja: format(maxEnd, 'yyyy-MM-dd') });
          }
        } else {
          updateData({ selesaiKerja: format(maxEnd, 'yyyy-MM-dd') });
        }
      } else {
        // Unlimited duration: ensure selesaiKerja does not precede start date
        if (data.selesaiKerja) {
          const currentEnd = new Date(data.selesaiKerja);
          if (isBefore(currentEnd, start)) {
            updateData({ selesaiKerja: newStart });
          }
        } else {
          updateData({ selesaiKerja: newStart });
        }
      }
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateData({ selesaiKerja: e.target.value });
  };

  const maxEndDate = (maxPermitDays > 0 && data.mulaiKerja) ? format(addDays(new Date(data.mulaiKerja), Math.max(0, maxPermitDays - 1)), 'yyyy-MM-dd') : undefined;
  const minEndDate = data.mulaiKerja ? data.mulaiKerja : undefined;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start gap-4 mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <ClipboardList size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Ijin Kerja & Data Vendor</h3>
          <p className="text-sm text-gray-500">Data dasar pengajuan izin kerja. Harap isi dengan lengkap dan sesuai dengan kontrak.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Jenis Permohonan</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={cn(
              "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
              data.requestType === "Baru" ? "border-blue-500 bg-blue-50/50 text-blue-700 ring-1 ring-blue-500" : "border-gray-200 bg-white hover:bg-gray-50"
            )}>
              <input 
                type="radio" 
                name="requestType" 
                value="Baru" 
                checked={data.requestType === "Baru"} 
                onChange={(e) => {
                  const val = e.target.value;
                  updateData({ requestType: val });
                  setMinStartDate(format(addDays(startOfToday(), minLeadDays), 'yyyy-MM-dd'));
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="font-medium">Baru</span>
            </label>
            <label className={cn(
              "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
              data.requestType === "Perpanjangan" ? "border-blue-500 bg-blue-50/50 text-blue-700 ring-1 ring-blue-500" : "border-gray-200 bg-white hover:bg-gray-50"
            )}>
              <input 
                type="radio" 
                name="requestType" 
                value="Perpanjangan" 
                checked={data.requestType === "Perpanjangan"} 
                onChange={(e) => {
                  const val = e.target.value;
                  updateData({ requestType: val });
                  setMinStartDate(format(startOfToday(), 'yyyy-MM-dd'));
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="font-medium">Perpanjangan</span>
            </label>
          </div>
        </div>

        {/* 1. Detail Pekerjaan & Jadwal */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Informasi Umum & Jadwal Pekerjaan</h4>
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
              <input 
                id="mulaiKerja"
                type="date" 
                min={minStartDate}
                value={data.mulaiKerja}
                onChange={handleStartDateChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Selesai Kerja {maxPermitDays > 0 ? `(maks. ${maxPermitDays} hari)` : "(Tanpa Batas Hari)"} <span className="text-red-500">*</span>
              </label>
              <input 
                id="selesaiKerja"
                type="date" 
                min={minEndDate}
                max={maxEndDate}
                value={data.selesaiKerja}
                onChange={handleEndDateChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {data.requestType === "Perpanjangan" && (
              <div className="md:col-span-2 p-4 bg-amber-50/90 border border-amber-200 rounded-xl space-y-3 animate-in fade-in duration-300">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-amber-200 text-amber-900 rounded-lg shrink-0 mt-0.5">
                    <CalendarClock size={18} />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                      Regulasi K3: Masa Aktif Perpanjangan & Kumulatif Proyek
                    </h5>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Berdasarkan standar K3 PT Widatra Bhakti, {maxPermitDays > 0 ? (
                        <>1 surat ijin kerja berlaku maksimal <strong>{maxPermitDays} hari kalender</strong> (Dihitung per dokumen).</>
                      ) : (
                        <>durasi surat ijin kerja bersifat <strong>fleksibel tanpa batasan hari maksimal</strong>.</>
                      )} Periode di atas adalah masa aktif lanjutan izin ini, dan sistem menghitung akumulasi total hari proyek secara otomatis.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-200/80">
                  <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">Ijin Acuan Induk</span>
                    <strong className="text-slate-800 font-mono text-xs block truncate">
                      {data.parentPermitNumber || "SIKA Sebelumnya"}
                    </strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {data.parentStartDate ? `Periode: ${data.parentStartDate} s/d ${data.parentEndDate || '-'}` : "Telah diverifikasi"}
                    </span>
                  </div>

                  <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">Periode Aktif Lanjutan</span>
                    <strong className="text-blue-900 text-xs block">
                      {data.mulaiKerja ? `${data.mulaiKerja} s/d ${data.selesaiKerja || '...'}` : 'Pilih tanggal'}
                    </strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Durasi Izin: <span className="font-semibold text-blue-700">{calculateInclusiveDays(data.mulaiKerja, data.selesaiKerja)} Hari</span> {maxPermitDays > 0 ? `(Maks. ${maxPermitDays} Hari)` : "(Tanpa Batas)"}
                    </span>
                  </div>

                  <div className="bg-amber-100/90 p-2.5 rounded-lg border border-amber-300">
                    <span className="text-[10px] uppercase font-bold text-amber-900 block">Rentang Kumulatif Proyek</span>
                    <strong className="text-amber-950 text-xs font-bold font-mono block">
                      {data.parentStartDate || data.mulaiKerja || '...'} s/d {data.selesaiKerja || '...'}
                    </strong>
                    <span className="text-[10px] text-amber-800 font-semibold block mt-0.5">
                      Total Akumulasi: {calculateInclusiveDays(data.parentStartDate || data.mulaiKerja, data.selesaiKerja)} Hari Kalender
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
                placeholder="Contoh: Tim K3 Widatra / Safety Officer"
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
