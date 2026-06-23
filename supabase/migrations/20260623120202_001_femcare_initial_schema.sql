/*
# FemCare AI - Initial Database Schema

## Overview
Comprehensive women's health management database supporting:
- Period and PCOD tracking
- Mental wellness monitoring
- Medication management
- Family care connectivity
- Lifestyle coaching
- Health analytics
- Emergency support

## New Tables

### User Management
- `profiles` - Extended user profile with health-specific fields

### Period & PCOD Tracking
- `period_cycles` - Menstrual cycle tracking
- `ovulation_predictions` - Predicted ovulation dates
- `pcod_symptoms` - PCOD symptom logs (acne, hair fall, weight, mood, fatigue)

### Mental Wellness
- `mood_entries` - Daily mood and emotional wellness tracking
- `stress_assessments` - Stress and anxiety assessments
- `journal_entries` - Emotional wellness journal
- `meditation_sessions` - Meditation practice tracking

### Medication Management
- `medications` - Active medications and prescriptions
- `medication_reminders` - Daily reminder schedule
- `medication_logs` - Adherence tracking

### Family Care
- `family_connections` - Trusted family/caregiver relationships
- `emergency_contacts` - Emergency contact list
- `health_shares` - Permission-based health data sharing

### Lifestyle Coaching
- `daily_habits` - Water intake, sleep, exercise tracking
- `diet_plans` - AI-generated PCOD diet recommendations
- `workout_routines` - Personalized workout and yoga plans
- `wellness_recommendations` - Daily wellness tips

### Health Analytics
- `health_scores` - Calculated wellness scores over time
- `symptom_trends` - Aggregated symptom analytics

### Emergency Support
- `emergency_alerts` - SOS alert history
- `medical_history_exports` - PDF export records

## Security
- RLS enabled on all tables
- Owner-scoped policies for authenticated users
- Family data sharing with explicit permissions
*/

-- User Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name text,
  date_of_birth date,
  profile_photo_url text,
  health_goals text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Period & Cycle Tracking
CREATE TABLE IF NOT EXISTS period_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date,
  cycle_length integer,
  period_length integer,
  flow_intensity text CHECK (flow_intensity IN ('light', 'medium', 'heavy')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Ovulation Predictions
CREATE TABLE IF NOT EXISTS ovulation_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  predicted_date date NOT NULL,
  fertile_window_start date,
  fertile_window_end date,
  confidence_score decimal(3,2),
  based_on_cycle_id uuid REFERENCES period_cycles(id),
  created_at timestamptz DEFAULT now()
);

-- PCOD Symptom Tracking
CREATE TABLE IF NOT EXISTS pcod_symptoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_date date NOT NULL DEFAULT CURRENT_DATE,
  acne_severity integer CHECK (acne_severity BETWEEN 0 AND 10),
  hair_fall_severity integer CHECK (hair_fall_severity BETWEEN 0 AND 10),
  weight_change numeric(5,2),
  mood_swings_severity integer CHECK (mood_swings_severity BETWEEN 0 AND 10),
  fatigue_level integer CHECK (fatigue_level BETWEEN 0 AND 10),
  irregular_periods boolean DEFAULT false,
  cramping_severity integer CHECK (cramping_severity BETWEEN 0 AND 10),
  bloating_severity integer CHECK (bloating_severity BETWEEN 0 AND 10),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Mood Tracking
CREATE TABLE IF NOT EXISTS mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_at timestamptz DEFAULT now(),
  mood text NOT NULL CHECK (mood IN ('happy', 'calm', 'neutral', 'anxious', 'sad', 'angry', 'stressed', 'depressed')),
  mood_intensity integer CHECK (mood_intensity BETWEEN 1 AND 10),
  energy_level integer CHECK (energy_level BETWEEN 1 AND 10),
  sleep_quality integer CHECK (sleep_quality BETWEEN 1 AND 10),
  triggers text[],
 coping_mechanisms text[],
  notes text
);

-- Stress Assessments
CREATE TABLE IF NOT EXISTS stress_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_date date NOT NULL DEFAULT CURRENT_DATE,
  perceived_stress_score integer,
  anxiety_level integer CHECK (anxiety_level BETWEEN 0 AND 21),
  depression_indicators integer,
  assessment_type text DEFAULT 'daily',
  created_at timestamptz DEFAULT now()
);

-- Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  title text,
  content text NOT NULL,
  entry_type text DEFAULT 'emotional' CHECK (entry_type IN ('emotional', 'gratitude', 'symptom', 'general')),
  mood_tags text[],
  is_private boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Meditation Sessions
CREATE TABLE IF NOT EXISTS meditation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type text CHECK (session_type IN ('breathing', 'guided', 'silent', 'body_scan', 'yoga_nidra')),
  duration_minutes integer NOT NULL,
  started_at timestamptz DEFAULT now(),
  completed boolean DEFAULT false,
  notes text
);

-- Medications
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  times text[] NOT NULL,
  start_date date NOT NULL,
  end_date date,
  prescribing_doctor text,
  prescription_image_url text,
  instructions text,
  is_active boolean DEFAULT true,
  refill_reminder_date date,
  created_at timestamptz DEFAULT now()
);

-- Medication Reminders
CREATE TABLE IF NOT EXISTS medication_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  reminder_time time NOT NULL,
  days_of_week integer[] DEFAULT ARRAY[0,1,2,3,4,5,6],
  is_active boolean DEFAULT true
);

-- Medication Logs (Adherence)
CREATE TABLE IF NOT EXISTS medication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  scheduled_time timestamptz NOT NULL,
  taken_at timestamptz,
  skipped boolean DEFAULT false,
  skip_reason text,
  created_at timestamptz DEFAULT now()
);

-- Family Connections
CREATE TABLE IF NOT EXISTS family_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  family_member_email text NOT NULL,
  family_member_name text,
  relationship text,
  permission_level text DEFAULT 'view' CHECK (permission_level IN ('view', 'edit', 'emergency')),
  can_view_medications boolean DEFAULT false,
  can_view_cycles boolean DEFAULT false,
  can_view_mood boolean DEFAULT false,
  receive_emergency_alerts boolean DEFAULT true,
  receive_medication_alerts boolean DEFAULT false,
  invite_accepted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Emergency Contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text NOT NULL,
  phone_number text NOT NULL,
  is_primary boolean DEFAULT false,
  priority_order integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Health Data Sharing
CREATE TABLE IF NOT EXISTS health_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES family_connections(id) ON DELETE CASCADE,
  share_symptoms boolean DEFAULT true,
  share_medications boolean DEFAULT false,
  share_cycles boolean DEFAULT false,
  share_mood boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Daily Habits
CREATE TABLE IF NOT EXISTS daily_habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_date date NOT NULL DEFAULT CURRENT_DATE,
  water_intake_glasses integer DEFAULT 0,
  sleep_hours numeric(3,1),
  sleep_quality integer CHECK (sleep_quality BETWEEN 1 AND 10),
  exercise_minutes integer DEFAULT 0,
  steps_count integer DEFAULT 0,
  meals_logged boolean DEFAULT false,
  meditation_minutes integer DEFAULT 0,
  supplements_taken boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, logged_date)
);

-- Diet Plans
CREATE TABLE IF NOT EXISTS diet_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name text,
  created_date date NOT NULL DEFAULT CURRENT_DATE,
  target_calories integer,
  meal_recommendations jsonb,
  restrictions text[],
  preferences text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Workout Routines
CREATE TABLE IF NOT EXISTS workout_routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_type text CHECK (workout_type IN ('cardio', 'strength', 'yoga', 'pilates', 'stretching', 'mixed')),
  duration_minutes integer NOT NULL,
  intensity text CHECK (intensity IN ('low', 'medium', 'high')),
  exercises jsonb,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Workout Logs
CREATE TABLE IF NOT EXISTS workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id uuid REFERENCES workout_routines(id),
  workout_date date NOT NULL DEFAULT CURRENT_DATE,
  completed boolean DEFAULT false,
  duration_actual integer,
  calories_burned integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Wellness Recommendations
CREATE TABLE IF NOT EXISTS wellness_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_date date NOT NULL DEFAULT CURRENT_DATE,
  recommendation_type text NOT NULL,
  title text NOT NULL,
  description text,
  priority integer DEFAULT 1,
  is_read boolean DEFAULT false,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Health Scores
CREATE TABLE IF NOT EXISTS health_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  score_date date NOT NULL DEFAULT CURRENT_DATE,
  overall_wellness_score integer CHECK (overall_wellness_score BETWEEN 0 AND 100),
  pcod_severity_index integer CHECK (pcod_severity_index BETWEEN 0 AND 100),
  mental_wellness_score integer CHECK (mental_wellness_score BETWEEN 0 AND 100),
  medication_adherence_score integer CHECK (medication_adherence_score BETWEEN 0 AND 100),
  lifestyle_score integer CHECK (lifestyle_score BETWEEN 0 AND 100),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, score_date)
);

-- Emergency Alerts
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  triggered_at timestamptz DEFAULT now(),
  location_lat numeric(9,6),
  location_lng numeric(9,6),
  message text,
  notified_contacts text[],
  resolved boolean DEFAULT false,
  resolved_at timestamptz
);

-- Medical History Exports
CREATE TABLE IF NOT EXISTS medical_history_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  export_type text DEFAULT 'full' CHECK (export_type IN ('full', 'symptoms', 'medications', 'cycles', 'mood')),
  date_range_start date,
  date_range_end date,
  generated_at timestamptz DEFAULT now(),
  file_url text,
  expires_at timestamptz
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE period_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ovulation_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pcod_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for period_cycles
DROP POLICY IF EXISTS "select_own_cycles" ON period_cycles;
CREATE POLICY "select_own_cycles" ON period_cycles FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_cycles" ON period_cycles;
CREATE POLICY "insert_own_cycles" ON period_cycles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_cycles" ON period_cycles;
CREATE POLICY "update_own_cycles" ON period_cycles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_cycles" ON period_cycles;
CREATE POLICY "delete_own_cycles" ON period_cycles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for ovulation_predictions
DROP POLICY IF EXISTS "select_own_predictions" ON ovulation_predictions;
CREATE POLICY "select_own_predictions" ON ovulation_predictions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_predictions" ON ovulation_predictions;
CREATE POLICY "insert_own_predictions" ON ovulation_predictions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS Policies for pcod_symptoms
DROP POLICY IF EXISTS "select_own_symptoms" ON pcod_symptoms;
CREATE POLICY "select_own_symptoms" ON pcod_symptoms FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_symptoms" ON pcod_symptoms;
CREATE POLICY "insert_own_symptoms" ON pcod_symptoms FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_symptoms" ON pcod_symptoms;
CREATE POLICY "update_own_symptoms" ON pcod_symptoms FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for mood_entries
DROP POLICY IF EXISTS "select_own_mood" ON mood_entries;
CREATE POLICY "select_own_mood" ON mood_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_mood" ON mood_entries;
CREATE POLICY "insert_own_mood" ON mood_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_mood" ON mood_entries;
CREATE POLICY "update_own_mood" ON mood_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for stress_assessments
DROP POLICY IF EXISTS "select_own_stress" ON stress_assessments;
CREATE POLICY "select_own_stress" ON stress_assessments FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_stress" ON stress_assessments;
CREATE POLICY "insert_own_stress" ON stress_assessments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS Policies for journal_entries
DROP POLICY IF EXISTS "select_own_journal" ON journal_entries;
CREATE POLICY "select_own_journal" ON journal_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_journal" ON journal_entries;
CREATE POLICY "insert_own_journal" ON journal_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_journal" ON journal_entries;
CREATE POLICY "update_own_journal" ON journal_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_journal" ON journal_entries;
CREATE POLICY "delete_own_journal" ON journal_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for meditation_sessions
DROP POLICY IF EXISTS "select_own_meditation" ON meditation_sessions;
CREATE POLICY "select_own_meditation" ON meditation_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_meditation" ON meditation_sessions;
CREATE POLICY "insert_own_meditation" ON meditation_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS Policies for medications
DROP POLICY IF EXISTS "select_own_medications" ON medications;
CREATE POLICY "select_own_medications" ON medications FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_medications" ON medications;
CREATE POLICY "insert_own_medications" ON medications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_medications" ON medications;
CREATE POLICY "update_own_medications" ON medications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_medications" ON medications;
CREATE POLICY "delete_own_medications" ON medications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for medication_reminders
DROP POLICY IF EXISTS "select_own_reminders" ON medication_reminders;
CREATE POLICY "select_own_reminders" ON medication_reminders FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM medications WHERE medications.id = medication_reminders.medication_id AND medications.user_id = auth.uid())
);

DROP POLICY IF EXISTS "insert_own_reminders" ON medication_reminders;
CREATE POLICY "insert_own_reminders" ON medication_reminders FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM medications WHERE medications.id = medication_reminders.medication_id AND medications.user_id = auth.uid())
);

-- RLS Policies for medication_logs
DROP POLICY IF EXISTS "select_own_med_logs" ON medication_logs;
CREATE POLICY "select_own_med_logs" ON medication_logs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM medications WHERE medications.id = medication_logs.medication_id AND medications.user_id = auth.uid())
);

DROP POLICY IF EXISTS "insert_own_med_logs" ON medication_logs;
CREATE POLICY "insert_own_med_logs" ON medication_logs FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM medications WHERE medications.id = medication_logs.medication_id AND medications.user_id = auth.uid())
);

-- RLS Policies for family_connections
DROP POLICY IF EXISTS "select_own_family" ON family_connections;
CREATE POLICY "select_own_family" ON family_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_family" ON family_connections;
CREATE POLICY "insert_own_family" ON family_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_family" ON family_connections;
CREATE POLICY "update_own_family" ON family_connections FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_family" ON family_connections;
CREATE POLICY "delete_own_family" ON family_connections FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for emergency_contacts
DROP POLICY IF EXISTS "select_own_emergency" ON emergency_contacts;
CREATE POLICY "select_own_emergency" ON emergency_contacts FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_emergency" ON emergency_contacts;
CREATE POLICY "insert_own_emergency" ON emergency_contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_emergency" ON emergency_contacts;
CREATE POLICY "update_own_emergency" ON emergency_contacts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_emergency" ON emergency_contacts;
CREATE POLICY "delete_own_emergency" ON emergency_contacts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for health_shares
DROP POLICY IF EXISTS "select_shares" ON health_shares;
CREATE POLICY "select_shares" ON health_shares FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = shared_with_user_id);

DROP POLICY IF EXISTS "insert_shares" ON health_shares;
CREATE POLICY "insert_shares" ON health_shares FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_shares" ON health_shares;
CREATE POLICY "delete_shares" ON health_shares FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for daily_habits
DROP POLICY IF EXISTS "select_own_habits" ON daily_habits;
CREATE POLICY "select_own_habits" ON daily_habits FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_habits" ON daily_habits;
CREATE POLICY "insert_own_habits" ON daily_habits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_habits" ON daily_habits;
CREATE POLICY "update_own_habits" ON daily_habits FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for diet_plans
DROP POLICY IF EXISTS "select_own_diet" ON diet_plans;
CREATE POLICY "select_own_diet" ON diet_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_diet" ON diet_plans;
CREATE POLICY "insert_own_diet" ON diet_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_diet" ON diet_plans;
CREATE POLICY "update_own_diet" ON diet_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for workout_routines
DROP POLICY IF EXISTS "select_own_workouts" ON workout_routines;
CREATE POLICY "select_own_workouts" ON workout_routines FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_workouts" ON workout_routines;
CREATE POLICY "insert_own_workouts" ON workout_routines FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_workouts" ON workout_routines;
CREATE POLICY "update_own_workouts" ON workout_routines FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_workouts" ON workout_routines;
CREATE POLICY "delete_own_workouts" ON workout_routines FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for workout_logs
DROP POLICY IF EXISTS "select_own_workout_logs" ON workout_logs;
CREATE POLICY "select_own_workout_logs" ON workout_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_workout_logs" ON workout_logs;
CREATE POLICY "insert_own_workout_logs" ON workout_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_workout_logs" ON workout_logs;
CREATE POLICY "update_own_workout_logs" ON workout_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for wellness_recommendations
DROP POLICY IF EXISTS "select_own_recommendations" ON wellness_recommendations;
CREATE POLICY "select_own_recommendations" ON wellness_recommendations FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_recommendations" ON wellness_recommendations;
CREATE POLICY "insert_own_recommendations" ON wellness_recommendations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_recommendations" ON wellness_recommendations;
CREATE POLICY "update_own_recommendations" ON wellness_recommendations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for health_scores
DROP POLICY IF EXISTS "select_own_scores" ON health_scores;
CREATE POLICY "select_own_scores" ON health_scores FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_scores" ON health_scores;
CREATE POLICY "insert_own_scores" ON health_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS Policies for emergency_alerts
DROP POLICY IF EXISTS "select_own_alerts" ON emergency_alerts;
CREATE POLICY "select_own_alerts" ON emergency_alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_alerts" ON emergency_alerts;
CREATE POLICY "insert_own_alerts" ON emergency_alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_alerts" ON emergency_alerts;
CREATE POLICY "update_own_alerts" ON emergency_alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for medical_history_exports
DROP POLICY IF EXISTS "select_own_exports" ON medical_history_exports;
CREATE POLICY "select_own_exports" ON medical_history_exports FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_exports" ON medical_history_exports;
CREATE POLICY "insert_own_exports" ON medical_history_exports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_period_cycles_user ON period_cycles(user_id);
CREATE INDEX IF NOT EXISTS idx_pcod_symptoms_user_date ON pcod_symptoms(user_id, logged_date DESC);
CREATE INDEX IF NOT EXISTS idx_mood_entries_user ON mood_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_user_active ON medications(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_daily_habits_user_date ON daily_habits(user_id, logged_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_scores_user_date ON health_scores(user_id, score_date DESC);
CREATE INDEX IF NOT EXISTS idx_family_connections_user ON family_connections(user_id);