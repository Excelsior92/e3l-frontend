import React from "react";
import { IoMoonOutline, IoSunnyOutline } from "react-icons/io5";
import ProfileIcon from "../Profile/ProfileIcon";

const Header = ({ isDarkMode, toggleDarkMode, onShowProfile }) => {
  return (
    <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 bg-white dark:bg-gray-900 sticky top-0 z-20">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white"></h1>
      </div>
      <div className="flex items-center space-x-4">
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
        {localStorage.getItem("authToken") && (
          <ProfileIcon onShowProfile={onShowProfile} />
        )}
      </div>
    </div>
  );
};

export default Header;
