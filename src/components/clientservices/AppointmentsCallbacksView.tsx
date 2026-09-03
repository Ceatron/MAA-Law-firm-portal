import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  User,
  Building2,
  CheckCircle2,
  Briefcase,
  Video,
  ChevronRight,
  Phone,
  PhoneForwarded,
} from 'lucide-react';
import {
  ClientInteraction,
  InteractionStatus,
  Advocate,
  Client,
  LegalMatter,
} from '../../types';

interface AppointmentsCallbacksViewProps {
  interactions: ClientInteraction[];
  onOpenNewModal: (initialType: 'Appointment') => void;
  onSelectInteraction: (interaction: ClientInteraction) => void;
  onUpdateStatus: (id: string, newStatus: InteractionStatus) => void;
  advocates: Advocate[];
  clients: Client[];
  matters: LegalMatter[];
  currentAdvocate: Advocate;
}

export const AppointmentsCallbacksView: React.FC<AppointmentsCallbacksViewProps> = ({
  interactions,
  onOpenNewModal,
  onSelectInteraction,
  onUpdateStatus,
  advocates,
  clients,
  matters,
  currentAdvocate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [advocateFilter, setAdvocateFilter] = useState('all');

  const appointments = interactions.filter(
    (i) => i.interactionType === 'Appointment' || i.subtype?.toLowerCase().includes('consultation')
  );

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      searchTerm === '' ||
      apt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.description && apt.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAdvocate =
      advocateFilter === 'all' ||
      apt.assignedStaffId === advocateFilter ||
      apt.handledById === advocateFilter;

    return matchesSearch && matchesAdvocate;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl font-bold font-serif-title text-stone-900 flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-cyan-600" />
            <span>Consultations & Reception Appointments</span>
          </h2>
          <p className="text-xs text-stone-500">
            Schedule and manage in-person client briefings, boardroom conferences, and virtual advocate meetings
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenNewModal('Appointment')}
          className="flex items-center space-x-1.5 rounded-xl bg-cyan-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-cyan-800 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Book Client Consultation</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search appointments by client, subject..."
              className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            />
          </div>

          <div>
            <select
              value={advocateFilter}
              onChange={(e) => setAdvocateFilter(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#0B63E5] focus:outline-hidden"
            >
              <option value="all">All Host Advocates & Rooms</option>
              {advocates.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Appointment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              onClick={() => onSelectInteraction(apt)}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs hover:border-[#0B63E5] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
            >
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-cyan-700">{apt.id}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      apt.status === 'Resolved' || apt.status === 'Closed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-cyan-100 text-cyan-900'
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>

                <div className="mt-3 flex items-center space-x-2 text-stone-500 text-xs">
                  <Calendar className="h-4 w-4 text-cyan-600" />
                  <strong className="text-stone-900 font-mono">{apt.date}</strong>
                  <span>at</span>
                  <strong className="text-stone-900 font-mono">{apt.time}</strong>
                </div>

                <h3 className="text-sm font-bold text-stone-900 mt-2 line-clamp-1 group-hover:text-[#0B63E5]">
                  {apt.subject}
                </h3>

                <div className="mt-2 text-xs text-stone-600 space-y-1">
                  <p className="font-semibold text-stone-800 line-clamp-1">{apt.clientName}</p>
                  {apt.phoneNumber && <p className="text-stone-400 font-mono text-[11px]">{apt.phoneNumber}</p>}
                  <p className="text-stone-500 line-clamp-2 italic text-[11px]">"{apt.description}"</p>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span className="truncate max-w-[150px]">Host: {apt.assignedStaffName || apt.handledByName}</span>
                <span className="font-semibold text-[#0B63E5] text-[11px] group-hover:underline flex items-center">
                  <span>View Details</span>
                  <ChevronRight className="h-3 w-3 ml-0.5" />
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center text-stone-400 bg-white rounded-2xl border border-stone-200">
            <Calendar className="h-10 w-10 mx-auto text-stone-300 mb-2" />
            <p className="text-xs font-semibold text-stone-600">No client consultations scheduled.</p>
          </div>
        )}
      </div>
    </div>
  );
};
