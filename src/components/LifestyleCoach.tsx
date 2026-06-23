import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DailyHabit, DietPlan, WorkoutRoutine } from '../types/database';
import {
  Sparkles,
  Droplets,
  Moon,
  Activity,
  Apple,
  Dumbbell,
  Plus,
  ChevronRight,
  Target,
  TrendingUp,
  Check,
  X,
  Save
} from 'lucide-react';

const dietRecommendations = [
  {
    category: 'Breakfast',
    foods: ['Oatmeal with berries', 'Greek yogurt with nuts', 'Whole grain toast with avocado'],
    benefits: 'High fiber, stabilizes blood sugar'
  },
  {
    category: 'Lunch',
    foods: ['Quinoa salad with vegetables', 'Grilled chicken with leafy greens', 'Lentil soup'],
    benefits: 'Protein-rich, anti-inflammatory'
  },
  {
    category: 'Dinner',
    foods: ['Baked salmon with steamed vegetables', 'Stir-fried tofu with brown rice', 'Grilled lean meat with salad'],
    benefits: 'Omega-3 fatty acids, fiber-rich'
  },
  {
    category: 'Snacks',
    foods: ['Mixed nuts', 'Apple slices with almond butter', 'Carrot sticks with hummus'],
    benefits: 'Protein, healthy fats'
  }
];

const workoutSuggestions = [
  {
    type: 'yoga' as const,
    title: 'PCOD-Friendly Yoga',
    duration: 30,
    description: 'Gentle poses to balance hormones and reduce stress',
    exercises: ['Cat-Cow stretch', 'Butterfly pose', 'Cobra pose', 'Child pose', 'Legs up the wall']
  },
  {
    type: 'cardio' as const,
    title: 'Low-Impact Cardio',
    duration: 20,
    description: 'Boost metabolism without over-stressing the body',
    exercises: ['Brisk walking', 'Swimming', 'Cycling', 'Elliptical', 'Dancing']
  },
  {
    type: 'strength' as const,
    title: 'Light Strength Training',
    duration: 25,
    description: 'Build muscle to improve insulin sensitivity',
    exercises: ['Bodyweight squats', 'Lunges', 'Planks', 'Modified push-ups', 'Resistance band exercises']
  }
];

const wellnessTips = [
  'Drink at least 8 glasses of water today',
  'Take a 10-minute walk after meals',
  'Practice 5 minutes of deep breathing',
  'Get 7-8 hours of quality sleep',
  'Avoid processed sugars and refined carbs',
  'Include protein in every meal',
  'Practice stress-reducing activities',
  'Take your supplements regularly'
];

export function LifestyleCoach() {
  const [todayHabit, setTodayHabit] = useState<DailyHabit | null>(null);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [recommendationType, setRecommendationType] = useState<'diet' | 'workout' | 'habits'>('habits');

  const [habitForm, setHabitForm] = useState({
    water_intake_glasses: 0,
    sleep_hours: '',
    sleep_quality: 5,
    exercise_minutes: '',
    steps_count: '',
    meditation_minutes: '',
    supplements_taken: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    const today = new Date().toISOString().split('T')[0];

    const { data: habit } = await supabase
      .from('daily_habits')
      .select('*')
      .eq('user_id', userId)
      .eq('logged_date', today)
      .maybeSingle();

    if (habit) setTodayHabit(habit);

    const { data: diets } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_date', { ascending: false });

    if (diets) setDietPlans(diets);

    const { data: workoutData } = await supabase
      .from('workout_routines')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (workoutData) setWorkouts(workoutData);
    setLoading(false);
  };

  const saveHabit = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    const today = new Date().toISOString().split('T')[0];

    if (todayHabit) {
      const { data } = await supabase
        .from('daily_habits')
        .update({
          water_intake_glasses: habitForm.water_intake_glasses,
          sleep_hours: habitForm.sleep_hours ? parseFloat(habitForm.sleep_hours) : null,
          sleep_quality: habitForm.sleep_quality,
          exercise_minutes: habitForm.exercise_minutes ? parseInt(habitForm.exercise_minutes) : 0,
          steps_count: habitForm.steps_count ? parseInt(habitForm.steps_count) : 0,
          meditation_minutes: habitForm.meditation_minutes ? parseInt(habitForm.meditation_minutes) : 0,
          supplements_taken: habitForm.supplements_taken
        })
        .eq('id', todayHabit.id)
        .select()
        .single();
      if (data) setTodayHabit(data);
    } else {
      const { data } = await supabase
        .from('daily_habits')
        .insert({
          user_id: userId,
          logged_date: today,
          water_intake_glasses: habitForm.water_intake_glasses,
          sleep_hours: habitForm.sleep_hours ? parseFloat(habitForm.sleep_hours) : null,
          sleep_quality: habitForm.sleep_quality,
          exercise_minutes: habitForm.exercise_minutes ? parseInt(habitForm.exercise_minutes) : 0,
          steps_count: habitForm.steps_count ? parseInt(habitForm.steps_count) : 0,
          meditation_minutes: habitForm.meditation_minutes ? parseInt(habitForm.meditation_minutes) : 0,
          supplements_taken: habitForm.supplements_taken
        })
        .select()
        .single();
      if (data) setTodayHabit(data);
    }

    setShowHabitModal(false);
  };

  const getCompletionScore = () => {
    if (!todayHabit) return 0;
    let score = 0;
    if (todayHabit.water_intake_glasses >= 8) score += 20;
    if (todayHabit.sleep_hours && todayHabit.sleep_hours >= 7) score += 20;
    if (todayHabit.exercise_minutes >= 30) score += 20;
    if (todayHabit.supplements_taken) score += 20;
    if (todayHabit.meditation_minutes >= 5) score += 20;
    return score;
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Lifestyle Coach</h1>
          <p className="text-gray-600">Personalized recommendations for your wellness journey</p>
        </div>
        <button
          onClick={() => setShowHabitModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Log Habits
        </button>
      </div>

      {/* Today's Score */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Today's Wellness Score</p>
            <p className="text-5xl font-bold mt-1">{getCompletionScore()}%</p>
            <p className="text-sm opacity-80 mt-2">
              {getCompletionScore() >= 80 ? 'Excellent progress!' :
               getCompletionScore() >= 50 ? 'Keep going, you\'re doing well!' :
               'Let\'s work on improving your score'}
            </p>
          </div>
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-12 h-12" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Droplets className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Water</p>
              <p className="font-bold text-gray-900">{todayHabit?.water_intake_glasses || 0}/8</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Moon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sleep</p>
              <p className="font-bold text-gray-900">{todayHabit?.sleep_hours || '-'} hrs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Exercise</p>
              <p className="font-bold text-gray-900">{todayHabit?.exercise_minutes || 0} min</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Supplements</p>
              <p className="font-bold text-gray-900">{todayHabit?.supplements_taken ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { id: 'habits', label: 'Daily Goals', icon: Target },
          { id: 'diet', label: 'Diet Plans', icon: Apple },
          { id: 'workout', label: 'Workouts', icon: Dumbbell }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setRecommendationType(tab.id as typeof recommendationType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              recommendationType === tab.id
                ? 'bg-amber-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Based on Tab */}
      {recommendationType === 'habits' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Today's Wellness Tips</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {wellnessTips.map((tip, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl hover:bg-amber-50 transition-colors"
              >
                <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{index + 1}</span>
                </div>
                <p className="text-sm text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendationType === 'diet' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">PCOD-Friendly Diet Recommendations</h2>
            <button className="text-sm text-amber-500 hover:text-amber-600 flex items-center gap-1">
              Generate New Plan <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {dietRecommendations.map((meal, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{meal.category}</h3>
                  <span className="text-xs text-gray-500">{meal.foods.length} options</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {meal.foods.map((food, i) => (
                    <span key={i} className="px-2 py-1 bg-white rounded text-sm text-gray-600">
                      {food}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-teal-600">{meal.benefits}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendationType === 'workout' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Recommended Workouts</h2>

          <div className="space-y-4">
            {workoutSuggestions.map((workout, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      workout.type === 'yoga' ? 'bg-purple-100' :
                      workout.type === 'cardio' ? 'bg-rose-100' :
                      'bg-amber-100'
                    }`}>
                      <Activity className={`w-5 h-5 ${
                        workout.type === 'yoga' ? 'text-purple-600' :
                        workout.type === 'cardio' ? 'text-rose-600' :
                        'text-amber-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{workout.title}</h3>
                      <p className="text-sm text-gray-500">{workout.duration} minutes</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs capitalize ${
                    workout.type === 'yoga' ? 'bg-purple-100 text-purple-600' :
                    workout.type === 'cardio' ? 'bg-rose-100 text-rose-600' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    {workout.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{workout.description}</p>
                <div className="flex flex-wrap gap-2">
                  {workout.exercises.map((exercise, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white rounded text-xs text-gray-500">
                      {exercise}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Habit Modal */}
      {showHabitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Log Today's Habits</h2>
              <button onClick={() => setShowHabitModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Water Intake: {habitForm.water_intake_glasses}/8 glasses
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((glass) => (
                    <button
                      key={glass}
                      onClick={() => setHabitForm({ ...habitForm, water_intake_glasses: glass })}
                      className={`flex-1 aspect-square rounded-lg flex items-center justify-center transition-all ${
                        glass <= habitForm.water_intake_glasses
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-100'
                      }`}
                    >
                      <Droplets className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sleep Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={habitForm.sleep_hours}
                    onChange={(e) => setHabitForm({ ...habitForm, sleep_hours: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                    placeholder="7.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sleep Quality</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={habitForm.sleep_quality}
                      onChange={(e) => setHabitForm({ ...habitForm, sleep_quality: parseInt(e.target.value) })}
                      className="flex-1 accent-amber-500"
                    />
                    <span className="text-sm text-gray-500 w-8">{habitForm.sleep_quality}/10</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Minutes</label>
                  <input
                    type="number"
                    value={habitForm.exercise_minutes}
                    onChange={(e) => setHabitForm({ ...habitForm, exercise_minutes: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Steps Count</label>
                  <input
                    type="number"
                    value={habitForm.steps_count}
                    onChange={(e) => setHabitForm({ ...habitForm, steps_count: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                    placeholder="5000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meditation Minutes</label>
                <input
                  type="number"
                  value={habitForm.meditation_minutes}
                  onChange={(e) => setHabitForm({ ...habitForm, meditation_minutes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                  placeholder="10"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={habitForm.supplements_taken}
                  onChange={(e) => setHabitForm({ ...habitForm, supplements_taken: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-600">Took supplements today</span>
              </label>
            </div>

            <button
              onClick={saveHabit}
              className="w-full mt-6 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Habits
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
