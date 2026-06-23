import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MoodEntry, JournalEntry, Meditation } from '../types/database';
import {
  Brain,
  Plus,
  Play,
  Pause,
  Square,
  Book,
  Smile,
  TrendingUp,
  X,
  Save,
  Wind,
  Heart,
  Moon,
  Edit3,
  Calendar
} from 'lucide-react';

const moodOptions = [
  { value: 'happy', emoji: '😊', label: 'Happy', color: 'amber' },
  { value: 'calm', emoji: '😌', label: 'Calm', color: 'teal' },
  { value: 'neutral', emoji: '😐', label: 'Neutral', color: 'gray' },
  { value: 'anxious', emoji: '😰', label: 'Anxious', color: 'rose' },
  { value: 'sad', emoji: '😢', label: 'Sad', color: 'blue' },
  { value: 'angry', emoji: '😠', label: 'Angry', color: 'red' },
  { value: 'stressed', emoji: '😓', label: 'Stressed', color: 'orange' },
  { value: 'depressed', emoji: '😔', label: 'Depressed', color: 'purple' }
];

const meditationTypes = [
  { value: 'breathing', label: 'Breathing Exercise', duration: 5, icon: Wind },
  { value: 'guided', label: 'Guided Meditation', duration: 10, icon: Play },
  { value: 'silent', label: 'Silent Meditation', duration: 15, icon: Moon },
  { value: 'body_scan', label: 'Body Scan', duration: 10, icon: Heart },
  { value: 'yoga_nidra', label: 'Yoga Nidra', duration: 20, icon: Brain }
];

export function MentalWellness() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [loading, setLoading] = useState(true);

  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showMeditationModal, setShowMeditationModal] = useState(false);

  const [moodForm, setMoodForm] = useState({
    mood: 'neutral' as MoodEntry['mood'],
    mood_intensity: 5,
    energy_level: 5,
    sleep_quality: 5,
    notes: ''
  });

  const [journalForm, setJournalForm] = useState({
    title: '',
    content: '',
    entry_type: 'emotional' as JournalEntry['entry_type'],
    mood_tags: [] as string[]
  });

  const [meditationState, setMeditationState] = useState({
    active: false,
    type: '',
    duration: 5,
    timeLeft: 0,
    completed: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (meditationState.active && meditationState.timeLeft > 0) {
      interval = setInterval(() => {
        setMeditationState((prev) => {
          if (prev.timeLeft <= 1) {
            completeMeditation();
            return { ...prev, timeLeft: 0, active: false };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [meditationState.active]);

  const loadData = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: moods } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', weekAgo.toISOString())
      .order('logged_at', { ascending: false });

    if (moods) setMoodEntries(moods);

    const { data: journals } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('is_private', true)
      .order('entry_date', { ascending: false })
      .limit(10);

    if (journals) setJournalEntries(journals);

    const { data: meds } = await supabase
      .from('meditation_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(10);

    if (meds) setMeditations(meds);
    setLoading(false);
  };

  const saveMood = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    await supabase.from('mood_entries').insert({
      user_id: userId,
      mood: moodForm.mood,
      mood_intensity: moodForm.mood_intensity,
      energy_level: moodForm.energy_level,
      sleep_quality: moodForm.sleep_quality,
      notes: moodForm.notes || null
    });

    setShowMoodModal(false);
    loadData();
  };

  const saveJournal = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    await supabase.from('journal_entries').insert({
      user_id: userId,
      title: journalForm.title || null,
      content: journalForm.content,
      entry_type: journalForm.entry_type,
      mood_tags: journalForm.mood_tags
    });

    setShowJournalModal(false);
    loadData();
  };

  const startMeditation = async (type: string, duration: number) => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    const { data } = await supabase
      .from('meditation_sessions')
      .insert({
        user_id: userId,
        session_type: type as Meditation['session_type'],
        duration_minutes: duration,
        completed: false
      })
      .select()
      .single();

    if (data) {
      setMeditationState({
        active: true,
        type,
        duration,
        timeLeft: duration * 60,
        completed: data.id
      });
    }
    setShowMeditationModal(false);
  };

  const completeMeditation = async () => {
    if (meditationState.completed) {
      await supabase
        .from('meditation_sessions')
        .update({ completed: true })
        .eq('id', meditationState.completed);
      loadData();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMoodStats = () => {
    if (moodEntries.length === 0) return null;

    const avg = {
      mood_intensity: 0,
      energy: 0,
      sleep: 0
    };

    moodEntries.forEach((e) => {
      avg.mood_intensity += e.mood_intensity || 0;
      avg.energy += e.energy_level || 0;
      avg.sleep += e.sleep_quality || 0;
    });

    avg.mood_intensity = Math.round(avg.mood_intensity / moodEntries.length);
    avg.energy = Math.round(avg.energy / moodEntries.length);
    avg.sleep = Math.round(avg.sleep / moodEntries.length);

    return avg;
  };

  const stats = getMoodStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mental Wellness</h1>
          <p className="text-gray-600">Track your mental health and practice mindfulness</p>
        </div>
      </div>

      {/* Meditation Timer */}
      {meditationState.active && (
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-8 text-white mb-6">
          <div className="text-center">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl font-bold mb-2">
              {meditationTypes.find((t) => t.value === meditationState.type)?.label}
            </h2>
            <p className="text-6xl font-bold mb-6">{formatTime(meditationState.timeLeft)}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setMeditationState((prev) => ({ ...prev, active: false }))}
                className="px-6 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <Pause className="w-5 h-5 inline mr-2" />
                Pause
              </button>
              <button
                onClick={() => {
                  completeMeditation();
                  setMeditationState({ active: false, type: '', duration: 0, timeLeft: 0, completed: 0 });
                }}
                className="px-6 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <Square className="w-5 h-5 inline mr-2" />
                End
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => setShowMoodModal(true)}
          className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-teal-200 transition-all text-left"
        >
          <Smile className="w-8 h-8 text-teal-500 mb-3" />
          <p className="font-semibold text-gray-900">Log Mood</p>
          <p className="text-sm text-gray-500">How are you feeling?</p>
        </button>

        <button
          onClick={() => setShowMeditationModal(true)}
          className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-amber-200 transition-all text-left"
        >
          <Brain className="w-8 h-8 text-amber-500 mb-3" />
          <p className="font-semibold text-gray-900">Meditate</p>
          <p className="text-sm text-gray-500">Start a session</p>
        </button>

        <button
          onClick={() => setShowJournalModal(true)}
          className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-rose-200 transition-all text-left"
        >
          <Book className="w-8 h-8 text-rose-500 mb-3" />
          <p className="font-semibold text-gray-900">Journal</p>
          <p className="text-sm text-gray-500">Write your thoughts</p>
        </button>

        <div className="p-5 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl text-white text-left">
          <Wind className="w-8 h-8 mb-3 opacity-80" />
          <p className="font-semibold">Breathe</p>
          <p className="text-sm opacity-80">Quick 2-min exercise</p>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-100 text-center">
            <p className="text-sm text-gray-500 mb-1">Avg Mood</p>
            <p className="text-3xl font-bold text-teal-600">{stats.mood_intensity}/10</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 text-center">
            <p className="text-sm text-gray-500 mb-1">Avg Energy</p>
            <p className="text-3xl font-bold text-amber-600">{stats.energy}/10</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 text-center">
            <p className="text-sm text-gray-500 mb-1">Avg Sleep</p>
            <p className="text-3xl font-bold text-purple-600">{stats.sleep}/10</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Mood History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Mood History</h2>
            <span className="text-sm text-gray-500">Last 7 days</span>
          </div>

          {moodEntries.length > 0 ? (
            <div className="space-y-3">
              {moodEntries.slice(0, 7).map((entry) => {
                const mood = moodOptions.find((m) => m.value === entry.mood);
                return (
                  <div key={entry.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl">{mood?.emoji}</div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 capitalize">{entry.mood}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(entry.logged_at).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Intensity: {entry.mood_intensity}/10</p>
                      <p className="text-sm text-gray-500">Energy: {entry.energy_level}/10</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Smile className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No mood entries yet. Start tracking!</p>
            </div>
          )}
        </div>

        {/* Journal Entries */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Journal</h2>
            <button
              onClick={() => setShowJournalModal(true)}
              className="text-sm text-teal-500 hover:text-teal-600"
            >
              + New Entry
            </button>
          </div>

          {journalEntries.length > 0 ? (
            <div className="space-y-3">
              {journalEntries.map((entry) => (
                <div key={entry.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">{entry.title || 'Untitled'}</p>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      entry.entry_type === 'gratitude' ? 'bg-amber-100 text-amber-600' :
                      entry.entry_type === 'symptom' ? 'bg-rose-100 text-rose-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {entry.entry_type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{entry.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(entry.entry_date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Book className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No journal entries yet. Start writing!</p>
            </div>
          )}
        </div>
      </div>

      {/* Mood Modal */}
      {showMoodModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">How are you feeling?</h2>
              <button onClick={() => setShowMoodModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-6">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setMoodForm({ ...moodForm, mood: mood.value as MoodEntry['mood'] })}
                  className={`p-3 rounded-xl flex flex-col items-center transition-all ${
                    moodForm.mood === mood.value
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-2xl mb-1">{mood.emoji}</span>
                  <span className="text-xs">{mood.label}</span>
                </button>
              ))}
            </div>

            {[
              { key: 'mood_intensity', label: 'Mood Intensity' },
              { key: 'energy_level', label: 'Energy Level' },
              { key: 'sleep_quality', label: 'Sleep Quality' }
            ].map((item) => (
              <div key={item.key} className="mb-4">
                <div className="flex justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">{item.label}</label>
                  <span className="text-sm text-gray-500">
                    {(moodForm as Record<string, number>)[item.key]}/10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={(moodForm as Record<string, number>)[item.key]}
                  onChange={(e) => setMoodForm({
                    ...moodForm,
                    [item.key]: parseInt(e.target.value)
                  })}
                  className="w-full accent-teal-500"
                />
              </div>
            ))}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={moodForm.notes}
                onChange={(e) => setMoodForm({ ...moodForm, notes: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
                rows={3}
                placeholder="What's on your mind?"
              />
            </div>

            <button
              onClick={saveMood}
              className="w-full py-3 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Mood
            </button>
          </div>
        </div>
      )}

      {/* Meditation Modal */}
      {showMeditationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Choose Meditation</h2>
              <button onClick={() => setShowMeditationModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {meditationTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => startMeditation(type.value, type.duration)}
                  className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-teal-50 transition-all"
                >
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                    <type.icon className="w-6 h-6 text-teal-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">{type.label}</p>
                    <p className="text-sm text-gray-500">{type.duration} minutes</p>
                  </div>
                  <Play className="w-5 h-5 text-teal-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Journal Modal */}
      {showJournalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">New Journal Entry</h2>
              <button onClick={() => setShowJournalModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
                <input
                  type="text"
                  value={journalForm.title}
                  onChange={(e) => setJournalForm({ ...journalForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none"
                  placeholder="Give your entry a title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Entry Type</label>
                <div className="flex gap-3">
                  {(['emotional', 'gratitude', 'symptom', 'general'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setJournalForm({ ...journalForm, entry_type: type })}
                      className={`flex-1 py-2 rounded-lg capitalize font-medium transition-all text-sm ${
                        journalForm.entry_type === type
                          ? 'bg-rose-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={journalForm.content}
                  onChange={(e) => setJournalForm({ ...journalForm, content: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none resize-none"
                  rows={6}
                  placeholder="Write your thoughts..."
                />
              </div>
            </div>

            <button
              onClick={saveJournal}
              disabled={!journalForm.content}
              className="w-full mt-4 py-3 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save Entry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
