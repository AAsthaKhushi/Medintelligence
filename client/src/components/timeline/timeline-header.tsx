import React from 'react';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Filter,
  View,
  Download
} from 'lucide-react';
import { formatDate } from '../../lib/timeline-utils';
import { cn } from '../../lib/utils';

interface TimelineHeaderProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  totalPrescriptions: number;
  filters?: {
    prescriptionIds: string[];
    priorityLevels: string[];
    statuses: string[];
    showConflicts: boolean;
  };
  onFiltersChange?: (filters: any) => void;
  viewOptions?: {
    view: 'day' | 'week' | 'month';
  };
  onViewChange?: (view: 'day' | 'week' | 'month') => void;
  onExport?: () => void;
}

export function TimelineHeader({
  selectedDate,
  onDateChange,
  onPreviousDay,
  onNextDay,
  onToday,
  totalPrescriptions,
  filters,
  onFiltersChange,
  viewOptions,
  onViewChange,
  onExport
}: TimelineHeaderProps) {
  const isToday = new Date().toDateString() === selectedDate.toDateString();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white border rounded-lg shadow-sm">
      {/* Date Navigation */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousDay}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal h-8 px-3",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDate(selectedDate)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && onDateChange(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onNextDay}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          variant={isToday ? "default" : "outline"}
          size="sm"
          onClick={onToday}
          className="h-8"
        >
          Today
        </Button>
      </div>

      {/* View Options */}
      <div className="flex items-center gap-3">
        {viewOptions && onViewChange && (
          <div className="flex items-center gap-2">
            <View className="h-4 w-4 text-muted-foreground" />
            <Select value={viewOptions.view} onValueChange={onViewChange}>
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Filters */}
        {filters && onFiltersChange && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select 
              value={filters.showConflicts ? "conflicts-on" : "conflicts-off"}
              onValueChange={(value) => onFiltersChange({ ...filters, showConflicts: value === "conflicts-on" })}
            >
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conflicts-on">Show Conflicts</SelectItem>
                <SelectItem value="conflicts-off">Hide Conflicts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Export Button */}
        <Button variant="outline" size="sm" className="h-8" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>

        {/* Prescription Count */}
        <Badge variant="secondary" className="h-8 px-3">
          {totalPrescriptions} Prescriptions
        </Badge>
      </div>
    </div>
  );
} 