import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { 
  ShieldCheck, 
  MapPin, 
  Building, 
  HardHat, 
  Plus, 
  CheckCircle2, 
  X,
  Save,
  Users
} from "lucide-react";
import { api } from "@/services/api";

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<"roles" | "locations" | "vendors" | "ppe">("roles");
  const [roles, setRoles] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [ppes, setPpes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State for Adding
  const [formData, setFormData] = useState<any>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "roles") {
        const res = await api.getRoles();
        if (res.success) setRoles(res.data);
      } else if (activeTab === "locations") {
        const res = await api.getLocations();
        if (res.success) setLocations(res.data);
      } else if (activeTab === "vendors") {
        const res = await apiRequest('/vendors');
        if (res.success) setVendors(res.data);
      } else if (activeTab === "ppe") {
        const res = await api.getPpeOptions();
        if (res.success) setPpes(res.data);
      }
    } catch (err) {
      console.warn("Error fetching data, using defaults:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeTab === "locations") {
        await apiRequest('/master/locations', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      } else if (activeTab === "vendors") {
        await apiRequest('/vendors', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      } else if (activeTab === "ppe") {
        await apiRequest('/master/ppe-options', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      } else if (activeTab === "roles") {
        await apiRequest('/master/roles', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      setModalOpen(false);
      setFormData({});
      fetchData();
    } catch (err: any) {
      alert("Gagal menyimpan data: " + err.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      <Header title="Master Data & Hak Akses" />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Manajemen Master Data</h2>
              <p className="text-sm text-gray-500 mt-1">
                Kelola data referensi, lokasi pabrik, rekanan vendor, dan wewenang hak akses.
                {loading && <span className="text-xs text-primary font-medium animate-pulse ml-2">Memuat data...</span>}
              </p>
            </div>
            
            <button
              onClick={() => { setFormData({}); setModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              <Plus size={18} /> Tambah Data {activeTab.toUpperCase()}
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-gray-200 pb-1">
            <button
              onClick={() => setActiveTab("roles")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === "roles" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <ShieldCheck size={18} /> Hak Akses (Roles)
            </button>
            <button
              onClick={() => setActiveTab("locations")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === "locations" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <MapPin size={18} /> Lokasi Pabrik
            </button>
            <button
              onClick={() => setActiveTab("vendors")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === "vendors" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <Building size={18} /> Rekanan Vendor
            </button>
            <button
              onClick={() => setActiveTab("ppe")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === "ppe" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <HardHat size={18} /> Opsi APD (PPE)
            </button>
          </div>

          {/* Tab 1: Roles */}
          {activeTab === "roles" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((r) => (
                <div key={r.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-1 bg-primary/10 text-primary font-bold text-xs rounded-full">
                      {r.code}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Users size={14} /> {r.users_count || 0} Pengguna
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{r.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.description || "Tidak ada deskripsi."}</p>
                  </div>
                  <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-1">
                    {r.permissions && r.permissions.map((p: any) => (
                      <span key={p.id} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {p.code}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Locations */}
          {activeTab === "locations" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Nama Area / Lokasi</th>
                    <th className="px-6 py-3.5">Keterangan</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {locations.map((loc) => (
                    <tr key={loc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2">
                        <MapPin size={16} className="text-primary" /> {loc.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{loc.description || "-"}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                          <CheckCircle2 size={12} /> Aktif
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3: Vendors */}
          {activeTab === "vendors" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Perusahaan Vendor</th>
                    <th className="px-6 py-3.5">Kontak Utama</th>
                    <th className="px-6 py-3.5">PIC Internal Widatra</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vendors.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{v.company_name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{v.address || "-"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{v.main_contact_name || "-"}</div>
                        <div className="text-xs text-gray-500">{v.main_contact_phone || "-"}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">
                        {v.pic_vendor_user ? v.pic_vendor_user.name : "Belum Ditentukan"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          v.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 4: PPE Options */}
          {activeTab === "ppe" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {ppes.map((item) => (
                <div key={item.id} className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 text-sm font-medium text-gray-800">
                  <HardHat size={16} className="text-amber-500 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Modal Add New Item */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Tambah Data {activeTab.toUpperCase()} Baru</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {activeTab === "locations" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Lokasi</label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: Gedung C Lantai 1"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Keterangan Area</label>
                    <textarea
                      placeholder="Uraian fungsi gedung/area..."
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary h-20 resize-none"
                    />
                  </div>
                </>
              )}

              {activeTab === "vendors" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Perusahaan Vendor</label>
                    <input
                      required
                      type="text"
                      placeholder="PT. Nama Vendor"
                      value={formData.company_name || ""}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Kontak Person / PIC</label>
                    <input
                      type="text"
                      placeholder="Nama Penanggung Jawab"
                      value={formData.main_contact_name || ""}
                      onChange={(e) => setFormData({ ...formData, main_contact_name: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">No. Telepon / WA</label>
                    <input
                      type="text"
                      placeholder="08xxxxxxxxxx"
                      value={formData.main_contact_phone || ""}
                      onChange={(e) => setFormData({ ...formData, main_contact_phone: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </>
              )}

              {activeTab === "ppe" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama APD Baru</label>
                  <input
                    required
                    type="text"
                    placeholder="Contoh: Kedok Las Otomatis"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-primary hover:opacity-90 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Save size={16} /> Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper fetch with auth
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = sessionStorage.getItem('authToken');
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };
  const res = await fetch(`http://localhost:8000/api/v1${endpoint}`, { ...options, headers });
  return res.json();
}
