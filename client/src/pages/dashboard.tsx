import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { UploadSection } from '@/components/prescriptions/upload-section';
import { PrescriptionsList } from '@/components/prescriptions/prescriptions-list';
import { PrescriptionModal } from '@/components/prescriptions/prescription-modal';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { AIInsights } from '@/components/ai/ai-insights';
import type { PrescriptionWithMedicines } from '@shared/schema';

export default function Dashboard() {
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionWithMedicines | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPrescriptionForChat, setSelectedPrescriptionForChat] = useState<string | undefined>();

  const handleViewPrescription = (prescription: PrescriptionWithMedicines) => {
    setSelectedPrescription(prescription);
    setModalOpen(true);
  };

  const handleChatAboutPrescription = (prescriptionId: string) => {
    setSelectedPrescriptionForChat(prescriptionId);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-8">
            <UploadSection />
            
            <PrescriptionsList 
              onViewPrescription={handleViewPrescription}
              onChatAboutPrescription={handleChatAboutPrescription}
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
    </div>
  );
}
