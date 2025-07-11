import { useState, useEffect } from 'react';
import { IoLogOutOutline, IoSettingsOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ProfileIcon = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [firstLetter, setFirstLetter] = useState('');
    const [profilePicture, setProfilePicture] = useState('');
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const email = localStorage.getItem('userEmail');
        const picture = localStorage.getItem('profilePicture');
        const name = localStorage.getItem('userName');
        
        console.log('=== ProfileIcon Debug ===');
        console.log('Email from localStorage:', email);
        console.log('Profile picture from localStorage:', picture);
        
        if (email) {
            setFirstLetter(email.charAt(0).toUpperCase());
            setUserEmail(email);
        }
        if (name) {
            setUserName(name);
        } else if (email) {
            // Fallback: use part before @ as name
            setUserName(email.split('@')[0]);
        }
        if (picture) {
            console.log('Setting profile picture:', picture);
            setProfilePicture(picture);
        }
    }, []);

    // Add debug log when profile picture changes
    useEffect(() => {
        console.log('Profile picture state updated:', profilePicture);
    }, [profilePicture]);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('profilePicture');
        toast.success('Logged out successfully!');
        
        // Delay the page reload to show the toast
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-lg font-semibold hover:bg-black transition-colors overflow-hidden dark:bg-white dark:text-black"
                aria-label="Profile menu"
            >
                {profilePicture ? (
                    <img 
                        src={profilePicture} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            console.error('Error loading profile picture:', e);
                            setProfilePicture('');
                        }}
                    />
                ) : (
                    firstLetter
                )}
            </button>

            {showDropdown && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg py-3 z-50 border border-gray-100 dark:border-gray-700">
                        <div className="px-5 pb-3 text-left">
                            <div className="font-semibold text-gray-900 dark:text-gray-100 text-base leading-tight">{userName || 'User'}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm truncate">{userEmail || 'user@example.com'}</div>
                        </div>
                        <hr className="my-1 border-gray-200 dark:border-gray-700" />
                        <button
                            className="w-full flex items-center px-5 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-base"
                            onClick={() => { setShowDropdown(false); navigate('/settings'); }}
                        >
                            <IoSettingsOutline className="mr-2 text-lg" />
                            <span>Settings</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-5 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-base"
                        >
                            <IoLogOutOutline className="mr-2 text-lg text-red-600 dark:text-red-400" />
                            <span>Logout</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProfileIcon; 