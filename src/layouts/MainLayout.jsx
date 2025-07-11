import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar/Sidebar";
import ChatInterface from "../components/Chat/ChatInterface";
import AuthPopup from "../components/Auth/AuthPopup";
import ComingSoon from "../components/Resources/ComingSoon";
import ProfilePage from "../components/Profile/ProfilePage";
import ProfileIcon from "../components/Profile/ProfileIcon";
import Dashboard from "../components/Dashboard/Dashboard";
import useApi from "../hooks/useApi";
import { IoMoonOutline, IoSunnyOutline } from "react-icons/io5";

const MainLayout = ({
  showProfile = false,
  showResources = false,
  showDashboard = false,
}) => {
  const { makeRequest, error } = useApi();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);
  const [chatKey, setChatKey] = useState(Date.now());
  const [authToken, setAuthToken] = useState(localStorage.getItem("authToken"));
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode !== null
      ? JSON.parse(savedMode)
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Handle dark mode changes
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  // Handle auth token changes and storage events
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "authToken") {
        const newToken = localStorage.getItem("authToken");
        if (newToken !== authToken) {
          setAuthToken(newToken);
          setCurrentChat(null); // Clear current chat on token change
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [authToken]);

  // Restore current chat and handle Google auth callback
  useEffect(() => {
    const handleAuthAndChat = async () => {
      // Handle Google auth callback
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const email = params.get("email");
      const profilePicture = params.get("profilePicture");

      if (token && email) {
        console.log("=== Authentication Check ===");
        console.log("Token exists:", !!token);
        console.log("Email exists:", !!email);
        console.log("Profile picture exists:", !!profilePicture);

        localStorage.setItem("authToken", token);
        localStorage.setItem("userEmail", email);
        if (profilePicture) {
          localStorage.setItem("profilePicture", profilePicture);
        }
        setAuthToken(token);
        toast.success("Successfully logged in with Google!");
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }

      // Save temporary messages if authToken exists
      if (token || authToken) {
        const tempMessages = localStorage.getItem("tempChatMessages");
        if (tempMessages) {
          const messages = JSON.parse(tempMessages);
          if (messages.length > 0) {
            const firstAIMessage = messages.find(
              (m) => m.type === "ai" && m.role
            );
            const tempRole = firstAIMessage ? firstAIMessage.role : "mentor";
            await saveTempMessagesToHistory(
              messages,
              token || authToken,
              tempRole
            );
          }
        }
      }

      // Restore current chat
      const savedChatId = localStorage.getItem("currentChatId");
      if (savedChatId && (token || authToken)) {
        try {
          const response = await makeRequest({
            method: "get",
            endpoint: `/chat/session/${savedChatId}`,
            headers: { Authorization: `Bearer ${token || authToken}` },
          });
          if (response.session) {
            setCurrentChat(response.session);
          }
        } catch (err) {
          console.error("Error restoring chat:", err);
          toast.error(error || "Failed to restore chat session");
        }
      }
    };

    handleAuthAndChat();
  }, [makeRequest, error, authToken]);

  // Save current chat ID
  useEffect(() => {
    if (currentChat?._id) {
      localStorage.setItem("currentChatId", currentChat._id);
    } else {
      localStorage.removeItem("currentChatId");
    }
  }, [currentChat]);

  const saveTempMessagesToHistory = async (messages, token, role) => {
    console.log("=== saveTempMessagesToHistory called ===");
    console.log("Number of messages to save:", messages.length);
    console.log("Messages to save:", messages);

    try {
      let sessionId = null;
      let lastSession = null;
      const firstUserMessage = messages.find((m) => m.type === "user");
      const title = firstUserMessage
        ? firstUserMessage.content.length > 30
          ? firstUserMessage.content.substring(0, 30) + "..."
          : firstUserMessage.content
        : "New Chat";

      console.log("Generated title:", title);

      // Group messages into pairs (user message and AI response)
      for (let i = 0; i < messages.length; i += 2) {
        const userMessage = messages[i];
        const aiMessage = messages[i + 1];

        console.log(`\nProcessing message pair ${i / 2 + 1}:`);
        console.log("User message:", userMessage);
        console.log("AI message:", aiMessage);

        if (userMessage && aiMessage) {
          const response = await makeRequest({
            method: "post",
            endpoint: "/chat/message",
            data: {
              message: userMessage.content,
              aiResponse: aiMessage.content,
              sessionId,
              isNewChat: !sessionId,
              role,
            },
            headers: { Authorization: `Bearer ${token}` },
          });

          console.log("API Response:", response);

          if (!sessionId && response.session) {
            sessionId = response.session._id;
            console.log("Setting new sessionId:", sessionId);
          }

          if (response.session) {
            lastSession = response.session;
          }
        }
      }

      console.log("\nRemoving temporary messages from localStorage");
      localStorage.removeItem("tempChatMessages");

      // Fetch updated chat history
      const historyResponse = await makeRequest({
        method: "get",
        endpoint: "/chat/history",
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Updated chat history:", historyResponse.sessions);

      if (lastSession) {
        setCurrentChat(lastSession);
      }

      return historyResponse.sessions;
    } catch (err) {
      console.error("Error in saveTempMessagesToHistory:", err);
      toast.error(error || "Failed to save previous messages");
    }
  };

  const handleNewChat = () => {
    setCurrentChat(null);
    localStorage.removeItem("currentChatId");
    localStorage.removeItem("tempChatMessages");
    setChatKey(Date.now());
    navigate("/");
  };

  const handleSelectChat = (chat) => {
    setCurrentChat(chat);
    navigate("/");
  };

  const handleShowResources = () => {
    navigate("/resources");
  };

  const handleShowProfile = () => {
    navigate("/user-profile");
  };

  const handleShowDashboard = () => {
    navigate("/dashboard");
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const renderContent = () => (
    <div className="flex-1 flex flex-col h-screen min-h-0 dark:bg-gray-900">
      {/* Header with dark mode toggle */}
      <div
        className="h-16  dark:border-gray-700 flex items-center justify-between px-4 dark:bg-gradient-to-b dark:bg-gradient-to-br bg-transparent
 sticky top-0 z-20"
      >
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
            {/* Add app name or dynamic title here if needed */}
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          {!authToken && (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 text-black text-sm rounded border border-gray-300 transition-colors dark:border-white dark:text-white"
            >
              Sign Up
            </button>
          )}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <IoSunnyOutline size={24} className="text-yellow-500" />
            ) : (
              <IoMoonOutline
                size={24}
                className="text-gray-600 dark:text-gray-400"
              />
            )}
          </button>
          {authToken && <ProfileIcon onShowProfile={handleShowProfile} />}
        </div>
      </div>
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0">
        {showProfile ? (
          <ProfilePage isSidebarOpen={isSidebarOpen} />
        ) : showResources ? (
          <ComingSoon />
        ) : showDashboard ? (
          <Dashboard isSidebarOpen={isSidebarOpen} />
        ) : (
          <ChatInterface
            key={chatKey}
            isSidebarOpen={isSidebarOpen}
            currentChat={currentChat}
            setCurrentChat={setCurrentChat}
            onNewChat={handleNewChat}
          />
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`flex h-screen overflow-hidden ${isDarkMode ? "dark" : ""}`}
    >
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={setIsSidebarOpen}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        currentChat={currentChat}
        onShowResources={handleShowResources}
        onShowProfile={handleShowProfile}
        onShowDashboard={handleShowDashboard}
      />
      {renderContent()}
      {(showAuthPopup || isAuthModalOpen) && (
        <AuthPopup
          isOpen={showAuthPopup || isAuthModalOpen}
          onClose={() => {
            setShowAuthPopup(false);
            setIsAuthModalOpen(false);
          }}
          onAuthSuccess={() => {
            setShowAuthPopup(false);
            setIsAuthModalOpen(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default MainLayout;
