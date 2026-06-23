import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { EmergencyAlert, EmergencyContact } from '../types/database';
import {
  AlertTriangle,
  Phone,
  MapPin,
  Clock,
  Building,
  User,
  Shield,
  Send,
  CheckCircle,
  XCircle,
  FileText,
  Download
} from 'lucide-react';

export function EmergencySupport() {
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [sosActive, setSosActive] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const nearbyServices = [
    { name: 'City General Hospital', type: 'Hospital', distance: '2.3 km', phone: '+1-555-0100', address: '123 Medical Center Dr' },
    { name: 'Women\'s Health Clinic', type: 'Clinic', distance: '1.5 km', phone: '+1-555-0120', address: '456 Wellness Ave' },
    { name: 'Emergency Care Center', type: 'Urgent Care', distance: '0.8 km', phone: '+1-555-0130', address: '789 Care Blvd' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    const { data: contacts } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('priority_order', { ascending: true });

    if (contacts) setEmergencyContacts(contacts);

    const { data: alerts } = await supabase
      .from('emergency_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('triggered_at', { ascending: false })
      .limit(10);

    if (alerts) setEmergencyAlerts(alerts);
    setLoading(false);
  };

  const triggerSOS = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    setSosActive(true);

    // Get current location if available
    let lat = null;
    let lng = null;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        },
        () => null
      );
    }

    const { data } = await supabase
      .from('emergency_alerts')
      .insert({
        user_id: userId,
        alert_type: 'SOS',
        location_lat: lat,
        location_lng: lng,
        message: 'Emergency SOS triggered',
        notified_contacts: emergencyContacts.map(c => c.phone_number)
      })
      .select()
      .single();

    if (data) {
      setEmergencyAlerts([data, ...emergencyAlerts]);
    }
  };

  const cancelSOS = async () => {
    if (emergencyAlerts.length > 0) {
      await supabase
        .from('emergency_alerts')
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', emergencyAlerts[0].id);

      loadData();
    }
    setSosActive(false);
    setShowCancelConfirm(false);
  };

  const generateReport = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    await supabase.from('medical_history_exports').insert({
      user_id: userId,
      export_type: 'full',
      date_range_start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      date_range_end: new Date().toISOString().split('T')[0]
    });

    alert('PDF health report generation requested. It will be available shortly.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Emergency Support</h1>
        <p className="text-gray-600">Quick access to emergency services and health information</p>
      </div>

      {/* SOS Button */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="text-center">
          {sosActive ? (
            <div>
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-red-500 animate-pulse flex items-center justify-center">
                <AlertTriangle className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">SOS ACTIVATED</h2>
              <p className="text-gray-600 mb-4">Emergency contacts have been notified</p>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel SOS
                </button>
                <a
                  href="tel:911"
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Call 911
                </a>
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={triggerSOS}
                className="w-40 h-40 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center group"
              >
                <div className="text-center">
                  <AlertTriangle className="w-16 h-16 text-white mx-auto mb-1" />
                  <span className="text-white font-bold text-xl">SOS</span>
                </div>
              </button>
              <h2 className="text-xl font-semibold text-gray-900">Press & Hold for Emergency</h2>
              <p className="text-gray-600">This will alert your emergency contacts</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <a
          href="tel:911"
          className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-center hover:bg-red-100 transition-colors group"
        >
          <Phone className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="font-medium text-red-700">Call 911</p>
        </a>

        <a
          href="tel:"
          className="p-4 bg-teal-50 border-2 border-teal-200 rounded-xl text-center hover:bg-teal-100 transition-colors group"
        >
          <User className="w-8 h-8 text-teal-600 mx-auto mb-2" />
          <p className="font-medium text-teal-700">
            {emergencyContacts[0]?.name || 'Primary Contact'}
          </p>
          {emergencyContacts[0] && (
            <p className="text-xs text-teal-600">{emergencyContacts[0].phone_number}</p>
          )}
        </a>

        <button
          onClick={generateReport}
          className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl text-center hover:bg-amber-100 transition-colors group"
        >
          <FileText className="w-8 h-8 text-amber-600 mx-auto mb-2" />
          <p className="font-medium text-amber-700">Export Health Report</p>
        </button>

        <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-xl text-center">
          <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <p className="font-medium text-purple-700">Find Nearby Hospital</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Emergency Contacts */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Emergency Contacts</h2>

          {emergencyContacts.length > 0 ? (
            <div className="space-y-3">
              {emergencyContacts.slice(0, 4).map((contact) => (
                <a
                  key={contact.id}
                  href={`tel:${contact.phone_number}`}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    contact.is_primary ? 'bg-red-200' : 'bg-gray-200'
                  }`}>
                    <Phone className={`w-5 h-5 ${contact.is_primary ? 'text-red-600' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      {contact.is_primary && (
                        <span className="px-1.5 py-0.5 bg-red-500 text-white rounded text-xs">Primary</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{contact.relationship} | {contact.phone_number}</p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Phone className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No emergency contacts set</p>
              <p className="text-sm text-gray-400 mt-1">Add them in Family Care settings</p>
            </div>
          )}
        </div>

        {/* Nearby Services */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Nearby Healthcare Services</h2>

          <div className="space-y-3">
            {nearbyServices.map((service, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{service.name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <Building className="w-4 h-4" />
                      <span>{service.type}</span>
                      <span>•</span>
                      <MapPin className="w-4 h-4" />
                      <span>{service.distance}</span>
                    </div>
                  </div>
                  <a href={`tel:${service.phone}`} className="p-2 bg-teal-100 text-teal-600 rounded-lg hover:bg-teal-200">
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-sm text-gray-600">{service.address}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SOS History */}
      {emergencyAlerts.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Alert History</h2>

          <div className="space-y-3">
            {emergencyAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center gap-4 p-4 rounded-xl ${
                  alert.resolved ? 'bg-gray-50' : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  alert.resolved ? 'bg-teal-100' : 'bg-red-200'
                }`}>
                  {alert.resolved ? (
                    <CheckCircle className="w-5 h-5 text-teal-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{alert.alert_type}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(alert.triggered_at).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  alert.resolved ? 'bg-teal-100 text-teal-600' : 'bg-red-100 text-red-600'
                }`}>
                  {alert.resolved ? 'Resolved' : 'Active'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel SOS Confirmation */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Cancel SOS?</h2>
              <p className="text-gray-600 mb-6">Are you sure the emergency is resolved?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                >
                  No, Keep Active
                </button>
                <button
                  onClick={cancelSOS}
                  className="flex-1 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
