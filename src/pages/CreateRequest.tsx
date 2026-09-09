import { useState } from "react";
import { Header } from "@/components/Header";
import { Step1DataKontraktor } from "@/components/wizard/Step1DataKontraktor";
import { Step2PermitType } from "@/components/wizard/Step2PermitType";
import { Step3TenagaKerja } from "@/components/wizard/Step3TenagaKerja";
import { Step4JSA } from "@/components/wizard/Step4JSA";
import { api } from "@/services/api";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export default function CreateRequestPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Global Form State
  const [formData, setFormData] = useState({
    // Step 1
    requestType: "Baru",
    namaKontraktor: "",
    jenisPekerjaan: "",
    mulaiKerja: "",
    selesaiKerja: "",
    penanggungJawab: "",
    noHpPJ: "",
    pengawasPekerjaan: "",
    noHpPengawas: "",
    pengawasHse: "",
    noHpHse: "",
    totalTenagaKerja: "",
    jamKerjaMulai: "",
    jamKerjaAkhir: "",
    lokasi: "",
    
    // Step 2
    permitTypes: [] as string[],
    ppe: [] as string[],
    otherPpe: "",
    workEquipment: ["", "", ""], // start with 3 empty inputs
    
    // Step 3
    pekerja: [] as any[],
    
    // Step 4
    jsa: [] as any[],
  });

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.submitWorkPermit(formData);
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      alert("Failed to submit");
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
          <p className="text-gray-500 mb-8 max-w-md">
            Your work permit request has been successfully submitted and is waiting for HSE Manager approval.
          </p>
          <button 
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2.5 bg-primary text-on-primary rounded-lg font-medium hover:opacity-90 transition-colors"
          >
            Back to Dashboard
          </button>
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
            <h2 className="text-2xl font-bold text-gray-900">Create Work Permit Request</h2>
            <p className="text-sm text-gray-500 mt-1">Formulir digital Ijin Kerja, Safety Induction & JSA untuk vendor eksternal.</p>
          </div>
          
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
