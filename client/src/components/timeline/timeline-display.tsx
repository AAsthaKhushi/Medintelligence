import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { TimelineDay, ScheduleSlot } from '../../lib/timeline-utils';
import { formatTime, getStatusIcon, getPriorityColor, getAdministrationIcon, formatDate } from '../../lib/timeline-utils';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Utensils,
  Coffee
} from 'lucide-react';
import { MedicationCard } from './medication-card';

interface TimelineDisplayProps {
  timelineData: TimelineDay;
  onMarkAsTaken: (scheduleId: string, notes?: string) => void;
  onMarkAsMissed: (scheduleId: string, notes?: string) => void;
  onMarkAsSkipped: (scheduleId: string, notes?: string) => void;
  isUpdating: boolean;
  onUpdateMealTiming?: (scheduleId: string, mealTiming: string) => void;
}

export function TimelineDisplay({
  timelineData,
  onMarkAsTaken,
  onMarkAsMissed,
  onMarkAsSkipped,
  isUpdating,
  onUpdateMealTiming
}: TimelineDisplayProps) {
  const [expandedSlots, setExpandedSlots] = React.useState<Set<string>>(new Set());

  const toggleSlot = (slotKey: string) => {
    const newExpanded = new Set(expandedSlots);
    if (newExpanded.has(slotKey)) {
      newExpanded.delete(slotKey);
    } else {
      newExpanded.add(slotKey);
    }
    setExpandedSlots(newExpanded);
  };

  const getSlotKey = (slot: ScheduleSlot) => {
    return `${slot.time.getHours()}:${slot.time.getMinutes()}`;
  };

  const getTimeSlotColor = (slot: ScheduleSlot) => {
    const hasConflicts = slot.conflicts.length > 0;
    const hasCritical = slot.medications.some(med => med.medicine.priorityLevel === 'critical');
    
    if (hasCritical) return 'border-red-200 bg-red-50';
    if (hasConflicts) return 'border-orange-200 bg-orange-50';
    return 'border-gray-200 bg-white';
  };

  const getMealTimeIcon = (hour: number) => {
    if (hour === 8) return <Coffee className="h-4 w-4 text-blue-600" />;
    if (hour === 12) return <Utensils className="h-4 w-4 text-green-600" />;
    if (hour === 18) return <Utensils className="h-4 w-4 text-orange-600" />;
    return null;
  };

  const getMealTimeLabel = (hour: number) => {
    if (hour === 8) return 'Breakfast';
    if (hour === 12) return 'Lunch';
    if (hour === 18) return 'Dinner';
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          24-Hour Medication Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Timeline Header */}
          <div className="grid grid-cols-24 gap-1 text-xs text-muted-foreground mb-4">
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="text-center p-1">
                {i === 0 ? '12 AM' : i === 12 ? '12 PM' : i > 12 ? `${i - 12} PM` : `${i} AM`}
              </div>
            ))}
          </div>

          {/* Timeline Slots */}
          <div className="space-y-3">
            {timelineData.slots.map((slot, index) => {
              const slotKey = getSlotKey(slot);
              const isExpanded = expandedSlots.has(slotKey);
              const hour = slot.time.getHours();
              const mealIcon = getMealTimeIcon(hour);
              const mealLabel = getMealTimeLabel(hour);

              return (
                <div key={slotKey} className={`border rounded-lg p-4 ${getTimeSlotColor(slot)}`}>
                  {/* Time Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{formatTime(slot.time)}</span>
                        {mealIcon && (
                          <div className="flex items-center gap-1 text-xs">
                            {mealIcon}
                            <span className="text-muted-foreground">{mealLabel}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Status Summary */}
                      <div className="flex items-center gap-2">
                        {slot.medications.map((med, medIndex) => (
                          <div key={medIndex} className="flex items-center gap-1">
                            <span className="text-lg">{getStatusIcon(med.status.status as any)}</span>
                            <span className="text-xs text-muted-foreground">
                              {med.medicine.name.split(' ')[0]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Conflict Indicator */}
                      {slot.conflicts.length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {slot.conflicts.length} Conflict{slot.conflicts.length > 1 ? 's' : ''}
                        </Badge>
                      )}

                      {/* Medication Count */}
                      <Badge variant="outline" className="text-xs">
                        {slot.medications.length} Medication{slot.medications.length > 1 ? 's' : ''}
                      </Badge>

                      {/* Expand/Collapse */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSlot(slotKey)}
                        className="h-6 w-6 p-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="space-y-3">
                      <Separator />
                      
                      {/* Medications */}
                      <div className="space-y-3">
                        {slot.medications.map((med, medIndex) => (
                          <div key={medIndex} className="border border-slate-200 rounded-lg p-3 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-base">{med.medicine.name}</span>
                              <span className="text-xs text-slate-500">{med.medicine.dosage}</span>
                              <span className="text-xs text-slate-500">{med.medicine.frequency}</span>
                              <span className="text-xs text-slate-500">{med.medicine.duration}</span>
                            </div>
                            {/* Show meal timing box for oral medicines */}
                            {med.medicine.administrationRoute === 'oral' && (
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-slate-600">Meal Timing:</label>
                                <select
                                  className="border border-slate-300 rounded px-2 py-1 text-xs"
                                  value={(med.schedule as any).mealTiming || ''}
                                  onChange={e => onUpdateMealTiming && onUpdateMealTiming(med.schedule.id, e.target.value)}
                                >
                                  <option value="">Select...</option>
                                  <option value="breakfast">Before/After Breakfast</option>
                                  <option value="lunch">Before/After Lunch</option>
                                  <option value="dinner">Before/After Dinner</option>
                                  <option value="evening">Before/After Evening</option>
                                </select>
                                <span className="text-xs text-slate-400">(auto-saves)</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Conflicts */}
                      {slot.conflicts.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-red-600 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Medication Conflicts
                          </h4>
                          {slot.conflicts.map((conflict, conflictIndex) => (
                            <div key={conflictIndex} className="p-3 bg-red-50 border border-red-200 rounded-md">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-red-800">
                                    {conflict.conflictType === 'timing' ? 'Timing Conflict' : 'Drug Interaction'}
                                  </p>
                                  <p className="text-xs text-red-600 mt-1">
                                    {conflict.description}
                                  </p>
                                  {conflict.suggestedResolution && (
                                    <p className="text-xs text-red-600 mt-1">
                                      <strong>Resolution:</strong> {conflict.suggestedResolution}
                                    </p>
                                  )}
                                </div>
                                <Badge 
                                  variant={conflict.severity === 'critical' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {conflict.severity}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {timelineData.slots.length === 0 && (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No medications scheduled
              </h3>
              <p className="text-sm text-muted-foreground">
                No medications are scheduled for {formatDate(timelineData.date)}.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 