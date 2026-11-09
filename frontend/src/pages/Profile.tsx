import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Loader2, 
  Camera, 
  Trash2 
} from "lucide-react";
import { api } from "@/services/api";
import { auth } from "@/lib/auth";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.getCurrentUser();
      if (res.success && res.data) {
        setProfile(res.data);
        setEditName(res.data.name || "");
        setEditPhone(res.data.phone_number || "");
        setPreviewAvatar(res.data.avatar || null);
        auth.setUser(res.data);
      } else {
        const stored = auth.getUser();
        if (stored) {
          setProfile(stored);
          setEditName(stored.name || "");
          setEditPhone(stored.phone_number || "");
          setPreviewAvatar(stored.avatar || null);
        }
      }
    } catch {
      const stored = auth.getUser();
      if (stored) {
        setProfile(stored);
        setEditName(stored.name || "");
        setEditPhone(stored.phone_number || "");
        setPreviewAvatar(stored.avatar || null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Compress & crop image to square data URL for fast upload and storage
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("File yang dipilih harus berupa gambar (JPG, PNG, WEBP)."));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        reject(new Error("Ukuran file gambar maksimal 5MB."));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const targetSize = 320;
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          // Center crop to square
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.88);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error("Gagal memproses file gambar."));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await processImageFile(file);
      setPreviewAvatar(compressed);
      setAvatarChanged(true);
      setIsEditing(true);
      setMessage({
        text: "Foto baru dipilih! Klik 'Simpan Perubahan' di bawah untuk menerapkan.",
        type: "success",
      });
    } catch (err: any) {
      setMessage({
        text: err.message || "Gagal memilih foto profil.",
        type: "error",
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = () => {
    setPreviewAvatar(null);
    setAvatarChanged(true);
    setIsEditing(true);
    setMessage({
      text: "Foto profil dihapus (kembali ke ikon default). Klik 'Simpan Perubahan' untuk menerapkan.",
      type: "success",
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(profile?.name || "");
    setEditPhone(profile?.phone_number || "");
    setEditPassword("");
    setPreviewAvatar(profile?.avatar || null);
    setAvatarChanged(false);
    setMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload: any = {
        name: editName,
        phone_number: editPhone,
      };
      if (editPassword) {
        payload.password = editPassword;
      }
      if (avatarChanged) {
        payload.avatar = previewAvatar;
      }

      const res = await api.updateProfile(payload);
      if (res.success && res.data) {
        setProfile(res.data);
        setPreviewAvatar(res.data.avatar || null);
        auth.setUser(res.data);
        setIsEditing(false);
        setAvatarChanged(false);
        setEditPassword("");
        setMessage({ text: "Profil dan foto berhasil diperbarui.", type: "success" });
      } else {
        setMessage({ text: res.message || "Gagal memperbarui profil.", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal memperbarui profil.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      <Header title="Profil Pengguna" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 border text-sm font-semibold transition-all ${
              message.type === 'success' 
                ? 'bg-success-container/30 border-success-container text-success' 
                : 'bg-error-container/30 border-error-container text-error'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 h-32 relative"></div>
            
            <div className="px-8 pb-8">
              <div className="relative flex justify-between items-end -mt-12 mb-6">
                
                {/* Avatar with Camera Button */}
                <div className="flex flex-col items-start gap-1">
                  <div className="relative group">
                    <div className="h-24 w-24 rounded-full bg-white p-1 border-4 border-white shadow-md flex items-center justify-center bg-gray-50 text-blue-600 overflow-hidden ring-2 ring-blue-100/50">
                      {previewAvatar ? (
                        <img 
                          src={previewAvatar} 
                          alt={profile?.name || "Profil"} 
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <User size={48} className="text-blue-600" />
                      )}
                    </div>

                    {/* Change Photo Trigger Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg border-2 border-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
                      title="Ubah Foto Profil"
                    >
                      <Camera size={16} />
                    </button>

                    {/* Hidden Native File Input */}
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarSelect}
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      className="hidden"
                    />
                  </div>

                  {/* Remove photo option if custom avatar exists */}
                  {previewAvatar && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline flex items-center gap-1 mt-1 transition-colors"
                    >
                      <Trash2 size={13} />
                      Hapus Foto
                    </button>
                  )}
                </div>

                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                  >
                    Edit Profil
                  </button>
                ) : (
                  <button 
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Memuat profil pengguna...</span>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{profile?.name || "Pengguna"}</h2>
                    <p className="text-gray-500 font-medium">
                      {profile?.role?.name || profile?.role?.code || "User"} 
                      {profile?.company_name ? ` • ${profile.company_name}` : ""}
                    </p>
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleSave} className="mt-8 space-y-4 border-t border-gray-100 pt-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-gray-900">Perbarui Informasi Pribadi</h3>
                        {avatarChanged && (
                          <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
                            Foto profil diubah
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nama Lengkap</label>
                        <input 
                          type="text" 
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nomor Telepon / WhatsApp</label>
                        <input 
                          type="text" 
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="08xxxxxxxxxx"
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Password Baru (Opsional)</label>
                        <input 
                          type="password" 
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          placeholder="Biarkan kosong jika tidak ingin mengubah password"
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>
                      <div className="pt-4 flex justify-end gap-3">
                        <button 
                          type="button" 
                          onClick={handleCancelEdit}
                          className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                        >
                          Batal
                        </button>
                        <button 
                          type="submit" 
                          disabled={saving}
                          className="px-4 py-2 text-sm font-bold text-white bg-primary hover:opacity-90 rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-opacity"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                          Simpan Perubahan
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-8">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Personal Information (Real Data)</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><User size={16} className="text-gray-400" /> Nama Lengkap</p>
                          <p className="font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">{profile?.name || "-"}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><Mail size={16} className="text-gray-400" /> Email Akun</p>
                          <p className="font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">{profile?.email || "-"}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><Phone size={16} className="text-gray-400" /> No. Telepon / HP</p>
                          <p className="font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">{profile?.phone_number || "-"}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><Building size={16} className="text-gray-400" /> Perusahaan / Departemen</p>
                          <p className="font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            {profile?.company_name || profile?.department || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><Briefcase size={16} className="text-gray-400" /> Hak Akses / Role</p>
                          <p className="font-semibold text-primary bg-primary/5 p-3 rounded-lg border border-primary/20">
                            {profile?.role?.name || profile?.role?.code || "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
