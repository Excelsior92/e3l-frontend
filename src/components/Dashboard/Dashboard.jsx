import React, { useEffect, useState } from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import axios from 'axios';

const Dashboard = ({ isSidebarOpen }) => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [items, setItems] = useState([]);
  const [uniqueSkills, setUniqueSkills] = useState([]);

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/learning-items', {
          params: { userId },
        });
        setItems(res.data);

        const skills = [...new Set(res.data.map((item) => item.skill))];
        setUniqueSkills(['All', ...skills]);
      } catch (err) {
        console.error('Failed to fetch items:', err);
      }
    };

    if (userId) {
      fetchItems();
    }
  }, [userId]);

  const filteredItems = items.filter((item) => {
    return (
      item.type === activeTab.slice(0, -1) &&
      (selectedCategory === 'All' || item.skill === selectedCategory)
    );
  });

  const parseContent = (text) => {
    let cleaned = text.replace(/[\*\[\]]/g, '');
    cleaned = cleaned.replace(/\[(.*?)\]\((https?:\/\/[^)]+)\)/g, (_, label, url) => {
      return `<a href="${url}" class="text-blue-600 dark:text-blue-400 underline" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });
    cleaned = cleaned.replace(/:\s*/, ':<br/>');
    return cleaned;
  };

  const toggleDone = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item._id === id
          ? { ...item, status: item.status === 'done' ? 'pending' : 'done' }
          : item
      )
    );
  };

  return (
    <div
      className={`w-full dark:bg-[#191A1A] h-screen overflow-y-auto px-6 pt-4 pb-10 transition-all duration-300 ${
        isSidebarOpen ? 'ml-[235px]' : 'ml-0'
      }`}
      style={{ maxWidth: isSidebarOpen ? 'calc(100% - 240px)' : '100%' }}
    >
      <h1 className="text-left text-2xl font-bold mb-6 text-gray-900 dark:text-white">Dashboard</h1>

      {/* Tabs */}
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-lg font-medium text-sm border transition-colors
            ${
              activeTab === 'tasks'
                ? 'bg-black text-white border-black'
                : 'bg-transparent text-gray-800 border-gray-300 dark:text-white dark:border-gray-600'
            }
          `}
        >
          Tasks
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`px-4 py-2 rounded-lg font-medium text-sm border transition-colors
            ${
              activeTab === 'resources'
                ? 'bg-black text-white border-black'
                : 'bg-transparent text-gray-800 border-gray-300 dark:text-white dark:border-gray-600'
            }
          `}
        >
          Resources
        </button>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-6">
        {uniqueSkills.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors
              ${
                selectedCategory === cat
                  ? 'bg-black text-white border-black'
                  : 'bg-transparent text-gray-800 border-gray-300 dark:text-white dark:border-gray-600'
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="w-full">
        {activeTab === 'tasks' ? (
          filteredItems.map((item, index) => (
            <div
              key={item._id}
              className="p-4 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-lg shadow flex items-start gap-3 mb-4"
            >
              <div className="mt-1">
                <input
                  type="checkbox"
                  checked={item.status === 'done'}
                  onChange={() => toggleDone(item._id)}
                  className="w-5 h-5 rounded focus:ring-2 focus:ring-black text-black"
                />
              </div>
              <div className="flex-1">
                <p className="text-left text-sm text-gray-800 dark:text-gray-100 mb-3">
                  <span dangerouslySetInnerHTML={{ __html: parseContent(item.content) }} />
                </p>
                <div className="flex gap-2 text-xs">
                  <button
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                    onClick={() => toggleDone(item._id)}
                  >
                    Mark as done
                  </button>
                  <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">
                    Need Help
                  </button>
                  <button className="ml-auto text-blue-600 dark:text-blue-400 hover:underline">
                    Remind me
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {filteredItems.map((item, index) => (
              <div
                key={item._id}
                className="p-4 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-lg shadow flex flex-col"
              >
                <p
                  className="text-sm text-gray-800 dark:text-gray-100 mb-3 text-left"
                  dangerouslySetInnerHTML={{ __html: parseContent(item.content) }}
                />
                {/* <div className="w-full h-20 bg-gray-200 dark:bg-gray-600 mb-4"></div> */}
                <div className="flex flex-col sm:flex-row gap-2 text-xs justify-start">
                  <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">
                    {item.type === 'video' ? 'Watch Video' : 'Start Learning'}
                  </button>
                  <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">
                    Need Help
                  </button>
                  <button className="text-blue-600 dark:text-blue-400 hover:underline">
                    Remind me
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;