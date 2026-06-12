import { useState, useEffect, useContext, useRef } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { Send, User as UserIcon, Loader2 } from 'lucide-react';
import api from '../api/axios';

export default function ChatInterface({ conversation, receiverName }) {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user || !conversation) return;

    // Fetch initial chat history
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/chat/messages/${conversation._id}`);
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Connect to Socket.IO server
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join the specific conversation room
    newSocket.emit('joinConversation', conversation._id);

    // Listen for incoming messages
    newSocket.on('receiveMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => newSocket.close();
  }, [user, conversation]);

  useEffect(() => {
    // Scroll to bottom on new message
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const currentUserId = user?.id || user?._id;
    const msgData = {
      conversationId: conversation._id,
      senderId: currentUserId,
      text: newMessage
    };

    // Emit to backend (backend will broadcast it back to us via receiveMessage)
    socket.emit('sendMessage', msgData);

    setNewMessage('');
  };

  if (!conversation) {
    return (
      <div className="flex flex-col h-[600px] bg-white border border-gray-200 rounded-2xl shadow-sm items-center justify-center text-gray-500">
        Select a conversation to start chatting
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
          <UserIcon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{receiverName || 'Chat'}</h3>
          <p className="text-xs text-green-600 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Online
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
        {isLoading ? (
          <div className="flex justify-center mt-10">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Say hi to start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const senderIdStr = (msg?.sender?._id || msg?.sender || '').toString();
            const currentUserIdStr = (user?.id || user?._id || '').toString();
            const isMe = currentUserIdStr && senderIdStr === currentUserIdStr;
            return (
              <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                  isMe 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                }`}>
                  {msg.text}
                  <span className={`block text-[10px] mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
