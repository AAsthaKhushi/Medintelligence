import React from 'react';
import { useTimeline } from '../hooks/useTimeline';
import { TimelineHeader } from '../components/timeline/timeline-header';
import { TimelineDisplay } from '../components/timeline/timeline-display';
import { ConflictPanel } from '../components/timeline/conflict-panel';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertTriangle, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function Timeline() {
  const {
    timelineData,
    prescriptions,
    isLoading,
    isUpdating,
    selectedDate,
    goToDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    markAsTaken,
    markAsMissed,
    markAsSkipped,
    filters,
    viewOptions,
    updateFilters,
    updateViewOptions
  } = useTimeline();
  const queryClient = useQueryClient();

  // Export timeline data as CSV
  const handleExport = () => {
    if (!timelineData) return;
    const rows = [
      ['Time', 'Medicine', 'Dosage', 'Frequency', 'Status', 'Doctor', 'Notes'],
    ];
    timelineData.slots.forEach(slot => {
      slot.medications.forEach(med => {
        rows.push([
          new Date(slot.time).toLocaleTimeString(),
          med.medicine.name,
          med.medicine.dosage || '',
          med.medicine.frequency || '',
          med.status.status,
          med.prescription.doctorName || '',
          med.status.notes || ''
        ]);
      });
    });
    const csvContent = rows.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline-${selectedDate.toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handler to update meal timing
  const handleUpdateMealTiming = async (scheduleId: string, mealTiming: string) => {
    await fetch(`/api/timeline/schedule/${scheduleId}/meal-timing`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mealTiming })
    });
    // Refetch timeline data
    queryClient.invalidateQueries({ queryKey: ['medication-schedules'] });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading medication timeline...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!timelineData) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No medication timeline data available. Please add prescriptions to see your medication schedule.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { totalMedications, completedMedications, missedMedications } = timelineData;
  const upcomingMedications = totalMedications - completedMedications - missedMedications;
  const adherenceRate = totalMedications > 0 ? (completedMedications / totalMedications) * 100 : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <TimelineHeader
        selectedDate={selectedDate}
        onDateChange={goToDate}
        onPreviousDay={goToPreviousDay}
        onNextDay={goToNextDay}
        onToday={goToToday}
        totalPrescriptions={prescriptions.length}
        filters={filters}
        onFiltersChange={updateFilters}
        viewOptions={viewOptions}
        onViewChange={v => updateViewOptions({ view: v })}
        onExport={handleExport}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Medications</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMedications}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled for today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedMedications}</div>
            <p className="text-xs text-muted-foreground">
              Taken successfully
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{upcomingMedications}</div>
            <p className="text-xs text-muted-foreground">
              Still to take
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{missedMedications}</div>
            <p className="text-xs text-muted-foreground">
              Overdue doses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Adherence Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Medication Adherence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Today's Progress</span>
              <span className="text-sm font-bold">{Math.round(adherenceRate)}%</span>
            </div>
            <Progress value={adherenceRate} className="h-2" />
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{completedMedications} of {totalMedications} medications taken</span>
              {missedMedications > 0 && (
                <Badge variant="destructive">{missedMedications} missed</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TimelineDisplay
            timelineData={timelineData}
            onMarkAsTaken={markAsTaken}
            onMarkAsMissed={markAsMissed}
            onMarkAsSkipped={markAsSkipped}
            isUpdating={isUpdating}
            onUpdateMealTiming={handleUpdateMealTiming}
          />
        </div>

        <div className="space-y-6">
          {/* Conflicts Panel */}
          <ConflictPanel conflicts={timelineData.slots.flatMap(slot => slot.conflicts)} />
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={() => {
                  // Mark all upcoming as taken
                  timelineData.slots.forEach(slot => {
                    slot.medications.forEach(med => {
                      if (med.status.status === 'upcoming') {
                        markAsTaken(med.schedule.id);
                      }
                    });
                  });
                }}
                disabled={isUpdating || upcomingMedications === 0}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark All as Taken
              </button>
              
              <button
                onClick={() => {
                  // Mark all missed as skipped
                  timelineData.slots.forEach(slot => {
                    slot.medications.forEach(med => {
                      if (med.status.status === 'missed') {
                        markAsSkipped(med.schedule.id);
                      }
                    });
                  });
                }}
                disabled={isUpdating || missedMedications === 0}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark All Missed as Skipped
              </button>
            </CardContent>
          </Card>

          {/* Prescription Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Active Prescriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {prescriptions.slice(0, 5).map((prescription: any) => (
                  <div key={prescription.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{prescription.patientName}</p>
                      <p className="text-xs text-muted-foreground">{prescription.doctorName}</p>
                    </div>
                    <Badge variant="outline">
                      {prescription.medicines?.length || 0} meds
                    </Badge>
                  </div>
                ))}
                {prescriptions.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{prescriptions.length - 5} more prescriptions
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 