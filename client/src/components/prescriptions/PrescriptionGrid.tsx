import React from 'react';
import { Prescription } from '../../lib/types';
import PrescriptionCard from './PrescriptionCard';

interface PrescriptionGridProps {
  prescriptions: Prescription[];
  onView: (id: string) => void;
  onDetails: (id: string) => void;
  onAskAI: (id: string) => void;
  onDelete: (id: string) => void;
}

// PrescriptionGrid displays a responsive grid of PrescriptionCard components.
const PrescriptionGrid: React.FC<PrescriptionGridProps> = ({ prescriptions, onView, onDetails, onAskAI, onDelete }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {prescriptions.map((prescription) => (
        <PrescriptionCard
          key={prescription.id}
          prescription={prescription}
          onView={onView}
          onDetails={onDetails}
          onAskAI={onAskAI}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default PrescriptionGrid;
 