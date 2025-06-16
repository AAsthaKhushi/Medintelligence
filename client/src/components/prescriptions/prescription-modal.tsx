import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { PrescriptionWithMedicines } from '@shared/schema';

interface PrescriptionModalProps {
  prescription: PrescriptionWithMedicines | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrescriptionModal({ prescription, open, onOpenChange }: PrescriptionModalProps) {
  if (!prescription) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const confidencePercentage = prescription.extractionConfidence 
    ? Math.round(prescription.extractionConfidence * 100) 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900">
            Prescription Details
          </DialogTitle>
          <p className="text-sm text-slate-600">AI-extracted medical information</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Doctor & Hospital Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-medium text-slate-900 mb-3">Healthcare Provider</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-slate-600">Doctor</p>
                  <p className="font-medium text-slate-900">
                    {prescription.doctorName || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Hospital/Clinic</p>
                  <p className="font-medium text-slate-900">
                    {prescription.hospitalClinic || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-medium text-slate-900 mb-3">Consultation Details</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-slate-600">Date</p>
                  <p className="font-medium text-slate-900">
                    {formatDate(prescription.consultationDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Diagnosis</p>
                  <p className="font-medium text-slate-900">
                    {prescription.diagnosis || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Info */}
          {prescription.patientName && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-medium text-slate-900 mb-3">Patient Information</h3>
              <p className="font-medium text-slate-900">{prescription.patientName}</p>
            </div>
          )}

          {/* Medications */}
          {prescription.medicines.length > 0 && (
            <div>
              <h3 className="font-medium text-slate-900 mb-4">Prescribed Medications</h3>
              <div className="space-y-4">
                {prescription.medicines.map((medicine, index) => (
                  <div key={medicine.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-slate-900">{medicine.name}</h4>
                        {medicine.genericName && (
                          <p className="text-sm text-slate-600">{medicine.genericName}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900">{medicine.dosage}</p>
                        {medicine.quantity && (
                          <p className="text-sm text-slate-600">{medicine.quantity}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Frequency</p>
                        <p className="font-medium text-slate-900">
                          {medicine.frequency || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Duration</p>
                        <p className="font-medium text-slate-900">
                          {medicine.duration || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Instructions</p>
                        <p className="font-medium text-slate-900">
                          {medicine.instructions || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vital Signs */}
          {prescription.vitalSigns && Object.keys(prescription.vitalSigns).length > 0 && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-medium text-slate-900 mb-3">Vital Signs</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(prescription.vitalSigns).map(([key, value]) => (
                  value && (
                    <div key={key}>
                      <p className="text-sm text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="font-medium text-slate-900">{value as string}</p>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          {prescription.specialInstructions && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-medium text-slate-900 mb-3">Special Instructions</h3>
              <p className="text-slate-700">{prescription.specialInstructions}</p>
            </div>
          )}

          {/* AI Confidence Score */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-primary">AI Extraction Confidence</h4>
              <span className="text-lg font-bold text-primary">{confidencePercentage}%</span>
            </div>
            <div className="w-full bg-primary/20 rounded-full h-2 mb-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${confidencePercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-primary/80">
              {confidencePercentage >= 90 ? 'High confidence extraction. All critical medical information successfully identified.' :
               confidencePercentage >= 70 ? 'Good confidence extraction. Most medical information identified successfully.' :
               'Moderate confidence extraction. Some information may need verification.'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
