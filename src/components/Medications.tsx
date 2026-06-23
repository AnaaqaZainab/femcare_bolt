import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Medication, MedicationLog } from '../types/database';
import {
  Pill,
  Plus,
  Clock,
  Calendar,
  Check,
  X,
  AlertTriangle,
  Bell,
  Save,
  Trash2,
  Edit3,
  CheckCircle,
  XCircle
} from 'lucide-react';

export function Medications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todayLogs, setTodayLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);

  const [form, setForm] = useState({
    name: '',
    dosage: '',
    frequency: 'daily',
    times: ['08:00'],
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    prescribing_doctor: '',
    instructions: '',
    refill_reminder_date: ''
  });

  const [timeInputs, setTimeInputs] = useState<string[]>(['08:00']);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    const { data: meds } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (meds) setMedications(meds);

    // Get today's logs
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: logs } = await supabase
      .from('medication_logs')
      .select('*, medications!inner(user_id)')
      .eq('medications.user_id', userId)
      .gte('scheduled_time', today)
      .lt('scheduled_time', tomorrow);

    if (logs) setTodayLogs(logs);
    setLoading(false);
  };

  const addTimeInput = () => {
    setTimeInputs([...timeInputs, '12:00']);
    setForm({ ...form, times: [...form.times, '12:00'] });
  };

  const removeTimeInput = (index: number) => {
    setTimeInputs(timeInputs.filter((_, i) => i !== index));
    setForm({ ...form, times: form.times.filter((_, i) => i !== index) });
  };

  const updateTime = (index: number, value: string) => {
    const newTimes = [...timeInputs];
    newTimes[index] = value;
    setTimeInputs(newTimes);
    setForm({ ...form, times: newTimes });
  };

  const saveMedication = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    const { error } = await supabase.from('medications').insert({
      user_id: userId,
      name: form.name,
      dosage: form.dosage,
      frequency: form.frequency,
      times: form.times,
      start_date: form.start_date,
      end_date: form.end_date || null,
      prescribing_doctor: form.prescribing_doctor || null,
      instructions: form.instructions || null,
      refill_reminder_date: form.refill_reminder_date || null
    });

    if (!error) {
      setShowAddModal(false);
      setForm({
        name: '',
        dosage: '',
        frequency: 'daily',
        times: ['08:00'],
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        prescribing_doctor: '',
        instructions: '',
        refill_reminder_date: ''
      });
      setTimeInputs(['08:00']);
      loadData();
    }
  };

  const toggleMedicationTaken = async (medicationId: string, taken: boolean) => {
    const now = new Date();
    const scheduledTime = new Date();
    const [hours, minutes] = (medications.find(m => m.id === medicationId)?.times[0] || '08:00').split(':');
    scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const { data: existingLog } = await supabase
      .from('medication_logs')
      .select('*')
      .eq('medication_id', medicationId)
      .gte('scheduled_time', new Date().toISOString().split('T')[0])
      .maybeSingle();

    if (existingLog) {
      await supabase
        .from('medication_logs')
        .update({
          taken_at: taken ? now.toISOString() : null,
          skipped: !taken
        })
        .eq('id', existingLog.id);
    } else {
      await supabase.from('medication_logs').insert({
        medication_id: medicationId,
        scheduled_time: scheduledTime.toISOString(),
        taken_at: taken ? now.toISOString() : null,
        skipped: !taken
      });
    }

    loadData();
  };

  const deleteMedication = async (id: string) => {
    await supabase.from('medications').delete().eq('id', id);
    loadData();
  };

  const getAdherenceRate = () => {
    if (todayLogs.length === 0) return 0;
    const taken = todayLogs.filter(log => log.taken_at).length;
    return Math.round((taken / todayLogs.length) * 100);
  };

  const activeMeds = medications.filter(m => m.is_active);
  const inactiveMeds = medications.filter(m => !m.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medications</h1>
          <p className="text-gray-600">Track your medications and set reminders</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Medication
        </button>
      </div>

      {/* Adherence Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-white">
          <Pill className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-sm opacity-90">Active Medications</p>
          <p className="text-3xl font-bold">{activeMeds.length}</p>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-5 text-white">
          <CheckCircle className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-sm opacity-90">Today's Adherence</p>
          <p className="text-3xl font-bold">{getAdherenceRate()}%</p>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-5 text-white">
          <Clock className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-sm opacity-90">Upcoming</p>
          <p className="text-3xl font-bold">
            {todayLogs.filter(l => !l.taken_at && !l.skipped).length}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white">
          <Bell className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-sm opacity-90">Missed Today</p>
          <p className="text-3xl font-bold">
            {todayLogs.filter(l => l.skipped && !l.taken_at).length}
          </p>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Today's Schedule</h2>

        {activeMeds.length > 0 ? (
          <div className="space-y-3">
            {activeMeds.map((med) => {
              const logsForMed = todayLogs.filter(l => l.medication_id === med.id);
              const isTaken = logsForMed.some(l => l.taken_at);
              const isSkipped = logsForMed.some(l => l.skipped);

              return (
                <div key={med.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isTaken ? 'bg-teal-100' : isSkipped ? 'bg-red-100' : 'bg-amber-100'
                  }`}>
                    <Pill className={`w-6 h-6 ${
                      isTaken ? 'text-teal-600' : isSkipped ? 'text-red-600' : 'text-amber-600'
                    }`} />
                  </div>

                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{med.name}</p>
                    <p className="text-sm text-gray-500">
                      {med.dosage} • {med.frequency}
                      {med.times.length > 0 && ` • ${med.times.join(', ')}`}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {isTaken ? (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-teal-100 text-teal-700 rounded-lg text-sm">
                        <Check className="w-4 h-4" />
                        Taken
                      </span>
                    ) : isSkipped ? (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm">
                        <X className="w-4 h-4" />
                        Skipped
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleMedicationTaken(med.id, true)}
                          className="p-2 bg-teal-100 text-teal-600 rounded-lg hover:bg-teal-200 transition-colors"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => toggleMedicationTaken(med.id, false)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No medications added yet</p>
          </div>
        )}
      </div>

      {/* All Medications */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">All Medications</h2>

        {medications.length > 0 ? (
          <div className="space-y-3">
            {medications.map((med) => (
              <div key={med.id} className={`p-4 rounded-xl ${med.is_active ? 'bg-gray-50' : 'bg-gray-100 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      med.is_active ? 'bg-amber-100' : 'bg-gray-200'
                    }`}>
                      <Pill className={`w-5 h-5 ${med.is_active ? 'text-amber-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{med.name}</p>
                      <p className="text-sm text-gray-500">
                        {med.dosage} • {med.frequency} • {med.times.join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {med.is_active ? (
                      <span className="px-2 py-1 bg-teal-100 text-teal-600 rounded text-xs">Active</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-200 text-gray-500 rounded text-xs">Inactive</span>
                    )}
                    <button
                      onClick={() => deleteMedication(med.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {med.instructions && (
                  <p className="mt-2 text-sm text-gray-600 bg-white p-2 rounded">
                    {med.instructions}
                  </p>
                )}

                {med.refill_reminder_date && new Date(med.refill_reminder_date) <= new Date() && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Refill reminder!</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No medications added yet</p>
          </div>
        )}
      </div>

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Add Medication</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                  placeholder="e.g., Metformin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                <input
                  type="text"
                  value={form.dosage}
                  onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                  placeholder="e.g., 500mg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                <div className="flex gap-3">
                  {['daily', 'twice daily', 'weekly', 'as needed'].map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setForm({ ...form, frequency: freq })}
                      className={`flex-1 py-2 rounded-lg capitalize text-sm font-medium transition-all ${
                        form.frequency === freq
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Reminder Times</label>
                  <button
                    onClick={addTimeInput}
                    className="text-sm text-amber-500 hover:text-amber-600"
                  >
                    + Add Time
                  </button>
                </div>
                <div className="space-y-2">
                  {timeInputs.map((time, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => updateTime(index, e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                      />
                      {timeInputs.length > 1 && (
                        <button
                          onClick={() => removeTimeInput(index)}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date (optional)</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prescribing Doctor (optional)</label>
                <input
                  type="text"
                  value={form.prescribing_doctor}
                  onChange={(e) => setForm({ ...form, prescribing_doctor: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                  placeholder="Dr. Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Refill Reminder Date</label>
                <input
                  type="date"
                  value={form.refill_reminder_date}
                  onChange={(e) => setForm({ ...form, refill_reminder_date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                <textarea
                  value={form.instructions}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none resize-none"
                  rows={3}
                  placeholder="Take with food, etc."
                />
              </div>
            </div>

            <button
              onClick={saveMedication}
              disabled={!form.name || !form.dosage}
              className="w-full mt-6 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save Medication
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
