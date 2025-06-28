import { useState, useEffect } from 'react';
import { UploadSection } from '@/components/prescriptions/upload-section';
import { PrescriptionsList } from '@/components/prescriptions/prescriptions-list';
import { PrescriptionModal } from '@/components/prescriptions/prescription-modal';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { AIInsights } from '@/components/ai/ai-insights';
import type { PrescriptionWithMedicines } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import DeleteConfirmationDialog from '../components/prescriptions/DeleteConfirmationDialog';
import { usePrescriptions } from '../hooks/usePrescriptions';

export default function Dashboard() {
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionWithMedicines | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPrescriptionForChat, setSelectedPrescriptionForChat] = useState<string | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch prescriptions
  const { data: prescriptions } = useQuery<PrescriptionWithMedicines[]>({
    queryKey: ['/api/prescriptions'],
  });

  const { deletePrescription } = usePrescriptions();

  const handleViewPrescription = (prescription: PrescriptionWithMedicines) => {
    setSelectedPrescription(prescription);
    setModalOpen(true);
  };

  const handleChatAboutPrescription = (prescriptionId: string) => {
    setSelectedPrescriptionForChat(prescriptionId);
  };

  const handleDelete = (id: string) => setDeleteId(id);
  const handleDeleteConfirm = async (permanent?: boolean) => {
    if (!deleteId) return;
    setDeleting(true);
    await deletePrescription(deleteId, permanent);
    setDeleting(false);
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-8">
            <UploadSection />
            
            <PrescriptionsList 
              onViewPrescription={handleViewPrescription}
              onChatAboutPrescription={handleChatAboutPrescription}
              selectedPrescriptionId={selectedPrescriptionForChat}
              onDeletePrescription={handleDelete}
            />
            
            <AIInsights />
          </div>

          {/* Chat Sidebar */}
          <div className="xl:col-span-1">
            <ChatSidebar selectedPrescriptionId={selectedPrescriptionForChat} />
          </div>
        </div>
      </div>

      {/* Prescription Modal */}
      <PrescriptionModal
        prescription={selectedPrescription}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />

      <DeleteConfirmationDialog
        open={!!deleteId}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
      {deleting && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded shadow text-slate-700">Deleting...</div>
        </div>
      )}
    </div>
  );
}
