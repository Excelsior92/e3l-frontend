import { useState, useEffect } from 'react';
import axios from 'axios';
import { IoChevronForward, IoChevronDown } from 'react-icons/io5';
import { API_URL } from '../../config';

const ChatHistoryList = ({ isOpen, onSelectChat, currentChat }) => {
    const [chatSessions, setChatSessions] = useState([]);
    const [error, setError] = useState(null);
    const [expandedRoles, setExpandedRoles] = useState({}); // This can be removed later, but we'll keep it for now
    // New state for pre-auth (localStorage) chats
    const [localChats, setLocalChats] = useState([]);

    // Fetch backend chat history if authenticated
    const fetchChatHistory = async () => {
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                setChatSessions([]);
                return;
            }
            const response = await axios.get(`${API_URL}/chat/history`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            setChatSessions(response.data.sessions);
        } catch (err) {
            console.error('Error fetching chat history:', err);
            setError('Failed to load chat history');
        }
    };

    useEffect(() => { fetchChatHistory(); }, []);
    useEffect(() => { if (currentChat || localStorage.getItem('authToken')) fetchChatHistory(); }, [currentChat?._id, currentChat?.messages?.length]);
    useEffect(() => { const interval = setInterval(fetchChatHistory, 2000); return () => clearInterval(interval); }, []);

    // New effect: Load pre-auth chats from localStorage if not authenticated
    useEffect(() => {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            // Load tempChatMessages from localStorage
            const temp = localStorage.getItem('tempChatMessages');
            if (temp) {
                const messages = JSON.parse(temp);
                // Group into chat sessions (user+ai pairs)
                const sessions = [];
                for (let i = 0; i < messages.length; i += 2) {
                    const userMsg = messages[i];
                    const aiMsg = messages[i + 1];
                    if (userMsg && aiMsg) {
                        sessions.push({
                            _id: `local-${i}`,
                            title: userMsg.content.length > 30 ? userMsg.content.substring(0, 30) + '...' : userMsg.content,
                            messages: [userMsg, aiMsg],
                            isLocal: true
                        });
                    }
                }
                setLocalChats(sessions);
            } else {
                setLocalChats([]);
            }
        } else {
            setLocalChats([]); // Clear local chats after login
        }
    }, [currentChat, localStorage.getItem('authToken')]);

    if (!isOpen) return null;

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 120px)', scrollbarWidth: 'thin', scrollbarColor: '#E5E7EB #FFFFFF' }}>
                <div className="space-y-1">
                    {/* Show pre-auth (localStorage) chats if any */}
                 
                    {/* Show backend chats as usual */}
                    {chatSessions.map(session => (
                        <div
                            key={session._id}
                            className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer 
        hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors
        ${currentChat?._id === session._id ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : ''}`}
                            onClick={() => onSelectChat(session)}
                        >
                            {/* <span className="text-gray-400 text-md">🗨️</span> */}
                            <span className="pl-2 text-md text-gray-700 dark:text-gray-300 truncate">{session.title}</span>
                        </div>
                    ))}
                </div>
            </div>
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: var(--bg-color, #FFFFFF); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: var(--thumb-color, #E5E7EB); border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: var(--thumb-hover-color, #D1D5DB); }

                :root {
                    --bg-color: #FFFFFF;
                    --thumb-color: #E5E7EB;
                    --thumb-hover-color: #D1D5DB;
                }

                :root.dark {
                    --bg-color: #171717;
                    --thumb-color: #374151;
                    --thumb-hover-color: #4B5563;
                }
            `}</style>
        </div>
    );
};

export default ChatHistoryList;