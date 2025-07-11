import React, { useState } from 'react';
import Sidebar from '../components/Sidebar/Sidebar';
import { Outlet } from 'react-router-dom';

const SharedLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [currentChat, setCurrentChat] = useState(null);

    const handleNewChat = () => {
        setCurrentChat(null);
    };

    const handleSelectChat = (chat) => {
        setCurrentChat(chat);
    };

    return (
        <div className="flex h-screen bg-white">
            <Sidebar 
                isOpen={isSidebarOpen} 
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
                currentChat={currentChat}
            />
            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
};

export default SharedLayout; 