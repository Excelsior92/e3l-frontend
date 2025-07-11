import React, { useState, useEffect } from 'react';
import { IoPersonOutline, IoLogOutOutline, IoStatsChartOutline, IoNotificationsOutline, IoShieldOutline, IoHelpCircleOutline, IoPencilOutline } from 'react-icons/io5';
import { FiUser, FiSettings } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';
import { formatDistanceToNow } from 'date-fns';
import useApi from '../../hooks/useApi';

const ProfilePage = ({ isSidebarOpen }) => {
  const [response, isLoading, error, makeRequest, statusCode] = useApi();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [sessionCount, setSessionCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  // Sync dark mode on mount and when toggled
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Fetch profile and session count on mount
  useEffect(() => {
    const fetchProfileData = async () => {
      const requestId = uuidv4();
      try {
        // Fetch user profile
        const profileData = await makeRequest('get', '/chat/profile', null, {}, requestId);

        console.log(`[React][${requestId}] Profile fetch:`, profileData);
        if (profileData) {
          setUserEmail(profileData.email || localStorage.getItem('userEmail') || '');
          setUserName(profileData.displayName || localStorage.getItem('userName') || '');
          setNewName(profileData.displayName || localStorage.getItem('userName') || '');
          setProfilePicture(profileData.profilePicture || localStorage.getItem('profilePicture') || '');
          setLastUpdated(profileData.updatedAt || null);
          localStorage.setItem('userName', profileData.displayName || '');
          localStorage.setItem('userEmail', profileData.email || '');
          localStorage.setItem('profilePicture', profileData.profilePicture || '');
        }

        // Fetch session count
        const token = localStorage.getItem('authToken');
        const decoded = token ? jwtDecode(token) : null;
        const userId = decoded?.id;

        console.log(`[React][${requestId}] Decoded userId:`, userId);
        if (!userId) {
          console.warn('No userId found in token');
          return;
        }

        const sessionData = await makeRequest('get', `/chat/session-count?userId=${userId}`, null, {}, uuidv4());

        console.log(`[React][${requestId}] Session count fetch:`, sessionData);
        setSessionCount(sessionData.sessionCount || 0);
      } catch (err) {
        console.error(`[React][${requestId}] Error fetching profile data:`, err);
        toast.error(error || 'Failed to load profile data');
        // Fallback to localStorage if API fails
        setUserEmail(localStorage.getItem('userEmail') || '');
        setUserName(localStorage.getItem('userName') || '');
        setNewName(localStorage.getItem('userName') || '');
        setProfilePicture(localStorage.getItem('profilePicture') || '');
      }
    };

    fetchProfileData();
  }, [makeRequest, error]);

  // Change name functionality
  const handleNameChange = async () => {
    const requestId = uuidv4();
    try {
      const email = localStorage.getItem('userEmail');
      const response = await makeRequest('put', '/auth/update-name', {
        email,
        name: newName,
      }, {}, requestId);

      console.log(`[React][${requestId}] update-name response:`, response);
      if (response) {
        setIsEditingName(false);
        toast.success('Name updated successfully!');

        // Re-fetch profile to sync name and updatedAt
        const profileData = await makeRequest('get', '/chat/profile', null, {}, uuidv4());

        console.log(`[React][${requestId}] Profile fetch after update:`, profileData);
        if (profileData && profileData.displayName) {
          setUserName(profileData.displayName);
          setNewName(profileData.displayName);
          localStorage.setItem('userName', profileData.displayName);
          setLastUpdated(profileData.updatedAt || null);
        }
      }
    } catch (err) {
      console.error(`[React][${requestId}] Error updating name:`, err);
      toast.error(error || 'Failed to update name');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('profilePicture');
    localStorage.removeItem('userName');
    toast.success('Logged out successfully!');
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  };

  return (
    <div className="flex-1 flex flex-col h-full transition-all duration-300 bg-gray-50 dark:bg-[#171717] overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className={`w-full max-w-3xl bg-white dark:bg-[#232323] rounded-2xl shadow-xl p-8 flex flex-col items-center transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
            {/* Profile Icon and Info */}
            <div className="flex flex-col items-center w-full mb-8">
              {/* Profile Icon */}
              <div className="flex justify-center w-full mb-3">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-black flex items-center justify-center overflow-hidden">
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={() => setProfilePicture('')}
                    />
                  ) : (
                    <span className="text-4xl md:text-5xl text-white font-semibold">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Name & Email */}
              <div className="text-center w-full">
                <div className="flex items-center justify-center gap-2">
                  {isEditingName ? (
                    <>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 px-1"
                        autoFocus
                      />
                      <button
                        onClick={handleNameChange}
                        className="text-blue-500 hover:text-blue-600 text-sm"
                        disabled={isLoading}
                      >
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white break-words">
                        {userName || 'User'}
                      </div>
                      <button
                        onClick={() => {
                          setNewName(userName);
                          setIsEditingName(true);
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <IoPencilOutline size={16} />
                      </button>
                    </>
                  )}
                </div>
                <div className="text-gray-500 text-sm md:text-base break-words mb-4">
                  {userEmail || 'user@example.com'}
                </div>
              </div>

              {/* Stats */}
              <div className="flex justify-center gap-6 text-gray-600 dark:text-gray-300">
                <div className="text-center">
                  <div className="font-semibold">{sessionCount}</div>
                  <div className="text-sm">Chats</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">4</div>
                  <div className="text-sm">Roles</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">89%</div>
                  <div className="text-sm">Rating</div>
                </div>
              </div>
            </div>

            {/* Settings Section */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-[#1E1E1E] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <IoPersonOutline className="mr-2 text-[#024DAE]" size={20} />
                  Account Settings
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Email Notifications</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#024DAE]"></div>
                    </label>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Dark Mode</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={darkMode}
                        onChange={() => setDarkMode((prev) => !prev)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#024DAE]"></div>
                    </label>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Chat History</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#024DAE]"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-[#1E1E1E] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <IoStatsChartOutline className="mr-2 text-[#024DAE]" size={20} />
                  Recent Activity
                </h2>
                <div className="space-y-3">
                  <div className="bg-white dark:bg-[#232323] rounded-lg p-3 flex items-center">
                    <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg mr-3">
                      <FiUser className="text-[#024DAE]" size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Profile Updated</div>
                      <div className="text-xs text-left text-gray-500">
                        {lastUpdated
                          ? `${formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}`
                          : 'Loading...'}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#232323] rounded-lg p-3 flex items-center">
                    <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-lg mr-3">
                      <IoNotificationsOutline className="text-purple-600" size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">New Chat Session</div>
                      <div className="text-xs text-left text-gray-500">Yesterday</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <button className="flex items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 dark:bg-[#1E1E1E] dark:hover:bg-[#252525] rounded-xl transition-colors">
                  <IoShieldOutline className="text-[#024DAE]" size={20} />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Security</span>
                </button>
                <button className="flex items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 dark:bg-[#1E1E1E] dark:hover:bg-[#252525] rounded-xl transition-colors">
                  <IoHelpCircleOutline className="text-[#024DAE]" size={20} />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Help</span>
                </button>
                <button className="flex items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 dark:bg-[#1E1E1E] dark:hover:bg-[#252525] rounded-xl transition-colors">
                  <FiSettings className="text-[#024DAE]" size={20} />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-red-50 dark:bg-[#1E1E1E-1E1E1E] dark:hover:bg-[#2a2323] rounded-xl transition-colors text-red-600"
                >
                  <IoLogOutOutline size={20} />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;