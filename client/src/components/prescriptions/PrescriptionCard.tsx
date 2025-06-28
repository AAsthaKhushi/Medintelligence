import React from 'react';
import { Prescription } from '../../lib/types';
import { formatConfidenceLevel } from '../../lib/prescriptionUtils';

interface PrescriptionCardProps {
  prescription: Prescription;
  onView: (id: string) => void;
  onDetails: (id: string) => void;
  onAskAI: (id: string) => void;
  onDelete: (id: string) => void;
}

const confidenceColors = {
  high: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-red-100 text-red-700',
};

const docIcons: Record<string, string> = {
  pdf: 'fas fa-file-pdf',
  image: 'fas fa-file-image',
  docx: 'fas fa-file-word',
};

// Helper function to format upload date and time
const formatUploadDateTime = (createdAt: string) => {
  const date = new Date(createdAt);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} min ago`;
    }
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
};

// PrescriptionCard displays a summary of a prescription with action buttons and status indicator.
const PrescriptionCard: React.FC<PrescriptionCardProps> = ({ prescription, onView, onDetails, onAskAI, onDelete }) => {
  const { id, doctorName, patientName, originalDocument, medicines, extractionConfidence, createdAt, consultationDate } = prescription;
  const medSummary = medicines.slice(0, 3);
  const moreMeds = medicines.length > 3 ? medicines.length - 3 : 0;

  // Use consultationDate or createdAt for display
  const displayDate = consultationDate || createdAt;
  const formatDisplayDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not specified';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 'Not specified' : d.toLocaleDateString();
  };
  const confidenceKey = (typeof extractionConfidence === 'string' ? extractionConfidence : 'low') as keyof typeof confidenceColors;

  return (
    <div
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 flex flex-col relative group border border-slate-100 hover:border-primary cursor-pointer"
    >
      {/* Delete Button */}
      <button
        className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors z-10"
        onClick={e => { e.stopPropagation(); onDelete(id); }}
        aria-label="Delete Prescription"
      >
        <i className="fas fa-trash"></i>
      </button>

      {/* Card Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-semibold text-slate-900 text-base">{doctorName || 'Unknown Doctor'}</div>
          <div className="text-xs text-slate-500">{formatDisplayDate(displayDate)}</div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-semibold ${confidenceColors[confidenceKey]}`}>{formatConfidenceLevel(confidenceKey)}</div>
      </div>
      <div className="text-xs text-slate-400 mb-2">ID: {id}</div>

      {/* Patient Info */}
      <div className="mb-3">
        <div className="text-sm text-slate-700 font-medium">{patientName || 'Unknown Patient'}</div>
      </div>

      {/* Upload Date Info */}
      <div className="mb-3">
        <div className="flex items-center text-xs text-slate-500">
          <i className="fas fa-upload mr-1"></i>
          <span>Uploaded {formatUploadDateTime(createdAt || '')}</span>
        </div>
      </div>

      {/* Prescription Preview */}
      <div className="flex items-center mb-3">
        {originalDocument?.type === 'image' && originalDocument.url ? (
          <img
            src={originalDocument.url}
            alt="Prescription Preview"
            className="w-12 h-12 object-cover rounded shadow border border-slate-200 mr-3"
          />
        ) : originalDocument?.type === 'pdf' && originalDocument.previewUrl ? (
          <img
            src={originalDocument.previewUrl}
            alt="PDF Preview"
            className="w-12 h-12 object-cover rounded shadow border border-slate-200 mr-3"
          />
        ) : (
          <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded mr-3">
            <i className={`${docIcons[originalDocument?.type || 'pdf']} text-2xl text-slate-400`}></i>
          </div>
        )}
        <div className="flex-1">
          <div className="text-xs text-slate-500 truncate">{(originalDocument && originalDocument.filename) ? originalDocument.filename : 'No file'}</div>
        </div>
      </div>

      {/* Medicine Summary */}
      <div className="flex flex-wrap gap-2 mb-4">
        {medSummary.map((med, idx) => (
          <span key={idx} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
            {med.name} {med.dosage || ''}
          </span>
        ))}
        {moreMeds > 0 && (
          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">
            +{moreMeds} more
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-auto">
        <button
          className="flex-1 bg-primary text-white rounded px-3 py-1 text-sm font-medium shadow hover:bg-primary/90 transition-colors"
          onClick={e => { e.stopPropagation(); onView(id); }}
        >
          <i className="fas fa-eye mr-1"></i>View
        </button>
        <button
          className="flex-1 bg-slate-100 text-slate-700 rounded px-3 py-1 text-sm font-medium hover:bg-slate-200 transition-colors"
          onClick={e => { e.stopPropagation(); onDetails(id); }}
        >
          <i className="fas fa-info-circle mr-1"></i>Details
        </button>
        <button
          className="flex-1 bg-slate-100 text-primary rounded px-3 py-1 text-sm font-medium hover:bg-primary/10 transition-colors"
          onClick={e => { e.stopPropagation(); onAskAI(id); }}
        >
          <i className="fas fa-robot mr-1"></i>Ask AI
        </button>
      </div>
    </div>
  );
};

export default PrescriptionCard;
