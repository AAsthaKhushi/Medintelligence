import { useQuery } from '@tanstack/react-query';
import type { PrescriptionWithMedicines } from '@shared/schema';

export function AIInsights() {
  const { data: prescriptions } = useQuery<PrescriptionWithMedicines[]>({
    queryKey: ['/api/prescriptions'],
  });

  // Simple analysis of prescriptions for insights
  const completedPrescriptions = prescriptions?.filter(p => p.processingStatus === 'completed') || [];
  const totalMedications = completedPrescriptions.reduce((sum, p) => sum + p.medicines.length, 0);
  const hasPendingFollowUp = completedPrescriptions.some(p => p.followUpDate && new Date(p.followUpDate) > new Date());

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
          <i className="fas fa-brain text-primary"></i>
        </div>
        <h2 className="text-lg font-semibold text-slate-900">AI Health Insights</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <i className="fas fa-check-circle text-green-600"></i>
            <h4 className="font-medium text-green-800">Medication Overview</h4>
          </div>
          <p className="text-sm text-green-700">
            {totalMedications > 0 
              ? `You have ${totalMedications} medication${totalMedications !== 1 ? 's' : ''} across ${completedPrescriptions.length} prescription${completedPrescriptions.length !== 1 ? 's' : ''}.`
              : 'No medications found in your prescription history.'
            }
          </p>
        </div>

        <div className={`p-4 border rounded-lg ${
          hasPendingFollowUp 
            ? 'bg-yellow-50 border-yellow-200' 
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <i className={`fas ${
              hasPendingFollowUp 
                ? 'fa-exclamation-triangle text-yellow-600' 
                : 'fa-check-circle text-green-600'
            }`}></i>
            <h4 className={`font-medium ${
              hasPendingFollowUp ? 'text-yellow-800' : 'text-green-800'
            }`}>
              Follow-up Status
            </h4>
          </div>
          <p className={`text-sm ${
            hasPendingFollowUp ? 'text-yellow-700' : 'text-green-700'
          }`}>
            {hasPendingFollowUp 
              ? 'You have upcoming follow-up appointments scheduled.'
              : 'No pending follow-up appointments found in your prescriptions.'
            }
          </p>
        </div>
      </div>

      {completedPrescriptions.length === 0 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <i className="fas fa-info-circle text-blue-600"></i>
            <h4 className="font-medium text-blue-800">Getting Started</h4>
          </div>
          <p className="text-sm text-blue-700">
            Upload your first prescription to start receiving personalized AI insights about your medications and health trends.
          </p>
        </div>
      )}
    </div>
  );
}
