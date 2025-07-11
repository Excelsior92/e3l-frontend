import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  IoSend,
  IoAttachOutline,
  IoCloudUploadOutline,
  IoImageOutline,
  IoDocumentOutline,
  IoClose,
  IoMenu,
  IoAdd,
  IoMicOutline,
  IoOptionsOutline,
  IoStarOutline,
  IoBulbOutline,
  IoCopyOutline,
} from "react-icons/io5";
import AuthPopup from "../Auth/AuthPopup";
import ProfileIcon from "../Profile/ProfileIcon";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { API_URL } from "../../config";
import { toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { IoMic } from "react-icons/io5";
import { FaArrowCircleRight, FaArrowRight } from "react-icons/fa";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { BookOpen, ClipboardList } from "lucide-react";
import { IoArrowBack } from "react-icons/io5";
import { saveTasksAndResourcesToBackend } from "../../utils/saveLearningItems";

// Implement real saveMessageToHistory
const saveMessageToHistory = async (
  userMessage,
  aiMessage,
  sessionId,
  isNewChat,
  role = "friend"
) => {
  try {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) return;

    const response = await axios.post(
      `${API_URL}/chat/save`,
      {
        message: userMessage,
        aiResponse: aiMessage,
        sessionId: sessionId,
        isNewChat: isNewChat,
        role: role,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error saving chat to MongoDB:", error);
  }
};

// Function to extract Resources
function extractResources(text) {
  const lines = text.split("\n");
  const resourceLines = [];
  let isInResourceSection = false;

  for (let line of lines) {
    // Match any heading containing "resources" (case-insensitive)
    if (/^##+\s*.*resources.*$/i.test(line.trim())) {
      isInResourceSection = true;
      continue;
    }

    // Stop collecting when we hit another major heading
    if (isInResourceSection && /^##+\s/i.test(line.trim())) {
      isInResourceSection = false;
      continue;
    }

    if (isInResourceSection && line.trim()) {
      resourceLines.push(line.trim());
    }
  }

  return resourceLines;
}
function stripMarkdown(text) {
  return text
    .replace(/(\*\*|__)(.*?)\1/g, "$2") // remove bold **text** or __text__
    .replace(/(\*|_)(.*?)\1/g, "$2") // remove italic *text* or _text_
    .replace(/`([^`]+)`/g, "$1"); // remove inline code `text`
}

// Function to extract Tasks
function extractTasks(text) {
  const lines = text.split("\n");
  const taskLines = [];
  let isInTaskSection = false;

  for (let line of lines) {
    // Match any heading containing "task" (case-insensitive)
    if (/^##+\s*.*task.*$/i.test(line.trim())) {
      isInTaskSection = true;
      continue;
    }

    // Stop collecting when we hit another major heading
    if (isInTaskSection && /^##+\s/i.test(line.trim())) {
      isInTaskSection = false;
      continue;
    }

    if (isInTaskSection && line.trim()) {
      taskLines.push(line.trim());
    }
  }

  return taskLines;
}

const ChatInterface = ({
  isSidebarOpen,
  currentChat,
  setCurrentChat,
  onNewChat,
}) => {
  const [messages, setMessages] = useState(() => {
    if (currentChat) {
      const msgs = currentChat.messages
        .map((msg) => ({
          type: "user",
          content: msg.userMessage.content,
          timestamp: msg.userMessage.timestamp,
          response: {
            content: msg.aiResponse.content,
            timestamp: msg.aiResponse.timestamp,
          },
        }))
        .reduce(
          (acc, msg) => [
            ...acc,
            { type: "user", content: msg.content, timestamp: msg.timestamp },
            {
              type: "ai",
              content: msg.response.content,
              timestamp: msg.response.timestamp,
            },
          ],
          []
        );
      return msgs;
    }
    const savedMessages = localStorage.getItem("tempChatMessages");
    const msgs = savedMessages ? JSON.parse(savedMessages) : [];
    return msgs;
  });

  const [sessionId, setSessionId] = useState(() => {
    if (currentChat?._id) return currentChat._id;
    const savedSessionId = localStorage.getItem("currentChatSession");
    return savedSessionId || null;
  });

  const [input, setInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatCount, setChatCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const messagesContainerRef = useRef(null);
  const [currentRole, setCurrentRole] = useState(null);
  const welcomeTextareaRef = useRef(null);
  const chatTextareaRef = useRef(null);

  // New state for modals and extracted data
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState([]);
  const [extractedResources, setExtractedResources] = useState([]);
  const [allSkillData, setAllSkillData] = useState({});
  const [selectedSkill, setSelectedSkill] = useState(null);

  // Speech recognition
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
  }

  //new dyanamic use state
  // const [dynamicPlaceholder, setDynamicPlaceholder] = useState("Ask anything");

  const handleMicClick = () => {
    if (!recognition) {
      alert("Speech Recognition not supported in your browser.");
      return;
    }

    recognition.start();

    recognition.onstart = () => {
      console.log("Voice recognition started...");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("Transcript:", transcript);
      setInput((prevInput) => prevInput + (prevInput ? " " : "") + transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      console.log("Voice recognition ended.");
    };
  };

  // Effect to handle chat state changes
  useEffect(() => {
    if (currentChat === null) {
      setMessages([]);
      setInput("");
      setIsChatting(false);
      setChatCount(0);
      setSessionId(null);
      setCurrentRole(null);
      setSelectedMessage(null);
      setExtractedTasks([]);
      setExtractedResources([]);
      return;
    }
    if (currentChat && currentChat._id) {
      loadExistingChat(currentChat);
    }
  }, [currentChat]);

  const loadExistingChat = (chat) => {
    const formattedMessages = chat.messages.reduce(
      (acc, msg) => [
        ...acc,
        {
          role: "user",
          content: msg.userMessage.content,
          timestamp: msg.userMessage.timestamp,
        },
        {
          role: "assistant",
          content: msg.aiResponse.content,
          timestamp: msg.aiResponse.timestamp,
        },
      ],
      []
    );

    setMessages(formattedMessages);
    setSessionId(chat._id);
    setIsChatting(formattedMessages.length > 0);

    // 🧠 Extract tasks/resources per skill from assistant messages
    const updatedSkillData = {};

    formattedMessages.forEach((msg) => {
      if (msg.role === "assistant") {
        const tasks = extractTasks(msg.content);
        const resources = extractResources(msg.content);
        const skill = inferSkillFromMessage(msg.content);
        if (!skill) return; // ⛔ skip if no skill heading

        if (!updatedSkillData[skill]) {
          updatedSkillData[skill] = {
            tasks: [],
            resources: [],
          };
        }

        if (tasks.length > 0) {
          updatedSkillData[skill].tasks.push(...tasks);
        }

        if (resources.length > 0) {
          updatedSkillData[skill].resources.push(...resources);
        }
      }
    });

    setAllSkillData(updatedSkillData); // 🔄 Set state to power modals
  };

  function inferSkillFromMessage(content) {
    const match = content.match(/### (?:Task List|Resources) for (.+)/i);
    return match ? match[1].trim() : null;
  }

  // Update isChatting based on messages
  useEffect(() => {
    if (messages.length === 0 && isChatting) {
      setIsChatting(false);
    } else if (messages.length > 0 && !isChatting) {
      setIsChatting(true);
    }
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const { scrollHeight, clientHeight } = messagesContainerRef.current;
      messagesContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Use effect to show the auth popup after 3 chats
  const lastAuthPopupShownAt = useRef(0);

  useEffect(() => {
    const isAuth = !!localStorage.getItem("authToken");
    const shouldShow = chatCount > 0 && chatCount % 3 === 0;

    if (!isAuth && shouldShow && chatCount !== lastAuthPopupShownAt.current) {
      setShowAuthPopup(true);
      lastAuthPopupShownAt.current = chatCount;
    }
  }, [chatCount, messages]);

  // Cleanup temporary messages after successful authentication
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (authToken) {
      localStorage.removeItem("tempChatMessages");
    }
  }, []);

  useEffect(() => {
    if (isChatting) {
      const textarea = chatTextareaRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = Math.min(textarea.scrollHeight, 150) + "px";
      }
    }
  }, [input, isChatting]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const autoResizeTextarea = (e) => {
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
    const maxHeight = 160;
    if (textarea.scrollHeight > maxHeight) {
      textarea.style.overflowY = "auto";
      textarea.style.height = `${maxHeight}px`;
    } else {
      textarea.style.overflowY = "hidden";
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault();
      sendMessage();
    }
  };

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
    "Ask me anything — even if it's just a shower thought!",
  ];

  const [randomPrompt, setRandomPrompt] = useState("");

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * prompts.length);
    setRandomPrompt(prompts[randomIndex]);
  }, []);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  // Replace both handleRoleSelect and newHandleRoleSelect with this
  // const handleRoleSelect = (role) => {
  //   setCurrentRole(role);

  //   // Update placeholder based on role
  //   switch (role) {
  //     case "career road map":
  //       setDynamicPlaceholder("I will provide you a road map");
  //       break;
  //     case "interview prep":
  //       setDynamicPlaceholder("Let's get you interview ready");
  //       break;
  //     case "stuck in problem":
  //       setDynamicPlaceholder("Tell me where you're stuck");
  //       break;
  //     default:
  //       setDynamicPlaceholder("Ask anything");
  //   }

  //   // Handle chat initialization for supported roles
  //   const roleMessages = {
  //     friend:
  //       "Hi! I am your friend, your supportive companion. How can I help you today?",
  //     mentor:
  //       "Hello! I’m your Mentor, here to guide you through challenges and help you grow.",
  //     collegebuddy:
  //       "Greetings! I’m your College Buddy. Let’s dive deep into your queries.",
  //   };

  //   if (roleMessages[role]) {
  //     setMessages([{ role: "assistant", content: roleMessages[role] }]);
  //     setIsChatting(true);
  //   } else {
  //     setMessages([]);
  //     setIsChatting(false);
  //   }
  // };

  const handleRoleSelect = (role) => {
    setCurrentRole(role);

    // Update input based on role
    switch (role) {
      case "career road map":
        setInput("Please provide me with a career road map.");
        break;
      case "interview prep":
        setInput("Help me prepare for an interview.");
        break;
      case "stuck in problem":
        setInput("I'm stuck on a problem. Can you help?");
        break;
      default:
        setInput("");
    }

    // Handle chat initialization for supported roles
    const roleMessages = {
      friend:
        "Hi! I am your friend, your supportive companion. How can I help you today?",
      mentor:
        "Hello! I’m your Mentor, here to guide you through challenges and help you grow.",
      collegebuddy:
        "Greetings! I’m your College Buddy. Let’s dive deep into your queries.",
    };

    if (roleMessages[role]) {
      setMessages([{ role: "assistant", content: roleMessages[role] }]);
      setIsChatting(true);
    } else {
      setMessages([]);
      setIsChatting(false);
    }
  };
  // const BASE_URL =

  //    "http://13.62.73.86:5001"; // Your production backend public IP

  // // Dynamic API paths for different roles
  // const ROLE_API_URLS = {
  //   friend: `${BASE_URL}/api/chroma/friend/chat`,
  //   mentor: `${BASE_URL}/api/chroma/mentor/chat`,
  //   college_buddy: `${BASE_URL}/api/chroma/college_buddy/chat`,
  // };

  const ROLE_API_URLS = {
    friend: "/api/chroma/friend/chat",
    mentor: "/api/chroma/mentor/chat",
    collegebuddy: "/api/chroma/collegebuddy/chat",
  };

  const sendMessage = async () => {
    const authToken = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");

    if (!input.trim()) return;

    setIsLoading(true);
    const userMessageContent = input.trim();
    const newUserMessage = { role: "user", content: userMessageContent };
    const currentConversation = [...messages, newUserMessage];
    setMessages(currentConversation);
    setInput("");
    setIsChatting(true);

    const requestId = uuidv4();
    const tSend = Date.now();
    console.log(
      `[React][${requestId}] Sending message at ${new Date().toLocaleTimeString()}`
    );

    try {
      const apiEndpoint = ROLE_API_URLS[currentRole] || ROLE_API_URLS["friend"];
      console.log(`[React][${requestId}] Making request to: ${apiEndpoint}`);

      const res = await axios.post(
        apiEndpoint,
        {
          message: userMessageContent,
          history: messages,
        },
        {
          headers: { "X-Request-Id": requestId },
        }
      );

      const tReceive = Date.now();
      console.log(
        `[React][${requestId}] Received response at ${new Date().toLocaleTimeString()} (duration: ${(
          (tReceive - tSend) /
          1000
        ).toFixed(2)}s)`
      );

      const amigoResponseText = res.data.answer;
      console.log(`[React][${requestId}] Amigo response:`, amigoResponseText);

      const domains = res.data.domains || [];
      domains.forEach((domain) => {
        setAllSkillData((prev) => ({
          ...prev,
          [domain]: {
            tasks: extractTasks(amigoResponseText),
            resources: extractResources(amigoResponseText),
          },
        }));
      });
      console.log("✅ All Skill Data So Far:", allSkillData);

      // Extract tasks/resources + skill
      const tasks = extractTasks(amigoResponseText);
      const resources = extractResources(amigoResponseText);
      const skillMatches = amigoResponseText.match(
        /### (?:Task List|Resources) for (.+)/i
      );
      const currentSkill = skillMatches ? skillMatches[1].trim() : null;

      // ✅ Save to backend
      if (authToken && userId && currentSkill) {
        saveTasksAndResourcesToBackend({
          tasks,
          resources,
          userId,
          persona: currentRole || "friend",
          skill: currentSkill,
        });
      }

      // ✅ Update frontend skill state
      if (currentSkill) {
        setAllSkillData((prev) => ({
          ...prev,
          [currentSkill]: {
            tasks,
            resources,
          },
        }));
        setSelectedSkill(currentSkill);
      }

      // Debug logs
      console.log("Extracted Resources:", resources);
      console.log("Extracted Tasks:", tasks);

      // Set extracted content in state
      setExtractedTasks(tasks);
      setExtractedResources(resources);

      // Push AI response to chat
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: amigoResponseText },
      ]);

      setChatCount((prev) => prev + 1);

      // Save chat history
      if (authToken) {
        const savedChat = await saveMessageToHistory(
          userMessageContent,
          amigoResponseText,
          sessionId,
          !sessionId,
          currentRole || "friend"
        );

        if (savedChat && savedChat.sessionId) {
          setSessionId(savedChat.sessionId);
        }
      } else {
        let tempMessages = JSON.parse(
          localStorage.getItem("tempChatMessages") || "[]"
        );
        tempMessages.push({
          type: "user",
          content: userMessageContent,
          timestamp: new Date().toISOString(),
          role: currentRole || "friend",
        });
        tempMessages.push({
          type: "ai",
          content: amigoResponseText,
          timestamp: new Date().toISOString(),
          role: currentRole || "friend",
        });
        localStorage.setItem("tempChatMessages", JSON.stringify(tempMessages));
      }
    } catch (err) {
      console.error(
        `[React][${requestId}] Error communicating with Amigo service:`,
        err
      );
      console.error(`[React][${requestId}] Error details:`, {
        message: err.message,
        code: err.code,
        response: err.response?.status,
        responseData: err.response?.data,
      });

      let errorMessage =
        "Amigo: I'm having trouble connecting right now. Please try again.";
      if (err.response) {
        errorMessage = `Amigo: Server Error (${err.response.status}): ${
          err.response.data.error || "Something went wrong."
        }`;
      } else if (err.request) {
        errorMessage =
          "Amigo: I can't reach my server. Please check if the backend services are running.";
      }

      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: errorMessage },
      ]);
      setIsChatting(messages.length > 0);
    } finally {
      setIsLoading(false);
      const tEnd = Date.now();
      console.log(
        `[React][${requestId}] sendMessage finished at ${new Date().toLocaleTimeString()} (total round-trip: ${(
          (tEnd - tSend) /
          1000
        ).toFixed(2)}s)`
      );
    }
  };

  const preprocessMathBlocks = (text) => {
    return text
      .replace(/\[\s*\\([^]*?)\s*\]/g, (_, math) => `$$${math.trim()}$$`)
      .replace(/\(\s*\\([^)]*?)\s*\)/g, (_, math) => `\\(${math.trim()}\\)`)
      .replace(/\\,| , /g, " \\, ");
  };

  const handleCopy = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success("Copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        toast.error("Failed to copy to clipboard");
      });
  };

  const handleViewFullMessage = async (messageId) => {
    try {
      const response = await axios.get(`${API_URL}/chat/${messageId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      setSelectedMessage(response.data.message);
    } catch (error) {
      console.error("Error fetching full message:", error);
    }
  };

  const renderMarkdown = (content, role, index) => {
    try {
      if (!content) {
        return <span className="text-gray-400 italic">No content</span>;
      }

      const sanitizedContent = content.toString().trim();

      return (
        <div className="prose prose-base max-w-full dark:prose-invert px-4 sm:px-6 lg:px-4 w-full overflow-x-hidden min-w-0">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              code({ node, inline, className, children, ...props }) {
                return inline ? (
                  <code
                    className="bg-gray-200 text-sm rounded px-1 break-words max-w-full inline-block dark:bg-gray-100 dark:text-gray-900 text-black"
                    {...props}
                  >
                    {children}
                  </code>
                ) : (
                  <pre className="text-sm p-4 rounded-lg my-4 overflow-x-auto max-w-full bg-gray-100 text-black dark:bg-gray-100 dark:text-gray-900 border border-gray-300 dark:border-gray-600">
                    <code {...props}>{children}</code>
                  </pre>
                );
              },
              p({ children }) {
                return (
                  <p className="mb-4 last:mb-0 text-base leading-relaxed break-words text-black dark:text-white">
                    {children}
                  </p>
                );
              },
              ul({ children }) {
                return (
                  <ul className="list-disc pl-5 mb-4 last:mb-0 text-base text-black dark:text-white">
                    {children}
                  </ul>
                );
              },
              ol({ children }) {
                return (
                  <ol className="list-decimal pl-5 mb-4 last:mb-0 text-base [&>li]:text-base text-black dark:text-white">
                    {children}
                  </ol>
                );
              },
              li({ children }) {
                return (
                  <li className="mb-1 last:mb-0 text-base font-normal text-black dark:text-white">
                    {children}
                  </li>
                );
              },
              a({ href, children }) {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {children}
                  </a>
                );
              },
              strong({ children }) {
                return (
                  <strong className="text-base font-semibold text-black dark:text-white">
                    {children}
                  </strong>
                );
              },
              em({ children }) {
                return (
                  <em className="italic text-base my-2 text-black dark:text-white">
                    {children}
                  </em>
                );
              },
              h1({ children }) {
                return (
                  <h1 className="text-2xl font-bold mb-4 mt-6 text-black dark:text-white">
                    {children}
                  </h1>
                );
              },
              h2({ children }) {
                return (
                  <h2 className="text-xl font-semibold mb-3 mt-5 text-black dark:text-white">
                    {children}
                  </h2>
                );
              },
              h3({ children }) {
                return (
                  <h3 className="text-lg font-semibold mb-2 mt-4 text-black dark:text-white">
                    {children}
                  </h3>
                );
              },
              h4({ children }) {
                return (
                  <h4 className="text-base font-medium mb-2 mt-3 text-black dark:text-white">
                    {children}
                  </h4>
                );
              },
              h5({ children }) {
                return (
                  <h5 className="text-base font-medium mb-2 mt-3 text-black dark:text-white">
                    {children}
                  </h5>
                );
              },
              h6({ children }) {
                return (
                  <h6 className="text-sm font-medium mb-2 mt-2 text-black dark:text-white">
                    {children}
                  </h6>
                );
              },
            }}
          >
            {sanitizedContent}
          </ReactMarkdown>
        </div>
      );
    } catch (error) {
      return (
        <p className="text-red-500">
          Error rendering message. Raw content: {content}
        </p>
      );
    }
  };

  const getRoleStyle = (role) => {
    switch (role) {
      case "friend":
        return "bg-blue-50 border-blue-200 text-gray-800 dark:bg-transparent dark:border-none dark:text-white";
      case "mentor":
        return "bg-purple-50 border-purple-200 text-gray-800 dark:bg-transparent dark:border-none dark:text-white";
      case "collegebuddy":
        return "bg-green-50 border-green-200 text-gray-800 dark:bg-transparent dark:border-none dark:text-white";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800 dark:bg-transparent dark:border-none dark:text-white";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "friend":
        return "👨‍🏫";
      case "mentor":
        return "🧠";
      case "collegebuddy":
        return "📋";
      default:
        return "🤖";
    }
  };

  function renderGroupedResources(resourceInput) {
    // Normalize input: convert string to array if needed
    const resourceLinesRaw = Array.isArray(resourceInput)
      ? resourceInput
      : String(resourceInput).split("\n");

    // Skip last 2 lines
    const resourceLines = resourceLinesRaw.slice(0, -1);

    console.log("Resource Lines:", resourceLines);
    const handleCopy = (text) => {
      navigator.clipboard.writeText(text).then(() => {
        // Optional: Toast or alert
        console.log("Copied!");
      });
    };

    const groupedResources = [];
    let currentGroup = [];

    resourceLines.forEach((line, index) => {
      if (line.includes(". **") && /^\d+\.\s\*\*/.test(line)) {
        if (currentGroup.length > 0) {
          groupedResources.push(currentGroup);
          currentGroup = [];
        }
      }

      currentGroup.push(line);

      // If it's the last line, push the final group
      if (index === resourceLines.length - 1 && currentGroup.length > 0) {
        groupedResources.push(currentGroup);
      }
    });

    return (
      <div className="space-y-6">
        {groupedResources.map((group, groupIndex) => {
          const headingLine = group.find(
            (line) => line.includes(". **") && /^\d+\.\s\*\*/.test(line)
          );
          const description = group.filter(
            (line) => !line.includes(". **") || !/^\d+\.\s\*\*/.test(line)
          );
          const headingText = headingLine
            ? headingLine.replace(/^\d+\.\s\*\*(.+?)\*\*$/, "$1").trim()
            : "";

          return (
            <div
              key={groupIndex}
              className="p-4 bg-gray-50 dark:bg-[#232323] rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors duration-200"
            >
              <h4 className="text-left text-lg font-semibold text-gray-900 dark:text-white">
                {stripMarkdown(headingText)}
              </h4>

              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      {children}
                    </a>
                  ),
                  p: ({ children }) => (
                    <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
                      {children}
                    </p>
                  ),
                  li: ({ children }) => (
                    <li className="text-left text-gray-800 dark:text-gray-200 text-sm leading-relaxed ml-4">
                      {children}
                    </li>
                  ),
                }}
              >
                {description.join("\n")}
              </ReactMarkdown>
            </div>
          );
        })}
      </div>
    );
  }

  const [checkedStates, setCheckedStates] = useState({});

  function renderGroupedTasks(taskInput) {
    const taskLines = Array.isArray(taskInput)
      ? taskInput
      : String(taskInput).split("\n");

    const groupedTasks = [];
    let currentGroup = [];

    taskLines.forEach((line, index) => {
      if (line.includes(". **") && /^\d+\.\s\*\*/.test(line)) {
        if (currentGroup.length > 0) {
          groupedTasks.push(currentGroup);
          currentGroup = [];
        }
      }

      currentGroup.push(line);

      if (index === taskLines.length - 1 && currentGroup.length > 0) {
        groupedTasks.push(currentGroup);
      }
    });

    return (
      <div className="space-y-6">
        {groupedTasks.map((group, groupIndex) => {
          const headingLine = group.find(
            (line) => line.includes(". **") && /^\d+\.\s\*\*/.test(line)
          );
          const description = group.filter(
            (line) => !line.includes(". **") || !/^\d+\.\s\*\*/.test(line)
          );
          const headingText = headingLine
            ? headingLine.replace(/^\d+\.\s\*\*(.+?)\*\*$/, "$1").trim()
            : "";

          return (
            <div
              key={groupIndex}
              className="p-4 bg-gray-50 dark:bg-[#232323] rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors duration-200"
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`taskCheckbox-${groupIndex}`}
                  checked={checkedStates[groupIndex] || false}
                  onChange={(e) => {
                    const authToken = localStorage.getItem("authToken");
                    if (!authToken) {
                      setShowAuthPopup(true);
                      return;
                    }

                    setCheckedStates((prev) => ({
                      ...prev,
                      [groupIndex]: !prev[groupIndex],
                    }));
                  }}
                  className="mr-2 h-5 w-5 text-black border-gray-300 rounded focus:ring-black dark:bg-[#2a2a2a] dark:border-gray-600 dark:checked:bg-black dark:focus:ring-black"
                />

                <h4 className="text-left text-lg font-semibold text-gray-900 dark:text-white">
                  {stripMarkdown(headingText)}
                </h4>
              </div>

              <div className="list-disc pl-6 text-left">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        {children}
                      </a>
                    ),
                    p: ({ children }) => (
                      <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
                        {children}
                      </p>
                    ),
                    li: ({ children }) => (
                      <li className="list-item list-disc ml-4 text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
                        {children}
                      </li>
                    ),
                  }}
                >
                  {["", ...description, ""].join("\n")}
                </ReactMarkdown>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  console.log("🔍 Modal Check:", {
    selectedSkill,
    allSkillData: Object.keys(allSkillData),
  });
  return (
    <div
      className={`h-full flex flex-col transition-all duration-300 ${
        isSidebarOpen ? "md:ml-64" : "md:ml-16"
      } bg-white dark:bg-gradient-to-br dark:from-[#000000] dark:to-[#1f1f1f]`}
    >
      <div className="block md:hidden w-full bg-white dark:bg-[#191A1A fixed top-0 left-0 z-20">
        <div className="flex items-center justify-between px-4 h-14">
          <span className="w-6 h-6"></span>
          <span className="font-bold text-lg text-[#024DAE] dark:text-white text-center">
            OneClarity
          </span>
          <button
            className="flex items-center justify-center w-6 h-6 text-gray-600 dark:text-gray-400"
            onClick={onNewChat}
          >
            <IoAdd size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col pt-14 md:pt-0 h-full min-h-0">
        <style>{`
                    @media (min-width: 768px) {
                        .chat-padding-desktop { padding-top: 64px !important; }
                        .chat-font-desktop { font-size: 0.95rem !important; }
                    }
                    .chat-font-mobile { font-size: 0.98rem !important; }
                `}</style>
        {!isChatting ? (
          <div className="flex flex-col items-center justify-center h-full w-full">
            <div className="text-center w-full max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-7xl font-bold text-black dark:text-white md:mb-4">
                OneClarity
              </h1>
              <p className="text-gray-600 mb-6 md:mb-8 text-sm md:text-base px-1 dark:text-white">
                {randomPrompt}
              </p>
              <div className="flex flex-col items-center w-full max-w-3xl mx-auto">
                <div className="w-full">
                  <form onSubmit={handleFormSubmit} className="w-full">
                    <div className="w-full bg-white dark:bg-[#141313]  rounded-3xl border border-gray-500 shadow-sm px-4 pb-4 pt-5 h-36 transition-all relative  flex flex-col">
                      <textarea
                        ref={chatTextareaRef}
                        value={input}
                        onChange={(e) => {
                          handleInputChange(e);
                          autoResizeTextarea(e);
                        }}
                        onKeyDown={handleInputKeyDown}
                        placeholder="Ask anything" // Changed from dynamicPlaceholder
                        className="bg-transparent outline-none border-none resize-none text-lg text-gray-800 dark:text-white min-h-[40px] max-h-[160px] px-1.5 py- overflow-y-auto"
                        rows={1}
                      />

                      <div className="flex items-center justify-between w-full px-1 gap-2">
                        {/* Left: Role Buttons */}
                        <div className="flex flex-wrap gap-6">
                          {[
                            { key: "friend", label: "Friend" },
                            { key: "mentor", label: "Mentor" },
                            // { key: "collegebuddy", label: "College Buddy" },
                          ].map((role) => (
                            <button
                              key={role.key}
                              onClick={() => handleRoleSelect(role.key)}
                              className={` py-2 rounded-2xl border transition-all font-medium text-md shadow-sm ${
                                currentRole === role.key
                                  ? "bg-white border-gray-300 text-black  shadow-xl dark:bg-[#232323] dark:text-white dark:border-white "
                                  : "bg-gray-100 border-gray-200 text-black hover:border-[#474747] hover:shadow-xl hover:bg-white shadow-md dark:bg-[#232323] dark:text-white dark:border-transparent dark:hover:bg-[#2c2c2c] dark:hover:border-gray-400"
                              }`}
                              style={{ minWidth: "120px" }}
                            >
                              {role.label}
                            </button>
                          ))}
                        </div>

                        {/* Right: Mic + Send */}
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
                            <FaArrowRight
                              size={12}
                              className="transition-colors duration-150"
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-6">
                  {[
                    { key: "career road map", label: "Career Road Map" },
                    { key: "interview prep", label: "Interview Prep" },
                    { key: "stuck in problem", label: "Stuck in Problem" },
                  ].map((role) => (
                    <button
                      key={role.key}
                      onClick={() => handleRoleSelect(role.key)}
                      className={`px-8 py-3 rounded-2xl transition-all font-medium text-md shadow-sm
                                                ${
                                                  currentRole === role.key
                                                    ? "bg=[#d9d9d9] border-gray-300 text-black ring-1 ring-[#474747] shadow-xl dark:bg-[#d9d9d9] dark:text-white dark:border-white dark:ring-1 dark:ring-white"
                                                    : "bg-gray-100 border-gray-200 text-black hover:border-[#47474] hover:shadow-xl hover:border shadow-lg hover:border-1 hover:bg-white dark:bg-[#232323] dark:text-white dark:border-transparent"
                                                }
                                            `}
                      style={{ minWidth: "180px" }}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col flex-1 min-h-0">
              <div
                ref={messagesContainerRef}
                className="flex-1 p-2 md:p-6 overflow-y-auto pt-4 md:pt-6 chat-padding-desktop chat-font-desktop chat-font-mobile scroll-smooth scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
                style={{ minHeight: 0 }}
              >
                <div className="max-w-3xl mx-auto px-2 md:px-0">
                  <div className="space-y-3 md:space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[100%] rounded-xl ${
                            message.role === "user"
                              ? "bg-gray-200 max-w-[70%] dark:bg-gray-800 dark:text-white text-black pb-2 text-left pt-2"
                              : "bg-gray-50 conservative dark:bg-[#191A1A] text-gray-800 dark:text-gray-200 justify-start text-left pt-0 pb-2"
                          }`}
                        >
                          {/* <div className="flex items-center mb-2">
                                                        {message.role !== 'user' && (
                                                            <span className={`text-sm font-medium ${getRoleStyle(message.role)} text-left`}>
                                                                {getRoleIcon(message.role || 'friend')}{' '}
                                                                {(message.role || 'friend').charAt(0).toUpperCase() + (message.role || 'friend').slice(1)}
                                                            </span>
                                                        )}
                                                    </div> */}
                          <div
                            className={`prose dark:prose-invert max-w-none text-sm [&_ul>li]:text-base ${
                              message.role === "user"
                                ? "text-left"
                                : "text-left"
                            }`}
                          >
                            {renderMarkdown(message.content)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg p-4">
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce delay-100" />
                            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce delay-200" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 left-0 w-full bg-white p-2 md:p-4 z-10 dark:bg-[#171717]">
              <form onSubmit={handleFormSubmit} className="max-w-3xl mx-auto">
                <div className="w-full bg-white dark:bg-[#171717] rounded-2xl border shadow-sm px-4 pt-2 pb-1 transition-all relative flex flex-col">
                  <textarea
                    ref={chatTextareaRef}
                    value={input}
                    onChange={(e) => {
                      handleInputChange(e);
                      autoResizeTextarea(e);
                    }}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Ask anything"
                    className="bg-transparent outline-none border-none resize-none text-base text-gray-800 dark:text-white min-h-[40px] max-h-[160px] px-0 py-1 mb-2 overflow-y-auto"
                    rows={1}
                  />
                  <div className="flex items-center justify-between w-full px-1 pb-1 gap-2">
                    <div className="flex items-center gap-2">
                      <div className="relative group">
                        {/* <button
                                                    type="button"
                                                    className="text-2xl text-gray-500 flex-shrink-0 hover:text-[#474747] hover:scale-110 transition-transform duration-150"
                                                    aria-label="Upload File"
                                                >
                                                    <IoAttachOutline />
                                                </button> */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-10">
                          This feature will be available soon
                        </div>
                      </div>
                      {currentRole !== "friend" && (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowResourcesModal(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-black rounded-lg shadow-md hover:bg-[#1a1a1a] dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 transition-all duration-200"
                          >
                            <BookOpen size={16} />
                            Resources
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowTasksModal(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-black rounded-lg shadow-md hover:bg-[#1a1a1a] dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 transition-all duration-200"
                          >
                            <ClipboardList size={16} />
                            Tasks
                          </button>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative group">
                        <button
                          type="button"
                          onClick={handleMicClick}
                          className="text-2xl text-gray-500 flex-shrink-0 mx-1 hover:text-[#474747] hover:scale-110 transition-transform duration-150"
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
                        <FaArrowRight
                          size={12}
                          className="transition-colors duration-150"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </>
        )}

        {selectedMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50">
            <div className="bg-white rounded-lg p-4 md:p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base md:text-lg font-semibold">
                  Full Conversation
                </h3>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <IoClose size={24} />
                </button>
              </div>
              <div className="space-y-3 md:space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2 text-sm md:text-base">
                    User Message:
                  </h4>
                  <div className="p-2 md:p-3 bg-blue-50 rounded-lg text-sm md:text-base">
                    {selectedMessage.userMessage.content}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2 text-sm md:text-base">
                    AI Response:
                  </h4>
                  <div className="p-2 md:p-3 bg-gray-100 rounded-lg whitespace-pre-wrap text-sm md:text-base">
                    {selectedMessage.aiResponse.content}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showResourcesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#1e1e1e] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl space-y-4 relative px-4 pb-4">
              {/* Sticky Header: Close Icon + Heading + Back Button */}
              <div className="sticky top-0 z-10 bg-white pt-3 dark:bg-[#1e1e1e] pt-1 pb-3">
                {/* ❌ Close Icon */}
                <button
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                  onClick={() => {
                    setShowResourcesModal(false);
                    setSelectedSkill(null); // optional reset
                  }}
                >
                  <IoClose size={24} />
                </button>

                {/* Heading */}
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Resources
                </h2>

                {/* ← Back Button */}
                {selectedSkill && Object.keys(allSkillData).length > 1 && (
                  <button
                    className="absolute top-4 left-4 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                    onClick={() => setSelectedSkill(null)}
                  >
                    <IoArrowBack size={23} />
                  </button>
                )}
              </div>

              {/* Content */}
              {Object.keys(allSkillData).length === 0 ||
              Object.values(allSkillData).every(
                (skill) => !skill.resources || skill.resources.length === 0
              ) ? (
                <p className="text-gray-600 dark:text-gray-300 text-center pb-3">
                  No resources yet. Once your journey starts, you’ll find
                  handpicked materials here.
                </p>
              ) : Object.keys(allSkillData).length === 1 ? (
                renderGroupedResources(
                  allSkillData[Object.keys(allSkillData)[0]].resources
                )
              ) : !selectedSkill ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.keys(allSkillData).map((skill) => (
                    <div
                      key={skill}
                      className="cursor-pointer p-4 bg-gray-100 dark:bg-[#2b2b2b] rounded-lg shadow hover:bg-gray-200 dark:hover:bg-[#3a3a3a]"
                      onClick={() => setSelectedSkill(skill)}
                    >
                      <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                        {skill}
                      </h3>
                    </div>
                  ))}
                </div>
              ) : (
                renderGroupedResources(allSkillData[selectedSkill]?.resources)
              )}
            </div>
          </div>
        )}

        {showTasksModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#1e1e1e] rounded-lg max-w-2xl w-full max-h-[90vh] shadow-xl relative flex flex-col">
              {/* Sticky Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-[#1e1e1e] px-4 pt-4 pb-3 rounded-t-lg">
                {/* ❌ Close Icon */}
                <button
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                  onClick={() => {
                    setShowTasksModal(false);
                    setSelectedSkill(null);
                  }}
                >
                  <IoClose size={24} />
                </button>

                {/* Heading */}
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Tasks
                </h2>

                {/* ← Back Button */}
                {selectedSkill && Object.keys(allSkillData).length > 1 && (
                  <button
                    className="absolute top-4 left-4 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                    onClick={() => setSelectedSkill(null)}
                  >
                    <IoArrowBack size={23} />
                  </button>
                )}
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto p-4 space-y-4">
                {Object.keys(allSkillData).length === 0 ||
                Object.values(allSkillData).every(
                  (skill) => !skill.tasks || skill.tasks.length === 0
                ) ? (
                  <p className="text-gray-600 dark:text-gray-300 text-center pb-3">
                    This space will show your clarity, learning, and growth
                    tasks. Nothing here for now.
                  </p>
                ) : Object.keys(allSkillData).length === 1 ? (
                  renderGroupedTasks(
                    allSkillData[Object.keys(allSkillData)[0]].tasks
                  )
                ) : !selectedSkill ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.keys(allSkillData).map((skill) => (
                      <div
                        key={skill}
                        className="cursor-pointer p-4 bg-gray-100 dark:bg-[#2b2b2b] rounded-lg shadow hover:bg-gray-200 dark:hover:bg-[#3a3a3a]"
                        onClick={() => setSelectedSkill(skill)}
                      >
                        <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                          {skill}
                        </h3>
                      </div>
                    ))}
                  </div>
                ) : (
                  renderGroupedTasks(allSkillData[selectedSkill]?.tasks)
                )}
              </div>
            </div>
          </div>
        )}

        <AuthPopup
          isOpen={showAuthPopup}
          onClose={() => {
            setShowAuthPopup(false);
          }}
        />
      </div>
    </div>
  );
};

export default ChatInterface;
