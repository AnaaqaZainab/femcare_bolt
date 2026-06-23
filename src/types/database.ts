export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  date_of_birth: string | null;
  profile_photo_url: string | null;
  health_goals: string[];
  created_at: string;
  updated_at: string;
}

export interface PeriodCycle {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
  cycle_length: number | null;
  period_length: number | null;
  flow_intensity: 'light' | 'medium' | 'heavy' | null;
  notes: string | null;
  created_at: string;
}

export interface OvulationPrediction {
  id: string;
  user_id: string;
  predicted_date: string;
  fertile_window_start: string | null;
  fertile_window_end: string | null;
  confidence_score: number | null;
  based_on_cycle_id: string | null;
  created_at: string;
}

export interface PcodSymptom {
  id: string;
  user_id: string;
  logged_date: string;
  acne_severity: number | null;
  hair_fall_severity: number | null;
  weight_change: number | null;
  mood_swings_severity: number | null;
  fatigue_level: number | null;
  irregular_periods: boolean;
  cramping_severity: number | null;
  bloating_severity: number | null;
  notes: string | null;
  created_at: string;
}

export interface MoodEntry {
  id: string;
  user_id: string;
  logged_at: string;
  mood: 'happy' | 'calm' | 'neutral' | 'anxious' | 'sad' | 'angry' | 'stressed' | 'depressed';
  mood_intensity: number | null;
  energy_level: number | null;
  sleep_quality: number | null;
  triggers: string[] | null;
  coping_mechanisms: string[] | null;
  notes: string | null;
}

export interface StressAssessment {
  id: string;
  user_id: string;
  assessment_date: string;
  perceived_stress_score: number | null;
  anxiety_level: number | null;
  depression_indicators: number | null;
  assessment_type: string;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  title: string | null;
  content: string;
  entry_type: 'emotional' | 'gratitude' | 'symptom' | 'general';
  mood_tags: string[];
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface Meditation {
  id: string;
  user_id: string;
  session_type: 'breathing' | 'guided' | 'silent' | 'body_scan' | 'yoga_nidra' | null;
  duration_minutes: number;
  started_at: string;
  completed: boolean;
  notes: string | null;
}

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  start_date: string;
  end_date: string | null;
  prescribing_doctor: string | null;
  prescription_image_url: string | null;
  instructions: string | null;
  is_active: boolean;
  refill_reminder_date: string | null;
  created_at: string;
}

export interface MedicationLog {
  id: string;
  medication_id: string;
  scheduled_time: string;
  taken_at: string | null;
  skipped: boolean;
  skip_reason: string | null;
  created_at: string;
}

export interface FamilyConnection {
  id: string;
  user_id: string;
  family_member_email: string;
  family_member_name: string | null;
  relationship: string | null;
  permission_level: 'view' | 'edit' | 'emergency';
  can_view_medications: boolean;
  can_view_cycles: boolean;
  can_view_mood: boolean;
  receive_emergency_alerts: boolean;
  receive_medication_alerts: boolean;
  invite_accepted: boolean;
  created_at: string;
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  phone_number: string;
  is_primary: boolean;
  priority_order: number;
  created_at: string;
}

export interface DailyHabit {
  id: string;
  user_id: string;
  logged_date: string;
  water_intake_glasses: number;
  sleep_hours: number | null;
  sleep_quality: number | null;
  exercise_minutes: number;
  steps_count: number;
  meals_logged: boolean;
  meditation_minutes: number;
  supplements_taken: boolean;
  created_at: string;
}

export interface DietPlan {
  id: string;
  user_id: string;
  plan_name: string | null;
  created_date: string;
  target_calories: number | null;
  meal_recommendations: Record<string, unknown>;
  restrictions: string[];
  preferences: string[];
  is_active: boolean;
  created_at: string;
}

export interface WorkoutRoutine {
  id: string;
  user_id: string;
  workout_type: 'cardio' | 'strength' | 'yoga' | 'pilates' | 'stretching' | 'mixed' | null;
  duration_minutes: number;
  intensity: 'low' | 'medium' | 'high' | null;
  exercises: Record<string, unknown>;
  notes: string | null;
  created_at: string;
}

export interface HealthScore {
  id: string;
  user_id: string;
  score_date: string;
  overall_wellness_score: number | null;
  pcod_severity_index: number | null;
  mental_wellness_score: number | null;
  medication_adherence_score: number | null;
  lifestyle_score: number | null;
  notes: string | null;
  created_at: string;
}

export interface EmergencyAlert {
  id: string;
  user_id: string;
  alert_type: string;
  triggered_at: string;
  location_lat: number | null;
  location_lng: number | null;
  message: string | null;
  notified_contacts: string[] | null;
  resolved: boolean;
  resolved_at: string | null;
}
