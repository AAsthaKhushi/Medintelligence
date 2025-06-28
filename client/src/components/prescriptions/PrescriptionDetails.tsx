import React, { useState } from 'react';
import { Prescription, Medicine } from '../../lib/types';

interface PrescriptionDetailsProps {
  prescription: Prescription | null;
  onClose: () => void;
  onSave?: (updated: Prescription) => Promise<boolean>;
}

// PrescriptionDetails displays and allows editing of all prescription data in a modal or drawer.
const PrescriptionDetails: React.FC<PrescriptionDetailsProps> = ({ prescription, onClose, onSave }) => {
  if (!prescription) return null;
  const [form, setForm] = useState<Prescription>({ ...prescription });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof Prescription, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };
  const handleMedicineChange = (idx: number, field: keyof Medicine, value: any) => {
    setForm(prev => ({
      ...prev,
      medicines: prev.medicines.map((m, i) => i === idx ? { ...m, [field]: value } : m)
    }));
  };
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    if (onSave) {
      const success = await onSave(form);
      if (!success) setError('Failed to update prescription.');
      else onClose();
    } else {
      onClose();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full relative overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Prescription Details</h2>
        {error && <div className="mb-2 text-red-500 text-sm">{error}</div>}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Doctor Name</label>
          <input className="w-full border border-slate-300 rounded px-3 py-2" value={form.doctorName} onChange={e => handleChange('doctorName', e.target.value)} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name</label>
          <input className="w-full border border-slate-300 rounded px-3 py-2" value={form.patientName} onChange={e => handleChange('patientName', e.target.value)} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
          <input type="date" className="w-full border border-slate-300 rounded px-3 py-2" value={form.date} onChange={e => handleChange('date', e.target.value)} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosis</label>
          <input className="w-full border border-slate-300 rounded px-3 py-2" value={form.diagnosis} onChange={e => handleChange('diagnosis', e.target.value)} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Instructions</label>
          <textarea className="w-full border border-slate-300 rounded px-3 py-2" value={form.instructions} onChange={e => handleChange('instructions', e.target.value)} />
        </div>
        <div className="mb-6">
          <h3 className="font-medium text-slate-900 mb-2">Medicines</h3>
          {form.medicines.map((med, idx) => (
            <div key={idx} className="border border-slate-200 rounded p-3 mb-2">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input className="border border-slate-300 rounded px-2 py-1" value={med.name} onChange={e => handleMedicineChange(idx, 'name', e.target.value)} placeholder="Name" />
                <input className="border border-slate-300 rounded px-2 py-1" value={med.dosage} onChange={e => handleMedicineChange(idx, 'dosage', e.target.value)} placeholder="Dosage" />
                <input className="border border-slate-300 rounded px-2 py-1" value={med.frequency} onChange={e => handleMedicineChange(idx, 'frequency', e.target.value)} placeholder="Frequency" />
                <input className="border border-slate-300 rounded px-2 py-1" value={med.duration} onChange={e => handleMedicineChange(idx, 'duration', e.target.value)} placeholder="Duration" />
              </div>
              <textarea className="w-full border border-slate-300 rounded px-2 py-1" value={med.instructions || ''} onChange={e => handleMedicineChange(idx, 'instructions', e.target.value)} placeholder="Instructions (optional)" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="bg-slate-100 text-slate-700 px-4 py-2 rounded hover:bg-slate-200" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
        <button className="absolute top-2 right-2 text-slate-400 hover:text-red-500" onClick={onClose}>X</button>
      </div>
    </div>
  );
};

export default PrescriptionDetails;
 