import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const ROOMS = ['R101', 'R102', 'R103', 'R104', 'R201', 'R202', 'R203', 'R204'];
const SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function RoomBookingSystem() {
  const { user } = useContext(AuthContext);
  const currentTeacher = user?.name || '';
  
  const [timetable, setTimetable] = useState({});
  const [requests, setRequests] = useState([]);
  
  const [activeTab, setActiveTab] = useState('timetable');
  const [selectedRoom, setSelectedRoom] = useState(ROOMS[0]);
  
  // Inline Panel States
  const [bookingPanel, setBookingPanel] = useState(null);
  const [takeoverPanel, setTakeoverPanel] = useState(null);
  
  // Form States
  const [subjectInput, setSubjectInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  
  const fetchData = async () => {
    try {
      const res = await api.get('/room-bookings');
      
      const newTimetable = {};
      ROOMS.forEach(room => {
        newTimetable[room] = {};
        DAYS.forEach(day => {
          newTimetable[room][day] = {};
          SLOTS.forEach(slot => {
            newTimetable[room][day][slot] = null;
          });
        });
      });
      
      res.data.bookings.forEach(b => {
        if(newTimetable[b.roomId] && newTimetable[b.roomId][b.day]) {
            newTimetable[b.roomId][b.day][b.timeSlot] = b;
        }
      });
      
      setTimetable(newTimetable);
      setRequests(res.data.requests);
    } catch(err) {
      console.error("Failed to fetch bookings", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (Object.keys(timetable).length === 0) return <div className="p-8 text-center text-gray-500 font-medium">Loading database records...</div>;

  const pendingInboxCount = requests.filter(r => r.toTeacher === currentTeacher && r.status === 'pending').length;

  const handleBookSlot = async (day, slot) => {
    if (!subjectInput.trim()) return;
    try {
      await api.post('/room-bookings/book', {
        roomId: selectedRoom,
        day,
        timeSlot: slot,
        teacherName: currentTeacher,
        subject: subjectInput
      });
      await fetchData(); // Refresh state from DB
      setBookingPanel(null);
      setSubjectInput('');
    } catch(err) {
      console.error("Failed to book slot", err);
      alert("Error booking slot");
    }
  };

  const handleCancelBooking = async (room, day, slot) => {
    try {
      await api.delete('/room-bookings/cancel', {
        data: { roomId: room, day, timeSlot: slot }
      });
      await fetchData();
    } catch(err) {
      console.error("Failed to cancel booking", err);
    }
  };

  const handleSendTakeoverRequest = async (day, slot, currentHolder) => {
    try {
      await api.post('/room-bookings/request', {
        fromTeacher: currentTeacher,
        toTeacher: currentHolder,
        roomId: selectedRoom,
        day,
        timeSlot: slot,
        message: messageInput
      });
      await fetchData();
      setTakeoverPanel(null);
      setMessageInput('');
    } catch(err) {
      console.error("Failed to send request", err);
    }
  };

  const handleAcceptRequest = async (request) => {
    try {
      await api.post(`/room-bookings/request/${request._id}/status`, { status: 'accepted' });
      await fetchData();
    } catch(err) {
      console.error("Failed to accept request", err);
    }
  };

  const handleRejectRequest = async (id) => {
    try {
      await api.post(`/room-bookings/request/${id}/status`, { status: 'rejected' });
      await fetchData();
    } catch(err) {
      console.error("Failed to reject request", err);
    }
  };

  const hasSentPendingRequest = (day, slot) => {
    return requests.some(r => 
      r.roomId === selectedRoom && 
      r.day === day && 
      r.timeSlot === slot && 
      r.fromTeacher === currentTeacher && 
      r.status === 'pending'
    );
  };

  return (
    <div className="bg-gray-50 text-gray-800 font-sans">
      <div className="bg-white shadow-sm border-b px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900">Room Booking System</h1>
      </div>

      <div className="bg-white border-b px-6 flex gap-6 overflow-x-auto">
        {[
          { id: 'timetable', label: 'Timetable' },
          { id: 'my_bookings', label: 'My Bookings' },
          { id: 'inbox', label: `Inbox ${pendingInboxCount > 0 ? `(${pendingInboxCount})` : ''}` },
          { id: 'sent_requests', label: 'Sent Requests' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="py-6 max-w-7xl mx-auto">
        {activeTab === 'timetable' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Weekly Grid</h2>
              <select 
                className="border border-gray-200 rounded-md px-4 py-2 bg-gray-50 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                value={selectedRoom} 
                onChange={(e) => setSelectedRoom(e.target.value)}
              >
                {ROOMS.map(r => <option key={r} value={r}>Room {r}</option>)}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr>
                    <th className="border p-3 bg-gray-50 w-24">Time</th>
                    {DAYS.map(day => <th key={day} className="border p-3 bg-gray-50 text-left font-semibold">{day}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {SLOTS.map(slot => (
                    <tr key={slot}>
                      <td className="border p-3 text-sm font-medium text-gray-500 whitespace-nowrap bg-gray-50">{slot}</td>
                      {DAYS.map(day => {
                        const booking = timetable[selectedRoom][day][slot];
                        
                        // Robust comparison to handle any whitespace or casing differences
                        const isMyBooking = booking?.teacherName && currentTeacher && 
                                          String(booking.teacherName).trim().toLowerCase() === String(currentTeacher).trim().toLowerCase();
                                          
                        const isPendingReq = hasSentPendingRequest(day, slot);
                        
                        let cellClass = "border p-2 align-top h-32 transition-colors relative group ";
                        if (!booking) cellClass += "bg-green-50/30 hover:bg-green-50";
                        else if (isMyBooking) cellClass += "bg-indigo-50/50";
                        else if (isPendingReq) cellClass += "bg-yellow-50/50";
                        else cellClass += "bg-gray-100/50";

                        return (
                          <td key={day} className={cellClass}>
                            {!booking ? (
                              <div className="h-full flex flex-col items-center justify-center">
                                {bookingPanel?.day === day && bookingPanel?.slot === slot ? (
                                  <div className="w-full bg-white p-2 rounded shadow-sm border border-green-200 text-sm">
                                    <div className="font-medium text-gray-700 mb-2">Book Slot</div>
                                    <input 
                                      autoFocus
                                      type="text" 
                                      placeholder="Subject"
                                      className="w-full border rounded px-2 py-1 mb-2 outline-none focus:border-green-500"
                                      value={subjectInput}
                                      onChange={e => setSubjectInput(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                      <button onClick={() => handleBookSlot(day, slot)} className="bg-green-600 text-white px-2 py-1 rounded w-full hover:bg-green-700 transition">Confirm</button>
                                      <button onClick={() => setBookingPanel(null)} className="bg-gray-200 text-gray-700 px-2 py-1 rounded w-full hover:bg-gray-300 transition">Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => { setBookingPanel({ day, slot }); setTakeoverPanel(null); }}
                                    className="opacity-0 group-hover:opacity-100 bg-green-100 text-green-700 px-4 py-2 rounded font-medium hover:bg-green-200 transition-all"
                                  >
                                    Book
                                  </button>
                                )}
                              </div>
                            ) : isMyBooking ? (
                              <div className="h-full p-2 flex flex-col justify-between">
                                <div>
                                  <div className="inline-block bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded mb-2">Your Booking</div>
                                  <div className="font-semibold text-gray-800">{booking.subject}</div>
                                </div>
                                <button 
                                  onClick={() => handleCancelBooking(selectedRoom, day, slot)}
                                  className="text-xs text-red-600 hover:text-red-800 mt-2 font-medium"
                                >
                                  Cancel Booking
                                </button>
                              </div>
                            ) : (
                              <div className="h-full p-2 flex flex-col justify-between relative">
                                <div>
                                  <div className="font-medium text-gray-800 text-sm">{booking.teacherName}</div>
                                  <div className="text-gray-500 text-xs mt-1">{booking.subject}</div>
                                </div>
                                
                                {isPendingReq ? (
                                  <div className="text-xs font-medium text-yellow-600 mt-2 bg-yellow-100 px-2 py-1 rounded inline-block w-fit">Request Sent</div>
                                ) : takeoverPanel?.day === day && takeoverPanel?.slot === slot ? (
                                  <div className="w-full bg-white p-2 rounded shadow-sm border border-yellow-200 text-sm mt-2 absolute bottom-2 left-2 right-2 z-10 w-[calc(100%-1rem)]">
                                    <textarea 
                                      placeholder="Reason (optional)"
                                      className="w-full border rounded px-2 py-1 mb-2 outline-none focus:border-yellow-500 text-xs h-16 resize-none"
                                      value={messageInput}
                                      onChange={e => setMessageInput(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                      <button onClick={() => handleSendTakeoverRequest(day, slot, booking.teacherName)} className="bg-yellow-500 text-white px-2 py-1 rounded w-full hover:bg-yellow-600 text-xs">Send</button>
                                      <button onClick={() => setTakeoverPanel(null)} className="bg-gray-200 text-gray-700 px-2 py-1 rounded w-full hover:bg-gray-300 text-xs">Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => { setTakeoverPanel({ day, slot, currentHolder: booking.teacherName }); setBookingPanel(null); }}
                                    className="opacity-0 group-hover:opacity-100 bg-yellow-100 text-yellow-700 text-xs px-2 py-1.5 rounded font-medium hover:bg-yellow-200 transition-all mt-2"
                                  >
                                    Request Takeover
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'my_bookings' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6">My Bookings</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ROOMS.flatMap(room => 
                DAYS.flatMap(day => 
                  SLOTS.map(slot => {
                    const booking = timetable[room][day][slot];
                    if (booking?.teacherName === currentTeacher) {
                      return (
                        <div key={`${room}-${day}-${slot}`} className="border border-indigo-100 rounded-lg p-4 bg-indigo-50/30">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-indigo-900">{room}</div>
                            <button 
                              onClick={() => handleCancelBooking(room, day, slot)}
                              className="text-sm text-red-600 hover:text-red-800 font-medium bg-white px-3 py-1 rounded border border-gray-200 shadow-sm"
                            >
                              Cancel
                            </button>
                          </div>
                          <div className="text-gray-600 font-medium">{day}, {slot}</div>
                          <div className="text-gray-800 mt-2">{booking.subject}</div>
                        </div>
                      );
                    }
                    return null;
                  })
                )
              )}
            </div>
          </div>
        )}

        {activeTab === 'inbox' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Takeover Requests Received</h2>
            <div className="space-y-4">
              {requests.filter(r => r.toTeacher === currentTeacher && r.status === 'pending').length === 0 ? (
                <div className="text-gray-500 py-8 text-center border-2 border-dashed rounded-lg">No pending requests.</div>
              ) : (
                requests.filter(r => r.toTeacher === currentTeacher && r.status === 'pending').map(req => (
                  <div key={req._id} className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">{req.fromTeacher}</span>
                        <span className="text-gray-500">requested</span>
                        <span className="font-bold bg-gray-200 px-2 py-0.5 rounded text-sm text-gray-700">{req.roomId}</span>
                      </div>
                      <div className="text-gray-600 font-medium mb-2">{req.day} • {req.timeSlot}</div>
                      {req.message && (
                        <div className="bg-white p-3 rounded border border-gray-200 text-gray-700 text-sm italic">"{req.message}"</div>
                      )}
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button onClick={() => handleAcceptRequest(req)} className="flex-1 md:flex-none bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium transition-colors">Accept</button>
                      <button onClick={() => handleRejectRequest(req._id)} className="flex-1 md:flex-none bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 font-medium transition-colors">Reject</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'sent_requests' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Takeover Requests Sent</h2>
            <div className="space-y-4">
              {requests.filter(r => r.fromTeacher === currentTeacher).length === 0 ? (
                <div className="text-gray-500 py-8 text-center border-2 border-dashed rounded-lg">You haven't sent any requests.</div>
              ) : (
                requests.filter(r => r.fromTeacher === currentTeacher).map(req => (
                  <div key={req._id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center bg-gray-50">
                    <div>
                      <div className="font-bold text-gray-900 mb-1">Room {req.roomId} • {req.day} {req.timeSlot}</div>
                      <div className="text-gray-600 text-sm">Requested from: <span className="font-medium text-gray-800">{req.toTeacher}</span></div>
                    </div>
                    <div>
                      {req.status === 'pending' && <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1 rounded-full font-medium text-sm">Pending</span>}
                      {req.status === 'accepted' && <span className="bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-full font-medium text-sm">Accepted</span>}
                      {req.status === 'rejected' && <span className="bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full font-medium text-sm">Rejected</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
