// MedIntelligence Schedule Page - AI-synced, feature-rich, modern UI
import { useState, useEffect, useRef } from 'react';
import { format, addDays, isSameDay, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, getYear, parseISO, isWithinInterval, add, startOfWeek, endOfWeek } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Search, Bell, BookOpen, Check, ChevronLeft, ChevronRight, CircleAlert, CircleX, Clock, Plus, Trash2, 
  Calendar, AlertTriangle, Activity, FileText, Loader2, Pill, User, ChevronDown, ChevronUp, Edit3, Grid3X3
} from 'lucide-react';

// --- Types ---
interface Medicine {
  id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  period?: string; // Morning, Afternoon, Evening, Other
  time?: string; // e.g. '08:00 AM'
  duration?: string; // e.g. '15 days', '1 month', '30 days'
  prescriptionId: string;
  prescriptionStatus: string;
  prescriptionName?: string;
  doctor?: string;
  startDate?: string;
  condition?: string;
  activeIngredient?: string;
}

interface Reminder {
  id: string;
  title: string;
  description: string;
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  repeat: string;
  isCompleted: boolean;
}

interface Note {
  id: string;
  title: string;
  content: string;
  date: string; // yyyy-MM-dd
  category: string;
  color: string;
  lastEdited?: string;
}

// --- Helper Functions ---
function getDefaultPeriod(med: Medicine): string {
  // Try to infer period from time or frequency
  if (med.time) {
    const hour = parseInt(med.time.split(':')[0], 10);
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  }
  if (med.frequency) {
    const freq = med.frequency.toLowerCase();
    if (freq.includes('morning')) return 'Morning';
    if (freq.includes('afternoon')) return 'Afternoon';
    if (freq.includes('evening') || freq.includes('night')) return 'Evening';
  }
  return 'Other';
}

function formatDate(dateString?: string) {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

// Parse duration string and return end date
function getMedicationEndDate(startDate: string, duration?: string): Date {
  if (!duration) {
    // Default to 30 days if no duration specified
    return add(parseISO(startDate), { days: 30 });
  }
  
  const durationLower = duration.toLowerCase().trim();
  
  // Parse common duration formats
  if (durationLower.includes('day')) {
    const days = parseInt(duration.match(/\d+/)?.[0] || '30', 10);
    return add(parseISO(startDate), { days });
  }
  
  if (durationLower.includes('week')) {
    const weeks = parseInt(duration.match(/\d+/)?.[0] || '4', 10);
    return add(parseISO(startDate), { weeks });
  }
  
  if (durationLower.includes('month')) {
    const months = parseInt(duration.match(/\d+/)?.[0] || '1', 10);
    return add(parseISO(startDate), { months });
  }
  
  if (durationLower.includes('year')) {
    const years = parseInt(duration.match(/\d+/)?.[0] || '1', 10);
    return add(parseISO(startDate), { years });
  }
  
  // Try to parse just a number as days
  const numberMatch = duration.match(/^(\d+)$/);
  if (numberMatch) {
    const days = parseInt(numberMatch[1], 10);
    return add(parseISO(startDate), { days });
  }
  
  // Default to 30 days if format not recognized
  return add(parseISO(startDate), { days: 30 });
}

// Check if medication should be taken on a specific date
function isMedicationScheduledForDate(med: Medicine, targetDate: Date): boolean {
  if (!med.startDate) return false;
  
  try {
    const startDate = parseISO(med.startDate);
    const endDate = getMedicationEndDate(med.startDate, med.duration);
    
    // Normalize dates to start of day for comparison
    const targetStartOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const startStartOfDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endStartOfDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    // Check if target date is within the medication schedule (inclusive of start and end dates)
    return targetStartOfDay >= startStartOfDay && targetStartOfDay <= endStartOfDay;
  } catch (error) {
    console.error('Error parsing medication dates:', error);
    return false;
  }
}

// Check if a date is today or in the past (allows status changes)
function isDateActionable(targetDate: Date): boolean {
  const today = new Date();
  const targetStartOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const todayStartOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  return targetStartOfDay <= todayStartOfDay;
}

// --- Main Component ---
export default function Schedule() {
  // --- Calendar State ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })); // Monday start
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  
  // --- UI State ---
  const [activeTab, setActiveTab] = useState<'schedule' | 'notes' | 'reminders'>('schedule');
  
  // --- Local State ---
  const [takenStatus, setTakenStatus] = useState<Record<string, { 
    taken?: boolean; 
    missed?: boolean; 
    skipped?: boolean; 
    skipReason?: string;
    timestamp?: string;
  }>>({});
  
  const [showSkipReasonModal, setShowSkipReasonModal] = useState(false);
  const [skipReason, setSkipReason] = useState('');
  const [selectedMedication, setSelectedMedication] = useState<Medicine | null>(null);
  const [expandedSkipReason, setExpandedSkipReason] = useState<string | null>(null);
  
  // --- Notes & Reminders ---
  const [notes, setNotes] = useState<Note[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteCategory, setNoteCategory] = useState('General');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  
  // --- Touch/Swipe ---
  const touchStartXRef = useRef<number | null>(null);
  
  // --- Generate Week Days ---
  const weekDays = eachDayOfInterval({ start: startOfWeek(currentWeekStart, { weekStartsOn: 1 }), end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }) });
  
  // --- Generate Month Days ---
  const monthDays = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  
  // --- Calendar Navigation ---
  const goToPreviousWeek = () => {
    const newWeekStart = addDays(currentWeekStart, -7);
    setCurrentWeekStart(newWeekStart);
    setSelectedDate(newWeekStart);
  };
  
  const goToNextWeek = () => {
    const newWeekStart = addDays(currentWeekStart, 7);
    setCurrentWeekStart(newWeekStart);
    setSelectedDate(newWeekStart);
  };
  
  const goToPreviousMonth = () => {
    const newMonth = addMonths(currentMonth, -1);
    setCurrentMonth(newMonth);
    setSelectedDate(startOfMonth(newMonth));
  };
  
  const goToNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    setSelectedDate(startOfMonth(newMonth));
  };
  
  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
    setCurrentMonth(today);
  };
  
  // --- Fetch Medications from Backend ---
  const { data: prescriptions = [], isLoading } = useQuery<any[]>({
    queryKey: ['prescriptions'],
    queryFn: async () => {
      const res = await fetch('/api/prescriptions');
      return res.json();
    },
    refetchInterval: 5000,
  });
  
  // Flatten and process medicines for the selected date
  const allMeds: Medicine[] = prescriptions.flatMap((p: any) =>
    (p.medicines || []).map((m: any) => {
      // Determine the start date for this medication
      let startDate = p.startDate || p.consultationDate;
      
      // If no start date is specified, use today's date (when prescription was uploaded)
      if (!startDate) {
        startDate = new Date().toISOString().split('T')[0];
      }
      
      return {
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        period: m.period || getDefaultPeriod(m),
        time: m.time,
        duration: m.duration,
        prescriptionId: p.id,
        prescriptionStatus: p.processingStatus,
        prescriptionName: p.patientName || p.fileName || 'Prescription',
        doctor: p.doctorName,
        startDate: startDate,
        condition: m.condition || p.diagnosis,
        activeIngredient: m.activeIngredient,
      };
    })
  );
  
  // Filter medicines for the selected date
  const medsForSelectedDate = allMeds.filter(med => 
    isMedicationScheduledForDate(med, selectedDate)
  );
  
  // Group medicines by period for the selected date
  const medsByPeriod: Record<string, Medicine[]> = {
    Morning: [],
    Afternoon: [],
    Evening: [],
    Other: [],
  };
  
  medsForSelectedDate.forEach(med => {
    medsByPeriod[med.period || 'Other'].push(med);
  });
  
  // --- Calendar/Swipe Logic ---
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe left - go to next week/month
        if (viewMode === 'week') {
          goToNextWeek();
        } else {
          goToNextMonth();
        }
      } else {
        // Swipe right - go to previous week/month
        if (viewMode === 'week') {
          goToPreviousWeek();
        } else {
          goToPreviousMonth();
        }
      }
    }
    touchStartXRef.current = null;
  };
  
  // --- Mark as taken/missed/skipped ---
  const handleStatusChange = (med: Medicine, status: 'taken' | 'missed' | 'skipped') => {
    // Only allow status changes for today or past dates
    if (!isDateActionable(selectedDate)) {
      return; // Don't allow changes for future dates
    }
    
    if (status === 'skipped') {
      setSelectedMedication(med);
      setShowSkipReasonModal(true);
      return;
    }
    
    setTakenStatus(prev => ({
      ...prev,
      [med.id]: { 
        taken: status === 'taken', 
        missed: status === 'missed', 
        skipped: false, 
        skipReason: undefined,
        timestamp: new Date().toISOString()
      },
    }));
  };
  
  const confirmSkipReason = () => {
    if (selectedMedication) {
      setTakenStatus(prev => ({
        ...prev,
        [selectedMedication.id]: { 
          taken: false, 
          missed: false, 
          skipped: true, 
          skipReason,
          timestamp: new Date().toISOString()
        },
      }));
      setShowSkipReasonModal(false);
      setSelectedMedication(null);
      setSkipReason('');
    }
  };
  
  // --- Notes/Reminders Local Storage ---
  useEffect(() => {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    const savedReminders = localStorage.getItem('reminders');
    if (savedReminders) setReminders(JSON.parse(savedReminders));
  }, []);
  
  useEffect(() => { localStorage.setItem('notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('reminders', JSON.stringify(reminders)); }, [reminders]);
  
  // --- Render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Schedule
            </h1>
          </div>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Your daily medication schedule, always in sync with your latest prescriptions.
          </p>
        </div>

        {/* Calendar Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <button 
                className="p-2 rounded-full hover:bg-gray-100 transition-colors" 
                onClick={viewMode === 'week' ? goToPreviousWeek : goToPreviousMonth}
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <div className="text-center">
                <div className="font-semibold text-lg text-gray-800">
                  {viewMode === 'week' 
                    ? `${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}`
                    : format(currentMonth, 'MMMM yyyy')
                  }
                </div>
                <div className="text-sm text-gray-500">
                  {viewMode === 'week' ? 'Week View' : 'Month View'}
                </div>
              </div>
              <button 
                className="p-2 rounded-full hover:bg-gray-100 transition-colors" 
                onClick={viewMode === 'week' ? goToNextWeek : goToNextMonth}
              >
                <ChevronRight size={20} className="text-gray-600" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={goToToday}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Today
              </button>
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'week' 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`} 
                onClick={() => setViewMode('week')}
              >
                <Calendar size={16} className="inline mr-1" />
                Week
              </button>
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'month' 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`} 
                onClick={() => setViewMode('month')}
              >
                <Grid3X3 size={16} className="inline mr-1" />
                Month
              </button>
            </div>
          </div>
        </div>

        {/* Week View Calendar */}
        {viewMode === 'week' && (
          <div 
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                const medsForDay = allMeds.filter(med => isMedicationScheduledForDate(med, day));
                const takenCount = medsForDay.filter(med => takenStatus[med.id]?.taken).length;
                const missedCount = medsForDay.filter(med => takenStatus[med.id]?.missed).length;
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`relative p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : isToday 
                          ? 'border-orange-300 bg-orange-50' 
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`text-center ${
                      isSelected ? 'text-blue-700 font-semibold' : 
                      isToday ? 'text-orange-700 font-semibold' : 
                      'text-gray-700'
                    }`}>
                      <div className="text-lg">{format(day, 'd')}</div>
                      <div className="text-xs opacity-75">{format(day, 'MMM')}</div>
                    </div>
                    
                    {/* Medication Indicators */}
                    {medsForDay.length > 0 && (
                      <div className="absolute -top-1 -right-1 flex flex-col gap-1">
                        {isDateActionable(day) ? (
                          <>
                            {takenCount > 0 && (
                              <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                            {missedCount > 0 && (
                              <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                            )}
                            {medsForDay.length > (takenCount + missedCount) && (
                              <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                            )}
                          </>
                        ) : (
                          <div className="w-3 h-3 bg-blue-400 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                    )}
                    
                    {/* Today indicator */}
                    {isToday && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Week Summary */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Week Summary:</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-700">
                      {weekDays.reduce((total, day) => 
                        total + (isDateActionable(day) ? allMeds.filter(med => 
                          isMedicationScheduledForDate(med, day) && takenStatus[med.id]?.taken
                        ).length : 0), 0
                      )} taken
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-red-700">
                      {weekDays.reduce((total, day) => 
                        total + (isDateActionable(day) ? allMeds.filter(med => 
                          isMedicationScheduledForDate(med, day) && takenStatus[med.id]?.missed
                        ).length : 0), 0
                      )} missed
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-700">
                      {weekDays.reduce((total, day) => 
                        total + allMeds.filter(med => 
                          isMedicationScheduledForDate(med, day)
                        ).length, 0
                      )} scheduled
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Month View Calendar */}
        {viewMode === 'month' && (
          <div 
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="grid grid-cols-7 gap-1">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
              {monthDays.map((day) => {
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                const medsForDay = allMeds.filter(med => isMedicationScheduledForDate(med, day));
                const takenCount = medsForDay.filter(med => takenStatus[med.id]?.taken).length;
                const missedCount = medsForDay.filter(med => takenStatus[med.id]?.missed).length;
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`relative p-2 rounded border transition-all duration-200 hover:shadow-sm min-h-[60px] ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : isToday 
                          ? 'border-orange-300 bg-orange-50' 
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`text-sm ${
                      isSelected ? 'text-blue-700 font-semibold' : 
                      isToday ? 'text-orange-700 font-semibold' : 
                      'text-gray-700'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    
                    {/* Medication Indicators */}
                    {medsForDay.length > 0 && (
                      <div className="absolute bottom-1 left-1 right-1 flex justify-center gap-1">
                        {isDateActionable(day) ? (
                          <>
                            {takenCount > 0 && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                            {missedCount > 0 && (
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            )}
                            {medsForDay.length > (takenCount + missedCount) && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </>
                        ) : (
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex justify-center">
          <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
            <button 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'schedule' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`} 
              onClick={() => setActiveTab('schedule')}
            >
              <Clock size={16} />
              <span>Schedule</span>
            </button>
            <button 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'notes' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`} 
              onClick={() => setActiveTab('notes')}
            >
              <BookOpen size={16} />
              <span>Notes</span>
            </button>
            <button 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'reminders' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`} 
              onClick={() => setActiveTab('reminders')}
            >
              <Bell size={16} />
              <span>Reminders</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {/* Medication Summary */}
            {!isLoading && allMeds.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Medication Schedule Summary</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Active Medications</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Pill className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">Total Medications</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{allMeds.length}</div>
                    <div className="text-xs text-blue-600 mt-1">From {prescriptions.length} prescription(s)</div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-800">Scheduled Today</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{medsForSelectedDate.length}</div>
                    <div className="text-xs text-green-600 mt-1">
                      {medsForSelectedDate.length > 0 ? 'Medications to take' : 'No medications scheduled'}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold text-purple-800">Date Range</span>
                    </div>
                    <div className="text-sm font-medium text-purple-800">
                      {format(selectedDate, 'MMM d, yyyy')}
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      {medsForSelectedDate.length > 0 
                        ? `${medsForSelectedDate.filter(med => isDateActionable(selectedDate) && takenStatus[med.id]?.taken).length} taken today`
                        : 'Navigate to see other dates'
                      }
                    </div>
                  </div>
                </div>
                
                {/* Quick Navigation Tips */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Tip:</span> Use the arrow buttons to navigate between dates. 
                      Medications appear based on their prescription start date and duration. 
                      If you don't see medications for today, they may be scheduled for other dates.
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-lg text-slate-600">Loading medications...</span>
                </div>
              </div>
            ) : Object.entries(medsByPeriod).map(([period, meds]) => (
              meds.length > 0 && (
                <div key={period} className={`rounded-2xl shadow-lg overflow-hidden border-2 ${
                  period === 'Morning' ? 'border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50' : 
                  period === 'Afternoon' ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50' : 
                  period === 'Evening' ? 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50' :
                  'border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50'
                }`}>
                  
                  {/* Period Header */}
                  <div className={`p-4 flex items-center justify-between ${
                    period === 'Morning' ? 'bg-gradient-to-r from-orange-400 to-yellow-400' : 
                    period === 'Afternoon' ? 'bg-gradient-to-r from-blue-400 to-cyan-400' : 
                    period === 'Evening' ? 'bg-gradient-to-r from-indigo-500 to-purple-500' :
                    'bg-gradient-to-r from-gray-400 to-slate-400'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-full">
                        {period === 'Morning' && <Pill className="w-5 h-5 text-white" />}
                        {period === 'Afternoon' && <Clock className="w-5 h-5 text-white" />}
                        {period === 'Evening' && <Activity className="w-5 h-5 text-white" />}
                        {period === 'Other' && <AlertTriangle className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <h2 className="font-bold text-white text-lg">{period}</h2>
                        <p className="text-white/80 text-sm">
                          {period === 'Morning' && '6:00 AM - 12:00 PM'}
                          {period === 'Afternoon' && '12:00 PM - 6:00 PM'}
                          {period === 'Evening' && '6:00 PM - 12:00 AM'}
                          {period === 'Other' && 'As needed'}
                        </p>
                      </div>
                    </div>
                    <div className="text-white/90 text-sm font-medium">
                      {meds.filter(med => takenStatus[med.id]?.taken).length}/{meds.length} taken
                    </div>
                  </div>

                  {/* Medications List */}
                  <div className="p-4 space-y-4">
                    {meds.map((med) => {
                      const status = takenStatus[med.id];
                      const isTaken = status?.taken;
                      const isMissed = status?.missed;
                      const isSkipped = status?.skipped;
                      
                      // Determine card style based on date and status
                      let cardClass = 'p-4 transition-all duration-300 hover:shadow-lg ';
                      if (isDateActionable(selectedDate)) {
                        cardClass += isTaken
                          ? 'border-l-4 border-l-green-500 bg-green-50/50 '
                          : isMissed
                          ? 'border-l-4 border-l-red-500 bg-red-50/50 '
                          : isSkipped
                          ? 'border-l-4 border-l-yellow-500 bg-yellow-50/50 '
                          : 'border-l-4 border-l-gray-200 bg-white ';
                      } else {
                        cardClass += 'border-l-4 border-l-gray-200 bg-white ';
                      }

                      return (
                        <Card key={med.id} className={cardClass}>
                          
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                  isDateActionable(selectedDate)
                                    ? isTaken ? 'bg-green-100' :
                                      isMissed ? 'bg-red-100' :
                                      isSkipped ? 'bg-yellow-100' :
                                      'bg-blue-100'
                                    : 'bg-gray-100'
                                }`}>
                                  <Pill className={`w-6 h-6 ${
                                    isDateActionable(selectedDate)
                                      ? isTaken ? 'text-green-600' :
                                        isMissed ? 'text-red-600' :
                                        isSkipped ? 'text-yellow-600' :
                                        'text-blue-600'
                                      : 'text-gray-400'
                                  }`} />
                                </div>
                                
                                <div className="flex-1">
                                  <h3 className="font-bold text-gray-800 text-lg">{med.name}</h3>
                                  <p className="text-blue-600 font-semibold">{med.dosage}</p>
                                  <p className="text-gray-600 text-sm">{med.frequency}</p>
                                  {med.duration && (
                                    <p className="text-gray-500 text-xs">Duration: {med.duration}</p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                {med.doctor && (
                                  <div className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    <span>{med.doctor}</span>
                                  </div>
                                )}
                                {med.startDate && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Started: {formatDate(med.startDate)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Status Badge */}
                            <div className="ml-4">
                              {isDateActionable(selectedDate) ? (
                                <>
                                  {isTaken && (
                                    <Badge className="bg-green-100 text-green-700 border-green-200">
                                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                                      Taken
                                    </Badge>
                                  )}
                                  {isMissed && (
                                    <Badge className="bg-red-100 text-red-700 border-red-200">
                                      <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                                      Missed
                                    </Badge>
                                  )}
                                  {isSkipped && (
                                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
                                      Skipped
                                    </Badge>
                                  )}
                                  {!isTaken && !isMissed && !isSkipped && (
                                    <Badge className="bg-gray-100 text-gray-600 border-gray-200">
                                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-1 animate-pulse"></div>
                                      Pending
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <Badge className="bg-blue-100 text-blue-600 border-blue-200">
                                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-1"></div>
                                  Scheduled
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2 mb-3">
                            {isDateActionable(selectedDate) ? (
                              <>
                                <button 
                                  className={`flex-1 py-2 px-3 rounded-xl border-2 text-sm font-semibold flex justify-center items-center gap-2 transition-all duration-200 ${
                                    isTaken 
                                      ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-200' 
                                      : 'bg-white text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300 hover:shadow-md'
                                  }`}
                                  onClick={() => handleStatusChange(med, 'taken')}
                                >
                                  <Check size={16} strokeWidth={2.5} />
                                  Taken
                                </button>
                                
                                <button 
                                  className={`flex-1 py-2 px-3 rounded-xl border-2 text-sm font-semibold flex justify-center items-center gap-2 transition-all duration-200 ${
                                    isMissed 
                                      ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-200' 
                                      : 'bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 hover:shadow-md'
                                  }`}
                                  onClick={() => handleStatusChange(med, 'missed')}
                                >
                                  <CircleX size={16} strokeWidth={2.5} />
                                  Missed
                                </button>
                                
                                <button 
                                  className={`flex-1 py-2 px-3 rounded-xl border-2 text-sm font-semibold flex justify-center items-center gap-2 transition-all duration-200 ${
                                    isSkipped 
                                      ? 'bg-yellow-500 text-white border-yellow-500 shadow-lg shadow-yellow-200' 
                                      : 'bg-white text-yellow-600 border-yellow-200 hover:bg-yellow-50 hover:border-yellow-300 hover:shadow-md'
                                  }`}
                                  onClick={() => handleStatusChange(med, 'skipped')}
                                >
                                  <CircleAlert size={16} strokeWidth={2.5} />
                                  Skip
                                </button>
                              </>
                            ) : (
                              <div className="flex-1 py-2 px-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-400 text-sm font-semibold flex justify-center items-center gap-2">
                                <Clock size={16} strokeWidth={2.5} />
                                Future Date - Actions Unavailable
                              </div>
                            )}
                          </div>
                          
                          {/* Skip Reason Collapsible */}
                          {isSkipped && status?.skipReason && (
                            <div className="mt-3">
                              <button
                                className="w-full flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
                                onClick={() => setExpandedSkipReason(expandedSkipReason === med.id ? null : med.id)}
                              >
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                  <span className="text-yellow-800 font-medium text-sm">Skip Reason</span>
                                </div>
                                {expandedSkipReason === med.id ? (
                                  <ChevronUp className="w-4 h-4 text-yellow-600" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-yellow-600" />
                                )}
                              </button>
                              
                              {expandedSkipReason === med.id && (
                                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <div className="flex items-start gap-2">
                                    <Edit3 className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-yellow-800 font-medium text-sm mb-1">Reason:</p>
                                      <p className="text-yellow-700 text-sm">{status.skipReason}</p>
                                      {status.timestamp && (
                                        <p className="text-yellow-600 text-xs mt-2">
                                          Skipped on {format(new Date(status.timestamp), 'MMM d, h:mm a')}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Progress Indicator */}
                          {isDateActionable(selectedDate) && isTaken && (
                            <div className="mt-3 flex items-center gap-2 text-green-600">
                              <div className="flex-1 bg-green-100 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full w-full transition-all duration-500"></div>
                              </div>
                              <span className="text-xs font-medium">Completed</span>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                  
                  {/* Period Summary */}
                  <div className={`p-3 border-t ${
                    period === 'Morning' ? 'bg-orange-50 border-orange-100' : 
                    period === 'Afternoon' ? 'bg-blue-50 border-blue-100' : 
                    period === 'Evening' ? 'bg-indigo-50 border-indigo-100' :
                    'bg-gray-50 border-gray-100'
                  }`}>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-gray-600">
                          Progress: <span className="font-semibold">{meds.filter(med => takenStatus[med.id]?.taken).length}/{meds.length}</span>
                        </span>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          meds.every(med => takenStatus[med.id]?.taken) ? 'bg-green-100 text-green-700' :
                          meds.some(med => takenStatus[med.id]?.missed) ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {meds.every(med => takenStatus[med.id]?.taken) ? 'Complete' :
                           meds.some(med => takenStatus[med.id]?.missed) ? 'Needs attention' :
                           'In progress'}
                        </div>
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            period === 'Morning' ? 'bg-orange-400' : 
                            period === 'Afternoon' ? 'bg-blue-400' : 
                            period === 'Evening' ? 'bg-indigo-400' :
                            'bg-gray-400'
                          }`}
                          style={{ width: `${(meds.filter(med => takenStatus[med.id]?.taken).length / meds.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ))}
            
            {!isLoading && medsForSelectedDate.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Pill className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">No medications scheduled for {format(selectedDate, 'MMM d, yyyy')}</h3>
                <p className="text-gray-500 mb-4">
                  {allMeds.length > 0 
                    ? "Medications are scheduled for other dates based on prescription start dates and durations."
                    : "Upload a prescription to see your medication schedule here."
                  }
                </p>
                
                {/* Debug Information */}
                {allMeds.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 text-left">
                    <h4 className="font-semibold text-blue-800 mb-3">Medication Schedule Information:</h4>
                    <div className="space-y-2 text-sm">
                      {allMeds.slice(0, 3).map((med) => {
                        const startDate = med.startDate ? parseISO(med.startDate) : null;
                        const endDate = med.startDate ? getMedicationEndDate(med.startDate, med.duration) : null;
                        const isScheduled = startDate && endDate ? isMedicationScheduledForDate(med, selectedDate) : false;
                        
                        return (
                          <div key={med.id} className="p-3 bg-white rounded border border-blue-100">
                            <div className="font-medium text-blue-700">{med.name} {med.dosage}</div>
                            <div className="text-blue-600 text-xs">
                              <div>Start: {startDate ? format(startDate, 'MMM d, yyyy') : 'Not set'}</div>
                              <div>End: {endDate ? format(endDate, 'MMM d, yyyy') : 'Not set'}</div>
                              <div>Duration: {med.duration || '30 days (default)'}</div>
                              <div className={`font-medium ${isScheduled ? 'text-green-600' : 'text-red-600'}`}>
                                Status: {isScheduled ? 'Scheduled for today' : 'Not scheduled for today'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {allMeds.length > 3 && (
                        <div className="text-blue-600 text-xs italic">
                          ... and {allMeds.length - 3} more medications
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {allMeds.length === 0 && (
                  <a href="/prescriptions" className="btn btn-primary">Upload Prescription</a>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Notes for {format(selectedDate, 'MMM d, yyyy')}</h2>
                <button className="btn btn-primary">
                  <Plus size={16} />
                  <span>Add Note</span>
                </button>
              </div>
              <div className="text-center text-gray-400 py-8">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Notes feature coming soon.</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Reminders Tab */}
        {activeTab === 'reminders' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Reminders for {format(selectedDate, 'MMM d, yyyy')}</h2>
                <button className="btn btn-primary">
                  <Plus size={16} />
                  <span>Add Reminder</span>
                </button>
              </div>
              <div className="text-center text-gray-400 py-8">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Reminders feature coming soon.</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Skip Reason Modal */}
        {showSkipReasonModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4">Skipping Medication</h2>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for skipping <span className="font-semibold">{selectedMedication?.name} {selectedMedication?.dosage}</span>:
              </p>
              
              <textarea 
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                placeholder="e.g., Doctor advised to skip, Feeling unwell, forgot to take, etc."
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
              ></textarea>
              
              <div className="flex gap-3 justify-end mt-6">
                <button 
                  onClick={() => setShowSkipReasonModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmSkipReason}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!skipReason.trim()}
                >
                  Confirm Skip
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 