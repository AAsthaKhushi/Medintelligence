import { useState, useEffect, useMemo } from 'react';
import { Prescription } from '../lib/types';

function getFileTypeFromName(fileName: string): 'pdf' | 'image' | 'docx' {
  if (!fileName) return 'pdf';
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (['jpg', 'jpeg', 'png'].includes(ext || '')) return 'image';
  return 'pdf';
}

// usePrescriptions manages fetching, searching, filtering, sorting, and pagination of prescriptions.
export function usePrescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search, filter, sort, and pagination state
  const [search, setSearch] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterConfidence, setFilterConfidence] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'doctorName' | 'patientName' | 'confidence'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Fetch prescriptions from API
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/prescriptions')
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        // Map backend data to frontend Prescription interface
        const mapped = data.map((p: any) => ({
          ...p,
          originalDocument: p.fileUrl ? {
            filename: p.fileName,
            type: getFileTypeFromName(p.fileName),
            url: p.fileUrl,
            previewUrl: getFileTypeFromName(p.fileName) === 'pdf' ? p.previewUrl || p.fileUrl : undefined,
          } : undefined,
        }));
        setPrescriptions(mapped);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch prescriptions');
        setLoading(false);
      });
  }, []);

  // Edit prescription (PUT)
  const editPrescription = async (id: string, updated: Partial<Prescription>) => {
    try {
      // Map frontend fields to backend fields
      const payload: any = {
        ...updated,
        medicines: updated.medicines?.map(med => ({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions,
        })),
      };
      const res = await fetch(`/api/prescriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const updatedPrescription = await res.json();
      setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, ...updatedPrescription } : p));
      return true;
    } catch (err) {
      setError((err as Error).message || 'Failed to update prescription');
      return false;
    }
  };

  // Delete prescription (DELETE)
  const deletePrescription = async (id: string, permanent = false) => {
    try {
      const url = `/api/prescriptions/${id}` + (permanent ? '?permanent=true' : '');
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      setPrescriptions(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err) {
      setError((err as Error).message || 'Failed to delete prescription');
      return false;
    }
  };

  // Filter, search, and sort prescriptions
  const filteredPrescriptions = useMemo(() => {
    let filtered = prescriptions;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(p =>
        (p.patientName || '').toLowerCase().includes(s) ||
        (p.doctorName || '').toLowerCase().includes(s) ||
        p.medicines.some(m => m.name.toLowerCase().includes(s)) ||
        ((p.consultationDate || '').toLowerCase().includes(s))
      );
    }
    if (filterDoctor) {
      filtered = filtered.filter(p => (p.doctorName || '') === filterDoctor);
    }
    if (filterConfidence) {
      filtered = filtered.filter(p => String(p.extractionConfidence) === filterConfidence);
    }
    // Sort
    filtered = filtered.slice().sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') {
        const aDate = a.consultationDate ? new Date(a.consultationDate).getTime() : 0;
        const bDate = b.consultationDate ? new Date(b.consultationDate).getTime() : 0;
        cmp = aDate - bDate;
      } else if (sortBy === 'doctorName') {
        cmp = (a.doctorName || '').localeCompare(b.doctorName || '');
      } else if (sortBy === 'patientName') {
        cmp = (a.patientName || '').localeCompare(b.patientName || '');
      } else if (sortBy === 'confidence') {
        const confOrder = { high: 3, medium: 2, low: 1 };
        const aConf = (typeof a.extractionConfidence === 'string' ? a.extractionConfidence : 'low') as keyof typeof confOrder;
        const bConf = (typeof b.extractionConfidence === 'string' ? b.extractionConfidence : 'low') as keyof typeof confOrder;
        cmp = confOrder[aConf] - confOrder[bConf];
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return filtered;
  }, [prescriptions, search, filterDoctor, filterConfidence, sortBy, sortOrder]);

  // Pagination
  const total = filteredPrescriptions.length;
  const totalPages = Math.ceil(total / pageSize);
  const paginatedPrescriptions = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPrescriptions.slice(start, start + pageSize);
  }, [filteredPrescriptions, page, pageSize]);

  // Handlers
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const handleFilterDoctor = (value: string) => {
    setFilterDoctor(value);
    setPage(1);
  };
  const handleFilterConfidence = (value: string) => {
    setFilterConfidence(value);
    setPage(1);
  };
  const handleSort = (by: typeof sortBy) => {
    if (sortBy === by) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(by);
      setSortOrder('asc');
    }
  };
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  // Delete all prescriptions (DELETE)
  const deleteAllPrescriptions = async (permanent = false) => {
    try {
      const url = '/api/prescriptions' + (permanent ? '?permanent=true' : '');
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      setPrescriptions([]);
      return true;
    } catch (err) {
      setError((err as Error).message || 'Failed to delete all prescriptions');
      return false;
    }
  };

  return {
    prescriptions: paginatedPrescriptions,
    loading,
    error,
    search,
    setSearch: handleSearch,
    filterDoctor,
    setFilterDoctor: handleFilterDoctor,
    filterConfidence,
    setFilterConfidence: handleFilterConfidence,
    sortBy,
    sortOrder,
    setSort: handleSort,
    page,
    totalPages,
    setPage: handlePageChange,
    pageSize,
    setPageSize: handlePageSizeChange,
    total,
    allPrescriptions: prescriptions,
    editPrescription,
    deletePrescription,
    deleteAllPrescriptions,
  };
}
