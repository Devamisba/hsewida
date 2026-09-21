import { useState, useEffect } from "react";
import { ShieldAlert, Loader2, RefreshCw } from "lucide-react";
import { api } from "@/services/api";
import { 
  getRecommendedPpeForPermits, 
  calculateUpdatedPpeSelection 
} from "@/config/permitPpeMapping";

export function Step2PermitType({ data, updateData }: { data: any, updateData: any }) {
  const [permitTypes, setPermitTypes] = useState<string[]>([]);
  const [permitTypeOptions, setPermitTypeOptions] = useState<any[]>([]);
  const [ppeTypes, setPpeTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const loadMasterData = async () => {
      setLoading(true);
      try {
        const [permitRes, ppeRes] = await Promise.all([
          api.getPermitTypes(),
          api.getPpeOptions(),
        ]);

        if (isMounted) {
          if (permitRes.success && Array.isArray(permitRes.data)) {
            const activePermits = permitRes.data.filter((item: any) => item.is_active !== false);
            setPermitTypeOptions(activePermits);
            setPermitTypes(activePermits.map((item: any) => item.name));
          }
          if (ppeRes.success && Array.isArray(ppeRes.data)) {
            const activePpe = ppeRes.data
              .filter((item: any) => item.is_active !== false)
              .map((item: any) => item.name);
            setPpeTypes(activePpe);
          }
        }
      } catch (err) {
        console.error("Failed to load permit types / PPE options:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadMasterData();
    return () => { isMounted = false; };
  }, []);

  const handlePermitToggle = (type: string) => {
    const oldPermits = data.permitTypes || [];
    const newPermits = oldPermits.includes(type)
      ? oldPermits.filter((t: string) => t !== type)
      : [...oldPermits, type];

    // Otomatis sinkronkan APD berdasarkan jenis izin baru (menggunakan relasi default_ppes database)
    const updatedPpe = calculateUpdatedPpeSelection(
      oldPermits,
      newPermits,
      data.ppe || [],
      ppeTypes,
      permitTypeOptions
    );

    updateData({ 
      permitTypes: newPermits,
      ppe: updatedPpe
    });
  };

  const handlePpeToggle = (type: string) => {
    if (data.ppe.includes(type)) {
      updateData({ ppe: data.ppe.filter((t: string) => t !== type) });
    } else {
      updateData({ ppe: [...data.ppe, type] });
    }
  };

  const resetToK3Recommendations = () => {
    const rec = getRecommendedPpeForPermits(data.permitTypes || [], ppeTypes, permitTypeOptions);
    updateData({ ppe: rec });
  };

  const handleEquipmentChange = (index: number, value: string) => {
    const newEq = [...data.workEquipment];
    newEq[index] = value;
    updateData({ workEquipment: newEq });
  };

  const addEquipmentField = () => {
    updateData({ workEquipment: [...data.workEquipment, ""] });
  };

  // Filter out "Others" from regular permit list to avoid duplicate checkbox
  const regularPermitTypes = permitTypes.filter((t) => t.toLowerCase() !== "others");
  const isOthersPermitChecked = data.permitTypes.includes("Others");

  // Get current recommended PPEs for badges (menggunakan relasi default_ppes database)
  const recommendedPpes = getRecommendedPpeForPermits(data.permitTypes || [], ppeTypes, permitTypeOptions);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start gap-4 mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Permit Type, Equipment & APD</h3>
          <p className="text-sm text-gray-500">
            Tentukan jenis izin kerja. Sistem akan otomatis merekomendasikan APD wajib standar K3 yang sesuai.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
          <p className="text-sm">Memuat opsi izin kerja & APD dari database...</p>
        </div>
      ) : (
        <>
          {/* Permit Type */}
          <div id="section-permit-types" className="space-y-4 p-1 rounded-xl transition-all">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Type of Work Permit (Master Data)
              </h4>
              <span className="text-xs text-blue-600 font-medium">
                Pilih satu atau lebih jenis pekerjaan
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {regularPermitTypes.map((type) => {
                const isChecked = data.permitTypes.includes(type);
                return (
                  <label 
                    key={type} 
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      isChecked 
                        ? 'border-blue-500 bg-blue-50/60 shadow-xs' 
                        : 'border-gray-200 hover:bg-gray-50 bg-white'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => handlePermitToggle(type)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${isChecked ? 'font-semibold text-blue-900' : 'text-gray-700 font-medium'}`}>
                      {type}
                    </span>
                  </label>
                );
              })}
              
              {/* Single Others checkbox */}
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                isOthersPermitChecked 
                  ? 'border-blue-500 bg-blue-50/60 shadow-xs' 
                  : 'border-gray-200 hover:bg-gray-50 bg-white'
              }`}>
                <input 
                  type="checkbox" 
                  checked={isOthersPermitChecked}
                  onChange={() => handlePermitToggle("Others")}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className={`text-sm ${isOthersPermitChecked ? 'font-semibold text-blue-900' : 'text-gray-700 font-medium'}`}>
                  Others (Lainnya)
                </span>
              </label>
            </div>
            
            {isOthersPermitChecked && (
              <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Specify Other Permit Type <span className="text-red-500">*</span>
                </label>
                <input 
                  id="otherPermitType"
                  type="text" 
                  value={data.otherPermitType || ""}
                  onChange={(e) => updateData({ otherPermitType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Sebutkan jenis pekerjaan lainnya..."
                />
              </div>
            )}
          </div>

          {/* PPE / APD */}
          <div id="section-ppe" className="space-y-4 pt-6 border-t border-gray-100 p-1 rounded-xl transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Required PPE / APD (Master Data)
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  💡 APD wajib otomatis tercentang sesuai kategori izin kerja. Anda tetap dapat menambah atau menyesuaikan APD lainnya.
                </p>
              </div>
              {data.permitTypes?.length > 0 && (
                <button
                  type="button"
                  onClick={resetToK3Recommendations}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 self-start sm:self-center cursor-pointer flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors"
                  title="Kembalikan centang APD sesuai standar K3"
                >
                  <RefreshCw size={12} />
                  <span>Reset ke Standar K3</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {ppeTypes.map((type) => {
                const isRecommended = recommendedPpes.includes(type);
                const isChecked = data.ppe.includes(type);
                return (
                  <label 
                    key={type} 
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isChecked 
                        ? 'border-blue-300 bg-blue-50/50 shadow-xs' 
                        : 'border-gray-200 hover:bg-gray-50 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => handlePpeToggle(type)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 shrink-0"
                      />
                      <span className={`text-xs sm:text-sm truncate ${isChecked ? 'font-medium text-blue-900' : 'text-gray-700'}`}>
                        {type}
                      </span>
                    </div>
                    {isRecommended && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded shrink-0 ml-1">
                        K3
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Others (Specify)</label>
              <input 
                type="text" 
                value={data.otherPpe}
                onChange={(e) => updateData({ otherPpe: e.target.value })}
                className="w-full max-w-md px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Other PPE requirements..."
              />
            </div>
          </div>

          {/* Equipment */}
          <div className="space-y-4 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Work Equipment Used</h4>
              <button 
                type="button"
                onClick={addEquipmentField}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                + Add Field
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {data.workEquipment.map((eq: string, idx: number) => (
                <input 
                  key={idx}
                  type="text" 
                  value={eq}
                  onChange={(e) => handleEquipmentChange(idx, e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder={`Equipment ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
