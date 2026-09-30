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
  Square,
  Info,
  SlidersHorizontal,
  Calendar,
  CalendarPlus
} from "lucide-react";
import { api } from "@/services/api";
import { RolePermissionMatrixView } from "@/components/RolePermissionMatrixView";

const PPE_CATEGORIES_INFO: Record<string, { label: string; desc: string; color: string; bg: string; border: string }> = {
  "Head & Face": {
    label: "Kepala & Wajah",
    desc: "Melindungi kepala, mata, telinga, dan wajah dari benturan benda keras, percikan kimia, radiasi pengelasan, atau kebisingan ekstrem.",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200"
  },
  "Foot & Hand": {
    label: "Kaki & Tangan",
    desc: "Melindungi tangan dan kaki dari bahaya sayatan, tusukan paku, sengatan kimia, suhu panas/dingin, dan impak benturan beban berat.",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200"
  },
  "Fall Protection": {
    label: "Ketinggian & Anti Jatuh",
    desc: "Perlengkapan pencegah dan penahan jatuh untuk pekerjaan pada elevasi di atas 1.8 meter sesuai SOP Bekerja di Ketinggian.",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200"
  },
  "Respiratory": {
    label: "Perlindungan Pernapasan",
    desc: "Menyaring partikel debu, uap kimia berbahaya, gas beracun, atau menyuplai udara bersih pada area terbatas (confined space).",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200"
  },
  "Fire & Safety": {
    label: "Kebakaran & Listrik",
    desc: "Peralatan proteksi kebakaran, isolasi energi panas, dan mitigasi risiko sengatan listrik / arc flash (hot work & electrical).",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200"
  },
  "Site & Area Safety": {
    label: "Barikade & Rambu Lokasi",
    desc: "Alat pengaman pembatas perimeter kerja dan tanda peringatan visual untuk mengisolasi area kerja dari lintasan umum pabrik.",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200"
  },
  "General PPE": {
    label: "Alat Keselamatan Umum",
    desc: "Kelengkapan keselamatan standar yang diterapkan secara umum di lingkungan operasional pabrik PT Widatra Bhakti.",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200"
  }
};

const resolvePpeCategory = (category: string | null | undefined, name: string): string => {
  if (category && PPE_CATEGORIES_INFO[category]) return category;
  
  const lowerName = name.toLowerCase();
  if (lowerName.includes("helmet") || lowerName.includes("glasses") || lowerName.includes("face shield") || lowerName.includes("ear plug") || lowerName.includes("muff")) return "Head & Face";
  if (lowerName.includes("shoes") || lowerName.includes("gloves")) return "Foot & Hand";
  if (lowerName.includes("harness") || lowerName.includes("lifeline") || lowerName.includes("net")) return "Fall Protection";
  if (lowerName.includes("respiratory") || lowerName.includes("breathing")) return "Respiratory";
  if (lowerName.includes("fire extinguisher") || lowerName.includes("apar")) return "Fire & Safety";
  if (lowerName.includes("barricade") || lowerName.includes("safety line") || lowerName.includes("sign") || lowerName.includes("scaffolding") || lowerName.includes("stairs")) return "Site & Area Safety";
  
  return "General PPE";
};

type MainTab = "users_roles" | "permit_types" | "ppe" | "workflow" | "locations_vendors" | "policy_settings";

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
  const [policySettingsMap, setPolicySettingsMap] = useState<Record<string, any>>({
    max_permit_duration_days: 6,
    min_lead_time_days: 3,
    extension_window_days: 3,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Search & Filter
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [ppeSearch, setPpeSearch] = useState("");
  const [ppeCategoryFilter, setPpeCategoryFilter] = useState("");

  // Modals & Detail Popups
  const [modalType, setModalType] = useState<string | null>(null);
  const [detailPpe, setDetailPpe] = useState<any | null>(null);
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
        const [ptRes, ppeRes] = await Promise.all([
          api.getPermitTypes(),
          api.getPpeOptions()
        ]);
        if (ptRes?.success) setPermitTypes(ptRes.data);
        if (ppeRes?.success) setPpes(ppeRes.data);
      } else if (activeTab === "ppe") {
        const [ppeRes, ptRes] = await Promise.all([
          api.getPpeOptions(),
          api.getPermitTypes()
        ]);
        if (ppeRes?.success) setPpes(ppeRes.data);
        if (ptRes?.success) setPermitTypes(ptRes.data);
      } else if (activeTab === "workflow") {
        const res = await api.getWorkflowStages();
        if (res?.success) {
          setWorkflowStages(res.data.stages || []);
          setTerminalStatuses(res.data.terminal_statuses || []);
        }
      } else if (activeTab === "locations_vendors") {
        const [lRes, vRes, uRes] = await Promise.all([
          api.getLocations(),
          api.getVendors(),
          api.getUsers()
        ]);
        if (lRes?.success) setLocations(lRes.data);
        if (vRes?.success) setVendors(vRes.data);
        if (uRes?.success) setUsers(uRes.data);
      } else if (activeTab === "policy_settings") {
        const sRes = await api.getSettings();
        if (sRes?.success && sRes.data?.map) {
          setPolicySettingsMap(sRes.data.map);
        }
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

  // Search filter for APD selection inside Permit Type modal
  const [permitPpeSearch, setPermitPpeSearch] = useState("");

  const togglePermitPpe = (id: number) => {
    const cur = formData.ppe_ids || [];
    const next = cur.includes(id) ? cur.filter((x: number) => x !== id) : [...cur, id];
    setFormData({ ...formData, ppe_ids: next });
  };

  const selectPermitPpeBaseline = () => {
    const baselineKeywords = ["safety helmet", "helm keselamatan", "safety shoes", "sepatu safety"];
    const baselineIds = ppes
      .filter((p: any) => baselineKeywords.some((k) => p.name.toLowerCase().includes(k)))
      .map((p: any) => p.id);
    setFormData({ ...formData, ppe_ids: Array.from(new Set([...(formData.ppe_ids || []), ...baselineIds])) });
  };

  const selectPermitPpeAll = () => {
    setFormData({ ...formData, ppe_ids: ppes.map((p: any) => p.id) });
  };

  const clearPermitPpeAll = () => {
    setFormData({ ...formData, ppe_ids: [] });
  };

  // Open Add Modal
  const handleOpenAdd = (type: string) => {
    setEditingItem(null);
    setPermitPpeSearch("");
    if (type === "permit_type") {
      setFormData({
        name: "",
        risk_level: "High Risk",
        is_active: true,
        ppe_ids: []
      });
    } else if (type === "ppe") {
      setFormData({
        name: "",
        category: "Head & Face",
        description: "",
        is_active: true
      });
    } else if (type === "location") {
      setFormData({
        name: "",
        description: "",
        is_active: true
      });
    } else if (type === "vendor") {
      setFormData({
        company_name: "",
        address: "",
        main_contact_name: "",
        main_contact_phone: "",
        pic_vendor_user_id: "",
        status: "Aktif"
      });
    } else {
      setFormData({});
    }
    setSelectedPermissions([]);
    setModalType(type);
  };

  // Open Edit Modal
  const handleOpenEdit = (type: string, item: any) => {
    setEditingItem(item);
    setPermitPpeSearch("");
    if (type === "permit_type") {
      setFormData({
        name: item.name,
        risk_level: item.risk_level || "General Risk",
        is_active: item.is_active !== false,
        ppe_ids: item.default_ppes ? item.default_ppes.map((p: any) => p.id) : []
      });
    } else if (type === "ppe") {
      setFormData({
        name: item.name,
        category: item.category || "Head & Face",
        description: item.description || "",
        is_active: item.is_active !== false
      });
    } else if (type === "location") {
      setFormData({
        name: item.name,
        description: item.description || "",
        is_active: item.is_active !== false
      });
    } else if (type === "vendor") {
      setFormData({
        company_name: item.company_name,
        address: item.address || "",
        main_contact_name: item.main_contact_name || "",
        main_contact_phone: item.main_contact_phone || "",
        pic_vendor_user_id: item.pic_vendor_user_id || "",
        status: item.status || "Aktif"
      });
    } else {
      setFormData({ ...item });
    }

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
        const payload = {
          name: formData.name,
          risk_level: formData.risk_level || "General Risk",
          is_active: formData.is_active !== false,
          ppe_ids: formData.ppe_ids || []
        };
        if (editingItem) {
          await api.updatePermitType(editingItem.id, payload);
          showFeedback("success", `Kategori izin kerja "${formData.name}" berhasil diperbarui.`);
        } else {
          await api.createPermitType(payload);
          showFeedback("success", `Kategori izin kerja "${formData.name}" berhasil ditambahkan.`);
        }
      } else if (modalType === "ppe") {
        const payload = {
          name: formData.name,
          category: formData.category || "Head & Face",
          description: formData.description || "",
          is_active: formData.is_active !== false
        };
        if (editingItem) {
          await api.updatePpeOption(editingItem.id, payload);
          showFeedback("success", `Item APD "${formData.name}" berhasil diperbarui.`);
        } else {
          await api.createPpeOption(payload);
          showFeedback("success", `Item APD baru "${formData.name}" berhasil ditambahkan.`);
        }
      } else if (modalType === "location") {
        const payload = {
          name: formData.name,
          description: formData.description || "",
          is_active: formData.is_active !== false
        };
        if (editingItem) {
          await api.updateLocation(editingItem.id, payload);
          showFeedback("success", `Lokasi pabrik "${formData.name}" berhasil diperbarui.`);
        } else {
          await api.createLocation(payload);
          showFeedback("success", `Lokasi baru "${formData.name}" berhasil ditambahkan.`);
        }
      } else if (modalType === "vendor") {
        const payload = {
          company_name: formData.company_name,
          address: formData.address || "",
          main_contact_name: formData.main_contact_name || "",
          main_contact_phone: formData.main_contact_phone || "",
          pic_vendor_user_id: formData.pic_vendor_user_id ? Number(formData.pic_vendor_user_id) : null,
          status: formData.status || "Aktif"
        };
        if (editingItem) {
          await api.updateVendor(editingItem.id, payload);
          showFeedback("success", `Data vendor rekanan "${formData.company_name}" berhasil diperbarui.`);
        } else {
          await api.createVendor(payload);
          showFeedback("success", `Vendor rekanan "${formData.company_name}" berhasil didaftarkan.`);
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

  // Save Policy Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const payload = Object.entries(policySettingsMap).map(([key, value]) => ({
        key,
        value: Number(value),
      }));
      const res = await api.updateSettings(payload);
      if (res?.success) {
        if (res.data?.map) setPolicySettingsMap(res.data.map);
        showFeedback("success", "Pengaturan Kebijakan SIKA berhasil disimpan ke sistem.");
      } else {
        showFeedback("error", res?.message || "Gagal menyimpan pengaturan.");
      }
    } catch (err: any) {
      showFeedback("error", err.message || "Gagal menyimpan pengaturan kebijakan SIKA.");
    } finally {
      setIsSavingSettings(false);
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
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Refresh Data"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                <span>Sinkronkan</span>
              </button>
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
            <button
              onClick={() => setActiveTab("policy_settings")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "policy_settings" ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <SlidersHorizontal size={18} /> Kebijakan & Durasi SIKA
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: HAK AKSES & PENGGUNA (USERS & ROLES) */}
          {/* ========================================================================= */}
          {activeTab === "users_roles" && (
            <div className="space-y-6">
              {/* Sub-tab switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="inline-flex bg-slate-200/80 p-1 rounded-xl gap-1 self-start">
                  <button
                    onClick={() => setUserSubTab("users")}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      userSubTab === "users" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Users size={16} /> Daftar Pengguna ({users.length})
                  </button>
                  <button
                    onClick={() => setUserSubTab("roles")}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      userSubTab === "roles" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <ShieldCheck size={16} /> Peran & Wewenang ({roles.length})
                  </button>
                </div>

                {userSubTab === "users" && (
                  <button
                    type="button"
                    onClick={() => handleOpenAdd("user")}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
                  >
                    <Plus size={15} /> Tambah Pengguna Baru
                  </button>
                )}

                {userSubTab === "roles" && (
                  <button
                    type="button"
                    onClick={() => handleOpenAdd("role")}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
                  >
                    <Plus size={15} /> Tambah Role / Peran Baru
                  </button>
                )}
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
                                  u.role?.code === 'hse' || u.role?.code === 'pic_k3' ? 'bg-emerald-100 text-emerald-800' :
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

              {/* Sub 1B: ROLES & DYNAMIC PERMISSIONS MATRIX DASHBOARD */}
              {userSubTab === "roles" && (
                <RolePermissionMatrixView
                  roles={roles}
                  users={users}
                  permissionsGrouped={permissionsGrouped}
                  onSavePermissions={async (roleId, permissionIds) => {
                    await api.updateRolePermissions(roleId, permissionIds);
                    showFeedback("success", "Hak akses role berhasil diperbarui.");
                    await fetchCurrentTabData();
                  }}
                  onOpenEditRole={(role) => handleOpenEdit("role", role)}
                  onOpenAddRole={() => handleOpenAdd("role")}
                  onDeleteRole={(role) => handleDelete("role", role.id, role.name)}
                  onOpenEditUser={(user) => handleOpenEdit("user", user)}
                />
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: JENIS IZIN KERJA (PERMIT TYPES) */}
          {/* ========================================================================= */}
          {activeTab === "permit_types" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Katalog Jenis Izin Kerja (Work Permit Categories)</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      {permitTypes.length} Kategori Terdaftar
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Izin kerja terdaftar yang wajib dipilih kontraktor saat mengajukan izin kerja di pabrik.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAdd("permit_type")}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
                >
                  <Plus size={15} /> Tambah Jenis Izin Baru
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-y border-slate-200 text-xs font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="px-5 py-3.5">Nama Kategori Izin</th>
                      <th className="px-5 py-3.5 text-center">Klasifikasi Risiko K3</th>
                      <th className="px-5 py-3.5">Standar APD Wajib (K3)</th>
                      <th className="px-5 py-3.5 text-center">Status</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {permitTypes.map((pt) => {
                      const isHigh = pt.risk_level
                        ? pt.risk_level === 'High Risk'
                        : ['Confined Space', 'Hot Work', 'Work at Height', 'High Voltage Electricity', 'Heavy Lifting'].some(k => pt.name.toLowerCase().includes(k.toLowerCase()));
                      const ppeList = pt.default_ppes || [];
                      return (
                        <tr key={pt.id} className="hover:bg-slate-50">
                          <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2">
                            <FileText size={16} className="text-blue-600 shrink-0" /> {pt.name}
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold ${
                              isHigh ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {isHigh ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                              {isHigh ? "High Risk (Risiko Tinggi)" : "General Risk (Normal)"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1 max-w-sm items-center">
                              {ppeList.length > 0 ? (
                                <>
                                  {ppeList.slice(0, 3).map((p: any) => (
                                    <span key={p.id} className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100 whitespace-nowrap">
                                      <HardHat size={11} className="text-blue-500" /> {p.name}
                                    </span>
                                  ))}
                                  {ppeList.length > 3 && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit("permit_type", pt)}
                                      className="text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded-md cursor-pointer transition-colors"
                                      title="Klik untuk melihat dan mengatur semua APD"
                                    >
                                      +{ppeList.length - 3} lainnya
                                    </button>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs text-slate-400 italic">Belum diatur</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                              pt.is_active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {pt.is_active !== false ? <CheckCircle2 size={12} /> : <X size={12} />}
                              {pt.is_active !== false ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit("permit_type", pt)}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 shadow-xs cursor-pointer"
                                title="Edit & Atur APD Wajib"
                              >
                                <HardHat size={13} /> Atur APD ({ppeList.length})
                              </button>
                              <button
                                onClick={() => handleOpenEdit("permit_type", pt)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                                title="Edit Data Izin"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete("permit_type", pt.id, pt.name)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
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
          {activeTab === "ppe" && (() => {
            const filteredPpes = ppes.filter((item) => {
              const matchSearch = (item.name || "").toLowerCase().includes(ppeSearch.toLowerCase()) ||
                (item.description || "").toLowerCase().includes(ppeSearch.toLowerCase());
              const matchCategory = !ppeCategoryFilter || item.category === ppeCategoryFilter;
              return matchSearch && matchCategory;
            }).sort((a, b) => {
              const colorOrder: Record<string, number> = {
                "text-red-700": 1,
                "text-rose-700": 2,
                "text-orange-700": 3,
                "text-amber-700": 4,
                "text-blue-700": 5,
                "text-purple-700": 6,
                "text-emerald-700": 7,
                "text-slate-700": 8
              };
              const catA = resolvePpeCategory(a.category, a.name);
              const catB = resolvePpeCategory(b.category, b.name);
              const colorA = PPE_CATEGORIES_INFO[catA]?.color || "text-slate-700";
              const colorB = PPE_CATEGORIES_INFO[catB]?.color || "text-slate-700";
              const weightA = colorOrder[colorA] || 99;
              const weightB = colorOrder[colorB] || 99;
              
              if (weightA !== weightB) {
                return weightA - weightB;
              }
              return (a.name || "").localeCompare(b.name || "");
            });

            return (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">Standar Alat Pelindung Diri (PPE / APD Wajib)</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {ppes.length} Item Terdaftar
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Daftar kelengkapan keselamatan kerja wajib di PT Widatra Bhakti. Klik kartu APD untuk melihat rincian proteksi & katalog izin kerja terkait.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAdd("ppe")}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
                  >
                    <Plus size={15} /> Tambah APD Baru
                  </button>
                </div>

                {/* Filter & Pencarian Bar */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama APD atau standar spesifikasi..."
                      value={ppeSearch}
                      onChange={(e) => setPpeSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                    {ppeSearch && (
                      <button
                        onClick={() => setPpeSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <div className="w-full sm:w-64">
                    <select
                      value={ppeCategoryFilter}
                      onChange={(e) => setPpeCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-700 font-medium"
                    >
                      <option value="">Semua Kategori Proteksi ({ppes.length})</option>
                      <option value="Head & Face">Kepala & Wajah (Head & Face)</option>
                      <option value="Foot & Hand">Kaki & Tangan (Foot & Hand)</option>
                      <option value="Fall Protection">Ketinggian (Fall Protection)</option>
                      <option value="Respiratory">Pernapasan (Respiratory)</option>
                      <option value="Fire & Safety">Kebakaran & Listrik (Fire & Safety)</option>
                      <option value="Site & Area Safety">Barikade & Rambu (Site Safety)</option>
                      <option value="General PPE">Keselamatan Umum (General PPE)</option>
                    </select>
                  </div>
                </div>

                {/* Grid Kartu APD */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {filteredPpes.map((item) => {
                    const resolvedCat = resolvePpeCategory(item.category, item.name);
                    const catMeta = PPE_CATEGORIES_INFO[resolvedCat] || {
                          label: item.category || "Umum",
                          desc: "Alat keselamatan kerja",
                          color: "text-slate-700",
                          bg: "bg-slate-100",
                          border: "border-slate-200"
                        };

                    const requiringPermitCount = permitTypes.filter((pt: any) => {
                      const permitPpes = pt.default_ppes || pt.defaultPpes || [];
                      return permitPpes.some((dp: any) => Number(dp.id) === Number(item.id));
                    }).length;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setDetailPpe(item)}
                        className="group relative bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
                      >
                        {/* Baris Atas: Label Kategori & Tombol Aksi */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md border bg-slate-50 text-slate-600 border-slate-200 truncate max-w-[170px]">
                            {catMeta.label}
                          </span>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit("ppe", item);
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors"
                              title="Edit APD"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete("ppe", item.id, item.name);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
                              title="Hapus APD"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Baris Tengah: Icon + Nama APD & Deskripsi */}
                        <div className="flex items-start gap-2.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            catMeta.bg + " " + catMeta.color
                          }`}>
                            <HardHat size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1" title={item.name}>
                                {item.name}
                              </span>
                              {item.is_active === false && (
                                <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1 py-0.2 rounded shrink-0">
                                  Nonaktif
                                </span>
                              )}
                            </div>
                            {item.description ? (
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={item.description}>
                                {item.description}
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-400 italic mt-0.5">Standar K3 Pabrik</p>
                            )}
                          </div>
                        </div>

                        {/* Baris Bawah: Info Ijin Kerja & Hint Detail */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          {requiringPermitCount > 0 ? (
                            <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                              Wajib di {requiringPermitCount} Izin Kerja
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              Opsional
                            </span>
                          )}
                          <span className="text-slate-400 group-hover:text-blue-600 flex items-center gap-0.5 font-medium transition-colors">
                            Info <Info size={12} />
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {filteredPpes.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400">
                      <HardHat size={32} className="mx-auto mb-2 opacity-40 text-slate-400" />
                      <p className="text-sm font-semibold text-slate-600">Tidak ada data APD yang cocok</p>
                      <p className="text-xs text-slate-400 mt-1">Coba kata kunci pencarian lain atau ubah pilihan kategori proteksi.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="inline-flex bg-slate-200/80 p-1 rounded-xl gap-1 self-start">
                  <button
                    onClick={() => setLocVendorSubTab("locations")}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      locVendorSubTab === "locations" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <MapPin size={16} /> Lokasi Pabrik ({locations.length})
                  </button>
                  <button
                    onClick={() => setLocVendorSubTab("vendors")}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      locVendorSubTab === "vendors" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Building size={16} /> Rekanan Vendor ({vendors.length})
                  </button>
                </div>

                {locVendorSubTab === "locations" && (
                  <button
                    type="button"
                    onClick={() => handleOpenAdd("location")}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
                  >
                    <Plus size={15} /> Tambah Lokasi Pabrik
                  </button>
                )}

                {locVendorSubTab === "vendors" && (
                  <button
                    type="button"
                    onClick={() => handleOpenAdd("vendor")}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
                  >
                    <Plus size={15} /> Daftarkan Vendor Rekanan
                  </button>
                )}
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

          {/* ========================================================================= */}
          {/* TAB 6: KEBIJAKAN & ATURAN SIKA (PERMIT POLICIES & DURATIONS) */}
          {/* ========================================================================= */}
          {activeTab === "policy_settings" && (
            <div className="space-y-6">
              {/* Header Policy Section */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">Pengaturan Kebijakan & Durasi SIKA</h3>
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                      Regulasi K3 PT Widatra Bhakti
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    Konfigurasi terpusat untuk batas maksimal masa berlaku izin kerja, batas waktu pengajuan awal (lead time), dan jendela pembukaan perpanjangan. Pengaturan ini langsung mengontrol validasi kalender vendor dan otorisasi sistem tanpa perlu mengubah kode program.
                  </p>
                </div>
                <button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
                >
                  <Save size={16} />
                  <span>{isSavingSettings ? "Menyimpan..." : "Simpan Pengaturan Kebijakan"}</span>
                </button>
              </div>

              {/* Form Policy Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Max Permit Duration Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                        <Clock size={22} />
                      </div>
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
                        Masa Berlaku SIKA
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Masa Berlaku Maksimal SIKA</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Batas maksimal rentang hari kalender untuk satu lembar izin kerja (selesai dikurangi mulai). Anda dapat membatasi hari atau mengizinkan tanpa batas.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        Durasi Maksimal SIKA
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={(policySettingsMap.max_permit_duration_days ?? 6) <= 0}
                          onChange={(e) => {
                            const isUnlimited = e.target.checked;
                            setPolicySettingsMap(prev => ({
                              ...prev,
                              max_permit_duration_days: isUnlimited ? 0 : 6
                            }));
                          }}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span>Tanpa Batas</span>
                      </label>
                    </div>

                    {(policySettingsMap.max_permit_duration_days ?? 6) <= 0 ? (
                      <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs font-semibold text-blue-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                        <span>Tanpa Batasan Hari (Unlimited)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={90}
                          value={policySettingsMap.max_permit_duration_days ?? 6}
                          onChange={(e) => setPolicySettingsMap(prev => ({
                            ...prev,
                            max_permit_duration_days: Math.max(1, parseInt(e.target.value) || 1)
                          }))}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                        />
                        <span className="text-xs font-bold text-slate-500 shrink-0">Hari</span>
                      </div>
                    )}
                    <p className="text-[11px] text-slate-400 italic">
                      {(policySettingsMap.max_permit_duration_days ?? 6) <= 0
                        ? "Pemohon bebas menentukan durasi kerja proyek tanpa batas maksimal."
                        : "Default standar pabrik: 6 hari kalender"}
                    </p>
                  </div>
                </div>

                {/* 2. Min Lead Time Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
                        <Calendar size={22} />
                      </div>
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                        Lead Time Pengajuan
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Batas Waktu Pengajuan Baru</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Minimal jarak hari pengajuan izin baru sebelum tanggal kerja (Aturan H-X) agar tim K3 dan PIC operasional memiliki waktu audit dokumen, personel, dan JSA.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Batas Minimal Pengajuan (H-X)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={policySettingsMap.min_lead_time_days ?? 3}
                        onChange={(e) => setPolicySettingsMap(prev => ({
                          ...prev,
                          min_lead_time_days: Math.max(0, parseInt(e.target.value) || 0)
                        }))}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                      />
                      <span className="text-xs font-bold text-slate-500 shrink-0">Hari (H-X)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 italic">Default standar K3: H-3 sebelum mulai</p>
                  </div>
                </div>

                {/* 3. Extension Window Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                        <CalendarPlus size={22} />
                      </div>
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                        Akses Perpanjangan
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Jendela Perpanjangan Izin</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Batas hari sebelum tanggal kedaluwarsa izin di mana tombol "Perpanjang Ijin" mulai dibuka untuk kontraktor pada modul Ijin Saya.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Jendela Pembukaan (H-X)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={policySettingsMap.extension_window_days ?? 3}
                        onChange={(e) => setPolicySettingsMap(prev => ({
                          ...prev,
                          extension_window_days: Math.max(1, parseInt(e.target.value) || 1)
                        }))}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                      />
                      <span className="text-xs font-bold text-slate-500 shrink-0">Hari (H-X)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 italic">Default standar K3: H-3 sebelum expired</p>
                  </div>
                </div>
              </div>

              {/* Compliance Info Strip */}
              <div className="p-5 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-start gap-3">
                <Info size={20} className="text-blue-700 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 space-y-1">
                  <p className="font-bold">Pedoman Regulasi Keselamatan Kerja PT Widatra Bhakti (SMK3 / ISO 45001):</p>
                  <p className="leading-relaxed text-blue-800">
                    Nilai konfigurasi pada halaman ini disimpan di database terpusat. Apabila sewaktu-waktu terjadi pergantian staf HSE atau perubahan kebijakan operasional pabrik, staf yang berwenang cukup memperbarui angka di atas dan menekan tombol simpan. Sistem akan langsung menyesuaikan batas kalender form pengajuan dan validasi izin tanpa memerlukan bantuan programmer.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ========================================================================= */}
      {/* ALL MODAL DIALOGS */}
      {/* ========================================================================= */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className={`bg-white rounded-2xl shadow-2xl w-full ${modalType === 'permit_type' || modalType === 'role_permissions' ? 'max-w-2xl' : 'max-w-xl'} max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200`}>
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-extrabold text-slate-900 text-base">
                {modalType === "user" && (editingItem ? "Edit Data Pengguna" : "Tambah Pengguna Baru")}
                {modalType === "reset_password" && `Reset Password — ${editingItem?.name}`}
                {modalType === "role" && (editingItem ? "Edit Informasi Role" : "Tambah Role Baru")}
                {modalType === "role_permissions" && `Atur Hak Akses Role: ${editingItem?.name}`}
                {modalType === "permit_type" && (editingItem ? `Edit Jenis Izin Kerja — ${editingItem?.name}` : "Tambah Jenis Izin Kerja Baru")}
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

              {/* 5. FORM PERMIT TYPE (NAMA, RISIKO K3, STATUS, DAN APD WAJIB) */}
              {modalType === "permit_type" && (
                <div className="space-y-4">
                  {/* Field 1: Nama Kategori */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Nama Kategori Izin *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: Ijin Kerja Ruang Terbatas (Confined Space)"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  {/* Field 2: Klasifikasi Risiko K3 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Klasifikasi Risiko K3 *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div
                        onClick={() => setFormData({ ...formData, risk_level: "High Risk" })}
                        className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                          formData.risk_level === "High Risk"
                            ? "border-rose-500 bg-rose-50/80 ring-2 ring-rose-500/20 text-rose-950"
                            : "border-slate-200 hover:bg-slate-50 bg-white text-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="risk_level"
                          value="High Risk"
                          checked={formData.risk_level === "High Risk"}
                          onChange={() => setFormData({ ...formData, risk_level: "High Risk" })}
                          className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1 text-rose-800">
                            <AlertTriangle size={13} /> High Risk (Risiko Tinggi)
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            Pekerjaan berisiko fatalitas (Hot Work, Ketinggian, Ruang Terbatas, Listrik, Crane).
                          </p>
                        </div>
                      </div>

                      <div
                        onClick={() => setFormData({ ...formData, risk_level: "General Risk" })}
                        className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                          formData.risk_level === "General Risk"
                            ? "border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20 text-blue-950"
                            : "border-slate-200 hover:bg-slate-50 bg-white text-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="risk_level"
                          value="General Risk"
                          checked={formData.risk_level === "General Risk"}
                          onChange={() => setFormData({ ...formData, risk_level: "General Risk" })}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1 text-blue-800">
                            <CheckCircle2 size={13} /> General Risk (Normal)
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            Pekerjaan umum non-kritis dengan standar keselamatan operasional biasa.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Field 3: Status Izin */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Status Operasional
                    </label>
                    <div className="flex gap-4 items-center">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="is_active"
                          checked={formData.is_active !== false}
                          onChange={() => setFormData({ ...formData, is_active: true })}
                          className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-emerald-700 font-bold">Aktif</span> (Dapat dipilih di form permit)
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="is_active"
                          checked={formData.is_active === false}
                          onChange={() => setFormData({ ...formData, is_active: false })}
                          className="text-slate-600 focus:ring-slate-500 cursor-pointer"
                        />
                        <span className="text-slate-600">Nonaktif</span> (Diarsipkan)
                      </label>
                    </div>
                  </div>

                  {/* Field 4: Standar APD Wajib (K3) */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 uppercase">
                          Standar APD Wajib (K3)
                        </label>
                        <span className="text-[11px] text-slate-500">
                          APD yang dipilih akan <strong>otomatis tercentang</strong> saat kategori izin ini dipilih.
                        </span>
                      </div>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        Terpilih: {(formData.ppe_ids || []).length} APD
                      </span>
                    </div>

                    {/* Toolbar APD: Search & Quick Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                          type="text"
                          placeholder="Filter nama APD..."
                          value={permitPpeSearch}
                          onChange={(e) => setPermitPpeSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={selectPermitPpeBaseline}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="Pilih Helm & Sepatu Keselamatan"
                        >
                          Standar Dasar
                        </button>
                        <button
                          type="button"
                          onClick={selectPermitPpeAll}
                          className="px-2 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Pilih Semua
                        </button>
                        <button
                          type="button"
                          onClick={clearPermitPpeAll}
                          className="px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Kosongkan
                        </button>
                      </div>
                    </div>

                    {/* Checklist Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      {ppes
                        .filter((p: any) => 
                          permitPpeSearch === "" || 
                          p.name.toLowerCase().includes(permitPpeSearch.toLowerCase())
                        )
                        .map((p: any) => {
                          const isChecked = (formData.ppe_ids || []).includes(p.id);
                          return (
                            <div
                              key={p.id}
                              onClick={() => togglePermitPpe(p.id)}
                              className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer select-none text-xs ${
                                isChecked
                                  ? "bg-blue-50/80 border-blue-300 text-blue-900 font-bold shadow-2xs"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}} // Handled by parent onClick
                                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer shrink-0"
                                />
                                <span className="truncate">{p.name}</span>
                              </div>
                              {isChecked && (
                                <span className="text-[9px] bg-blue-600 text-white font-extrabold px-1 rounded shrink-0">
                                  WAJIB
                                </span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
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
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kategori Perlindungan K3</label>
                    <select
                      value={formData.category || "Head & Face"}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="Head & Face">Pelindung Kepala, Mata & Wajah (Head & Face)</option>
                      <option value="Foot & Hand">Pelindung Kaki & Tangan (Foot & Hand)</option>
                      <option value="Fall Protection">Perlindungan Ketinggian (Fall Protection)</option>
                      <option value="Respiratory">Perlindungan Pernafasan (Respiratory)</option>
                      <option value="Fire & Safety">Pencegahan Kebakaran & Listrik (Fire & Safety)</option>
                      <option value="Site & Area Safety">Barikade & Rambu Area (Site Safety)</option>
                      <option value="General PPE">Alat Keselamatan Umum (General PPE)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Uraian / Spesifikasi Standar K3</label>
                    <input
                      type="text"
                      placeholder="Standar SNI/EN/OSHA, tipe filter, dll (opsional)"
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {editingItem && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status APD</label>
                      <select
                        value={formData.is_active !== false ? "1" : "0"}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "1" })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="1">Aktif (Dapat dipilih di form)</option>
                        <option value="0">Nonaktif (Diarsipkan)</option>
                      </select>
                    </div>
                  )}
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
                  {editingItem && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status Lokasi</label>
                      <select
                        value={formData.is_active !== false ? "1" : "0"}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "1" })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="1">Aktif</option>
                        <option value="0">Nonaktif</option>
                      </select>
                    </div>
                  )}
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
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kontak Person (PIC Vendor)</label>
                      <input
                        type="text"
                        placeholder="Nama penanggung jawab vendor"
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
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      PIC Internal PT Widatra (Penanggung Jawab Pabrik)
                    </label>
                    <select
                      value={formData.pic_vendor_user_id || ""}
                      onChange={(e) => setFormData({ ...formData, pic_vendor_user_id: e.target.value ? Number(e.target.value) : null })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">-- Belum Ditugaskan / Pilih PIC Internal --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role?.name || 'User'}) — {u.department || u.email}
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-slate-400">Pegawai PT Widatra yang mengawasi vendor ini di pabrik</span>
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

      {/* ========================================================================= */}
      {/* DETAIL APD POP-UP MODAL */}
      {/* ========================================================================= */}
      {detailPpe && (() => {
        const resolvedCat = resolvePpeCategory(detailPpe.category, detailPpe.name);
        const catMeta = PPE_CATEGORIES_INFO[resolvedCat] || {
              label: detailPpe.category || "Umum / General",
              desc: "Alat Pelindung Diri untuk menjaga standar keselamatan kerja operasional di PT Widatra Bhakti.",
              color: "text-slate-700",
              bg: "bg-slate-50",
              border: "border-slate-200"
            };

        const requiringPermits = permitTypes.filter((pt: any) => {
          const permitPpes = pt.default_ppes || pt.defaultPpes || [];
          return permitPpes.some((dp: any) => Number(dp.id) === Number(detailPpe.id));
        });

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                    catMeta.bg + " " + catMeta.color
                  }`}>
                    <HardHat size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                        Detail Informasi APD
                      </span>
                      {detailPpe.is_active !== false ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Aktif Digunakan
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                          Nonaktif (Arsip)
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 mt-1">{detailPpe.name}</h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailPpe(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-sm">
                {/* 1. Kategori Perlindungan K3 */}
                <div className={`p-4 rounded-xl border ${catMeta.border} ${catMeta.bg} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Kategori Perlindungan K3
                    </span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200">
                      {catMeta.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {catMeta.desc}
                  </p>
                </div>

                {/* 2. Spesifikasi Standar K3 */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Uraian / Spesifikasi Standar K3
                  </span>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    {detailPpe.description ? (
                      <p className="text-xs font-medium text-slate-800 leading-relaxed">
                        {detailPpe.description}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Belum ada spesifikasi teknis khusus yang diinput (mengikuti SOP standar K3 pabrik PT Widatra Bhakti).
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. Katalog Izin Kerja Wajib */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Kewajiban Pada Katalog Izin Kerja
                    </span>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                      {requiringPermits.length} Izin Kerja Wajib
                    </span>
                  </div>

                  {requiringPermits.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {requiringPermits.map((pt) => (
                        <div
                          key={pt.id}
                          className="p-3 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 rounded-xl flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                            <span className="text-xs font-bold text-slate-900">{pt.name}</span>
                          </div>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            pt.risk_level === "High Risk" 
                              ? "bg-rose-100 text-rose-700 border border-rose-200" 
                              : "bg-blue-100 text-blue-700 border border-blue-200"
                          }`}>
                            {pt.risk_level || "General Risk"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-1">
                      <p className="text-xs font-medium text-slate-600">
                        APD ini belum diatur sebagai standar wajib di katalog izin kerja manapun.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Anda dapat menetapkannya sebagai APD wajib melalui tab "Katalog Jenis Izin Kerja".
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setDetailPpe(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const itemToEdit = detailPpe;
                    setDetailPpe(null);
                    handleOpenEdit("ppe", itemToEdit);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Edit3 size={14} /> Edit Data APD
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
