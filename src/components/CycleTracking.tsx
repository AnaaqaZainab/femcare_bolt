import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PeriodCycle, PcodSymptom } from '../types/database';
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Droplet,
  AlertCircle,
  TrendingDown,
  Activity,
  Moon,
  Zap,
  Heart,
  X,
  Save
} from 'lucide-react';

const symptoms = [
  { id: 'acne', label: 'Acne', icon: AlertCircle, color: 'rose' },
  { id: 'hair_fall', label: 'Hair Fall', icon: TrendingDown, color: 'amber' },
  { id: 'mood_swings', label: 'Mood Swings', icon: Moon, color: 'purple' },
  { id: 'fatigue', label: 'Fatigue', icon: Zap, color: 'teal' },
  { id: 'cramping', label: 'Cramping', icon: Activity, color: 'red' },
  { id: 'bloating', label: 'Bloating', icon: Heart, color: 'orange' }
];

export function CycleTracking() {
  const [cycles, setCycles] = useState<PeriodCycle[]>([]);
  const [symptoms, setSymptoms] = useState<PcodSymptom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [periodForm, setPeriodForm] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    flow_intensity: 'medium' as 'light' | 'medium' | 'heavy',
    notes: ''
  });

  const [symptomForm, setSymptomForm] = useState({
    logged_date: new Date().toISOString().split('T')[0],
    acne_severity: 0,
    hair_fall_severity: 0,
    weight_change: '',
    mood_swings_severity: 0,
    fatigue_level: 0,
    irregular_periods: false,
    cramping_severity: 0,
    bloating_severity: 0,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    const { data: cyclesData } = await supabase
      .from('period_cycles')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    if (cyclesData) setCycles(cyclesData);

    const { data: symptomsData } = await supabase
      .from('pcod_symptoms')
      .select('*')
      .eq('user_id', userId)
      .order('logged_date', { ascending: false })
      .limit(30);

    if (symptomsData) setSymptoms(symptomsData);
    setLoading(false);
  };

  const handleSavePeriod = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    const { error } = await supabase.from('period_cycles').insert({
      user_id: userId,
      start_date: periodForm.start_date,
      end_date: periodForm.end_date || null,
      flow_intensity: periodForm.flow_intensity,
      notes: periodForm.notes || null
    });

    if (!error) {
      setShowPeriodModal(false);
      loadData();
    }
  };

  const handleSaveSymptom = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    const { error } = await supabase.from('pcod_symptoms').insert({
      user_id: userId,
      logged_date: symptomForm.logged_date,
      acne_severity: symptomForm.acne_severity || null,
      hair_fall_severity: symptomForm.hair_fall_severity || null,
      weight_change: symptomForm.weight_change ? parseFloat(symptomForm.weight_change) : null,
      mood_swings_severity: symptomForm.mood_swings_severity || null,
      fatigue_level: symptomForm.fatigue_level || null,
      irregular_periods: symptomForm.irregular_periods,
      cramping_severity: symptomForm.cramping_severity || null,
      bloating_severity: symptomForm.bloating_severity || null,
      notes: symptomForm.notes || null
    });

    if (!error) {
      setShowSymptomModal(false);
      loadData();
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isPeriodDay = (date: Date) => {
    if (!cycles.length) return false;

    const dateStr = date.toISOString().split('T')[0];
    for (const cycle of cycles) {
      const start = new Date(cycle.start_date);
      const end = cycle.end_date ? new Date(cycle.end_date) : new Date(start.getTime() + 5 * 24 * 60 * 60 * 1000);

      if (date >= start && date <= end) {
        return true;
      }
    }
    return false;
  };

  const getCyclePhase = (date: Date): string | null => {
    if (!cycles.length) return null;

    const latestCycle = cycles[0];
    const startDate = new Date(latestCycle.start_date);
    const daysSinceStart = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceStart < 0) return null;
    if (daysSinceStart < 5) return 'Menstrual';
    if (daysSinceStart < 14) return 'Follicular';
    if (daysSinceStart < 17) return 'Ovulation';
    return 'Luteal';
  };

  const getPhaseColor = (phase: string | null) => {
    switch (phase) {
      case 'Menstrual': return 'bg-rose-500';
      case 'Follicular': return 'bg-teal-400';
      case 'Ovulation': return 'bg-amber-400';
      case 'Luteal': return 'bg-purple-400';
      default: return '';
    }
  };

  const days = getDaysInMonth(currentMonth);

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
          <h1 className="text-2xl font-bold text-gray-900">Cycle Tracking</h1>
          <p className="text-gray-600">Track your period and PCOD symptoms</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPeriodModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Log Period
          </button>
          <button
            onClick={() => setShowSymptomModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Log Symptom
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getMonth() - 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getMonth() + 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="aspect-square" />;

            const isToday = date.toDateString() === new Date().toDateString();
            const isPeriod = isPeriodDay(date);
            const phase = getCyclePhase(date);

            return (
              <button
                key={date.toISOString()}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all ${
                  isPeriod
                    ? 'bg-rose-500 text-white'
                    : phase
                    ? `${getPhaseColor(phase)} text-white`
                    : isToday
                    ? 'bg-gray-100 text-gray-900'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="text-sm font-medium">{date.getDate()}</span>
                {isPeriod && <Droplet className="w-3 h-3 absolute bottom-1 opacity-80" />}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-rose-500" />
            <span className="text-sm text-gray-600">Menstrual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-teal-400" />
            <span className="text-sm text-gray-600">Follicular</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-400" />
            <span className="text-sm text-gray-600">Ovulation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-400" />
            <span className="text-sm text-gray-600">Luteal</span>
          </div>
        </div>
      </div>

      {/* Cycle History */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Periods</h2>
          {cycles.length > 0 ? (
            <div className="space-y-3">
              {cycles.slice(0, 5).map((cycle) => (
                <div key={cycle.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(cycle.start_date).toLocaleDateString()}
                      {cycle.end_date && ` - ${new Date(cycle.end_date).toLocaleDateString()}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {cycle.cycle_length ? `${cycle.cycle_length} day cycle` : 'Length not set'}
                      {' • '}
                      <span className="capitalize">{cycle.flow_intensity || 'Flow not logged'}</span>
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm ${
                    cycle.flow_intensity === 'heavy' ? 'bg-rose-100 text-rose-600' :
                    cycle.flow_intensity === 'medium' ? 'bg-amber-100 text-amber-600' :
                    'bg-teal-100 text-teal-600'
                  }`}>
                    {cycle.flow_intensity || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No periods logged yet</p>
            </div>
          )}
        </div>

        {/* Recent Symptoms */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">PCOD Symptoms</h2>
          {symptoms.length > 0 ? (
            <div className="space-y-3">
              {symptoms.slice(0, 5).map((symptom) => (
                <div key={symptom.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">
                      {new Date(symptom.logged_date).toLocaleDateString()}
                    </p>
                    {symptom.irregular_periods && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded text-xs">
                        Irregular Period
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {symptom.acne_severity ? (
                      <div className="text-gray-600">Acne: {symptom.acne_severity}/10</div>
                    ) : null}
                    {symptom.hair_fall_severity ? (
                      <div className="text-gray-600">Hair: {symptom.hair_fall_severity}/10</div>
                    ) : null}
                    {symptom.mood_swings_severity ? (
                      <div className="text-gray-600">Mood: {symptom.mood_swings_severity}/10</div>
                    ) : null}
                    {symptom.fatigue_level ? (
                      <div className="text-gray-600">Fatigue: {symptom.fatigue_level}/10</div>
                    ) : null}
                    {symptom.cramping_severity ? (
                      <div className="text-gray-600">Cramps: {symptom.cramping_severity}/10</div>
                    ) : null}
                    {symptom.bloating_severity ? (
                      <div className="text-gray-600">Bloating: {symptom.bloating_severity}/10</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No symptoms logged yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Log Period Modal */}
      {showPeriodModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Log Period</h2>
              <button onClick={() => setShowPeriodModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={periodForm.start_date}
                  onChange={(e) => setPeriodForm({ ...periodForm, start_date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date (optional)</label>
                <input
                  type="date"
                  value={periodForm.end_date}
                  onChange={(e) => setPeriodForm({ ...periodForm, end_date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Flow Intensity</label>
                <div className="flex gap-3">
                  {(['light', 'medium', 'heavy'] as const).map((intensity) => (
                    <button
                      key={intensity}
                      onClick={() => setPeriodForm({ ...periodForm, flow_intensity: intensity })}
                      className={`flex-1 py-2 rounded-lg capitalize font-medium transition-all ${
                        periodForm.flow_intensity === intensity
                          ? 'bg-rose-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {intensity}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={periodForm.notes}
                  onChange={(e) => setPeriodForm({ ...periodForm, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none resize-none"
                  rows={3}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <button
              onClick={handleSavePeriod}
              className="w-full mt-6 py-3 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Period
            </button>
          </div>
        </div>
      )}

      {/* Log Symptom Modal */}
      {showSymptomModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Log PCOD Symptoms</h2>
              <button onClick={() => setShowSymptomModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={symptomForm.logged_date}
                  onChange={(e) => setSymptomForm({ ...symptomForm, logged_date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                />
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={symptomForm.irregular_periods}
                    onChange={(e) => setSymptomForm({ ...symptomForm, irregular_periods: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Experiencing irregular periods</span>
                </label>
              </div>

              {/* Severity Sliders */}
              {[
                { key: 'acne_severity', label: 'Acne', max: 10 },
                { key: 'hair_fall_severity', label: 'Hair Fall', max: 10 },
                { key: 'mood_swings_severity', label: 'Mood Swings', max: 10 },
                { key: 'fatigue_level', label: 'Fatigue', max: 10 },
                { key: 'cramping_severity', label: 'Cramping', max: 10 },
                { key: 'bloating_severity', label: 'Bloating', max: 10 }
              ].map((item) => (
                <div key={item.key}>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">{item.label}</label>
                    <span className="text-sm text-gray-500">
                      {(symptomForm as Record<string, number | string | boolean>)[item.key] as number}/10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={(symptomForm as Record<string, number | string | boolean>)[item.key] as number}
                    onChange={(e) => setSymptomForm({
                      ...symptomForm,
                      [item.key]: parseInt(e.target.value)
                    })}
                    className="w-full accent-teal-500"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight Change (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={symptomForm.weight_change}
                  onChange={(e) => setSymptomForm({ ...symptomForm, weight_change: e.target.value })}
                  placeholder="e.g., +0.5 or -0.3"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={symptomForm.notes}
                  onChange={(e) => setSymptomForm({ ...symptomForm, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
                  rows={3}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <button
              onClick={handleSaveSymptom}
              className="w-full mt-6 py-3 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Symptoms
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
