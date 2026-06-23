import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { HealthScore, MoodEntry, PcodSymptom, DailyHabit, MedicationLog } from '../types/database';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Heart,
  Brain,
  Pill,
  Activity,
  Calendar,
  Download,
  FileText
} from 'lucide-react';

export function AnalyticsDashboard() {
  const [healthScores, setHealthScores] = useState<HealthScore[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [pcodSymptoms, setPcodSymptoms] = useState<PcodSymptom[]>([]);
  const [dailyHabits, setDailyHabits] = useState<DailyHabit[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | '3months'>('month');

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    const daysAgo = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const { data: scores } = await supabase
      .from('health_scores')
      .select('*')
      .eq('user_id', userId)
      .gte('score_date', startDate.toISOString().split('T')[0])
      .order('score_date', { ascending: true });

    if (scores) setHealthScores(scores);

    const { data: moods } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', startDate.toISOString())
      .order('logged_at', { ascending: true });

    if (moods) setMoodEntries(moods);

    const { data: symptoms } = await supabase
      .from('pcod_symptoms')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_date', startDate.toISOString().split('T')[0])
      .order('logged_date', { ascending: true });

    if (symptoms) setPcodSymptoms(symptoms);

    const { data: habits } = await supabase
      .from('daily_habits')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_date', startDate.toISOString().split('T')[0])
      .order('logged_date', { ascending: true });

    if (habits) setDailyHabits(habits);

    const { data: logs } = await supabase
      .from('medication_logs')
      .select('*, medications!inner(user_id)')
      .eq('medications.user_id', userId)
      .gte('scheduled_time', startDate.toISOString())
      .order('scheduled_time', { ascending: true });

    if (logs) setMedicationLogs(logs);
    setLoading(false);
  };

  const calculateAverages = () => {
    const moodAvg = moodEntries.length
      ? Math.round(moodEntries.reduce((sum, e) => sum + (e.mood_intensity || 0), 0) / moodEntries.length)
      : 0;

    const energyAvg = moodEntries.length
      ? Math.round(moodEntries.reduce((sum, e) => sum + (e.energy_level || 0), 0) / moodEntries.length)
      : 0;

    const waterAvg = dailyHabits.length
      ? Math.round(dailyHabits.reduce((sum, h) => sum + h.water_intake_glasses, 0) / dailyHabits.length)
      : 0;

    const sleepAvg = dailyHabits.filter(h => h.sleep_hours).length
      ? Math.round(dailyHabits.filter(h => h.sleep_hours).reduce((sum, h) => sum + (h.sleep_hours || 0), 0) / dailyHabits.filter(h => h.sleep_hours).length * 10) / 10
      : 0;

    const exerciseAvg = dailyHabits.length
      ? Math.round(dailyHabits.reduce((sum, h) => sum + h.exercise_minutes, 0) / dailyHabits.length)
      : 0;

    const medicationRate = medicationLogs.length
      ? Math.round((medicationLogs.filter(l => l.taken_at).length / medicationLogs.length) * 100)
      : 0;

    return { moodAvg, energyAvg, waterAvg, sleepAvg, exerciseAvg, medicationRate };
  };

  const getMoodDistribution = () => {
    const distribution: Record<string, number> = {};
    moodEntries.forEach((entry) => {
      distribution[entry.mood] = (distribution[entry.mood] || 0) + 1;
    });
    return distribution;
  };

  const getSymptomTrends = () => {
    const trends: Record<string, { avg: number; trend: 'up' | 'down' | 'stable' }> = {};
    if (pcodSymptoms.length >= 2) {
      const recent = pcodSymptoms.slice(-7);
      const previous = pcodSymptoms.slice(-14, -7);

      const calcAvg = (arr: PcodSymptom[], field: keyof PcodSymptom) => {
        const valid = arr.filter(s => s[field] !== null);
        return valid.length ? valid.reduce((sum, s) => sum + (s[field] as number), 0) / valid.length : 0;
      };

      ['acne_severity', 'hair_fall_severity', 'mood_swings_severity', 'fatigue_level'].forEach((field) => {
        const recentAvg = calcAvg(recent, field as keyof PcodSymptom);
        const prevAvg = calcAvg(previous, field as keyof PcodSymptom);

        if (recentAvg && prevAvg) {
          trends[field] = {
            avg: Math.round(recentAvg * 10) / 10,
            trend: recentAvg > prevAvg + 0.5 ? 'up' : recentAvg < prevAvg - 0.5 ? 'down' : 'stable'
          };
        }
      });
    }
    return trends;
  };

  const exportReport = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    await supabase.from('medical_history_exports').insert({
      user_id: userId,
      export_type: 'full',
      date_range_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      date_range_end: new Date().toISOString().split('T')[0]
    });

    alert('Health report generation requested. It will be available shortly.');
  };

  const averages = calculateAverages();
  const moodDistribution = getMoodDistribution();
  const symptomTrends = getSymptomTrends();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health Analytics</h1>
          <p className="text-gray-600">Track your wellness journey with detailed insights</p>
        </div>
        <button
          onClick={exportReport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'week', label: 'Last 7 Days' },
          { id: 'month', label: 'Last 30 Days' },
          { id: '3months', label: 'Last 90 Days' }
        ].map((range) => (
          <button
            key={range.id}
            onClick={() => setTimeRange(range.id as typeof timeRange)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              timeRange === range.id
                ? 'bg-rose-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-5 text-white">
          <Heart className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-90">Overall Wellness</p>
          <p className="text-3xl font-bold">{averages.moodAvg}</p>
          <p className="text-xs opacity-75">mood score avg</p>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-5 text-white">
          <Brain className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-90">Energy Level</p>
          <p className="text-3xl font-bold">{averages.energyAvg}</p>
          <p className="text-xs opacity-75">energy avg</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
          <Pill className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-90">Medication</p>
          <p className="text-3xl font-bold">{averages.medicationRate}%</p>
          <p className="text-xs opacity-75">adherence rate</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <Activity className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-90">Avg Exercise</p>
          <p className="text-3xl font-bold">{averages.exerciseAvg}</p>
          <p className="text-xs opacity-75">min/day</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lifestyle Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Lifestyle Metrics</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">💧</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Water Intake</p>
                  <p className="text-sm text-gray-500">Average daily glasses</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-teal-600">{averages.waterAvg}</p>
                <p className="text-xs text-gray-500">/8 glasses</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">😴</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Sleep Duration</p>
                  <p className="text-sm text-gray-500">Average nightly hours</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">{averages.sleepAvg}</p>
                <p className="text-xs text-gray-500">hours</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🏃</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Exercise</p>
                  <p className="text-sm text-gray-500">Average daily minutes</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-rose-600">{averages.exerciseAvg}</p>
                <p className="text-xs text-gray-500">minutes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mood Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Mood Distribution</h2>

          {Object.keys(moodDistribution).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(moodDistribution)
                .sort((a, b) => b[1] - a[1])
                .map(([mood, count]) => {
                  const percentage = Math.round((count / moodEntries.length) * 100);
                  const getMoodEmoji = (m: string) => {
                    const emojies: Record<string, string> = {
                      happy: '😊', calm: '😌', neutral: '😐', anxious: '😰',
                      sad: '😢', angry: '😠', stressed: '😓', depressed: '😔'
                    };
                    return emojies[m] || '😐';
                  };

                  return (
                    <div key={mood} className="flex items-center gap-3">
                      <span className="text-xl">{getMoodEmoji(mood)}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm capitalize text-gray-700">{mood}</span>
                          <span className="text-sm text-gray-500">{percentage}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-400 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No mood data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* PCOD Symptom Trends */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">PCOD Symptom Trends</h2>

        {Object.keys(symptomTrends).length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(symptomTrends).map(([key, value]) => {
              const label = key.replace('_severity', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

              return (
                <div key={key} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">{label}</p>
                    {value.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-rose-500" />
                    ) : value.trend === 'down' ? (
                      <TrendingDown className="w-4 h-4 text-teal-500" />
                    ) : null}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{value.avg}</p>
                  <p className="text-xs text-gray-500">avg severity</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No symptom data for trend analysis</p>
            <p className="text-sm text-gray-400 mt-1">Log symptoms regularly to see trends</p>
          </div>
        )}
      </div>

      {/* Summary Report */}
      <div className="mt-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <FileText className="w-6 h-6 text-gray-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Health Summary</h3>
            <p className="text-sm text-gray-600 mt-1">
              Based on your data from the last {timeRange === 'week' ? '7' : timeRange === 'month' ? '30' : '90'} days:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                • Mood tracking: {moodEntries.length} entries logged
                {averages.moodAvg >= 6 ? ' - Your overall mood is positive!' : averages.moodAvg <= 4 ? ' - Consider mood-boosting activities' : ' - Room for improvement'}
              </li>
              <li>
                • Medication adherence: {averages.medicationRate}%
                {averages.medicationRate >= 90 ? ' - Excellent consistency!' : averages.medicationRate <= 70 ? ' - Focus on medication compliance' : ' - Keep improving'}
              </li>
              <li>
                • Exercise: {averages.exerciseAvg} min/day average
                {averages.exerciseAvg >= 30 ? ' - Meeting recommended levels!' : ' - Aim for 30+ minutes daily'}
              </li>
              <li>
                • Water intake: {averages.waterAvg}/8 glasses average
                {averages.waterAvg >= 6 ? ' - Good hydration!' : ' - Drink more water'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
