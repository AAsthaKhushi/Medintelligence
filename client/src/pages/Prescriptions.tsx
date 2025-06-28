import React, { useState } from 'react';
import { usePrescriptions } from '../hooks/usePrescriptions';
import PrescriptionGrid from '../components/prescriptions/PrescriptionGrid';
import ViewPrescriptionModal from '../components/prescriptions/ViewPrescriptionModal';
import PrescriptionDetails from '../components/prescriptions/PrescriptionDetails';
import AskAIModal from '../components/prescriptions/AskAIModal';
import DeleteConfirmationDialog from '../components/prescriptions/DeleteConfirmationDialog';
import { Prescription } from '../lib/types';
import { Link } from 'wouter';
import { Button } from '../components/ui/button';
import { useQueryClient } from '@tanstack/react-query';

// Helper for unique doctor names
function getUniqueDoctors(prescriptions: Prescription[]) {
  return Array.from(new Set(prescriptions.map(p => p.doctorName).filter(Boolean)));
}

const confidenceOptions = [
  { value: '', label: 'All' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const sortOptions = [
  { value: 'date', label: 'Date' },
  { value: 'doctorName', label: 'Doctor' },
  { value: 'patientName', label: 'Patient' },
  { value: 'confidence', label: 'Confidence' },
];

// Prescriptions page displays all prescriptions with search, filter, and modals.
const Prescriptions: React.FC = () => {
  const {
    prescriptions,
    loading,
    error,
    search,
    setSearch,
    filterDoctor,
    setFilterDoctor,
    filterConfidence,
    setFilterConfidence,
    sortBy,
    sortOrder,
    setSort,
    page,
    totalPages,
    setPage,
    pageSize,
    setPageSize,
    total,
    allPrescriptions,
    editPrescription,
    deletePrescription,
    deleteAllPrescriptions,
  } = usePrescriptions();

  const queryClient = useQueryClient();

  // Modal state
  const [viewId, setViewId] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [aiId, setAIId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Delete All state
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const getPrescriptionById = (id: string | null) =>
    allPrescriptions.find(p => p.id === id) || null;

  // UI Handlers
  const handleView = (id: string) => setViewId(id);
  const handleDetails = (id: string) => setDetailsId(id);
  const handleAskAI = (id: string) => setAIId(id);
  const handleDelete = (id: string) => setDeleteId(id);
  const handleDeleteConfirm = async (permanent?: boolean) => {
    if (!deleteId) return;
    setDeleting(true);
    await deletePrescription(deleteId, permanent);
    setDeleting(false);
    setDeleteId(null);
  };
  const handleEditSave = async (updated: Prescription) => {
    if (!detailsId) return false;
    const success = await editPrescription(detailsId, updated);
    if (success) {
      // Regenerate medication schedules for this prescription
      await fetch('/api/timeline/generate-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescriptionId: detailsId,
          startDate: updated.consultationDate || new Date().toISOString().slice(0, 10),
        })
      });
      // Invalidate timeline-related queries to trigger real-time update
      queryClient.invalidateQueries({ queryKey: ['medication-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['medication-status'] });
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['medication-conflicts'] });
    }
    return success;
  };

  // Pagination controls
  const handlePrevPage = () => setPage(Math.max(1, page - 1));
  const handleNextPage = () => setPage(Math.min(totalPages, page + 1));

  // Doctor options
  const doctorOptions = getUniqueDoctors(allPrescriptions);

  // Delete All handler
  const handleDeleteAll = async () => {
    setDeletingAll(true);
    await deleteAllPrescriptions(true);
    setDeletingAll(false);
    setShowDeleteAll(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Delete All Button */}
      <div className="flex justify-end mb-4">
        <Button
          variant="destructive"
          onClick={() => setShowDeleteAll(true)}
          disabled={loading || prescriptions.length === 0}
        >
          Delete All
        </Button>
      </div>
      {/* Delete All Confirmation Dialog */}
      {showDeleteAll && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
            <h2 className="text-lg font-semibold mb-2 text-red-700">Delete All Prescriptions?</h2>
            <p className="mb-4 text-slate-700">This will permanently delete <b>all</b> prescriptions from your account. This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowDeleteAll(false)} disabled={deletingAll} variant="outline">Cancel</Button>
              <Button onClick={handleDeleteAll} disabled={deletingAll} variant="destructive">
                {deletingAll ? 'Deleting...' : 'Delete All'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header with search and filters */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by patient, doctor, medicine, or date..."
            className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Doctor</label>
          <select
            value={filterDoctor}
            onChange={e => setFilterDoctor(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2"
          >
            <option value="">All</option>
            {doctorOptions.map(doc => (
              <option key={doc} value={doc}>{doc}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Confidence</label>
          <select
            value={filterConfidence}
            onChange={e => setFilterConfidence(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2"
          >
            {confidenceOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={e => setSort(e.target.value as any)}
            className="w-full border border-slate-300 rounded px-3 py-2"
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Page Size</label>
          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="w-full border border-slate-300 rounded px-3 py-2"
          >
            {[6, 12, 24, 48].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading and error states */}
      {loading && (
        <div className="text-center py-12 text-slate-500">Loading prescriptions...</div>
      )}
      {error && (
        <div className="text-center py-12 text-red-500">{error}</div>
      )}

      {/* Empty state */}
      {!loading && prescriptions.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-prescription-bottle text-slate-400 text-2xl"></i>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No prescriptions found</h3>
          <p className="text-slate-600">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Prescription grid */}
      {!loading && prescriptions.length > 0 && (
        <PrescriptionGrid
          prescriptions={prescriptions}
          onView={handleView}
          onDetails={handleDetails}
          onAskAI={handleAskAI}
          onDelete={handleDelete}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            className="px-3 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
            onClick={handlePrevPage}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="text-slate-700">Page {page} of {totalPages}</span>
          <button
            className="px-3 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
            onClick={handleNextPage}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      <ViewPrescriptionModal
        prescription={getPrescriptionById(viewId)}
        open={!!viewId}
        onClose={() => setViewId(null)}
      />
      <PrescriptionDetails
        prescription={getPrescriptionById(detailsId)}
        onClose={() => setDetailsId(null)}
        onSave={handleEditSave}
      />
      <AskAIModal
        prescription={getPrescriptionById(aiId)}
        open={!!aiId}
        onClose={() => setAIId(null)}
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
};

export default Prescriptions; 