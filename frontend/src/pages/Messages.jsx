import { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Loader2, MessageSquare, Search } from 'lucide-react';
import api from '../api/axios';
import ChatInterface from '../components/ChatInterface';

export default function Messages() {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // The ID of the user we want to chat with from the URL ?userId=123
  const targetUserId = searchParams.get('userId');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);

        // 1. If we have a targetUserId in URL, get/create that conversation first
        let activeConv = null;
        if (targetUserId) {
          const res = await api.get(`/chat/conversation/${targetUserId}`);
          activeConv = res.data;
          setActiveConversation(activeConv);
        }

        // 2. Fetch all conversations for the sidebar
        const convRes = await api.get('/chat/conversations');
        let allConvs = convRes.data;

        // If the newly created one isn't in the list yet, add it
        if (activeConv && !allConvs.find(c => c._id === activeConv._id)) {
            allConvs = [activeConv, ...allConvs];
        }

        setConversations(allConvs);

      } catch (err) {
        console.error("Failed to load conversations:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [targetUserId]);

  const getOtherParticipant = (participants) => {
    if (!participants || !Array.isArray(participants)) return null;
    const currentUserId = (user?.id || user?._id || '').toString();
    return participants.find(p => p._id.toString() !== currentUserId) || participants[0];
  };

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    // Clear URL param to avoid re-fetching on refresh
    setSearchParams({});
  };

  return (
    <div className="max-w-6xl mx-auto h-[600px] flex gap-6 pb-12">
      {/* Sidebar: Conversation List */}
      <div className="w-1/3 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Messages
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center mt-10">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-gray-500 mt-10 text-sm px-4">
              You have no active conversations. Search for teammates to start chatting!
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {conversations.map((conv) => {
                const otherUser = getOtherParticipant(conv.participants);
                const isActive = activeConversation?._id === conv._id;
                
                return (
                  <button
                    key={conv._id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                      isActive ? 'bg-indigo-50 hover:bg-indigo-50 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                      {otherUser?.name ? otherUser.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-indigo-900' : 'text-gray-900'}`}>
                        {otherUser?.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {conv.lastMessage ? conv.lastMessage.text : 'Start chatting...'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1">
        {activeConversation ? (
          <ChatInterface 
            conversation={activeConversation} 
            receiverName={getOtherParticipant(activeConversation.participants)?.name} 
          />
        ) : (
          <div className="h-full bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col items-center justify-center text-gray-400">
            <MessageSquare className="w-12 h-12 mb-4 text-gray-200" />
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
