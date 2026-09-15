import { useState, useEffect } from "react";
import { format, addDays, isBefore, startOfToday } from "date-fns";
import { ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import { auth } from "@/lib/auth";

export function Step1DataKontraktor({ data, updateData }: { data: any, updateData: any }) {
  const [minStartDate, setMinStartDate] = useState("");
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    const today = startOfToday();
    setMinStartDate(format(addDays(today, 3), 'yyyy-MM-dd')); // H-3 rule

    // Pre-fill vendor name and default shift/hse if available
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
      if (!data.totalTenagaKerja) updates.totalTenagaKerja = "1";
      if (Object.keys(updates).length > 0) {
        updateData(updates);
      }
    } catch {}

    // Load locations from master data
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
      const maxEnd = addDays(start, 5); // Start + 5 days = 6 days total validity
      
      if (data.selesaiKerja) {
        const currentEnd = new Date(data.selesaiKerja);
        if (isBefore(maxEnd, currentEnd) || isBefore(currentEnd, start)) {
          updateData({ selesaiKerja: format(maxEnd, 'yyyy-MM-dd') });
        }
      } else {
        updateData({ selesaiKerja: format(maxEnd, 'yyyy-MM-dd') });
      }
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateData({ selesaiKerja: e.target.value });
  };

  const maxEndDate = data.mulaiKerja ? format(addDays(new Date(data.mulaiKerja), 5), 'yyyy-MM-dd') : undefined;
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
                onChange={(e) => updateData({ requestType: e.target.value })}
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
                onChange={(e) => updateData({ requestType: e.target.value })}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="font-medium">Perpanjangan</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Nama Vendor <span className="text-red-500">*</span></label>
            <input 
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
              type="text" 
              value={data.jenisPekerjaan}
              onChange={(e) => updateData({ jenisPekerjaan: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Ex: Perbaikan pipa boiler"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Mulai Kerja (min. H-3) <span className="text-red-500">*</span></label>
            <input 
              type="date" 
              min={minStartDate}
              value={data.mulaiKerja}
              onChange={handleStartDateChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Selesai Kerja (maks. 6 hari) <span className="text-red-500">*</span></label>
            <input 
              type="date" 
              min={minEndDate}
              max={maxEndDate}
              value={data.selesaiKerja}
              onChange={handleEndDateChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Penanggung Jawab Vendor</label>
            <input 
              type="text" 
              value={data.penanggungJawab}
              onChange={(e) => updateData({ penanggungJawab: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">No. HP Penanggung Jawab</label>
            <input 
              type="tel" 
              value={data.noHpPJ}
              onChange={(e) => updateData({ noHpPJ: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Pengawas Pekerjaan</label>
            <input 
              type="text" 
              value={data.pengawasPekerjaan}
              onChange={(e) => updateData({ pengawasPekerjaan: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">No. HP Pengawas Pekerjaan</label>
            <input 
              type="tel" 
              value={data.noHpPengawas}
              onChange={(e) => updateData({ noHpPengawas: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Jam Kerja Mulai <span className="text-red-500">*</span></label>
            <input 
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
              type="time" 
              required
              value={data.jamKerjaAkhir || "17:00"}
              onChange={(e) => updateData({ jamKerjaAkhir: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Pengawas K3 / HSE Lapangan <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              value={data.pengawasHse || ""}
              onChange={(e) => updateData({ pengawasHse: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Contoh: Tim K3 Widatra / Safety Officer"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">No. HP Pengawas K3 / HSE <span className="text-red-500">*</span></label>
            <input 
              type="tel" 
              required
              value={data.noHpHse || ""}
              onChange={(e) => updateData({ noHpHse: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="085566778899"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Lokasi Pekerjaan <span className="text-red-500">*</span></label>
            <input 
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
              type="number" 
              min={1}
              max={50}
              required
              value={data.totalTenagaKerja || "1"}
              onChange={(e) => {
                const val = e.target.value;
                updateData({ totalTenagaKerja: val });
              }}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
              placeholder="Jumlah orang (misal: 3)"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
