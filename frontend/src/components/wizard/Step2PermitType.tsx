import { ShieldAlert } from "lucide-react";


const PERMIT_TYPES = [
  "Confined Space",
  "High Voltage Electricity",
  "Heavy Lifting",
  "Hot Work",
  "Excavation (LOTO)",
  "Work at Height",
];

const PPE_TYPES = [
  "Safety Helmet",
  "Safety Shoes",
  "Body Harness",
  "Safety Net",
  "Scaffolding",
  "Safety Glasses",
  "Face Shield",
  "Respiratory Protection",
  "Safety Line",
  "Ear Plug/Muff",
  "Gloves",
  "Breathing Apparatus",
  "Stairs",
  "Fire Extinguisher",
  "Lifeline",
  "Sign",
  "Barricade",
];

export function Step2PermitType({ data, updateData }: { data: any, updateData: any }) {
  
  const handlePermitToggle = (type: string) => {
    if (data.permitTypes.includes(type)) {
      updateData({ permitTypes: data.permitTypes.filter((t: string) => t !== type) });
    } else {
      updateData({ permitTypes: [...data.permitTypes, type] });
    }
  };

  const handlePpeToggle = (type: string) => {
    if (data.ppe.includes(type)) {
      updateData({ ppe: data.ppe.filter((t: string) => t !== type) });
    } else {
      updateData({ ppe: [...data.ppe, type] });
    }
  };

  const handleEquipmentChange = (index: number, value: string) => {
    const newEq = [...data.workEquipment];
    newEq[index] = value;
    updateData({ workEquipment: newEq });
  };

  const addEquipmentField = () => {
    updateData({ workEquipment: [...data.workEquipment, ""] });
  };

  const isOthersPermitChecked = data.permitTypes.includes("Others");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start gap-4 mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Permit Type, Equipment & APD</h3>
          <p className="text-sm text-gray-500">Tentukan jenis izin, peralatan yang digunakan, dan Alat Pelindung Diri (APD) yang diwajibkan.</p>
        </div>
      </div>

      {/* Permit Type */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Type of Work Permit</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {PERMIT_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
              <input 
                type="checkbox" 
                checked={data.permitTypes.includes(type)}
                onChange={() => handlePermitToggle(type)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 font-medium">{type}</span>
            </label>
          ))}
          
          {/* Others checkbox */}
          <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
            <input 
              type="checkbox" 
              checked={isOthersPermitChecked}
              onChange={() => handlePermitToggle("Others")}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 font-medium">Others</span>
          </label>
        </div>
        
        {isOthersPermitChecked && (
          <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Specify Other Permit Type <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Please specify..."
            />
          </div>
        )}
      </div>

      {/* PPE */}
      <div className="space-y-4 pt-6 border-t border-gray-100">
        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Required PPE (APD)</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {PPE_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={data.ppe.includes(type)}
                onChange={() => handlePpeToggle(type)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{type}</span>
            </label>
          ))}
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

    </div>
  );
}
