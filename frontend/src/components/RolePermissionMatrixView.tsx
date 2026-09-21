import { useState, useMemo } from "react";
import { 
  LayoutDashboard, 
  FileText, 
  GitFork, 
  Activity, 
  Users, 
  Building2, 
  Shield, 
  Check, 
  Save, 
  Plus, 
  Edit3, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  Briefcase, 
  UserCheck, 
  ShieldCheck, 
  Building, 
  KeyRound,
  History,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RolePermissionMatrixViewProps {
  roles: any[];
  users: any[];
  permissionsGrouped: Record<string, any[]>;
  onSavePermissions: (roleId: number, permissionIds: number[]) => Promise<void>;
  onOpenEditRole: (role: any) => void;
  onOpenAddRole: () => void;
  onDeleteRole: (role: any) => void;
  onOpenEditUser: (user: any) => void;
}

// Map each module to the database permissions for its supported actions
interface MatrixModuleDef {
  id: string;
  name: string;
  description: string;
  icon: any;
  actions: {
    view?: string[];    // permission codes
    create?: string[];
    edit?: string[];
    delete?: string[];
    approve?: string[];
    manage?: string[];
  };
}

const MATRIX_MODULES: MatrixModuleDef[] = [
  {
    id: "dashboard",
    name: "Dashboard & Statistik",
    description: "Ringkasan metrik K3, status izin kerja aktif, dan analitik pabrik",
    icon: LayoutDashboard,
    actions: {
      view: ["permits.view_own", "permits.view_all", "monitoring.view"],
      manage: ["master.roles"],
    }
  },
  {
    id: "permits",
    name: "Surat Ijin Kerja (Permits)",
    description: "Pengajuan dan manajemen Surat Ijin Kerja Aman (SIKA)",
    icon: FileText,
    actions: {
      view: ["permits.view_own", "permits.view_all"],
      create: ["permits.create"],
      edit: ["permits.create"],
      delete: ["permits.create"],
      approve: ["permits.review_pic", "permits.review_hse", "permits.review_ga_dept", "permits.review_ga_div"],
      manage: ["permits.verify_qr"],
    }
  },
  {
    id: "workflow",
    name: "Review & Otorisasi Berjenjang",
    description: "Alur verifikasi bertahap PIC Vendor, HSE, GA Dept, dan GA Div Head",
    icon: GitFork,
    actions: {
      view: ["permits.view_all"],
      approve: ["permits.review_pic", "permits.review_hse", "permits.review_ga_dept", "permits.review_ga_div"],
      manage: ["permits.verify_qr"],
    }
  },
  {
    id: "monitoring",
    name: "Monitoring & Fasilitas K3",
    description: "Inspeksi rutin APAR, Hydrant, P3K, Pintu & Rambu Darurat",
    icon: Activity,
    actions: {
      view: ["monitoring.view"],
      create: ["inspections.create"],
      edit: ["inspections.create"],
      manage: ["capa.manage"],
    }
  },
  {
    id: "workers",
    name: "Tenaga Kerja & Dokumen",
    description: "Data pekerja eksternal, KTP, dan kepesertaan BPJS Ketenagakerjaan",
    icon: Users,
    actions: {
      view: ["permits.view_own", "permits.view_all"],
      create: ["documents.upload"],
      approve: ["documents.verify"],
      manage: ["documents.verify"],
    }
  },
  {
    id: "master",
    name: "Master Data Pabrik",
    description: "Konfigurasi area lokasi, vendor rekanan, APD, dan kategori izin",
    icon: Building2,
    actions: {
      view: ["master.vendors", "master.locations", "master.permit_options"],
      create: ["master.vendors", "master.locations", "master.permit_options"],
      edit: ["master.vendors", "master.locations", "master.permit_options"],
      delete: ["master.vendors", "master.locations", "master.permit_options"],
      manage: ["master.vendors", "master.locations", "master.permit_options"],
    }
  },
  {
    id: "users_rbac",
    name: "Manajemen Pengguna & RBAC",
    description: "Pengelolaan akun pengguna, hak akses, dan konfigurasi wewenang",
    icon: Shield,
    actions: {
      view: ["master.roles"],
      create: ["master.roles"],
      edit: ["master.roles"],
      delete: ["master.roles"],
      manage: ["master.roles"],
    }
  }
];

const ACTION_COLUMNS = [
  { key: "view", label: "VIEW" },
  { key: "create", label: "CREATE" },
  { key: "edit", label: "EDIT" },
  { key: "delete", label: "DELETE" },
  { key: "approve", label: "APPROVE" },
  { key: "manage", label: "MANAGE" },
] as const;

export function RolePermissionMatrixView({
  roles,
  users,
  permissionsGrouped,
  onSavePermissions,
  onOpenEditRole,
  onOpenAddRole,
  onDeleteRole,
  onOpenEditUser,
}: RolePermissionMatrixViewProps) {
  // Selected active role in left sidebar
  const [selectedRoleId, setSelectedRoleId] = useState<number>(roles[0]?.id || 1);
  const [isSaving, setIsSaving] = useState(false);

  // Flatten all available permissions for quick lookup by code
  const allPermissionsByCode = useMemo(() => {
    const map = new Map<string, any>();
    Object.values(permissionsGrouped).forEach((group) => {
      group.forEach((p) => {
        map.set(p.code, p);
      });
    });
    return map;
  }, [permissionsGrouped]);

  // Selected role object
  const selectedRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || roles[0];
  }, [roles, selectedRoleId]);

  // Track modified permission IDs for each role (local state before saving)
  const [rolePermissionsState, setRolePermissionsState] = useState<Record<number, number[]>>({});

  // Get currently active permission IDs for selected role
  const currentPermissions = useMemo<number[]>(() => {
    if (!selectedRole) return [];
    if (rolePermissionsState[selectedRole.id] !== undefined) {
      return rolePermissionsState[selectedRole.id];
    }
    return selectedRole.permissions ? selectedRole.permissions.map((p: any) => p.id) : [];
  }, [selectedRole, rolePermissionsState]);

  // Check if there are unsaved changes for the selected role
  const hasUnsavedChanges = useMemo(() => {
    if (!selectedRole || rolePermissionsState[selectedRole.id] === undefined) return false;
    const original = (selectedRole.permissions || []).map((p: any) => p.id).sort();
    const modified = [...rolePermissionsState[selectedRole.id]].sort();
    if (original.length !== modified.length) return true;
    return original.some((id: number, idx: number) => id !== modified[idx]);
  }, [selectedRole, rolePermissionsState]);

  // Get users belonging to selected role
  const usersForSelectedRole = useMemo(() => {
    if (!selectedRole) return [];
    return users.filter(
      (u) =>
        u.role_id === selectedRole.id ||
        u.role?.id === selectedRole.id ||
        u.role?.code === selectedRole.code
    );
  }, [users, selectedRole]);

  // Check if a specific cell in the matrix is checked
  const isCellChecked = (moduleDef: MatrixModuleDef, actionKey: keyof MatrixModuleDef["actions"]) => {
    const codes = moduleDef.actions[actionKey];
    if (!codes || codes.length === 0) return false;

    // For APPROVE action, check if relevant permission for this role or any code is active
    const targetCodes = codes.filter((code) => {
      if (actionKey === "approve") {
        if (selectedRole?.code === "pic_vendor") return code === "permits.review_pic";
        if (selectedRole?.code === "hse") return code === "permits.review_hse";
        if (selectedRole?.code === "ga_dept_head") return code === "permits.review_ga_dept";
        if (selectedRole?.code === "ga_div_head") return code === "permits.review_ga_div";
      }
      return true;
    });

    // Check if at least one target permission is active in currentPermissions
    return targetCodes.some((code) => {
      const perm = allPermissionsByCode.get(code);
      return perm && currentPermissions.includes(perm.id);
    });
  };

  // Toggle a specific cell in the matrix
  const handleToggleCell = (moduleDef: MatrixModuleDef, actionKey: keyof MatrixModuleDef["actions"]) => {
    if (!selectedRole) return;
    const codes = moduleDef.actions[actionKey];
    if (!codes || codes.length === 0) return;

    // Filter relevant codes for this role if action is APPROVE
    const targetCodes = codes.filter((code) => {
      if (actionKey === "approve") {
        if (selectedRole.code === "pic_vendor") return code === "permits.review_pic";
        if (selectedRole.code === "hse") return code === "permits.review_hse";
        if (selectedRole.code === "ga_dept_head") return code === "permits.review_ga_dept";
        if (selectedRole.code === "ga_div_head") return code === "permits.review_ga_div";
      }
      return true;
    });

    const targetPermIds = targetCodes
      .map((code) => allPermissionsByCode.get(code)?.id)
      .filter((id): id is number => id !== undefined);

    if (targetPermIds.length === 0) return;

    const currentlyChecked = isCellChecked(moduleDef, actionKey);
    let updated: number[];

    if (currentlyChecked) {
      // Remove these permissions
      updated = currentPermissions.filter((id: number) => !targetPermIds.includes(id));
    } else {
      // Add these permissions
      updated = Array.from(new Set([...currentPermissions, ...targetPermIds]));
    }

    setRolePermissionsState((prev) => ({
      ...prev,
      [selectedRole.id]: updated,
    }));
  };

  // Toggle Select All Actions
  const handleToggleSelectAll = () => {
    if (!selectedRole) return;

    // Gather all valid permission IDs referenced in the matrix
    const allMatrixPermIds: number[] = [];
    MATRIX_MODULES.forEach((mod) => {
      Object.values(mod.actions).forEach((codes) => {
        if (codes) {
          codes.forEach((code) => {
            const p = allPermissionsByCode.get(code);
            if (p && !allMatrixPermIds.includes(p.id)) {
              allMatrixPermIds.push(p.id);
            }
          });
        }
      });
    });

    const isAllSelected = allMatrixPermIds.every((id) => currentPermissions.includes(id));

    setRolePermissionsState((prev) => ({
      ...prev,
      [selectedRole.id]: isAllSelected ? [] : allMatrixPermIds,
    }));
  };

  // Save changes to backend
  const handleSave = async () => {
    if (!selectedRole || isSaving) return;
    setIsSaving(true);
    try {
      await onSavePermissions(selectedRole.id, currentPermissions);
      // Reset local changes tracking for this role
      setRolePermissionsState((prev) => {
        const next = { ...prev };
        delete next[selectedRole.id];
        return next;
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset local changes
  const handleReset = () => {
    if (!selectedRole) return;
    setRolePermissionsState((prev) => {
      const next = { ...prev };
      delete next[selectedRole.id];
      return next;
    });
  };

  const getRoleIcon = (code: string) => {
    switch (code) {
      case "pemohon": return Briefcase;
      case "pic_vendor": return UserCheck;
      case "hse": return ShieldCheck;
      case "ga_dept_head": return Building;
      case "ga_div_head": return CheckCircle2;
      case "admin": return KeyRound;
      default: return Shield;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      
      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR: ROLE SELECTOR LIST */}
      {/* ========================================================================= */}
      <div className="lg:col-span-4 xl:col-span-3 space-y-3">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
          
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Daftar Peran & Role</h3>
              <p className="text-[11px] text-slate-500">Pilih role untuk mengatur wewenang</p>
            </div>
            <button
              type="button"
              onClick={onOpenAddRole}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Tambah Role Baru"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Role Cards List */}
          <div className="space-y-2">
            {roles.map((r) => {
              const IconComp = getRoleIcon(r.code);
              const isSelected = r.id === selectedRole?.id;
              const userCount = users.filter(
                (u) => u.role_id === r.id || u.role?.id === r.id || u.role?.code === r.code
              ).length;

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 relative group",
                    isSelected
                      ? "bg-blue-50/70 border-blue-600 shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                  )}
                >
                  {/* Active Indicator Bar */}
                  {isSelected && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 rounded-r-full" />
                  )}

                  {/* Icon Box */}
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                      isSelected
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                    )}
                  >
                    <IconComp size={17} />
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={cn(
                          "text-xs font-bold truncate",
                          isSelected ? "text-blue-950" : "text-slate-900"
                        )}
                      >
                        {r.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {userCount} user
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 leading-tight">
                      {r.description || "Tanggung jawab & wewenang operasional"}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/80">
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
                        {r.code}
                      </span>
                      
                      {/* Action buttons on role */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEditRole(r);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                          title="Edit Info Role"
                        >
                          <Edit3 size={12} />
                        </button>
                        {!["pemohon", "pic_vendor", "hse", "ga_dept_head", "ga_div_head", "admin"].includes(r.code) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteRole(r);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Hapus Role"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onOpenAddRole}
            className="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 text-blue-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={14} /> Tambah Role Baru
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RIGHT CONTENT AREA: PERMISSION MATRIX & BOTTOM SPLIT */}
      {/* ========================================================================= */}
      <div className="lg:col-span-8 xl:col-span-9 space-y-5">
        
        {/* TOP PANEL: PERMISSION MATRIX */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Permission Matrix</h3>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-md font-mono">
                  {selectedRole?.code}
                </span>
                {hasUnsavedChanges && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                    Perubahan belum disimpan
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi tingkat akses per modul untuk peran <strong>{selectedRole?.name}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Select All Actions
              </button>

              {hasUnsavedChanges && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs rounded-lg transition-colors cursor-pointer"
                  title="Batalkan perubahan lokal"
                >
                  <RotateCcw size={14} />
                </button>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer",
                  hasUnsavedChanges
                    ? "bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-400/30"
                    : "bg-slate-800 hover:bg-slate-900 text-white"
                )}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-5 py-3.5 w-64">MODULE</th>
                  {ACTION_COLUMNS.map((col) => (
                    <th key={col.key} className="px-3 py-3.5 text-center w-20">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MATRIX_MODULES.map((mod) => {
                  const ModIcon = mod.icon;
                  return (
                    <tr key={mod.id} className="hover:bg-slate-50/60 transition-colors">
                      
                      {/* Module Info */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                            <ModIcon size={15} />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{mod.name}</div>
                            <div className="text-[11px] text-slate-400 line-clamp-1">{mod.description}</div>
                          </div>
                        </div>
                      </td>

                      {/* Action Checkboxes */}
                      {ACTION_COLUMNS.map((col) => {
                        const isSupported = !!mod.actions[col.key];
                        const checked = isSupported && isCellChecked(mod, col.key);

                        return (
                          <td key={col.key} className="px-3 py-3.5 text-center">
                            {isSupported ? (
                              <button
                                type="button"
                                onClick={() => handleToggleCell(mod, col.key)}
                                className={cn(
                                  "w-5 h-5 rounded mx-auto flex items-center justify-center transition-all cursor-pointer",
                                  checked
                                    ? "bg-blue-600 border border-blue-600 text-white shadow-xs"
                                    : "bg-white border border-slate-300 hover:border-slate-400"
                                )}
                                title={`${col.label} - ${mod.name}`}
                              >
                                {checked && <Check size={12} strokeWidth={3} />}
                              </button>
                            ) : (
                              <span className="w-5 h-5 rounded bg-slate-100/60 border border-slate-200/60 block mx-auto opacity-30 cursor-not-allowed" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Matrix Footer Notes */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
            <div>
              * Hak akses yang dicentang akan langsung berlaku untuk semua pengguna yang memiliki peran <strong>{selectedRole?.name}</strong>.
            </div>
            <div className="font-mono text-[10px]">
              Active permissions: {currentPermissions.length} hak akses
            </div>
          </div>

        </div>

        {/* BOTTOM SPLIT: USER ASSIGNMENT & AUDIT TIMELINE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* BOTTOM LEFT: USER ASSIGNMENT */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">User Assignment</h4>
                  <p className="text-[11px] text-slate-500">Pengguna terdaftar dengan peran ini</p>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
                  {usersForSelectedRole.length} Pengguna
                </span>
              </div>

              {/* Users List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {usersForSelectedRole.length > 0 ? (
                  usersForSelectedRole.map((u) => {
                    const initial = (u.name || "U").charAt(0).toUpperCase();
                    return (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs truncate">{u.name}</div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {u.department || u.company_name || "PT Widatra Bhakti"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-md">
                            {selectedRole?.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpenEditUser(u)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                            title="Edit Pengguna"
                          >
                            <Edit3 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    <Users size={24} className="mx-auto mb-1.5 opacity-30" />
                    <p className="font-medium">Belum ada pengguna di peran ini</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Tugaskan pengguna dari tab Daftar Pengguna.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-100">
              Total {users.length} pengguna terdaftar di sistem HSE Portal.
            </div>
          </div>

          {/* BOTTOM RIGHT: AUDIT TIMELINE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Audit Timeline</h4>
                  <p className="text-[11px] text-slate-500">Catatan aktivitas wewenang & perubahan</p>
                </div>
                <span className="text-xs text-blue-600 font-bold flex items-center gap-1">
                  <History size={13} /> Log Sistem
                </span>
              </div>

              {/* Timeline Track */}
              <div className="border-l-2 border-slate-200 ml-2.5 space-y-4 pl-4 py-1 text-xs">
                
                {/* Event 1 */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                  <div className="font-bold text-slate-900 leading-tight">Role Modification</div>
                  <div className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                    Matriks wewenang untuk peran <strong>{selectedRole?.name}</strong> dikonfigurasi aktif.
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    Sesi aktif • Administrator
                  </div>
                </div>

                {/* Event 2 */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                  <div className="font-bold text-slate-900 leading-tight">User Assignment</div>
                  <div className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                    {usersForSelectedRole.length} pengguna aktif ditugaskan dengan wewenang ini.
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    Sinkronisasi database otomatis
                  </div>
                </div>

                {/* Event 3 */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-amber-600 ring-4 ring-white" />
                  <div className="font-bold text-slate-900 leading-tight">SOP K3 Compliance</div>
                  <div className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                    Wewenang disesuaikan dengan alur verifikasi pabrik PT Widatra Bhakti.
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    Standar SMK3 & ISO 45001
                  </div>
                </div>

              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-100 flex justify-between items-center">
              <span>Status otorisasi: Terlindungi</span>
              <span className="font-mono text-[10px]">Session #RBAC-SEC</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
