import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Medicine, 
  Prescription, 
  MedicationSchedule, 
  MedicationStatus, 
  MedicationConflict,
  TimelineDay 
} from '@shared/schema';
import { 
  generateOptimalTimeline, 
  detectMedicationConflicts, 
  generateMedicationSchedule,
  formatDate,
  formatTime 
} from '../lib/timeline-utils';

export interface TimelineFilters {
  prescriptionIds: string[];
  priorityLevels: string[];
  statuses: string[];
  showConflicts: boolean;
}

export interface TimelineViewOptions {
  view: 'day' | 'week' | 'month';
  startDate: Date;
  endDate?: Date;
}

export function useTimeline() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filters, setFilters] = useState<TimelineFilters>({
    prescriptionIds: [],
    priorityLevels: [],
    statuses: [],
    showConflicts: true
  });
  const [viewOptions, setViewOptions] = useState<TimelineViewOptions>({
    view: 'day',
    startDate: new Date(),
    endDate: undefined
  });

  // Fetch prescriptions
  const { data: prescriptions = [], isLoading: prescriptionsLoading } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: async () => {
      const response = await fetch('/api/prescriptions');
      if (!response.ok) throw new Error('Failed to fetch prescriptions');
      return response.json();
    }
  });

  // Fetch medication schedules
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['medication-schedules', selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/timeline/schedules?date=${selectedDate.toISOString()}`);
      if (!response.ok) throw new Error('Failed to fetch schedules');
      return response.json();
    },
    enabled: prescriptions.length > 0
  });

  // Fetch medication status
  const { data: statuses = [], isLoading: statusesLoading } = useQuery({
    queryKey: ['medication-status', selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/timeline/status?date=${selectedDate.toISOString()}`);
      if (!response.ok) throw new Error('Failed to fetch status');
      return response.json();
    },
    enabled: schedules.length > 0
  });

  // Fetch conflicts
  const { data: conflicts = [], isLoading: conflictsLoading } = useQuery({
    queryKey: ['medication-conflicts'],
    queryFn: async () => {
      const response = await fetch('/api/timeline/conflicts');
      if (!response.ok) throw new Error('Failed to fetch conflicts');
      return response.json();
    },
    enabled: prescriptions.length > 0
  });

  // Generate timeline data
  const timelineData = useMemo(() => {
    if (prescriptionsLoading || schedulesLoading || statusesLoading || conflictsLoading) {
      return null;
    }

    const medicines = prescriptions.flatMap((p: Prescription) => p.medicines || []);
    
    // Filter data based on current filters
    const filteredSchedules = schedules.filter((schedule: MedicationSchedule) => {
      if (filters.prescriptionIds.length > 0 && !filters.prescriptionIds.includes(schedule.prescriptionId)) {
        return false;
      }
      return true;
    });

    const filteredStatuses = statuses.filter((status: MedicationStatus) => {
      if (filters.statuses.length > 0 && !filters.statuses.includes(status.status)) {
        return false;
      }
      return true;
    });

    const filteredConflicts = filters.showConflicts ? conflicts : [];

    return generateOptimalTimeline(
      filteredSchedules,
      medicines,
      prescriptions,
      filteredStatuses,
      filteredConflicts,
      selectedDate
    );
  }, [
    prescriptions,
    schedules,
    statuses,
    conflicts,
    filters,
    selectedDate,
    prescriptionsLoading,
    schedulesLoading,
    statusesLoading,
    conflictsLoading
  ]);

  // Update medication status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      scheduleId, 
      status, 
      notes 
    }: { 
      scheduleId: string; 
      status: string; 
      notes?: string; 
    }) => {
      const response = await fetch(`/api/timeline/status/${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes, actualTime: new Date().toISOString() })
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medication-status'] });
      queryClient.invalidateQueries({ queryKey: ['timeline-data'] });
    }
  });

  // Generate schedules for a prescription
  const generateSchedulesMutation = useMutation({
    mutationFn: async ({ 
      prescriptionId, 
      startDate, 
      endDate 
    }: { 
      prescriptionId: string; 
      startDate: Date; 
      endDate?: Date; 
    }) => {
      const response = await fetch('/api/timeline/generate-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prescriptionId, startDate, endDate })
      });
      if (!response.ok) throw new Error('Failed to generate schedules');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medication-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['medication-conflicts'] });
    }
  });

  // Optimize schedule mutation
  const optimizeScheduleMutation = useMutation({
    mutationFn: async ({ 
      date, 
      conflicts 
    }: { 
      date: Date; 
      conflicts: string[]; 
    }) => {
      const response = await fetch('/api/timeline/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, conflicts })
      });
      if (!response.ok) throw new Error('Failed to optimize schedule');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medication-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['medication-conflicts'] });
    }
  });

  // Navigation functions
  const goToDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const goToPreviousDay = useCallback(() => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  }, []);

  const goToNextDay = useCallback(() => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  }, []);

  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  // Filter functions
  const updateFilters = useCallback((newFilters: Partial<TimelineFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      prescriptionIds: [],
      priorityLevels: [],
      statuses: [],
      showConflicts: true
    });
  }, []);

  // View functions
  const updateViewOptions = useCallback((newOptions: Partial<TimelineViewOptions>) => {
    setViewOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  // Action functions
  const markAsTaken = useCallback(async (scheduleId: string, notes?: string) => {
    await updateStatusMutation.mutateAsync({ scheduleId, status: 'taken', notes });
  }, [updateStatusMutation]);

  const markAsMissed = useCallback(async (scheduleId: string, notes?: string) => {
    await updateStatusMutation.mutateAsync({ scheduleId, status: 'missed', notes });
  }, [updateStatusMutation]);

  const markAsSkipped = useCallback(async (scheduleId: string, notes?: string) => {
    await updateStatusMutation.mutateAsync({ scheduleId, status: 'skipped', notes });
  }, [updateStatusMutation]);

  const generateSchedulesForPrescription = useCallback(async (
    prescriptionId: string, 
    startDate: Date, 
    endDate?: Date
  ) => {
    await generateSchedulesMutation.mutateAsync({ prescriptionId, startDate, endDate });
  }, [generateSchedulesMutation]);

  const optimizeSchedule = useCallback(async (date: Date, conflicts: string[]) => {
    await optimizeScheduleMutation.mutateAsync({ date, conflicts });
  }, [optimizeScheduleMutation]);

  // Statistics
  const statistics = useMemo(() => {
    if (!timelineData) return null;

    const totalMedications = timelineData.totalMedications;
    const completedMedications = timelineData.completedMedications;
    const missedMedications = timelineData.missedMedications;
    const upcomingMedications = totalMedications - completedMedications - missedMedications;
    const adherenceRate = totalMedications > 0 ? (completedMedications / totalMedications) * 100 : 0;

    return {
      total: totalMedications,
      completed: completedMedications,
      missed: missedMedications,
      upcoming: upcomingMedications,
      adherenceRate: Math.round(adherenceRate)
    };
  }, [timelineData]);

  // Loading states
  const isLoading = prescriptionsLoading || schedulesLoading || statusesLoading || conflictsLoading;
  const isUpdating = updateStatusMutation.isPending || generateSchedulesMutation.isPending || optimizeScheduleMutation.isPending;

  return {
    // Data
    timelineData,
    prescriptions,
    schedules,
    statuses,
    conflicts,
    statistics,
    
    // State
    selectedDate,
    filters,
    viewOptions,
    isLoading,
    isUpdating,
    
    // Navigation
    goToDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    
    // Filters
    updateFilters,
    clearFilters,
    
    // View
    updateViewOptions,
    
    // Actions
    markAsTaken,
    markAsMissed,
    markAsSkipped,
    generateSchedulesForPrescription,
    optimizeSchedule,
    
    // Mutations
    updateStatusMutation,
    generateSchedulesMutation,
    optimizeScheduleMutation
  };
} 