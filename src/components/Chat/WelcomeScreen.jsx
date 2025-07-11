
import { useState, useEffect, useRef } from 'react';
import { IoAttachOutline, IoMicOutline } from 'react-icons/io5';
import { FaArrowRight } from 'react-icons/fa';

const prompts = [
  "How can I support you today in your learning or work?",
  "Stuck somewhere? Let's figure it out together.",
  "Need help brainstorming an idea or solving a problem?",
  "What’s something you’ve been curious about lately?",
  "Tell me your goal—I’ll help you reach it faster.",
  "Let’s turn your thoughts into action.",
  "Ask anything, from career tips to code fixes.",
  "What challenge can I help you tackle today?",
  "Feeling stuck? I’m here to lend a hand.",
  "Got a task in mind? Let’s break it down together.",
  "Have a project you're working on? Need feedback?",
  "Let’s make progress together, one step at a time.",
  "Need help drafting something? Let’s co-create.",
  "Ask me anything — even if it's just a shower thought!"
];

const WelcomeScreen = ({ input, setInput, handleFormSubmit, handleRoleSelect, currentRole, handleMicClick, isLoading }) => {
  const [randomPrompt, setRandomPrompt] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * prompts.length);
    setRandomPrompt(prompts[randomIndex]);
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const autoResizeTextarea = (e) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    const maxHeight = 160;
    if (textarea.scrollHeight > maxHeight) {
      textarea.style.overflowY = 'auto';
      textarea.style.height = `${maxHeight}px`;
    } else {
      textarea.style.overflowY = 'hidden';
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    autoResizeTextarea(e);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleFormSubmit(e);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <div className="text-center w-full max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold text-black dark:text-white md:mb-6">OneClarity</h1>
        <p className="text-gray-600 mb-6 md:mb-8 text-sm md:text-base px-1 dark:text-white">
          {randomPrompt}
        </p>
        <div className="flex flex-col items-center w-full max-w-3xl mx-auto">
          <div className="w-full">
            <form onSubmit={handleFormSubmit} className="w-full">
              <div className="w-full bg-white dark:bg-[#171717] rounded-2xl border shadow-sm px-4 pt-2 pb-1 transition-all relative flex flex-col">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Ask anything"
                  className="bg-transparent outline-none border-none resize-none text-base text-gray-800 dark:text-white min-h-[40px] max-h-[160px] px-0 py-1 mb-2 overflow-y-auto"
                  rows={1}
                />
                <div className="flex items-center justify-between w-full px-1 pb-1 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="relative group">
                      <button
                        type="button"
                        className="text-2xl text-gray-500 flex-shrink-0 hover:text-[#474747] transition-transform duration-150"
                        aria-label="Upload File"
                      >
                        <IoAttachOutline />
                      </button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-10">
                        This feature will be available soon
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative group">
                      <button
                        type="button"
                        onClick={handleMicClick}
                        className="text-2xl text-gray-500 flex-shrink-0 mx-1 hover:text-[#474747] transition-transform duration-150"
                        aria-label="Mic"
                      >
                        <IoMicOutline />
                      </button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-10">
                        Dictate
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="mb-2 flex items-center justify-center rounded-full w-9 h-9 transition-all duration-150 
                                 bg-black text-white hover:opacity-90 
                                 dark:bg-white dark:text-black 
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!input.trim()}
                      aria-label="Send"
                    >
                      <span className="sr-only">Send</span>
                      <FaArrowRight size={12} className="transition-colors duration-150" />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            {[
              { key: 'friend', label: 'Friend' },
              { key: 'mentor', label: 'Mentor' },
              { key: 'college buddy', label: 'College Buddy' },
            ].map((role) => (
              <button
                key={role.key}
                onClick={() => handleRoleSelect(role.key)}
                className={`px-8 py-3 rounded-xl border transition-all font-medium text-lg shadow-sm
                  ${currentRole === role.key
                    ? 'bg-white border-gray-300 text-black ring-1 ring-[#474747] shadow-xl dark:bg-[#232323] dark:text-white dark:border-white dark:ring-1 dark:ring-white'
                    : 'bg-gray-100 border-gray-200 text-black hover:border-[#47474] hover:shadow-xl shadow-md hover:bg-white dark:bg-[#232323] dark:text-white dark:border-transparent'}
                `}
                style={{ minWidth: '180px' }}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
