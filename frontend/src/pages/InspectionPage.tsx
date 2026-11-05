import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { 
  MapPin, 
  RefreshCw, 
  QrCode, 
  Trash2, 
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InspectionDataTable } from "@/components/InspectionDataTable";
import { InspectionModal } from "@/components/InspectionModal";
import { FacilityDetailActionModal } from "@/components/FacilityDetailActionModal";
import { FacilityQrStickerModal } from "@/components/FacilityQrStickerModal";
import { QrScanFieldModal } from "@/components/QrScanFieldModal";
import { EditFacilityModal } from "@/components/EditFacilityModal";
import { api, SafetyFacility } from "@/services/api";

export default function InspectionPage() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");
  const [stickerModalOpen, setStickerModalOpen] = useState(false);
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [facilityToEdit, setFacilityToEdit] = useState<SafetyFacility | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState<SafetyFacility | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Selected facility for modal operations
  const [selectedFacility, setSelectedFacility] = useState<SafetyFacility | null>(null);

  const getCategoryTitle = (cat?: string) => {
    switch ((cat || "").toLowerCase()) {
      case "all": return "Semua Fasilitas";
      case "apar": return "APAR";
      case "hydrant": return "Hydrant";
      case "emergency_door":
      case "emergency": return "Pintu Emergency";
      case "p3k": return "P3K";
      case "safety_mirror":
      case "mirror": return "Safety Mirror";
      case "assembly_point":
      case "assembly": return "Assembly Point";
      default: return "Fasilitas K3";
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const handleInspect = (facility: SafetyFacility, type?: string) => {
    setSelectedFacility(facility);
    setModalType(type || getCategoryTitle(facility.category));
    setModalOpen(true);
  };

  const handleShowSticker = (facility: SafetyFacility) => {
    setSelectedFacility(facility);
    setStickerModalOpen(true);
  };

  const handleOpenDetail = (facility: SafetyFacility) => {
    setSelectedFacility(facility);
    setDetailModalOpen(true);
  };

  const handleOpenEdit = (facility: SafetyFacility) => {
    setFacilityToEdit(facility);
    setEditModalOpen(true);
  };

  const handleRequestDelete = (facility: SafetyFacility) => {
    setFacilityToDelete(facility);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!facilityToDelete) return;
    setDeleting(true);
    try {
      const res = await api.deleteFacility(facilityToDelete.id);
      if (res?.success) {
        setDeleteConfirmOpen(false);
        setFacilityToDelete(null);
        handleRefresh();
      } else {
        alert(res?.message || "Gagal menghapus fasilitas.");
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Gagal menghapus fasilitas.");
    } finally {
      setDeleting(false);
    }
  };

  const handleScanSuccess = (facility: SafetyFacility) => {
    setScannerModalOpen(false);
    if (!facility.category || facility.category === "apar") {
      navigate(`/scan/apar/${facility.code}`);
    } else {
      handleInspect(facility, getCategoryTitle(facility.category));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden relative font-sans">
      <Header title="Inspeksi & Audit K3" />

      <main className="flex-1 overflow-y-auto p-4 md:p-5">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          
          {/* Top Control Bar */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white px-5 py-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Audit & Inspeksi Lapangan K3</h1>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Pantau kepatuhan pengecekan fisik, foto bukti realtime, validasi radius geofence, dan verifikasi PIC K3
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full xl:w-auto justify-start xl:justify-end">
              <Link
                to="/gis-map"
                className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-2 rounded-xl transition-all text-xs font-bold shadow-2xs cursor-pointer active:scale-95"
                title="Buka Peta GIS & Radius Geofence Pabrik"
              >
                <MapPin size={14} className="text-emerald-700" />
                <span>Peta GIS</span>
              </Link>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-2 rounded-xl transition-all text-xs font-semibold shadow-2xs cursor-pointer active:scale-95"
                title="Muat Ulang Data Inspeksi"
              >
                <RefreshCw size={14} className={cn(refreshing && "animate-spin text-primary")} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setScannerModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl transition-all text-xs font-bold shadow-xs cursor-pointer active:scale-95"
                title="Scan QR Code Alat di Lapangan"
              >
                <QrCode size={14} />
                <span>Scan QR Lapangan</span>
              </button>
            </div>
          </div>

          {/* Inspection Data Table Section */}
          <div id="inspeksi-section" className="flex-1 flex flex-col min-h-[420px]">
            <InspectionDataTable
              key={refreshKey}
              onOpenFacilityDetail={handleOpenDetail}
              onShowSticker={handleShowSticker}
              onInspectFacility={(f) => {
                if (!f.category || f.category === "apar") {
                  navigate(`/scan/apar/${f.code}`);
                } else {
                  handleInspect(f, getCategoryTitle(f.category));
                }
              }}
            />
          </div>

        </div>
      </main>

      {/* 1. Modal Form Inspeksi */}
      <InspectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={selectedFacility}
        type={modalType}
        onSuccess={handleRefresh}
      />

      {/* 2. Modal Cetak QR Sticker Fisik */}
      <FacilityQrStickerModal
        isOpen={stickerModalOpen}
        onClose={() => setStickerModalOpen(false)}
        facility={selectedFacility}
      />

      {/* 3. Modal Scan QR Lapangan */}
      <QrScanFieldModal
        isOpen={scannerModalOpen}
        onClose={() => setScannerModalOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* 4. Modal Bundel Aksi & Riwayat Monitoring Fasilitas */}
      <FacilityDetailActionModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        facility={selectedFacility}
        onInspect={(f) => handleInspect(f, getCategoryTitle(f.category))}
        onShowSticker={handleShowSticker}
        onRefill={() => {}}
        onFacilityUpdated={handleRefresh}
        onEdit={(f) => {
          setDetailModalOpen(false);
          handleOpenEdit(f);
        }}
        onDelete={(f) => {
          setDetailModalOpen(false);
          handleRequestDelete(f);
        }}
      />

      {/* 5. Modal Edit Data Fasilitas */}
      <EditFacilityModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setFacilityToEdit(null);
        }}
        facility={facilityToEdit}
        onSuccess={() => {
          setEditModalOpen(false);
          setFacilityToEdit(null);
          handleRefresh();
        }}
        onDeleteRequest={(f) => {
          setEditModalOpen(false);
          handleRequestDelete(f);
        }}
      />

      {/* 6. Konfirmasi Hapus Fasilitas Modal */}
      {deleteConfirmOpen && facilityToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-red-100 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center">Hapus Fasilitas K3?</h3>
              <p className="text-sm text-gray-500 text-center mt-2">
                Apakah Anda yakin ingin menonaktifkan/menghapus fasilitas{" "}
                <span className="font-bold text-gray-800">{facilityToDelete.code} - {facilityToDelete.name}</span>?
              </p>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
                Unit akan dinonaktifkan dari daftar aktif monitoring. Riwayat inspeksi terdahulu tetap diarsipkan demi kepatuhan audit K3.
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setFacilityToDelete(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Ya, Hapus Fasilitas</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
