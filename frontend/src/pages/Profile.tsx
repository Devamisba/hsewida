
import { Header } from "@/components/Header";
import { User, Mail, Phone, Building } from "lucide-react";

export default function ProfilePage() {
  const role = sessionStorage.getItem('userRole');

  const getProfileData = () => {
    switch(role) {
      case 'pemohon':
        return { nama: "PT. Maju Mundur", jabatan: "Vendor", email: "contact@majumundur.com", phone: "081122334455", dept: "Eksternal" };
      case 'pic_vendor':
        return { nama: "PIC Vendor Widatra", jabatan: "Penanggung Jawab", email: "pic@widatra.com", phone: "089988776655", dept: "Vendor Management" };
      case 'hse':
        return { nama: "Tim HSE", jabatan: "PIC HSE", email: "hse@widatra.com", phone: "085566778899", dept: "HSE" };
      case 'ga_dept_head':
        return { nama: "P. Andaru", jabatan: "HRD & GA Dept Head", email: "andaru@widatra.com", phone: "081234567890", dept: "HRD & GA" };
      case 'ga_div_head':
        return { nama: "P. Effendy", jabatan: "HRD & GA Div Head", email: "effendy@widatra.com", phone: "082345678901", dept: "HRD & GA" };
      default:
        return { nama: "User", jabatan: "User", email: "-", phone: "-", dept: "-" };
    }
  };

  const profile = getProfileData();

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      <Header title="Profil Pengguna" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 h-32"></div>
            
            <div className="px-8 pb-8">
              <div className="relative flex justify-between items-end -mt-12 mb-6">
                <div className="h-24 w-24 rounded-full bg-white p-1 border-4 border-white shadow-md flex items-center justify-center bg-gray-50 text-blue-600">
                  <User size={48} />
                </div>
                <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Edit Profil
                </button>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900">{profile.nama}</h2>
                <p className="text-gray-500 font-medium">{profile.jabatan}</p>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><User size={16} className="text-gray-400" /> Full Name</p>
                    <p className="font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">{profile.nama}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><Mail size={16} className="text-gray-400" /> Email Address</p>
                    <p className="font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">{profile.email}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><Phone size={16} className="text-gray-400" /> Phone Number</p>
                    <p className="font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">{profile.phone}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><Building size={16} className="text-gray-400" /> Role</p>
                    <p className="font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">{profile.jabatan}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
