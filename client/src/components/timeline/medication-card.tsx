import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  CheckCircle, 
  XCircle, 
  SkipForward, 
  AlertTriangle,
  Clock,
  User,
  Pill,
  Utensils,
  Coffee
} from 'lucide-react';
import { Medicine, Prescription, MedicationSchedule, MedicationStatus } from '@shared/schema';
import { getPriorityColor, getAdministrationIcon, getStatusIcon } from '../../lib/timeline-utils';

interface MedicationCardProps {
  medication: {
    medicine: Medicine;
    prescription: Prescription;
    schedule: MedicationSchedule;
    status: MedicationStatus;
  };
  onMarkAsTaken: (scheduleId: string, notes?: string) => void;
  onMarkAsMissed: (scheduleId: string, notes?: string) => void;
  onMarkAsSkipped: (scheduleId: string, notes?: string) => void;
  isUpdating: boolean;
}

export function MedicationCard({
  medication,
  onMarkAsTaken,
  onMarkAsMissed,
  onMarkAsSkipped,
  isUpdating
}: MedicationCardProps) {
  const [notes, setNotes] = useState('');
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [actionType, setActionType] = useState<'taken' | 'missed' | 'skipped' | null>(null);

  const { medicine, prescription, schedule, status } = medication;

  const handleAction = (type: 'taken' | 'missed' | 'skipped') => {
    setActionType(type);
    setShowNotesDialog(true);
  };

  const confirmAction = () => {
    const actionNotes = notes.trim() || undefined;
    
    switch (actionType) {
      case 'taken':
        onMarkAsTaken(schedule.id, actionNotes);
        break;
      case 'missed':
        onMarkAsMissed(schedule.id, actionNotes);
        break;
      case 'skipped':
        onMarkAsSkipped(schedule.id, actionNotes);
        break;
    }
    
    setShowNotesDialog(false);
    setNotes('');
    setActionType(null);
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'taken': return 'border-green-200 bg-green-50';
      case 'missed': return 'border-red-200 bg-red-50';
      case 'skipped': return 'border-gray-200 bg-gray-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const getTimingIcon = () => {
    const instructions = medicine.timingInstructions?.toLowerCase() || '';
    if (instructions.includes('with food') || instructions.includes('after meal')) {
      return <Utensils className="h-4 w-4 text-green-600" />;
    }
    if (instructions.includes('empty stomach') || instructions.includes('before meal')) {
      return <Coffee className="h-4 w-4 text-orange-600" />;
    }
    return null;
  };

  const isOverdue = () => {
    if (status.status !== 'upcoming') return false;
    const now = new Date();
    const scheduledTime = new Date(schedule.scheduledTime);
    return now > scheduledTime;
  };

  return (
    <>
      <Card className={`${getStatusColor()} transition-colors`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            {/* Medication Info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getAdministrationIcon(medicine.administrationRoute as any)}</span>
                <div>
                  <h4 className="font-semibold text-sm">{medicine.name}</h4>
                  <p className="text-xs text-muted-foreground">{medicine.genericName}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="font-medium">{medicine.dosage}</span>
                <span className="text-muted-foreground">{medicine.frequency}</span>
                {getTimingIcon() && (
                  <div className="flex items-center gap-1">
                    {getTimingIcon()}
                    <span className="text-muted-foreground">Timing</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Dr. {prescription.doctorName}</span>
                <Badge variant="outline" className="text-xs">
                  {medicine.priorityLevel || 'medium'}
                </Badge>
              </div>

              {medicine.instructions && (
                <p className="text-xs text-muted-foreground italic">
                  "{medicine.instructions}"
                </p>
              )}
            </div>

            {/* Status and Actions */}
            <div className="flex flex-col items-end gap-2">
              {/* Status */}
              <div className="flex items-center gap-1">
                <span className="text-lg">{getStatusIcon(status.status as any)}</span>
                <span className="text-xs font-medium capitalize">{status.status}</span>
              </div>

              {/* Overdue Indicator */}
              {isOverdue() && (
                <Badge variant="destructive" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}

              {/* Action Buttons */}
              {status.status === 'upcoming' && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction('taken')}
                    disabled={isUpdating}
                    className="h-7 px-2 text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Taken
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction('missed')}
                    disabled={isUpdating}
                    className="h-7 px-2 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Missed
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction('skipped')}
                    disabled={isUpdating}
                    className="h-7 px-2 text-gray-600 border-gray-200 hover:bg-gray-50"
                  >
                    <SkipForward className="h-3 w-3 mr-1" />
                    Skip
                  </Button>
                </div>
              )}

              {/* Status Update */}
              {status.status !== 'upcoming' && status.actualTime && (
                <p className="text-xs text-muted-foreground">
                  {new Date(status.actualTime).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          {status.notes && (
            <div className="mt-3 p-2 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600">
                <strong>Notes:</strong> {status.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Mark as {actionType === 'taken' ? 'Taken' : actionType === 'missed' ? 'Missed' : 'Skipped'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {medicine.name} - {medicine.dosage}
              </p>
              <Textarea
                placeholder="Add notes (optional)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNotesDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmAction}
                disabled={isUpdating}
                className={
                  actionType === 'taken' ? 'bg-green-600 hover:bg-green-700' :
                  actionType === 'missed' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-gray-600 hover:bg-gray-700'
                }
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 