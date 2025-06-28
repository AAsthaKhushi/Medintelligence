-- Add timeline-related columns to existing tables
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS schedule_data JSONB,
ADD COLUMN IF NOT EXISTS priority_level TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

ALTER TABLE medicines 
ADD COLUMN IF NOT EXISTS timing_instructions TEXT,
ADD COLUMN IF NOT EXISTS priority_level TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS administration_route TEXT DEFAULT 'oral';

-- Create medication_schedules table
CREATE TABLE IF NOT EXISTS medication_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  scheduled_time TIMESTAMP NOT NULL,
  frequency TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create medication_status table
CREATE TABLE IF NOT EXISTS medication_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES medication_schedules(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  scheduled_time TIMESTAMP NOT NULL,
  actual_time TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'upcoming',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create medication_conflicts table
CREATE TABLE IF NOT EXISTS medication_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  medicine_id_1 UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  medicine_id_2 UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  conflict_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  suggested_resolution TEXT,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medication_schedules_user_date ON medication_schedules(user_id, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_medicine ON medication_schedules(medicine_id);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_prescription ON medication_schedules(prescription_id);

CREATE INDEX IF NOT EXISTS idx_medication_status_user_date ON medication_status(user_id, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_medication_status_schedule ON medication_status(schedule_id);
CREATE INDEX IF NOT EXISTS idx_medication_status_medicine ON medication_status(medicine_id);

CREATE INDEX IF NOT EXISTS idx_medication_conflicts_user ON medication_conflicts(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_conflicts_medicines ON medication_conflicts(medicine_id_1, medicine_id_2); 