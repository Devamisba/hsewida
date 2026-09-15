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
  Users, 
  UserCheck, 
  KeyRound, 
  Edit3, 
  Trash2, 
  Search, 
  FileText, 
  AlertTriangle, 
  Clock, 
  GitFork, 
  RefreshCw,
  CheckSquare,
  Square
} from "lucide-react";
import { api } from "@/services/api";

type MainTab = "users_roles" | "permit_types" | "ppe" | "workflow" | "locations_vendors";

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<MainTab>("users_roles");
  const [userSubTab, setUserSubTab] = useState<"users" | "roles">("users");
  const [locVendorSubTab, setLocVendorSubTab] = useState<"locations" | "vendors">("locations");

  // Data States
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissionsGrouped, setPermissionsGrouped] = useState<Record<string, any[]>>({});
  const [permitTypes, setPermitTypes] = useState<any[]>([]);
  const [ppes, setPpes] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [workflowStages, setWorkflowStages] = useState<any[]>([]);
  const [terminalStatuses, setTerminalStatuses] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Search & Filter
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");

  // Modals
  const [modalType, setModalType] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // Fetch data on active tab change
  const fetchCurrentTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === "users_roles") {
        const [uRes, rRes, pRes] = await Promise.all([
          api.getUsers(),
          api.getRoles(),
          api.getPermissions()
        ]);
        if (uRes?.success) setUsers(uRes.data);
        if (rRes?.success) setRoles(rRes.data);
        if (pRes?.success) setPermissionsGrouped(pRes.data);
      } else if (activeTab === "permit_types") {
        const res = await api.getPermitTypes();
        if (res?.success) setPermitTypes(res.data);
      } else if (activeTab === "ppe") {
        const res = await api.getPpeOptions();
        if (res?.success) setPpes(res.data);
      } else if (activeTab === "workflow") {
        const res = await api.getWorkflowStages();
        if (res?.success) {
          setWorkflowStages(res.data.stages || []);
          setTerminalStatuses(res.data.terminal_statuses || []);
        }
      } else if (activeTab === "locations_vendors") {
        const [lRes, vRes] = await Promise.all([
          api.getLocations(),
          api.getVendors()
        ]);
        if (lRes?.success) setLocations(lRes.data);
        if (vRes?.success) setVendors(vRes.data);
      }
    } catch (err: any) {
      console.warn("Failed fetching master data:", err.message);
      showFeedback("error", "Gagal memuat data dari server backend: " + (err.message || "Periksa koneksi backend"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentTabData();
  }, [activeTab]);

  // Open Add Modal
  const handleOpenAdd = (type: string) => {
    setEditingItem(null);
    setFormData({});
    setSelectedPermissions([]);
    setModalType(type);
  };

  // Open Edit Modal
  const handleOpenEdit = (type: string, item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    if (type === "role_permissions" || type === "edit_role") {
      setSelectedPermissions(item.permissions ? item.permissions.map((p: any) => p.id) : []);
    }
    setModalType(type);
  };

  // Generic Save Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (modalType === "user") {
        if (editingItem) {
          await api.updateUser(editingItem.id, formData);
          showFeedback("success", `Data pengguna ${formData.name || ''} berhasil diperbarui.`);
        } else {
          await api.createUser(formData);
          showFeedback("success", `Pengguna baru ${formData.name} berhasil didaftarkan.`);
        }
      } else if (modalType === "reset_password") {
        await api.resetUserPassword(editingItem.id, formData.new_password);
        showFeedback("success", `Password untuk ${editingItem.name} berhasil diatur ulang.`);
      } else if (modalType === "role") {
        const payload = { ...formData, permission_ids: selectedPermissions };
        if (editingItem) {
          await api.updateRole(editingItem.id, payload);
          showFeedback("success", `Role ${formData.name} berhasil diperbarui.`);
        } else {
          await api.createRole(payload);
          showFeedback("success", `Role ${formData.name} berhasil dibuat.`);
        }
      } else if (modalType === "role_permissions") {
        await api.updateRolePermissions(editingItem.id, selectedPermissions);
        showFeedback("success", `Hak akses untuk role ${editingItem.name} berhasil diperbarui.`);
      } else if (modalType === "permit_type") {
        if (editingItem) {
          await api.updatePermitType(editingItem.id, formData);
          showFeedback("success", "Kategori izin kerja berhasil diperbarui.");
        } else {
          await api.createPermitType(formData);
          showFeedback("success", "Kategori izin kerja berhasil ditambahkan.");
        }
      } else if (modalType === "ppe") {
        if (editingItem) {
          await api.updatePpeOption(editingItem.id, formData);
          showFeedback("success", "Item APD berhasil diperbarui.");
        } else {
          await api.createPpeOption(formData);
          showFeedback("success", "Item APD baru berhasil ditambahkan.");
        }
      } else if (modalType === "location") {
        if (editingItem) {
          await api.updateLocation(editingItem.id, formData);
          showFeedback("success", "Lokasi pabrik berhasil diperbarui.");
        } else {
          await api.createLocation(formData);
          showFeedback("success", "Lokasi baru berhasil ditambahkan.");
        }
      } else if (modalType === "vendor") {
        if (editingItem) {
          await api.updateVendor(editingItem.id, formData);
          showFeedback("success", "Data vendor rekanan berhasil diperbarui.");
        } else {
          await api.createVendor(formData);
          showFeedback("success", "Vendor rekanan baru berhasil didaftarkan.");
        }
      }

      setModalType(null);
      setFormData({});
      setEditingItem(null);
      fetchCurrentTabData();
    } catch (err: any) {
      showFeedback("error", err.message || "Gagal menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  // Delete Handler
  const handleDelete = async (type: string, id: number, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus/menonaktifkan data "${name}"?`)) return;

    setLoading(true);
    try {
      if (type === "user") await api.deleteUser(id);
      else if (type === "role") await api.deleteRole(id);
      else if (type === "permit_type") await api.deletePermitType(id);
      else if (type === "ppe") await api.deletePpeOption(id);
      else if (type === "location") await api.deleteLocation(id);
      else if (type === "vendor") await api.deleteVendor(id);

      showFeedback("success", `Data "${name}" berhasil dihapus.`);
      fetchCurrentTabData();
    } catch (err: any) {
      showFeedback("error", err.message || "Gagal menghapus data.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle permission in matrix
  const togglePermission = (permId: number) => {
    setSelectedPermissions(prev => 
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchSearch = userSearch === "" || 
      (u.nik && u.nik.toLowerCase().includes(userSearch.toLowerCase())) ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.company_name && u.company_name.toLowerCase().includes(userSearch.toLowerCase()));
    const matchRole = userRoleFilter === "" || (u.role && u.role.code === userRoleFilter);
    return matchSearch && matchRole;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden relative font-sans">
      <Header title="Master Data & Hak Akses" />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Feedback Toast Banner */}
          {feedbackMsg && (
            <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
              feedbackMsg.type === "success" 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}>
              <div className="flex items-center gap-2 text-sm font-medium">
                {feedbackMsg.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                <span>{feedbackMsg.text}</span>
              </div>
              <button onClick={() => setFeedbackMsg(null)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Page Title & Main Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Manajemen Master Data Industri</h2>
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">PT Widatra Bhakti</span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Kelola hak akses pengguna (RBAC), jenis izin kerja, APD terstandar, alur persetujuan K3, lokasi pabrik, dan rekanan kontraktor.
                {loading && <span className="text-xs text-blue-600 font-semibold animate-pulse ml-2">Sinkronisasi database...</span>}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchCurrentTabData}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                title="Refresh Data"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>

              {activeTab === "users_roles" && userSubTab === "users" && (
                <button
                  onClick={() => handleOpenAdd("user")}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                >
                  <Plus size={18} /> Tambah
                </button>
              )}

              {activeTab === "users_roles" && userSubTab === "roles" && (
                <button
                  onClick={() => handleOpenAdd("role")}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                >
                  <Plus size={18} /> Tambah
                </button>
              )}

              {activeTab === "permit_types" && (
                <button
                  onClick={() => handleOpenAdd("permit_type")}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                >
                  <Plus size={18} /> Tambah
                </button>
              )}

              {activeTab === "ppe" && (
                <button
                  onClick={() => handleOpenAdd("ppe")}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                >
                  <Plus size={18} /> Tambah
                </button>
              )}

              {activeTab === "locations_vendors" && locVendorSubTab === "locations" && (
                <button
                  onClick={() => handleOpenAdd("location")}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                >
                  <Plus size={18} /> Tambah
                </button>
              )}

              {activeTab === "locations_vendors" && locVendorSubTab === "vendors" && (
                <button
                  onClick={() => handleOpenAdd("vendor")}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                >
                  <Plus size={18} /> Tambah
                </button>
              )}
            </div>
          </div>

          {/* 5 Navigation Tabs Utama */}
          <div className="flex border-b border-slate-200 bg-white rounded-xl p-1.5 shadow-sm overflow-x-auto gap-1">
            <button
              onClick={() => setActiveTab("users_roles")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "users_roles" ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ShieldCheck size={18} /> Hak Akses & Pengguna (RBAC)
            </button>
            <button
              onClick={() => setActiveTab("permit_types")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "permit_types" ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <FileText size={18} /> Jenis Izin Kerja (Permit Types)
            </button>
            <button
              onClick={() => setActiveTab("ppe")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "ppe" ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <HardHat size={18} /> Alat Pelindung Diri (PPE / APD)
            </button>
            <button
              onClick={() => setActiveTab("workflow")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "workflow" ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <GitFork size={18} /> Status Workflow & Approval
            </button>
            <button
              onClick={() => setActiveTab("locations_vendors")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "locations_vendors" ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Building size={18} /> Lokasi Pabrik & Rekanan Vendor
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: HAK AKSES & PENGGUNA (USERS & ROLES) */}
          {/* ========================================================================= */}
          {activeTab === "users_roles" && (
            <div className="space-y-6">
              {/* Sub-tab switcher */}
              <div className="flex items-center justify-between">
                <div className="inline-flex bg-slate-200/80 p-1 rounded-xl gap-1">
                  <button
                    onClick={() => setUserSubTab("users")}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      userSubTab === "users" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Users size={16} /> Daftar Pengguna ({users.length})
                  </button>
                  <button
                    onClick={() => setUserSubTab("roles")}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      userSubTab === "roles" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <ShieldCheck size={16} /> Peran & Wewenang ({roles.length})
                  </button>
                </div>
              </div>

              {/* Sub 1A: USERS MANAGEMENT TABLE */}
              {userSubTab === "users" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-between">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        placeholder="Cari nama, email, perusahaan..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Semua Peran (Roles)</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.code}>{r.name} ({r.code})</option>
                      ))}
                    </select>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-y border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                        <tr>
                          <th className="px-5 py-3.5">Nama, NIK & Kontak</th>
                          <th className="px-5 py-3.5">Peran / Role</th>
                          <th className="px-5 py-3.5">Instansi / Departemen</th>
                          <th className="px-5 py-3.5">No. Telepon</th>
                          <th className="px-5 py-3.5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-5 py-4">
                                <div className="font-bold text-slate-900">{u.name}</div>
                                <div className="text-xs font-mono font-semibold text-blue-600">NIK: {u.nik || "-"}</div>
                                <div className="text-xs text-slate-400">{u.email}</div>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                  u.role?.code === 'admin' ? 'bg-purple-100 text-purple-800' :
                                  u.role?.code === 'hse' ? 'bg-emerald-100 text-emerald-800' :
                                  u.role?.code === 'ga_dept_head' || u.role?.code === 'ga_div_head' ? 'bg-amber-100 text-amber-800' :
                                  u.role?.code === 'pic_vendor' ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {u.role ? u.role.name : "Tanpa Role"}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-slate-700">
                                <div className="font-medium">{u.company_name || "PT Widatra Bhakti"}</div>
                                <div className="text-xs text-slate-400">{u.department || "-"}</div>
                              </td>
                              <td className="px-5 py-4 text-slate-600 font-mono text-xs">{u.phone_number || "-"}</td>
                              <td className="px-5 py-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenEdit("user", u)}
                                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit Pengguna"
                                  >
                                    <Edit3 size={16} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingItem(u);
                                      setFormData({ new_password: "" });
                                      setModalType("reset_password");
                                    }}
                                    className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                    title="Reset Password"
                                  >
                                    <KeyRound size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete("user", u.id, u.name)}
                                    className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Hapus / Nonaktifkan"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center py-10 text-slate-400">
                              Tidak ada data pengguna yang cocok dengan pencarian.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub 1B: ROLES & DYNAMIC PERMISSIONS MATRIX */}
              {userSubTab === "roles" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {roles.map((r) => (
                    <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className={`px-2.5 py-1 font-extrabold text-xs rounded-lg uppercase tracking-wider font-mono ${
                            r.code === 'admin' ? 'bg-purple-100 text-purple-800' :
                            r.code === 'hse' ? 'bg-emerald-100 text-emerald-800' :
                            r.code === 'ga_dept_head' || r.code === 'ga_div_head' ? 'bg-amber-100 text-amber-800' :
                            r.code === 'pic_vendor' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {r.code}
                          </span>
                          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                            <Users size={14} className="text-slate-400" /> {r.users_count || 0} Pengguna
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">{r.name}</h3>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-3">{r.description || "Tidak ada rincian deskripsi tanggung jawab."}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                          <span className="text-xs font-bold text-slate-600 block w-full mb-1">
                            Hak Akses ({r.permissions ? r.permissions.length : 0} Wewenang):
                          </span>
                          {r.permissions && r.permissions.slice(0, 5).map((p: any) => (
                            <span key={p.id} className="text-xs bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-md">
                              {p.name}
                            </span>
                          ))}
                          {r.permissions && r.permissions.length > 5 && (
                            <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded-md">
                              +{r.permissions.length - 5} lainnya
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons for Role */}
                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleOpenEdit("role_permissions", r)}
                          className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <ShieldCheck size={14} /> Atur Hak Akses
                        </button>
                        <button
                          onClick={() => handleOpenEdit("role", r)}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors"
                          title="Edit Info Role"
                        >
                          <Edit3 size={15} />
                        </button>
                        {!['pemohon', 'pic_vendor', 'hse', 'ga_dept_head', 'ga_div_head', 'admin'].includes(r.code) && (
                          <button
                            onClick={() => handleDelete("role", r.id, r.name)}
                            className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Hapus Role"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: JENIS IZIN KERJA (PERMIT TYPES) */}
          {/* ========================================================================= */}
          {activeTab === "permit_types" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Katalog Jenis Izin Kerja (Work Permit Categories)</h3>
                <p className="text-xs text-slate-500">Izin kerja terdaftar yang wajib dipilih kontraktor saat mengajukan izin kerja di pabrik.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-y border-slate-200 text-xs font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="px-5 py-3.5">Nama Kategori Izin</th>
                      <th className="px-5 py-3.5 text-center">Klasifikasi Risiko K3</th>
                      <th className="px-5 py-3.5 text-center">Status</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {permitTypes.map((pt) => {
                      const isHigh = ['Confined Space', 'Hot Work', 'Work at Height', 'High Voltage Electricity', 'Heavy Lifting', 'Ijin Kerja Panas', 'Ijin Kerja Ketinggian', 'Ijin Kerja Ruang Terbatas'].some(k => pt.name.toLowerCase().includes(k.toLowerCase()));
                      return (
                        <tr key={pt.id} className="hover:bg-slate-50">
                          <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2">
                            <FileText size={16} className="text-blue-600" /> {pt.name}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold ${
                              isHigh ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {isHigh ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                              {isHigh ? "High Risk (Risiko Tinggi)" : "General Risk (Normal)"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                              <CheckCircle2 size={12} /> Aktif
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit("permit_type", pt)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Edit"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete("permit_type", pt.id, pt.name)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="Hapus"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ALAT PELINDUNG DIRI (PPE / APD) */}
          {/* ========================================================================= */}
          {activeTab === "ppe" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Standar Alat Pelindung Diri (PPE / APD Wajib)</h3>
                  <p className="text-xs text-slate-500">Daftar kelengkapan keselamatan yang wajib digunakan pekerja di area PT Widatra Bhakti.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {ppes.map((item) => (
                  <div key={item.id} className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        ['safety helmet', 'safety shoes', 'safety glasses', 'gloves', 'ear plug/muff', 'face shield'].includes(item.name.toLowerCase()) ? 'bg-blue-50 text-blue-600' :
                        ['body harness', 'lifeline', 'respiratory protection', 'breathing apparatus'].includes(item.name.toLowerCase()) ? 'bg-orange-50 text-orange-600' :
                        ['fire extinguisher'].includes(item.name.toLowerCase()) ? 'bg-red-50 text-red-600' :
                        ['barricade', 'safety line', 'sign', 'scaffolding'].includes(item.name.toLowerCase()) ? 'bg-amber-50 text-amber-600' :
                        ['safety net', 'stairs'].includes(item.name.toLowerCase()) ? 'bg-emerald-50 text-emerald-600' :
                        'bg-slate-50 text-slate-600'
                      }`}>
                        <HardHat size={16} />
                      </div>
                      <span className="text-sm font-bold text-slate-800 truncate" title={item.name}>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit("ppe", item)}
                        className="p-1 text-slate-400 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete("ppe", item.id, item.name)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: STATUS WORKFLOW & APPROVAL PIPELINE */}
          {/* ========================================================================= */}
          {activeTab === "workflow" && (
            <div className="space-y-6">
              {/* Stepper Pipeline Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Alur Persetujuan Bertingkat Ijin Kerja (Approval Pipeline)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Urutan tahapan verifikasi hukum & keselamatan kerja pabrik sesuai SOP PT Widatra Bhakti.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                  {workflowStages.map((st) => (
                    <div key={st.step} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 relative flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center">
                            {st.step}
                          </span>
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock size={12} /> {st.sla_label}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{st.status_name}</h4>
                        <div className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                          <UserCheck size={14} className="text-blue-600" /> {st.role_name}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{st.description}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Kriteria Wajib:</span>
                        <ul className="text-[11px] text-slate-700 space-y-0.5">
                          {st.mandatory_items.map((m: string, i: number) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-emerald-500 font-bold">•</span>
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terminal Statuses Dictionary */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900">Kamus Status Operasional Permit</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {terminalStatuses.map(ts => (
                    <div key={ts.code} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                      <div className="font-bold text-xs text-slate-900">{ts.name}</div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{ts.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: LOKASI PABRIK & REKANAN VENDOR */}
          {/* ========================================================================= */}
          {activeTab === "locations_vendors" && (
            <div className="space-y-6">
              <div className="inline-flex bg-slate-200/80 p-1 rounded-xl gap-1">
                <button
                  onClick={() => setLocVendorSubTab("locations")}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    locVendorSubTab === "locations" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <MapPin size={16} /> Lokasi Pabrik ({locations.length})
                </button>
                <button
                  onClick={() => setLocVendorSubTab("vendors")}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    locVendorSubTab === "vendors" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Building size={16} /> Rekanan Vendor ({vendors.length})
                </button>
              </div>

              {/* Sub 5A: LOCATIONS TABLE */}
              {locVendorSubTab === "locations" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                      <tr>
                        <th className="px-6 py-3.5">Nama Area / Lokasi Pabrik</th>
                        <th className="px-6 py-3.5">Keterangan / Fungsi Bangunan</th>
                        <th className="px-6 py-3.5 text-center">Status</th>
                        <th className="px-6 py-3.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {locations.map((loc) => (
                        <tr key={loc.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                            <MapPin size={16} className="text-blue-600" /> {loc.name}
                          </td>
                          <td className="px-6 py-4 text-slate-600">{loc.description || "-"}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                              <CheckCircle2 size={12} /> Aktif
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit("location", loc)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Edit"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete("location", loc.id, loc.name)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="Hapus"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sub 5B: VENDORS TABLE */}
              {locVendorSubTab === "vendors" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                      <tr>
                        <th className="px-6 py-3.5">Perusahaan Kontraktor</th>
                        <th className="px-6 py-3.5">Kontak Utama / PJ</th>
                        <th className="px-6 py-3.5">PIC Internal PT Widatra</th>
                        <th className="px-6 py-3.5 text-center">Status</th>
                        <th className="px-6 py-3.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vendors.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{v.company_name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{v.address || "-"}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-800">{v.main_contact_name || "-"}</div>
                            <div className="text-xs text-slate-500">{v.main_contact_phone || "-"}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-700 font-medium">
                            {v.pic_vendor_user ? v.pic_vendor_user.name : "Belum Ditugaskan"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                              v.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {v.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit("vendor", v)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Edit"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete("vendor", v.id, v.company_name)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="Hapus"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ========================================================================= */}
      {/* ALL MODAL DIALOGS */}
      {/* ========================================================================= */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-extrabold text-slate-900 text-base">
                {modalType === "user" && (editingItem ? "Edit Data Pengguna" : "Tambah Pengguna Baru")}
                {modalType === "reset_password" && `Reset Password — ${editingItem?.name}`}
                {modalType === "role" && (editingItem ? "Edit Informasi Role" : "Tambah Role Baru")}
                {modalType === "role_permissions" && `Atur Hak Akses Role: ${editingItem?.name}`}
                {modalType === "permit_type" && (editingItem ? "Edit Jenis Izin Kerja" : "Tambah Jenis Izin Kerja Baru")}
                {modalType === "ppe" && (editingItem ? "Edit Item APD" : "Tambah Item APD Baru")}
                {modalType === "location" && (editingItem ? "Edit Lokasi Pabrik" : "Tambah Lokasi Baru")}
                {modalType === "vendor" && (editingItem ? "Edit Rekanan Vendor" : "Daftarkan Vendor Rekanan")}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">

              {/* 1. FORM USER */}
              {modalType === "user" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">NIK (Nomor Induk Karyawan / Rekanan) *</label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: SA12345, VN10001"
                      value={formData.nik || ""}
                      onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Lengkap *</label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: Budi Santoso"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Perusahaan / Login *</label>
                    <input
                      required
                      type="email"
                      placeholder="nama@hse.com"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {!editingItem && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password Awal *</label>
                      <input
                        required
                        type="password"
                        placeholder="Minimal 6 karakter"
                        value={formData.password || ""}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Peran / Role Pengguna *</label>
                    <select
                      required
                      value={formData.role_id || ""}
                      onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Pilih Peran...</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Perusahaan / Kontraktor</label>
                      <input
                        type="text"
                        placeholder="PT Widatra Bhakti / PT Vendor"
                        value={formData.company_name || ""}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Departemen</label>
                      <input
                        type="text"
                        placeholder="HSE, GA, Maintenance, dll"
                        value={formData.department || ""}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">No. WhatsApp / HP</label>
                    <input
                      type="text"
                      placeholder="08xxxxxxxxxx"
                      value={formData.phone_number || ""}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* 2. FORM RESET PASSWORD */}
              {modalType === "reset_password" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password Baru *</label>
                  <input
                    required
                    type="password"
                    placeholder="Masukkan password baru min 6 karakter"
                    value={formData.new_password || ""}
                    onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-2">Password akan langsung diperbarui di database dan pengguna dapat login dengan password ini.</p>
                </div>
              )}

              {/* 3. FORM ROLE (CREATE / EDIT INFO) */}
              {modalType === "role" && (
                <>
                  {!editingItem && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kode Unik Role *</label>
                      <input
                        required
                        type="text"
                        placeholder="Contoh: safety_inspector"
                        value={formData.code || ""}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                      <span className="text-[11px] text-slate-400">Gunakan huruf kecil tanpa spasi (cth: supervisor_area)</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Tampilan Role *</label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: Pengawas K3 Lapangan"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Uraian Tanggung Jawab / Deskripsi</label>
                    <textarea
                      placeholder="Tugas dan wewenang role..."
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                    />
                  </div>

                  {/* Checklist permissions if creating new role */}
                  {!editingItem && Object.keys(permissionsGrouped).length > 0 && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Pilih Wewenang Hak Akses Awal:</label>
                      <div className="max-h-48 overflow-y-auto space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        {Object.entries(permissionsGrouped).map(([group, perms]) => (
                          <div key={group} className="space-y-1">
                            <span className="text-xs font-bold text-blue-700">{group}</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2">
                              {perms.map((p: any) => {
                                const isChecked = selectedPermissions.includes(p.id);
                                return (
                                  <label key={p.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => togglePermission(p.id)}
                                      className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>{p.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 4. FORM ROLE PERMISSIONS MATRIX MODAL */}
              {modalType === "role_permissions" && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Centang hak akses yang diizinkan untuk peran <strong className="text-slate-900">{editingItem?.name}</strong>:
                  </p>

                  <div className="space-y-4">
                    {Object.entries(permissionsGrouped).map(([group, perms]) => (
                      <div key={group} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="font-extrabold text-xs uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                          <ShieldCheck size={14} /> {group}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {perms.map((p: any) => {
                            const isChecked = selectedPermissions.includes(p.id);
                            return (
                              <button
                                type="button"
                                key={p.id}
                                onClick={() => togglePermission(p.id)}
                                className={`p-2 rounded-lg border text-left flex items-start gap-2 text-xs transition-colors ${
                                  isChecked 
                                    ? "bg-blue-100/60 border-blue-300 text-blue-900 font-bold" 
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                {isChecked ? <CheckSquare size={16} className="text-blue-600 shrink-0 mt-0.5" /> : <Square size={16} className="text-slate-300 shrink-0 mt-0.5" />}
                                <div>
                                  <div className="leading-tight">{p.name}</div>
                                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">{p.code}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. FORM PERMIT TYPE */}
              {modalType === "permit_type" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Kategori Izin *</label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: Ijin Kerja Ruang Terbatas (Confined Space)"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* 6. FORM PPE */}
              {modalType === "ppe" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Alat Pelindung Diri (APD) *</label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: Kedok Las Otomatis / Filter Respirator A2P3"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* 7. FORM LOCATION */}
              {modalType === "location" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Lokasi / Area Pabrik *</label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: Gedung C Lantai 2 — Cleanroom"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Uraian / Keterangan Area</label>
                    <textarea
                      placeholder="Fungsi gedung atau batasan keselamatan..."
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                    />
                  </div>
                </>
              )}

              {/* 8. FORM VENDOR */}
              {modalType === "vendor" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Perusahaan Vendor *</label>
                    <input
                      required
                      type="text"
                      placeholder="PT Nama Vendor"
                      value={formData.company_name || ""}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Alamat Kantor</label>
                    <input
                      type="text"
                      placeholder="Jl. Raya..."
                      value={formData.address || ""}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kontak Person (PIC)</label>
                      <input
                        type="text"
                        placeholder="Nama penanggung jawab"
                        value={formData.main_contact_name || ""}
                        onChange={(e) => setFormData({ ...formData, main_contact_name: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">No. WhatsApp / HP</label>
                      <input
                        type="text"
                        placeholder="08xxxxxxxxxx"
                        value={formData.main_contact_phone || ""}
                        onChange={(e) => setFormData({ ...formData, main_contact_phone: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status Rekanan</label>
                    <select
                      value={formData.status || "Aktif"}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                      <option value="Blacklist">Blacklist</option>
                    </select>
                  </div>
                </>
              )}

              {/* Modal Footer */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-2 transition-colors disabled:opacity-70 cursor-pointer"
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
