import React from 'react';
import { Prescription } from '../../lib/types';

interface ViewPrescriptionModalProps {
  prescription: Prescription | null;
  open: boolean;
  onClose: () => void;
}

const docIcons: Record<string, string> = {
  pdf: 'fas fa-file-pdf',
  image: 'fas fa-file-image',
  docx: 'fas fa-file-word',
};

// ViewPrescriptionModal displays the original prescription document and extracted data side by side.
const ViewPrescriptionModal: React.FC<ViewPrescriptionModalProps> = ({ prescription, open, onClose }) => {
  if (!open || !prescription) return null;
  const { originalDocument, doctorName, patientName, diagnosis, medicines, instructions } = prescription;

  const handlePrint = () => {
    window.print();
  };
  const handleDownload = () => {
    if (originalDocument?.url) {
      const link = document.createElement('a');
      link.href = originalDocument.url;
      link.download = originalDocument.filename || 'prescription';
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:bg-white print:relative print:inset-auto print:flex print:items-start print:justify-start">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full relative flex flex-col md:flex-row gap-6 print:block print:rounded-none print:p-0">
        {/* Document Preview */}
        <div className="flex-shrink-0 w-full md:w-64 flex flex-col items-center print:w-full print:mb-4">
          {originalDocument?.url && originalDocument.type === 'image' && (
            <img src={originalDocument.url} alt="Prescription" className="w-full h-auto rounded shadow border border-slate-200" />
          )}
          {originalDocument?.url && originalDocument.type === 'pdf' && (
            <iframe src={originalDocument.url} title="Prescription PDF" className="w-full h-64 rounded border border-slate-200" />
          )}
          {originalDocument?.url && originalDocument.type === 'docx' && (
            <div className="flex flex-col items-center justify-center w-full h-64 bg-slate-50 rounded border border-slate-200">
              <i className="fas fa-file-word text-4xl text-blue-500 mb-2"></i>
              <span className="text-slate-500 text-sm">DOCX Preview</span>
              <a href={originalDocument.url} target="_blank" rel="noopener noreferrer" className="text-primary underline mt-2">Open Document</a>
            </div>
          )}
          {!originalDocument?.url && (
            <div className="flex flex-col items-center justify-center w-full h-64 bg-slate-50 rounded border border-slate-200">
              <i className={`${docIcons[originalDocument?.type || 'pdf']} text-4xl text-slate-400 mb-2`}></i>
              <span className="text-slate-500 text-sm">No preview available</span>
            </div>
          )}
          <div className="flex gap-2 mt-4 print:hidden">
            <button onClick={handlePrint} className="bg-slate-100 text-slate-700 px-3 py-1 rounded hover:bg-slate-200"><i className="fas fa-print mr-1"></i>Print</button>
            <button onClick={handleDownload} className="bg-slate-100 text-slate-700 px-3 py-1 rounded hover:bg-slate-200"><i className="fas fa-download mr-1"></i>Download</button>
          </div>
        </div>
        {/* Extracted Data */}
        <div className="flex-1 overflow-y-auto print:w-full">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Extracted Prescription Data</h2>
          <div className="mb-2"><span className="font-medium text-slate-700">Doctor:</span> {doctorName || 'N/A'}</div>
          <div className="mb-2"><span className="font-medium text-slate-700">Patient:</span> {patientName || 'N/A'}</div>
          <div className="mb-2"><span className="font-medium text-slate-700">Diagnosis:</span> {diagnosis || 'N/A'}</div>
          <div className="mb-4"><span className="font-medium text-slate-700">Instructions:</span> {instructions || 'N/A'}</div>
          <div>
            <h3 className="font-medium text-slate-900 mb-2">Medicines</h3>
            {medicines.length === 0 ? (
              <div className="text-slate-500">No medicines found.</div>
            ) : (
              <ul className="space-y-2">
                {medicines.map((med, idx) => (
                  <li key={idx} className="border border-slate-200 rounded p-2">
                    <div className="font-medium text-slate-800">{med.name}</div>
                    <div className="text-xs text-slate-500">Dosage: {med.dosage} | Frequency: {med.frequency} | Duration: {med.duration}</div>
                    {med.instructions && <div className="text-xs text-slate-500">Instructions: {med.instructions}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <button className="absolute top-2 right-2 text-slate-400 hover:text-red-500 print:hidden" onClick={onClose}>X</button>
      </div>
    </div>
  );
};

export default ViewPrescriptionModal;
