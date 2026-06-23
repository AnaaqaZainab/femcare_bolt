import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DailyHabit, PeriodCycle, MoodEntry, Medication } from '../types/database';
import {
  Droplets,
  Moon,
  Activity,
  Heart,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Pill,
  Smile,
  CloudRain,
  Target,
  ChevronRight
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [todayHabits, setTodayHabits] = useState<DailyHabit | null>(null);
  const [currentCycle, setCurrentCycle] = useState<PeriodCycle | null>(null);
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);
  const [activeMedications, setActiveMedications] = useState<Medication[]>([]);
  const [cyclePhase, setCyclePhase] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    const today = new Date().toISOString().split('T')[0];

    // Load today's habits
    const { data: habits } = await supabase
      .from('daily_habits')
      .select('*')
      .eq('user_id', userId)
      .eq('logged_date', today)
      .maybeSingle();

    if (habits) setTodayHabits(habits);

    // Load current cycle
    const { data: cycles } = await supabase
      .from('period_cycles')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })
      .limit(1);

    if (cycles && cycles.length > 0) {
      setCurrentCycle(cycles[0]);
      calculateCyclePhase(cycles[0]);
    }

    // Load today's mood
    const { data: moods } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', today)
      .order('logged_at', { ascending: false })
      .limit(1);

    if (moods && moods.length > 0) setTodayMood(moods[0]);

    // Load active medications
    const { data: meds } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (meds) setActiveMedications(meds);

    setLoading(false);
  };

  const calculateCyclePhase = (cycle: PeriodCycle) => {
    const startDate = new Date(cycle.start_date);
    const today = new Date();
    const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceStart < 0) {
      setCyclePhase('Upcoming');
      return;
    }

    if (daysSinceStart < 5) {
      setCyclePhase('Menstrual');
    } else if (daysSinceStart < 14) {
      setCyclePhase('Follicular');
    } else if (daysSinceStart < 17) {
      setCyclePhase('Ovulation');
    } else {
      setCyclePhase('Luteal');
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'happy': return '😊';
      case 'calm': return '😌';
      case 'neutral': return '😐';
      case 'anxious': return '😰';
      case 'sad': return '😢';
      case 'angry': return '😠';
      case 'stressed': return '😓';
      case 'depressed': return '😔';
      default: return '😐';
    }
  };

  const updateWaterIntake = async (glasses: number) => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    const today = new Date().toISOString().split('T')[0];

    if (todayHabits) {
      const { data } = await supabase
        .from('daily_habits')
        .update({ water_intake_glasses: glasses })
        .eq('id', todayHabits.id)
        .select()
        .single();
      if (data) setTodayHabits(data);
    } else {
      const { data } = await supabase
        .from('daily_habits')
        .insert({
          user_id: userId,
          logged_date: today,
          water_intake_glasses: glasses
        })
        .select()
        .single();
      if (data) setTodayHabits(data);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
        <p className="text-gray-600">Here's your health overview for today</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-5 text-white">
          <Calendar className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-sm opacity-90">Cycle Phase</p>
          <p className="text-xl font-bold">{cyclePhase || 'Not set'}</p>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-5 text-white">
          <Droplets className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-sm opacity-90">Water Today</p>
          <p className="text-xl font-bold">{todayHabits?.water_intake_glasses || 0}/8 glasses</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-white">
          <Moon className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-sm opacity-90">Sleep Hours</p>
          <p className="text-xl font-bold">{todayHabits?.sleep_hours || '-'} hours</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white">
          <Activity className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-sm opacity-90">Exercise</p>
          <p className="text-xl font-bold">{todayHabits?.exercise_minutes || 0} min</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cycle Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Cycle Tracking</h2>
            <button
              onClick={() => onNavigate('cycles')}
              className="text-rose-500 hover:text-rose-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {currentCycle ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Current Phase</span>
                <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-sm font-medium">
                  {cyclePhase}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Period Started</span>
                <span className="font-medium text-gray-900">
                  {new Date(currentCycle.start_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Flow Intensity</span>
                <span className="font-medium text-gray-900 capitalize">
                  {currentCycle.flow_intensity || 'Not logged'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">Start tracking your cycle</p>
              <button
                onClick={() => onNavigate('cycles')}
                className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
              >
                Log Period
              </button>
            </div>
          )}
        </div>

        {/* Mood Today */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Today's Mood</h2>
            <button
              onClick={() => onNavigate('wellness')}
              className="text-rose-500 hover:text-rose-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {todayMood ? (
            <div className="text-center py-4">
              <div className="text-6xl mb-3">{getMoodEmoji(todayMood.mood)}</div>
              <p className="text-xl font-semibold text-gray-900 capitalize">{todayMood.mood}</p>
              <div className="flex justify-center gap-4 mt-4 text-sm text-gray-600">
                <div>
                  <p className="font-medium">Energy</p>
                  <p className="text-lg">{todayMood.energy_level || '-'}/10</p>
                </div>
                <div>
                  <p className="font-medium">Sleep</p>
                  <p className="text-lg">{todayMood.sleep_quality || '-'}/10</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Smile className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">How are you feeling?</p>
              <button
                onClick={() => onNavigate('wellness')}
                className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
              >
                Log Mood
              </button>
            </div>
          )}
        </div>

        {/* Medications */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Medications</h2>
            <button
              onClick={() => onNavigate('medications')}
              className="text-rose-500 hover:text-rose-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {activeMedications.length > 0 ? (
            <div className="space-y-3">
              {activeMedications.slice(0, 3).map((med) => (
                <div key={med.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Pill className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{med.name}</p>
                    <p className="text-sm text-gray-500">{med.dosage} | {med.frequency}</p>
                  </div>
                </div>
              ))}
              {activeMedications.length > 3 && (
                <p className="text-sm text-gray-500 text-center">
                  +{activeMedications.length - 3} more
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">Add your medications</p>
              <button
                onClick={() => onNavigate('medications')}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                Add Medication
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Water Tracker */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Droplets className="w-6 h-6 text-teal-500" />
            <h2 className="font-semibold text-gray-900">Water Intake</h2>
          </div>
          <span className="text-2xl font-bold text-teal-600">{todayHabits?.water_intake_glasses || 0}/8</span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((glass) => (
            <button
              key={glass}
              onClick={() => updateWaterIntake(glass)}
              className={`flex-1 aspect-square rounded-xl flex items-center justify-center transition-all ${
                glass <= (todayHabits?.water_intake_glasses || 0)
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-400 hover:bg-teal-100'
              }`}
            >
              <Droplets className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('cycles')}
          className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-rose-200 transition-all group"
        >
          <CloudRain className="w-8 h-8 text-rose-500 mb-2" />
          <p className="font-medium text-gray-900 group-hover:text-rose-600">Log Symptoms</p>
        </button>

        <button
          onClick={() => onNavigate('wellness')}
          className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-teal-200 transition-all group"
        >
          <Target className="w-8 h-8 text-teal-500 mb-2" />
          <p className="font-medium text-gray-900 group-hover:text-teal-600">Start Meditation</p>
        </button>

        <button
          onClick={() => onNavigate('lifestyle')}
          className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-amber-200 transition-all group"
        >
          <TrendingUp className="w-8 h-8 text-amber-500 mb-2" />
          <p className="font-medium text-gray-900 group-hover:text-amber-600">View Diet Plan</p>
        </button>

        <button
          onClick={() => onNavigate('emergency')}
          className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-red-200 transition-all group"
        >
          <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
          <p className="font-medium text-gray-900 group-hover:text-red-600">Emergency SOS</p>
        </button>
      </div>
    </div>
  );
}
