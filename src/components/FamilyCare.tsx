import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FamilyConnection, EmergencyContact } from '../types/database';
import {
  Users,
  Plus,
  Mail,
  Phone,
  Shield,
  Heart,
  X,
  Save,
  Trash2,
  UserPlus,
  AlertCircle
} from 'lucide-react';

export function FamilyCare() {
  const [familyConnections, setFamilyConnections] = useState<FamilyConnection[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const [familyForm, setFamilyForm] = useState({
    family_member_email: '',
    family_member_name: '',
    relationship: '',
    permission_level: 'view' as 'view' | 'edit' | 'emergency',
    can_view_medications: false,
    can_view_cycles: false,
    can_view_mood: false,
    receive_emergency_alerts: true,
    receive_medication_alerts: false
  });

  const [emergencyForm, setEmergencyForm] = useState({
    name: '',
    relationship: '',
    phone_number: '',
    is_primary: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    const { data: family } = await supabase
      .from('family_connections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (family) setFamilyConnections(family);

    const { data: emergency } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('priority_order', { ascending: true });

    if (emergency) setEmergencyContacts(emergency);
    setLoading(false);
  };

  const saveFamilyConnection = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    await supabase.from('family_connections').insert({
      user_id: userId,
      ...familyForm
    });

    setShowFamilyModal(false);
    setFamilyForm({
      family_member_email: '',
      family_member_name: '',
      relationship: '',
      permission_level: 'view',
      can_view_medications: false,
      can_view_cycles: false,
      can_view_mood: false,
      receive_emergency_alerts: true,
      receive_medication_alerts: false
    });
    loadData();
  };

  const saveEmergencyContact = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    // If setting as primary, unset other primary contacts
    if (emergencyForm.is_primary) {
      await supabase
        .from('emergency_contacts')
        .update({ is_primary: false })
        .eq('user_id', userId);
    }

    await supabase.from('emergency_contacts').insert({
      user_id: userId,
      ...emergencyForm,
      priority_order: emergencyContacts.length + 1
    });

    setShowEmergencyModal(false);
    setEmergencyForm({
      name: '',
      relationship: '',
      phone_number: '',
      is_primary: false
    });
    loadData();
  };

  const deleteFamilyConnection = async (id: string) => {
    await supabase.from('family_connections').delete().eq('id', id);
    loadData();
  };

  const deleteEmergencyContact = async (id: string) => {
    await supabase.from('emergency_contacts').delete().eq('id', id);
    loadData();
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Family Care Connect</h1>
          <p className="text-gray-600">Manage trusted family members and emergency contacts</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Family Connections */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-rose-500" />
              <h2 className="font-semibold text-gray-900">Family & Caregivers</h2>
            </div>
            <button
              onClick={() => setShowFamilyModal(true)}
              className="text-sm text-rose-500 hover:text-rose-600 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Member
            </button>
          </div>

          {familyConnections.length > 0 ? (
            <div className="space-y-3">
              {familyConnections.map((connection) => (
                <div key={connection.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {connection.family_member_name || connection.family_member_email}
                      </p>
                      <p className="text-sm text-gray-500">{connection.relationship}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        connection.permission_level === 'emergency' ? 'bg-red-100 text-red-600' :
                        connection.permission_level === 'edit' ? 'bg-amber-100 text-amber-600' :
                        'bg-teal-100 text-teal-600'
                      }`}>
                        {connection.permission_level}
                      </span>
                      <button
                        onClick={() => deleteFamilyConnection(connection.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="w-4 h-4" />
                    <span>{connection.family_member_email}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {connection.can_view_medications && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded text-xs">
                        Medications
                      </span>
                    )}
                    {connection.can_view_cycles && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded text-xs">
                        Cycles
                      </span>
                    )}
                    {connection.can_view_mood && (
                      <span className="px-2 py-0.5 bg-teal-100 text-teal-600 rounded text-xs">
                        Mood
                      </span>
                    )}
                    {connection.receive_emergency_alerts && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs">
                        Emergency Alerts
                      </span>
                    )}
                  </div>
                  {!connection.invite_accepted && (
                    <div className="mt-2 flex items-center gap-1 text-sm text-amber-600">
                      <AlertCircle className="w-4 h-4" />
                      <span>Invite pending</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No family members added yet</p>
              <p className="text-sm text-gray-400 mt-1">Invite trusted caregivers to monitor your health</p>
            </div>
          )}
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-500" />
              <h2 className="font-semibold text-gray-900">Emergency Contacts</h2>
            </div>
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Contact
            </button>
          </div>

          {emergencyContacts.length > 0 ? (
            <div className="space-y-3">
              {emergencyContacts.map((contact, index) => (
                <div key={contact.id} className={`p-4 rounded-xl ${
                  contact.is_primary ? 'bg-red-50 border-2 border-red-200' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        contact.is_primary ? 'bg-red-200' : 'bg-gray-200'
                      }`}>
                        <Heart className={`w-5 h-5 ${contact.is_primary ? 'text-red-600' : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{contact.name}</p>
                          {contact.is_primary && (
                            <span className="px-2 py-0.5 bg-red-500 text-white rounded text-xs">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{contact.relationship}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteEmergencyContact(contact.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{contact.phone_number}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No emergency contacts added yet</p>
              <p className="text-sm text-gray-400 mt-1">These contacts will be notified in emergencies</p>
            </div>
          )}
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800">Privacy Control</p>
            <p className="text-sm text-amber-700 mt-1">
              You have full control over what health information is shared with family members.
              They will only see data you've explicitly allowed access to.
            </p>
          </div>
        </div>
      </div>

      {/* Add Family Modal */}
      {showFamilyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Add Family Member</h2>
              <button onClick={() => setShowFamilyModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={familyForm.family_member_email}
                  onChange={(e) => setFamilyForm({ ...familyForm, family_member_email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none"
                  placeholder="family@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={familyForm.family_member_name}
                  onChange={(e) => setFamilyForm({ ...familyForm, family_member_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none"
                  placeholder="Their name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                <select
                  value={familyForm.relationship}
                  onChange={(e) => setFamilyForm({ ...familyForm, relationship: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none"
                >
                  <option value="">Select relationship</option>
                  <option value="parent">Parent</option>
                  <option value="spouse">Spouse</option>
                  <option value="sibling">Sibling</option>
                  <option value="child">Child</option>
                  <option value="friend">Friend</option>
                  <option value="caregiver">Caregiver</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permission Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['view', 'edit', 'emergency'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setFamilyForm({ ...familyForm, permission_level: level })}
                      className={`py-2 rounded-lg capitalize text-sm font-medium transition-all ${
                        familyForm.permission_level === level
                          ? level === 'emergency' ? 'bg-red-500 text-white' :
                            level === 'edit' ? 'bg-amber-500 text-white' :
                            'bg-rose-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Share Access To:</p>
                <div className="space-y-2">
                  {[
                    { key: 'can_view_medications', label: 'Medications' },
                    { key: 'can_view_cycles', label: 'Cycle Tracking' },
                    { key: 'can_view_mood', label: 'Mood & Wellness' }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(familyForm as Record<string, boolean>)[item.key]}
                        onChange={(e) => setFamilyForm({
                          ...familyForm,
                          [item.key]: e.target.checked
                        })}
                        className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
                      />
                      <span className="text-sm text-gray-600">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Alert Notifications:</p>
                <div className="space-y-2">
                  {[
                    { key: 'receive_emergency_alerts', label: 'Emergency Alerts' },
                    { key: 'receive_medication_alerts', label: 'Medication Reminders' }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(familyForm as Record<string, boolean>)[item.key]}
                        onChange={(e) => setFamilyForm({
                          ...familyForm,
                          [item.key]: e.target.checked
                        })}
                        className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
                      />
                      <span className="text-sm text-gray-600">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={saveFamilyConnection}
              disabled={!familyForm.family_member_email}
              className="w-full mt-6 py-3 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Send Invite
            </button>
          </div>
        </div>
      )}

      {/* Add Emergency Contact Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Add Emergency Contact</h2>
              <button onClick={() => setShowEmergencyModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={emergencyForm.name}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                  placeholder="Contact name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                <select
                  value={emergencyForm.relationship}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, relationship: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                >
                  <option value="">Select relationship</option>
                  <option value="parent">Parent</option>
                  <option value="spouse">Spouse</option>
                  <option value="sibling">Sibling</option>
                  <option value="child">Child</option>
                  <option value="friend">Friend</option>
                  <option value="doctor">Doctor</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={emergencyForm.phone_number}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, phone_number: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emergencyForm.is_primary}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, is_primary: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                />
                <span className="text-sm text-gray-600">Set as primary emergency contact</span>
              </label>
            </div>

            <button
              onClick={saveEmergencyContact}
              disabled={!emergencyForm.name || !emergencyForm.phone_number}
              className="w-full mt-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save Contact
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
