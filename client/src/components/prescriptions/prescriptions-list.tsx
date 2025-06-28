import { useQuery } from '@tanstack/react-query';
import type { PrescriptionWithMedicines } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';

interface PrescriptionsListProps {
  onViewPrescription: (prescription: PrescriptionWithMedicines) => void;
  onChatAboutPrescription: (prescriptionId: string) => void;
  selectedPrescriptionId?: string;
  onDeletePrescription?: (prescriptionId: string) => void;
}

// Helper function to format upload date and time
const formatUploadDateTime = (date: Date): string => {
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

export function PrescriptionsList({ onViewPrescription, onChatAboutPrescription, selectedPrescriptionId, onDeletePrescription }: PrescriptionsListProps) {
  const { data: prescriptions, isLoading } = useQuery<PrescriptionWithMedicines[]>({
    queryKey: ['/api/prescriptions'],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Processed</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Pending</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Recent Prescriptions</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-slate-200 rounded-lg p-4">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64 mb-3" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Recent Prescriptions</h2>
        <Link href="/prescriptions">
        <Button variant="ghost" className="text-primary hover:text-primary/80 font-medium text-sm">
          View All
        </Button>
        </Link>
      </div>

      {!prescriptions || prescriptions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-prescription-bottle text-slate-400 text-2xl"></i>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No prescriptions yet</h3>
          <p className="text-slate-600">Upload your first prescription to get started with AI analysis.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className={`border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors ${selectedPrescriptionId === prescription.id ? 'ring-2 ring-primary bg-primary/5' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-slate-900">
                      {prescription.doctorName || 'Processing...'}
                    </h3>
                    {getStatusBadge(prescription.processingStatus)}
                  </div>
                  <p className="text-sm text-slate-600 mb-3">
                    {prescription.diagnosis || 'Diagnosis pending analysis'}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Hospital</p>
                      <p className="text-sm text-slate-700">
                        {prescription.hospitalClinic || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Date</p>
                      <p className="text-sm text-slate-700">
                        {formatDate(prescription.consultationDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Medicines</p>
                      <p className="text-sm text-slate-700">
                        {prescription.processingStatus === 'completed' 
                          ? `${prescription.medicines.length} medication${prescription.medicines.length !== 1 ? 's' : ''}`
                          : 'Analyzing...'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Uploaded</p>
                      <p className="text-sm text-slate-700">
                        {prescription.createdAt ? formatUploadDateTime(new Date(prescription.createdAt)) : 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {prescription.processingStatus === 'completed' && prescription.medicines.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {prescription.medicines.slice(0, 3).map((medicine, index) => (
                        <div key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                          {medicine.name} {medicine.dosage}
                        </div>
                      ))}
                      {prescription.medicines.length > 3 && (
                        <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">
                          +{prescription.medicines.length - 3} more
                        </div>
                      )}
                    </div>
                  )}

                  {prescription.processingStatus === 'processing' && (
                    <div className="mt-4">
                      <div className="flex items-center space-x-2">
                        <div className="animate-pulse w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm text-yellow-600">AI extraction in progress</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col space-y-2 ml-4">
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewPrescription(prescription)}
                    className={`text-primary hover:text-primary/80 justify-start${prescription.processingStatus !== 'completed' ? ' opacity-50 pointer-events-none' : ''}`}
                    disabled={prescription.processingStatus !== 'completed'}
                      >
                        <i className="fas fa-eye mr-2"></i>View Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onChatAboutPrescription(prescription.id)}
                    className={`text-slate-600 hover:text-slate-700 justify-start${prescription.processingStatus !== 'completed' ? ' opacity-50 pointer-events-none' : ''}`}
                    disabled={prescription.processingStatus !== 'completed'}
                      >
                        <i className="fas fa-comment mr-2"></i>Ask AI
                      </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeletePrescription && onDeletePrescription(prescription.id)}
                    className="text-red-500 hover:text-red-700 justify-start"
                    aria-label="Delete Prescription"
                  >
                    <i className="fas fa-trash mr-2"></i>Delete
                    </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
