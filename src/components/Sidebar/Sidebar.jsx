import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoMdAdd } from "react-icons/io";
import {
  IoMenuOutline,
  IoCloseOutline,
  IoPersonOutline,
  IoChevronForwardOutline,
  IoLogOutOutline,
  IoChevronDown,
  IoBookOutline,
  IoSearchOutline,
  IoSettingsOutline,
  IoMoonOutline,
  IoSunnyOutline,
} from "react-icons/io5";
import { RiVipCrownLine } from "react-icons/ri";
import toast from "react-hot-toast";
import ChatHistoryList from "../ChatHistory/ChatHistoryList";
import { FiPlusCircle, FiGrid } from "react-icons/fi";

const Sidebar = ({
  isOpen,
  onToggle,
  onNewChat,
  onSelectChat,
  currentChat,
  onShowResources,
  onShowProfile,
}) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [showMobileProfileMenu, setShowMobileProfileMenu] = useState(false);
  const [userName, setUserName] = useState("");
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  useEffect(() => {
    // Initialize dark mode on component mount
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const email = localStorage.getItem("userEmail");
    const picture = localStorage.getItem("profilePicture");
    const name = localStorage.getItem("userName");

    setUserEmail(email || "");
    setProfilePicture(picture || "");

    if (email) {
      const displayName = email.split("@")[0];
      const formattedName = displayName
        .split(/[._-]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      setUserName(formattedName);
      localStorage.setItem("userName", formattedName);
    } else {
      setUserName("");
    }

    const handleAuthChange = () => {
      const newEmail = localStorage.getItem("userEmail");
      const newPicture = localStorage.getItem("profilePicture");
      const newName = localStorage.getItem("userName");

      setUserEmail(newEmail || "");
      setProfilePicture(newPicture || "");

      if (newEmail) {
        const displayName = newEmail.split("@")[0];
        const formattedName = displayName
          .split(/[._-]/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        setUserName(formattedName);
        localStorage.setItem("userName", formattedName);
      } else {
        setUserName("");
      }
    };

    window.addEventListener("authStateChanged", handleAuthChange);
    return () =>
      window.removeEventListener("authStateChanged", handleAuthChange);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
        if (newIsMobile) {
          onToggle(false);
        } else {
          onToggle(true);
        }
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile, onToggle]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("profilePicture");
    localStorage.removeItem("userName");
    toast.success("Logged out successfully!");

    setTimeout(() => {
      window.location.reload();
    }, 3000);
  };

  useEffect(() => {
    if (!isOpen) {
      setShowProfileMenu(false);
      setShowMobileProfileMenu(false);
    }
  }, [isOpen]);

  const handleProfileClick = () => {
    navigate("/user-profile");
    setShowMobileProfileMenu(false);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode.toString());

    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <>
      {/* Mobile Hamburger Menu - Hidden */}
      {isMobile && !isOpen && (
        <button
          onClick={onToggle}
          className="fixed top-4 left-4 z-[60] p-2 rounded-lg bg-transparent text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors"
        >
          <IoMenuOutline size={24} className="mx-auto" />
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      {(!isMobile || (isMobile && isOpen)) && (
        <div
          className={`fixed top-0 left-0 h-full bg-white dark:bg-gradient-to-tr from-[#1f1f1f] to-[#000000] text-gray-800 dark:text-gray-200 z-30 transition-all duration-300 flex flex-col  ${
            isOpen ? "w-64" : "w-16"
          }`}
        >
          {/* Header with E3L Chatbot and Toggle Button */}
          <div className="px-4 h-16 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {isOpen && (
                <span className="text-xl font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
                  OneClarity
                </span>
              )}
            </div>
            {/* Show toggle button on desktop */}
            {!isMobile && (
              <button
                onClick={() => onToggle(!isOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Toggle Sidebar"
              >
                {isOpen ? (
                  <IoCloseOutline
                    size={24}
                    className="text-gray-600 dark:text-gray-400"
                  />
                ) : (
                  <IoMenuOutline
                    size={24}
                    className="text-gray-600 dark:text-gray-400"
                  />
                )}
              </button>
            )}
            {/* Mobile close button */}
            {isMobile && isOpen && (
              <button
                onClick={() => onToggle(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Close Sidebar"
              >
                <IoCloseOutline
                  size={24}
                  className="text-gray-600 dark:text-gray-400"
                />
              </button>
            )}
          </div>

          <nav className="mt-6">
            <ul className="space-y-2">
              {/* New Chat Tab */}
              <li>
                <button
                  onClick={onNewChat}
                  className={`w-full flex items-center rounded-lg px-4 py-3 border transition-colors ${
                    isOpen
                      ? "bg-gray-100 dark:bg-blue-900/20  dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-blue-900/30"
                      : ""
                  }`}
                >
                  <FiPlusCircle
                    size={22}
                    className="text-gray-800 dark:text-white"
                  />
                  {isOpen && (
                    <span className="ml-3 text-gray-800 dark:text-white font-medium">
                      New Chat
                    </span>
                  )}
                </button>
              </li>

              {/* Dashboard Tab */}
              <li>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full flex items-center rounded-lg px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FiGrid
                    size={20}
                    className="text-gray-500 dark:text-gray-400"
                  />
                  {isOpen && (
                    <span className="ml-3 text-gray-700 dark:text-gray-300 font-medium">
                      Dashboard
                    </span>
                  )}
                </button>
              </li>

              {/* Chat History Section */}
              <li>
                <div className="w-full flex items-center rounded-lg px-4 py-3">
                  {isOpen && (
                    <span className="text-base text-gray-500 dark:text-gray-400">
                      Chat History
                    </span>
                  )}
                </div>
              </li>
            </ul>
          </nav>

          {/* Chat History List */}
          {isOpen && (
            <div
              className="mt-2 flex-1 overflow-y-auto custom-scrollbar"
              style={{
                maxHeight: "calc(100vh - 280px)",
                scrollbarWidth: "thin",
                scrollbarColor: "#E5E7EB #FFFFFF",
              }}
            >
              <ChatHistoryList
                isOpen={isOpen}
                onSelectChat={onSelectChat}
                currentChat={currentChat}
              />
            </div>
          )}

          {/* Mobile Profile Section */}
          {isMobile && isOpen && userName && (
            <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700 relative">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowMobileProfileMenu(!showMobileProfileMenu)}
              >
                <div className="flex items-center">
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="ml-3 font-medium">{userName}</span>
                </div>
                <IoChevronDown
                  className={`transition-transform ${
                    showMobileProfileMenu ? "transform rotate-180" : ""
                  }`}
                />
              </div>

              {/* Mobile Profile Menu Popup */}
              {showMobileProfileMenu && (
                <div className="absolute bottom-16 left-4 right-4 bg-white dark:bg-[#191A1A] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-40">
                  <ul className="py-1">
                    <li>
                      <button
                        onClick={handleProfileClick}
                        className="w-full flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <IoSettingsOutline
                          size={18}
                          className="text-gray-500 dark:text-gray-400"
                        />
                        <span className="ml-3">Settings</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={toggleDarkMode}
                        className="w-full flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        {darkMode ? (
                          <IoSunnyOutline
                            size={18}
                            className="text-gray-500 dark:text-gray-400"
                          />
                        ) : (
                          <IoMoonOutline
                            size={18}
                            className="text-gray-500 dark:text-gray-400"
                          />
                        )}
                        <span className="ml-3">
                          {darkMode ? "Light Mode" : "Dark Mode"}
                        </span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-red-500"
                      >
                        <IoLogOutOutline size={18} className="text-red-500" />
                        <span className="ml-3">Logout</span>
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Desktop Profile Section (collapsed sidebar) */}
          {!isMobile && !isOpen && userName && (
            <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
              <div
                className="flex justify-center cursor-pointer"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Desktop Profile Menu Popup */}
              {showProfileMenu && (
                <div className="absolute bottom-16 left-16 ml-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-40 w-48">
                  <ul className="py-1">
                    <li>
                      <button
                        onClick={handleProfileClick}
                        className="w-full flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                      >
                        <IoSettingsOutline
                          size={18}
                          className="text-gray-500 dark:text-gray-400"
                        />
                        <span className="ml-3">Settings</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={toggleDarkMode}
                        className="w-full flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                      >
                        {darkMode ? (
                          <IoSunnyOutline
                            size={18}
                            className="text-gray-500 dark:text-gray-400"
                          />
                        ) : (
                          <IoMoonOutline
                            size={18}
                            className="text-gray-500 dark:text-gray-400"
                          />
                        )}
                        <span className="ml-3">
                          {darkMode ? "Light Mode" : "Dark Mode"}
                        </span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-red-500 dark:text-red-400"
                      >
                        <IoLogOutOutline
                          size={18}
                          className="text-red-500 dark:text-red-400"
                        />
                        <span className="ml-3">Logout</span>
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}

          <style>{`
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 6px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: #FFFFFF;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background-color: #E5E7EB;
                            border-radius: 3px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background-color: #D1D5DB;
                        }
                        .dark .custom-scrollbar::-webkit-scrollbar-track {
                            background: #1F2937;
                        }
                        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                            background-color: #4B5563;
                        }
                        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background-color: #6B7280;
                        }
                    `}</style>
        </div>
      )}
    </>
  );
};

export default Sidebar;
