import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Search, Pill, Clock, User, Calendar, AlertTriangle, Activity, FileText, Loader2 } from 'lucide-react';

interface Medicine {
  id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  prescriptionId: string;
  prescriptionStatus: string;
  prescriptionName?: string;
  doctor?: string;
  startDate?: string;
  condition?: string;
  sideEffects?: string;
  warnings?: string;
  activeIngredient?: string;
}

interface MedicineInfo {
  sideEffects: string;
  warnings: string;
}

export default function Medications() {
  const [searchQuery, setSearchQuery] = useState('');
  const [medicineInfoCache, setMedicineInfoCache] = useState<Record<string, MedicineInfo>>({});
  const [loadingInfo, setLoadingInfo] = useState<Record<string, boolean>>({});

  const { data = [], isLoading, error, refetch } = useQuery<Medicine[]>({
    queryKey: ['medications'],
    queryFn: async (): Promise<Medicine[]> => {
      // Fetch all prescriptions and flatten medicines
      const res = await fetch('/api/prescriptions');
      const prescriptions = await res.json();
      // Each prescription has a medicines array and a processingStatus
      const meds: Medicine[] = prescriptions.flatMap((p: any) =>
        (p.medicines || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          prescriptionId: p.id,
          prescriptionStatus: p.processingStatus,
          prescriptionName: p.patientName || p.fileName || 'Prescription',
          doctor: p.doctorName,
          startDate: p.createdAt || new Date().toISOString(),
          condition: m.condition || p.diagnosis,
          sideEffects: m.sideEffects,
          warnings: m.warnings,
          activeIngredient: m.activeIngredient,
        }))
      );
      return meds;
    },
    refetchInterval: 5000, // Poll every 5 seconds for updates
  });

  useEffect(() => {
    // Optionally, refetch on mount
    refetch();
  }, [refetch]);

  // Function to fetch medicine info from AI
  const fetchMedicineInfo = async (medicineName: string) => {
    if (medicineInfoCache[medicineName] || loadingInfo[medicineName]) {
      return;
    }

    setLoadingInfo(prev => ({ ...prev, [medicineName]: true }));
    
    try {
      const response = await fetch(`/api/medicine-info?name=${encodeURIComponent(medicineName)}`);
      if (response.ok) {
        const info = await response.json();
        setMedicineInfoCache(prev => ({ ...prev, [medicineName]: info }));
      } else {
        console.error('Failed to fetch medicine info:', response.status);
      }
    } catch (error) {
      console.error('Error fetching medicine info:', error);
    } finally {
      setLoadingInfo(prev => ({ ...prev, [medicineName]: false }));
    }
  };

  // Effect to fetch medicine info for medicines that need it
  useEffect(() => {
    if (data.length > 0) {
      data.forEach((med) => {
        if (!med.sideEffects && !med.warnings && !medicineInfoCache[med.name] && !loadingInfo[med.name]) {
          fetchMedicineInfo(med.name);
        }
      });
    }
  }, [data, medicineInfoCache, loadingInfo]);

  const filteredMedications = data.filter((med) =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Pill className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Medications
            </h1>
          </div>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            All medications extracted from your uploaded prescriptions are listed here. 
            This includes medicines currently being processed by AI and those already analyzed.
          </p>
        </div>

        {/* Search and Stats Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search medications by name..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">{filteredMedications.length} medications</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {filteredMedications.filter(m => m.prescriptionStatus === 'completed').length} ready
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading and Error States */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-lg text-slate-600">Loading medications...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-red-700 font-medium">Error loading medications. Please try again.</p>
          </div>
        )}
        
        {!isLoading && filteredMedications.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
            <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No medications found</h3>
            <p className="text-gray-500">Upload a prescription to get started with medication tracking.</p>
          </div>
        )}

        {/* Medications Grid */}
        {!isLoading && filteredMedications.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMedications.map((med) => {
              const cachedInfo = medicineInfoCache[med.name];
              const isInfoLoading = loadingInfo[med.name];

              return (
                <Card key={med.id} className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {med.name}
                        </h3>
                      </div>
                      <Badge 
                        variant={med.prescriptionStatus === 'processing' ? 'outline' : 'default'}
                        className={`ml-2 ${
                          med.prescriptionStatus === 'processing' 
                            ? 'border-orange-200 text-orange-700 bg-orange-50' 
                            : 'bg-green-100 text-green-700 border-green-200'
                        }`}
                      >
                        {med.prescriptionStatus === 'processing' ? 'Processing' : 'Ready'}
                      </Badge>
                    </div>

                    {/* Medicine Details */}
                    <div className="space-y-3">
                      {med.dosage && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="p-1.5 bg-blue-100 rounded-lg">
                            <Pill className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-gray-700">Dosage: <span className="font-medium">{med.dosage}</span></span>
                        </div>
                      )}
                      
                      {med.frequency && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="p-1.5 bg-purple-100 rounded-lg">
                            <Clock className="w-4 h-4 text-purple-600" />
                          </div>
                          <span className="text-gray-700">Frequency: <span className="font-medium">{med.frequency}</span></span>
                        </div>
                      )}
                      
                      {med.activeIngredient && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="p-1.5 bg-green-100 rounded-lg">
                            <Activity className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-gray-700">Active Ingredient: <span className="font-medium">{med.activeIngredient}</span></span>
                        </div>
                      )}
                      
                      {med.doctor && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="p-1.5 bg-indigo-100 rounded-lg">
                            <User className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="text-gray-700">Prescribed By: <span className="font-medium">{med.doctor}</span></span>
                        </div>
                      )}
                      
                      {med.startDate && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="p-1.5 bg-orange-100 rounded-lg">
                            <Calendar className="w-4 h-4 text-orange-600" />
                          </div>
                          <span className="text-gray-700">Start Date: <span className="font-medium">{formatDate(med.startDate)}</span></span>
                        </div>
                      )}
                      
                      {med.condition && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="p-1.5 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          </div>
                          <span className="text-gray-700">Condition: <span className="font-medium">{med.condition}</span></span>
                        </div>
                      )}
                    </div>

                    {/* Side Effects */}
                    {med.sideEffects ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-yellow-800 mb-1">Side Effects</p>
                            <p className="text-sm text-yellow-700">{med.sideEffects}</p>
                          </div>
                        </div>
                      </div>
                    ) : cachedInfo?.sideEffects ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-yellow-800 mb-1">Side Effects</p>
                            <p className="text-sm text-yellow-700">{cachedInfo.sideEffects}</p>
                          </div>
                        </div>
                      </div>
                    ) : isInfoLoading ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          <span className="text-sm text-gray-500">Loading side effects...</span>
                        </div>
                      </div>
                    ) : null}
                    
                    {/* Warnings */}
                    {med.warnings ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-800 mb-1">Warnings</p>
                            <p className="text-sm text-red-700">{med.warnings}</p>
                          </div>
                        </div>
                      </div>
                    ) : cachedInfo?.warnings ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-800 mb-1">Warnings</p>
                            <p className="text-sm text-red-700">{cachedInfo.warnings}</p>
                          </div>
                        </div>
                      </div>
                    ) : isInfoLoading ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          <span className="text-sm text-gray-500">Loading warnings...</span>
                        </div>
                      </div>
                    ) : null}
                    
                    {/* Footer */}
                    <div className="pt-3 border-t border-gray-100">
                      <Link 
                        href={`/prescriptions`} 
                        className="inline-flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        From: {med.prescriptionName}
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 