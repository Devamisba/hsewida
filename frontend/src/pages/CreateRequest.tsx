import { useState } from "react";
import { Header } from "@/components/Header";
import { Step1DataKontraktor } from "@/components/wizard/Step1DataKontraktor";
import { Step2PermitType } from "@/components/wizard/Step2PermitType";
import { Step3TenagaKerja } from "@/components/wizard/Step3TenagaKerja";
import { Step4JSA } from "@/components/wizard/Step4JSA";
import { api } from "@/services/api";
import { CheckCircle, AlertCircle, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { format, addDays } from "date-fns";

// Helper to create blank worker row
const createEmptyWorker = (idx: number) => ({
  id: Date.now() + Math.floor(Math.random() * 1000) + idx,
  nama: "",
  jabatan: "",
  alamat: "",
  id_card_photo: null,
  photoName: "",
});

// Helper to expand or truncate worker rows while preserving existing data
const syncWorkersWithCount = (existingWorkers: any[], targetCount: number): any[] => {
  const count = Math.max(1, Math.min(50, targetCount));
  const current = existingWorkers || [];
  if (current.length === count) return current;

  if (current.length < count) {
    const additions = Array.from(
      { length: count - current.length },
      (_, i) => createEmptyWorker(current.length + i + 1)
    );
    return [...current, ...additions];
  } else {
    return current.slice(0, count);
  }
};

export default function CreateRequestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const extendState = (location.state as any) || null;

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [permitNumber, setPermitNumber] = useState<string>("");

  // Global Form State - Auto prefill if launched from Extension action
  const [formData, setFormData] = useState(() => {
    if (extendState?.extendMode) {
      let nextStart = "";
      let nextEnd = "";
      if (extendState.selesaiKerja) {
        try {
          const baseEnd = new Date(extendState.selesaiKerja);
          if (!isNaN(baseEnd.getTime())) {
            const startD = addDays(baseEnd, 1);
            nextStart = format(startD, "yyyy-MM-dd");
            nextEnd = format(addDays(startD, 4), "yyyy-MM-dd"); // 5 days extension
          }
        } catch {}
      }

      const prevPhase = typeof extendState.extensionPhase === 'number' 
        ? extendState.extensionPhase 
        : (typeof extendState.extension_phase === 'number' ? extendState.extension_phase : 0);
      const nextPhase = prevPhase + 1;
      const rootId = extendState.rootPermitId || extendState.root_permit_id || extendState.rawId || (typeof extendState.originalId === "number" ? extendState.originalId : null);
      const rootNum = extendState.rootPermitNumber || extendState.rootPermit?.permitNumber || extendState.rootPermit?.permit_number || extendState.parentPermitNumber || extendState.permitNumber || extendState.id || "";
      const rootStart = extendState.rootStartDate || extendState.rootPermit?.startDate || extendState.rootPermit?.start_date || extendState.cumulativeStartDate || extendState.parentStartDate || extendState.mulaiKerja || "";

      return {
        // Step 1
        requestType: "Perpanjangan",
        extensionPhase: nextPhase,
        rootPermitId: rootId,
        rootPermitNumber: rootNum,
        rootStartDate: rootStart,
        parentPermitId: extendState.rawId || (typeof extendState.originalId === "number" ? extendState.originalId : null),
        parentPermitNumber: extendState.permitNumber || extendState.id || "",
        parentStartDate: extendState.cumulativeStartDate || extendState.mulaiKerja || "",
        parentEndDate: extendState.selesaiKerja || "",
        namaKontraktor: extendState.namaKontraktor || "",
        jenisPekerjaan: extendState.jenisPekerjaan || "",
        mulaiKerja: nextStart,
        selesaiKerja: nextEnd,
        penanggungJawab: extendState.penanggungJawab || "",
        noHpPJ: extendState.noHpPJ || "",
        pengawasPekerjaan: extendState.pengawasPekerjaan || "",
        noHpPengawas: extendState.noHpPengawas || "",
        pengawasHse: extendState.pengawasHse || "Tim K3 / HSE Lapangan",
        noHpHse: extendState.noHpHse || "085566778899",
        totalTenagaKerja: String(extendState.pekerja?.length || extendState.totalTenagaKerja || "1"),
        jamKerjaMulai: extendState.jamKerjaMulai || "08:00",
        jamKerjaAkhir: extendState.jamKerjaAkhir || "17:00",
        lokasi: extendState.lokasi || "",

        // Step 2
        permitTypes: Array.isArray(extendState.permitTypes) ? extendState.permitTypes : [],
        otherPermitType: extendState.otherPermitType || "",
        ppe: Array.isArray(extendState.ppe) ? extendState.ppe : [],
        otherPpe: extendState.otherPpe || "",
        workEquipment: extendState.workEquipment?.length ? extendState.workEquipment : ["", "", ""],

        // Step 3
        pekerja: extendState.pekerja?.length ? extendState.pekerja : [createEmptyWorker(1)],

        // Step 4
        jsa: extendState.jsa?.length ? extendState.jsa : [],
      };
    }

    return {
      // Step 1
      requestType: "Baru",
      extensionPhase: 0,
      rootPermitId: null,
      rootPermitNumber: "",
      rootStartDate: "",
      parentPermitId: null,
      parentPermitNumber: "",
      parentStartDate: "",
      parentEndDate: "",
      namaKontraktor: "",
      jenisPekerjaan: "",
      mulaiKerja: "",
      selesaiKerja: "",
      penanggungJawab: "",
      noHpPJ: "",
      pengawasPekerjaan: "",
      noHpPengawas: "",
      pengawasHse: "Tim K3 / HSE Lapangan",
      noHpHse: "085566778899",
      totalTenagaKerja: "1",
      jamKerjaMulai: "08:00",
      jamKerjaAkhir: "17:00",
      lokasi: "",

      // Step 2
      permitTypes: [] as string[],
      otherPermitType: "",
      ppe: [] as string[],
      otherPpe: "",
      workEquipment: ["", "", ""], // start with 3 empty inputs

      // Step 3 (Initialized with 1 blank worker matching totalTenagaKerja = 1)
      pekerja: [createEmptyWorker(1)] as any[],

      // Step 4
      jsa: [] as any[],
    };
  });

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => {
      let nextState = { ...prev, ...updates };

      // Sinkronisasi otomatis: Jika totalTenagaKerja berubah dari Step 1, sesuaikan baris pekerja
      if ('totalTenagaKerja' in updates && !('pekerja' in updates)) {
        const count = parseInt(String(updates.totalTenagaKerja || "")) || 0;
        if (count > 0) {
          nextState.pekerja = syncWorkersWithCount(prev.pekerja, count);
        }
      }

      // Sinkronisasi otomatis dua arah: Jika pekerja diubah (tambah/hapus baris), sesuaikan totalTenagaKerja
      if ('pekerja' in updates && updates.pekerja) {
        nextState.totalTenagaKerja = String(updates.pekerja.length);
      }

      return nextState;
    });
  };

  const focusAndScrollToField = (fieldId: string, errorMsg: string) => {
    setSubmitError(errorMsg);
    setTimeout(() => {
      const el = document.getElementById(fieldId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        if (typeof (el as HTMLElement).focus === "function") {
          (el as HTMLElement).focus();
        }
        el.classList.add("ring-2", "ring-red-500", "border-red-500");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-red-500", "border-red-500");
        }, 3000);
      } else {
        const main = document.querySelector("main");
        if (main) main.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 80);
  };

  const nextStep = () => {
    setSubmitError("");

    if (currentStep === 1) {
      if (!formData.namaKontraktor?.trim()) {
        focusAndScrollToField("namaKontraktor", "Mohon isi Nama Perusahaan Vendor.");
        return;
      }
      if (!formData.jenisPekerjaan?.trim()) {
        focusAndScrollToField("jenisPekerjaan", "Mohon isi Jenis Pekerjaan.");
        return;
      }
      if (!formData.mulaiKerja) {
        focusAndScrollToField("mulaiKerja", "Mohon tentukan Tanggal Mulai Kerja.");
        return;
      }
      if (!formData.selesaiKerja) {
        focusAndScrollToField("selesaiKerja", "Mohon tentukan Tanggal Selesai Kerja.");
        return;
      }
      if (!formData.jamKerjaMulai) {
        focusAndScrollToField("jamKerjaMulai", "Mohon tentukan Jam Kerja Mulai.");
        return;
      }
      if (!formData.jamKerjaAkhir) {
        focusAndScrollToField("jamKerjaAkhir", "Mohon tentukan Jam Kerja Selesai.");
        return;
      }
      if (!formData.lokasi?.trim()) {
        focusAndScrollToField("lokasi", "Mohon pilih atau ketik Lokasi Pekerjaan.");
        return;
      }
      if (!formData.totalTenagaKerja || parseInt(formData.totalTenagaKerja) < 1) {
        focusAndScrollToField("totalTenagaKerja", "Mohon tentukan Total Tenaga Kerja (minimal 1 orang).");
        return;
      }

      // Validasi Personel Vendor & Internal Widatra (Wajib Diisi)
      if (!formData.penanggungJawab?.trim()) {
        focusAndScrollToField("penanggungJawab", "Mohon isi Nama Penanggung Jawab Vendor.");
        return;
      }
      if (!formData.noHpPJ?.trim()) {
        focusAndScrollToField("noHpPJ", "Mohon isi No. HP Penanggung Jawab Vendor.");
        return;
      }
      if (!formData.pengawasPekerjaan?.trim()) {
        focusAndScrollToField("pengawasPekerjaan", "Mohon isi Nama Pengawas Pekerjaan (User Widatra).");
        return;
      }
      if (!formData.noHpPengawas?.trim()) {
        focusAndScrollToField("noHpPengawas", "Mohon isi No. HP Pengawas Pekerjaan.");
        return;
      }
      if (!formData.pengawasHse?.trim()) {
        focusAndScrollToField("pengawasHse", "Mohon isi Nama Pengawas K3 / HSE Lapangan.");
        return;
      }
      if (!formData.noHpHse?.trim()) {
        focusAndScrollToField("noHpHse", "Mohon isi No. HP Pengawas K3 / HSE.");
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.permitTypes || formData.permitTypes.length === 0) {
        focusAndScrollToField("section-permit-types", "Mohon pilih minimal satu Jenis Ijin Kerja (Permit Type).");
        return;
      }
      if (formData.permitTypes.includes("Others") && !formData.otherPermitType?.trim()) {
        focusAndScrollToField("otherPermitType", "Mohon sebutkan jenis pekerjaan lainnya pada opsi Others.");
        return;
      }
      if (!formData.ppe || formData.ppe.length === 0) {
        focusAndScrollToField("section-ppe", "Mohon pilih minimal satu Alat Pelindung Diri (APD) Wajib.");
        return;
      }
    } else if (currentStep === 3) {
      if (!formData.pekerja || formData.pekerja.length === 0) {
        focusAndScrollToField("workers-section", "Mohon isi data Tenaga Kerja minimal 1 orang.");
        return;
      }
      const emptyIdx = formData.pekerja.findIndex((p: any) => !p.nama?.trim() || !p.jabatan?.trim());
      if (emptyIdx !== -1) {
        const targetId = !formData.pekerja[emptyIdx].nama?.trim() 
          ? `pekerja-nama-${emptyIdx}` 
          : `pekerja-jabatan-${emptyIdx}`;
        focusAndScrollToField(targetId, `Mohon lengkapi Nama dan Jabatan tenaga kerja ke-${emptyIdx + 1}.`);
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };
  const prevStep = () => {
    setSubmitError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const sanitizeErrorMessage = (msg: string) => {
    if (!msg) return "Mohon lengkapi seluruh data yang diperlukan.";
    const lower = msg.toLowerCase();
    if (lower.includes("jsa")) return "Mohon isi data Job Safety Analysis (JSA) minimal 1 tahapan kerja.";
    if (lower.includes("permit")) return "Mohon pilih minimal satu Jenis Ijin Kerja.";
    if (lower.includes("ppe") || lower.includes("apd")) return "Mohon pilih minimal satu Alat Pelindung Diri (APD) Wajib.";
    if (lower.includes("pekerja") || lower.includes("worker")) return "Mohon lengkapi data Tenaga Kerja minimal 1 orang.";
    if (lower.includes("penanggungjawab") || lower.includes("pic")) return "Mohon isi Nama Penanggung Jawab Vendor.";
    if (lower.includes("kontraktor")) return "Mohon isi Nama Perusahaan Vendor.";
    return msg;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError("");

    // Validasi kelengkapan sebelum submit
    if (!formData.namaKontraktor?.trim() || !formData.jenisPekerjaan?.trim() || !formData.mulaiKerja || !formData.selesaiKerja || !formData.jamKerjaMulai || !formData.jamKerjaAkhir || !formData.lokasi?.trim() || !formData.penanggungJawab?.trim() || !formData.noHpPJ?.trim() || !formData.pengawasPekerjaan?.trim() || !formData.noHpPengawas?.trim() || !formData.pengawasHse?.trim() || !formData.noHpHse?.trim()) {
      setCurrentStep(1);
      setTimeout(() => nextStep(), 50);
      setIsSubmitting(false);
      return;
    }

    if (!formData.permitTypes || formData.permitTypes.length === 0 || (formData.permitTypes.includes("Others") && !formData.otherPermitType?.trim()) || !formData.ppe || formData.ppe.length === 0) {
      setCurrentStep(2);
      setTimeout(() => nextStep(), 50);
      setIsSubmitting(false);
      return;
    }

    if (!formData.pekerja || formData.pekerja.length === 0 || formData.pekerja.some((p: any) => !p.nama?.trim() || !p.jabatan?.trim())) {
      setCurrentStep(3);
      setTimeout(() => nextStep(), 50);
      setIsSubmitting(false);
      return;
    }

    // Validasi Step 4 (JSA)
    if (!formData.jsa || formData.jsa.length === 0) {
      focusAndScrollToField("jsa-section", "Mohon isi data Job Safety Analysis (JSA) minimal 1 tahapan kerja.");
      setIsSubmitting(false);
      return;
    }
    const emptyJsaIdx = formData.jsa.findIndex((j: any) => !j.tahapan?.trim() || !j.potensi?.trim() || !j.pengendalian?.trim() || !j.tanggapDarurat?.trim());
    if (emptyJsaIdx !== -1) {
      focusAndScrollToField(`jsa-tahapan-${emptyJsaIdx}`, `Mohon lengkapi seluruh kolom JSA pada baris ke-${emptyJsaIdx + 1}.`);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        parentPermitId: formData.parentPermitId || extendState?.rawId || (typeof extendState?.originalId === "number" ? extendState.originalId : null) || undefined,
      };
      const res = await api.submitWorkPermit(payload);
      if (res.success) {
        setPermitNumber(res.data?.permit_number || "");
        setIsSuccess(true);
      } else {
        setSubmitError(sanitizeErrorMessage(res.message));
      }
    } catch (error: any) {
      console.error(error);
      setSubmitError(sanitizeErrorMessage(error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex-1 flex flex-col h-full bg-background/50">
        <Header title="Create Work Permit" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-success-container text-success rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
          {permitNumber && (
            <p className="text-sm font-semibold text-primary mb-2">
              Nomor Ijin Kerja: <span className="underline">{permitNumber}</span>
            </p>
          )}
          <p className="text-gray-500 mb-8 max-w-md">
            Ijin kerja berhasil tersimpan di sistem dan sedang menunggu verifikasi dari PIC Vendor & Tim K3 (HSE).
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate("/my-requests")}
              className="px-6 py-2.5 bg-primary text-on-primary rounded-lg font-medium hover:opacity-90 transition-colors cursor-pointer"
            >
              Lihat Ijin Saya
            </button>
            <button 
              onClick={() => navigate("/dashboard")}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Ke Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 1, title: "Ijin Kerja & Vendor" },
    { id: 2, title: "Permit Type & APD" },
    { id: 3, title: "Data Tenaga Kerja" },
    { id: 4, title: "Job Safety Analysis" },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <Header title="Create Work Permit" />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          
          {/* Page Titles directly on background */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {extendState?.extendMode 
                ? `Perpanjangan Ijin Kerja Ke-${formData.extensionPhase || 1} (Fase ${formData.extensionPhase || 1})` 
                : "Create Work Permit Request"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {extendState?.extendMode 
                ? `Pengajuan perpanjangan masa berlaku untuk Surat Ijin Kerja ${extendState.permitNumber || extendState.id || ""} (SIKA Induk: ${formData.rootPermitNumber || extendState.permitNumber}).`
                : "Formulir digital Ijin Kerja, Safety Induction & JSA untuk vendor eksternal."}
            </p>
          </div>

          {extendState?.extendMode && (
            <div className="mb-6 p-4 bg-amber-50/90 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-amber-900 text-sm shadow-sm animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                  <CalendarPlus size={20} />
                </div>
                <div>
                  <p className="font-bold text-amber-900">
                    Mode Perpanjangan Ijin Aktif &mdash; Fase {formData.extensionPhase || 1} (Perpanjangan Ke-{formData.extensionPhase || 1})
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Data perusahaan, personel, APD, dan dokumen JSA dari ijin <strong className="underline">{extendState.permitNumber || extendState.id}</strong> telah dimuat secara otomatis. Silakan periksa dan tentukan periode lanjutan kerja (maks. 6 hari).
                  </p>
                </div>
              </div>
            </div>
          )}

          {submitError && (
            <div className="mb-6 p-4 bg-red-50/90 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-red-700 text-sm shadow-sm animate-in fade-in">
              <div className="flex items-center gap-3">
                <AlertCircle size={20} className="shrink-0 text-red-600" />
                <span className="font-semibold text-red-800">{submitError}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setSubmitError("")} 
                className="text-red-500 hover:text-red-800 text-xs font-bold px-2 py-1 rounded-md hover:bg-red-100 transition-colors cursor-pointer shrink-0"
                title="Tutup pesan"
              >
                ✕
              </button>
            </div>
          )}
          
          {/* Stepper Bar in its own white pill container */}
          <div className="bg-white rounded-full border border-gray-200 px-6 py-4 shadow-sm mb-6 flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border-2 transition-colors",
                      isActive ? "bg-primary border-primary text-on-primary" : 
                      isCompleted ? "bg-white border-primary text-primary" : 
                      "bg-gray-50 border-gray-200 text-gray-400"
                    )}>
                      {step.id}
                    </div>
                    <span className={cn(
                      "hidden md:block text-sm font-medium whitespace-nowrap",
                      isActive || isCompleted ? "text-gray-900" : "text-gray-400"
                    )}>
                      {step.title}
                    </span>
                  </div>
                  
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block flex-1 h-px bg-gray-200 mx-4"></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Form Content Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 md:p-8">
              {currentStep === 1 && <Step1DataKontraktor data={formData} updateData={updateFormData} />}
              {currentStep === 2 && <Step2PermitType data={formData} updateData={updateFormData} />}
              {currentStep === 3 && <Step3TenagaKerja data={formData} updateData={updateFormData} />}
              {currentStep === 4 && <Step4JSA data={formData} updateData={updateFormData} />}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 md:px-8 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-2.5 rounded-lg font-medium text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Back
              </button>
              
              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  className="px-6 py-2.5 rounded-lg font-medium text-sm text-on-primary bg-primary hover:opacity-90 transition-colors shadow-sm"
                >
                  Next Step
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm text-on-primary bg-primary hover:opacity-90 transition-colors shadow-sm disabled:opacity-70"
                >
                  {isSubmitting ? "Submitting..." : "Submit Permit"}
                </button>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
