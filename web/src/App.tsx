import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Globe, Code, FolderOpen, Terminal, Settings, Send, LogOut, User as UserIcon, Mail, Download, Eye, Share2, Copy, ExternalLink, Plus, Trash2 } from 'lucide-react';
import './App.css';

// Backend API URL for Claude proxy
const API_URL = 'https://app-xjdhhtie.fly.dev';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

interface LocalUser {
  email: string;
  displayName: string;
}

function App() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState('chat');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');
    const [chatHistory, setChatHistory] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [browserUrl, setBrowserUrl] = useState('https://www.google.com');
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [codeContent, setCodeContent] = useState(`// Welcome to PulseBuilder Code Editor
// Write your JavaScript code here

function greet(name) {
  return \`Hello, \${name}! Welcome to PulseBuilder.\`;
}

console.log(greet('Developer'));
`);
  const [codeOutput, setCodeOutput] = useState('');
    const [terminalHistory, setTerminalHistory] = useState<string[]>(['Welcome to PulseBuilder Terminal', 'Type "help" for available commands']);
    const [terminalInput, setTerminalInput] = useState('');
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const [hostedUrl, setHostedUrl] = useState<string | null>(null);
    const [isHosting, setIsHosting] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('pulsebuilder_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

    useEffect(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, [chatHistory, isTyping]);

    // Load chat sessions from localStorage
    useEffect(() => {
      const savedSessions = localStorage.getItem('pulsebuilder_chat_sessions');
      if (savedSessions) {
        const sessions = JSON.parse(savedSessions) as ChatSession[];
        setChatSessions(sessions);
        if (sessions.length > 0) {
          const lastSession = sessions[sessions.length - 1];
          setCurrentSessionId(lastSession.id);
          setChatHistory(lastSession.messages);
        }
      }
    }, []);

    // Save chat sessions to localStorage when they change
    useEffect(() => {
      if (chatSessions.length > 0) {
        localStorage.setItem('pulsebuilder_chat_sessions', JSON.stringify(chatSessions));
      }
    }, [chatSessions]);

    // Update current session when chat history changes
    useEffect(() => {
      if (currentSessionId && chatHistory.length > 0) {
        setChatSessions(prev => prev.map(session => 
          session.id === currentSessionId 
            ? { ...session, messages: chatHistory, title: chatHistory[0]?.content.slice(0, 30) + '...' || 'New Chat' }
            : session
        ));
      }
    }, [chatHistory, currentSessionId]);

    const createNewChat = () => {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: 'New Chat',
        messages: [],
        createdAt: Date.now()
      };
      setChatSessions(prev => [...prev, newSession]);
      setCurrentSessionId(newSession.id);
      setChatHistory([]);
    };

    const selectChat = (sessionId: string) => {
      const session = chatSessions.find(s => s.id === sessionId);
      if (session) {
        setCurrentSessionId(sessionId);
        setChatHistory(session.messages);
      }
    };

    const deleteChat = (sessionId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setChatSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        const remaining = chatSessions.filter(s => s.id !== sessionId);
        if (remaining.length > 0) {
          setCurrentSessionId(remaining[remaining.length - 1].id);
          setChatHistory(remaining[remaining.length - 1].messages);
        } else {
          setCurrentSessionId(null);
          setChatHistory([]);
        }
      }
    };

    const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (!email || !password) {
      setAuthError('Please enter both email and password');
      return;
    }
    
    if (password.length < 6) {
      setAuthError('Password should be at least 6 characters');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAuthError('Please enter a valid email address');
      return;
    }
    
    const users = JSON.parse(localStorage.getItem('pulsebuilder_users') || '{}');
    
    if (isSignUp) {
      if (users[email]) {
        setAuthError('An account with this email already exists');
        return;
      }
      users[email] = { password, displayName: email.split('@')[0] };
      localStorage.setItem('pulsebuilder_users', JSON.stringify(users));
    } else {
      if (!users[email]) {
        setAuthError('No account found with this email');
        return;
      }
      if (users[email].password !== password) {
        setAuthError('Incorrect password');
        return;
      }
    }
    
    const loggedInUser: LocalUser = { email, displayName: users[email]?.displayName || email.split('@')[0] };
    localStorage.setItem('pulsebuilder_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const handleSignOut = () => {
    localStorage.removeItem('pulsebuilder_user');
    setUser(null);
  };

  const callClaude = async (messages: Message[]): Promise<string> => {
    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error('API error');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      return generateLocalResponse(messages[messages.length - 1].content);
    }
  };

  const generateLocalResponse = (message: string): string => {
    const lower = message.toLowerCase();
    if (lower.includes('hello') || lower.includes('hi')) {
      return "Hello! I'm PulseBuilder, your AI assistant. How can I help you today?";
    }
    if (lower.includes('help')) {
      return `# PulseBuilder Features

- **Chat**: Ask me anything about coding, development, or any topic
- **Browser**: Browse the web directly in the app
- **Code Editor**: Write and run JavaScript code
- **File Explorer**: Manage your project files
- **Terminal**: Execute commands

What would you like to do?`;
    }
    if (lower.includes('javascript') || lower.includes('code')) {
      return `Here's a JavaScript example:

\`\`\`javascript
// Function to greet
function greet(name) {
  return \`Hello, \${name}!\`;
}

// Arrow function
const add = (a, b) => a + b;

console.log(greet('Developer'));
console.log('Sum:', add(5, 3));
\`\`\`

Try it in the Code Editor!`;
    }
    return "I'm here to help! Ask me about coding, web development, or any topic you'd like to explore.";
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = { role: 'user', content: inputMessage };
    const messageContent = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    // Create a new session if one doesn't exist
    if (!currentSessionId) {
      const newSessionId = Date.now().toString();
      const newSession: ChatSession = {
        id: newSessionId,
        title: messageContent.slice(0, 30) + '...',
        messages: [userMessage],
        createdAt: Date.now()
      };
      
      // Save to localStorage immediately
      const existingSessions = JSON.parse(localStorage.getItem('pulsebuilder_chat_sessions') || '[]');
      const updatedSessions = [...existingSessions, newSession];
      localStorage.setItem('pulsebuilder_chat_sessions', JSON.stringify(updatedSessions));
      
      setChatSessions(updatedSessions);
      setCurrentSessionId(newSessionId);
      setChatHistory([userMessage]);

      const response = await callClaude([userMessage]);
      const assistantMessage: Message = { role: 'assistant', content: response };
      const finalMessages = [userMessage, assistantMessage];
      
      setChatHistory(finalMessages);
      
      // Update session with response and save to localStorage
      const sessionsWithResponse = updatedSessions.map(session => 
        session.id === newSessionId 
          ? { ...session, messages: finalMessages }
          : session
      );
      localStorage.setItem('pulsebuilder_chat_sessions', JSON.stringify(sessionsWithResponse));
      setChatSessions(sessionsWithResponse);
      setIsTyping(false);
    } else {
      const updatedHistory = [...chatHistory, userMessage];
      setChatHistory(updatedHistory);

      const response = await callClaude(updatedHistory);
      const finalHistory = [...updatedHistory, { role: 'assistant' as const, content: response }];
      setChatHistory(finalHistory);
      
      // Update the session with the new messages and save to localStorage
      const updatedSessions = chatSessions.map(session => 
        session.id === currentSessionId 
          ? { ...session, messages: finalHistory, title: finalHistory[0]?.content.slice(0, 30) + '...' || 'New Chat' }
          : session
      );
      localStorage.setItem('pulsebuilder_chat_sessions', JSON.stringify(updatedSessions));
      setChatSessions(updatedSessions);
      setIsTyping(false);
    }
  };

  const runCode = () => {
    try {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args) => {
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      };
      
      eval(codeContent);
      
      console.log = originalLog;
      setCodeOutput(logs.join('\n') || 'Code executed successfully (no output)');
    } catch (error) {
      setCodeOutput(`Error: ${error}`);
    }
  };

  const handleTerminalCommand = () => {
    if (!terminalInput.trim()) return;
    
    const cmd = terminalInput.toLowerCase().trim();
    let output = '';
    
    if (cmd === 'help') {
      output = 'Available commands: help, clear, date, whoami, echo [text], pwd, ls';
    } else if (cmd === 'clear') {
      setTerminalHistory(['Terminal cleared']);
      setTerminalInput('');
      return;
    } else if (cmd === 'date') {
      output = new Date().toString();
    } else if (cmd === 'whoami') {
      output = user?.displayName || 'guest';
    } else if (cmd.startsWith('echo ')) {
      output = cmd.substring(5);
    } else if (cmd === 'pwd') {
      output = '/home/user/pulsebuilder';
    } else if (cmd === 'ls') {
      output = 'Documents  Downloads  Projects  README.md';
    } else {
      output = `Command not found: ${cmd}`;
    }
    
    setTerminalHistory([...terminalHistory, `$ ${terminalInput}`, output]);
    setTerminalInput('');
  };

    const openInBrowser = (url: string) => {
      let finalUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        finalUrl = 'https://' + url;
      }
      setBrowserUrl(finalUrl);
      setActivePanel('browser');
    };

    // Make this function available globally for onclick handlers
    (window as unknown as { openInBrowser: (url: string) => void }).openInBrowser = openInBrowser;

    const formatMessage = (content: string) => {
      return content
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-800 p-3 rounded my-2 overflow-x-auto"><code>$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code class="bg-gray-700 px-1 rounded">$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-3 mb-2">$1</h1>')
        .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-2 mb-1">$1</h2>')
        .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
        .replace(/(https?:\/\/[^\s<>"']+)/g, '<a href="#" onclick="window.openInBrowser(\'$1\'); return false;" class="text-blue-400 hover:text-blue-300 underline cursor-pointer">$1</a>')
        .replace(/\n/g, '<br/>');
    };

    const extractCodeBlocks = (content: string): { code: string; language: string }[] => {
      const regex = /```(\w+)?\n([\s\S]*?)```/g;
      const blocks: { code: string; language: string }[] = [];
      let match;
      while ((match = regex.exec(content)) !== null) {
        blocks.push({ language: match[1] || 'text', code: match[2] });
      }
      return blocks;
    };

    const hasHtmlCode = (content: string): boolean => {
      const blocks = extractCodeBlocks(content);
      return blocks.some(b => b.language === 'html' || b.code.includes('<!DOCTYPE') || b.code.includes('<html'));
    };

    const getHtmlCode = (content: string): string => {
      const blocks = extractCodeBlocks(content);
      const htmlBlock = blocks.find(b => b.language === 'html' || b.code.includes('<!DOCTYPE') || b.code.includes('<html'));
      return htmlBlock?.code || '';
    };

    const downloadCode = (content: string, filename: string) => {
      const blocks = extractCodeBlocks(content);
      if (blocks.length === 0) return;
    
      const code = blocks[0].code;
      const ext = blocks[0].language === 'html' ? 'html' : 
                  blocks[0].language === 'javascript' || blocks[0].language === 'js' ? 'js' :
                  blocks[0].language === 'python' || blocks[0].language === 'py' ? 'py' :
                  blocks[0].language === 'css' ? 'css' : 'txt';
    
      const blob = new Blob([code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    const previewHtmlCode = (content: string) => {
      const html = getHtmlCode(content);
      if (html) {
        setPreviewHtml(html);
        setActivePanel('browser');
      }
    };

    const hostHtmlCode = async (content: string) => {
      const html = getHtmlCode(content);
      if (!html) return;
    
      setIsHosting(true);
      try {
        const response = await fetch(`${API_URL}/host`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html, title: 'PulseBuilder Generated Page' })
        });
      
        if (response.ok) {
          const data = await response.json();
          setHostedUrl(data.url);
        }
      } catch (error) {
        console.error('Failed to host HTML:', error);
      }
      setIsHosting(false);
    };

    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
    };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

    if (!user) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-blue-900 flex items-center justify-center">
          <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
              <span className="text-4xl font-bold text-white">P</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">PulseBuilder</h1>
            <p className="text-gray-400 mb-6">Your AI-powered development assistant</p>
          
            {authError && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-2 rounded-lg mb-4 text-sm">
                {authError}
              </div>
            )}
          
            <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-3 transition-colors"
              >
                <Mail className="w-5 h-5" />
                {isSignUp ? 'Create Account' : 'Sign In with Email'}
              </button>
            </form>
          
            <button
              onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }}
              className="text-purple-400 hover:text-purple-300 text-sm block w-full"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-900 flex">
        {/* Icon Sidebar */}
        <div className="w-16 bg-gray-800 flex flex-col items-center py-4 gap-2 border-r border-gray-700">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
            <span className="text-lg font-bold text-white">P</span>
          </div>
        
          <button
            onClick={() => setActivePanel('chat')}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${activePanel === 'chat' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}
            title="Chat"
          >
            <MessageSquare className="w-6 h-6 text-white" />
          </button>
        
          <button
            onClick={() => setActivePanel('browser')}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${activePanel === 'browser' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}
            title="Browser"
          >
            <Globe className="w-6 h-6 text-white" />
          </button>
        
          <button
            onClick={() => setActivePanel('code')}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${activePanel === 'code' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}
            title="Code Editor"
          >
            <Code className="w-6 h-6 text-white" />
          </button>
        
          <button
            onClick={() => setActivePanel('files')}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${activePanel === 'files' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}
            title="Files"
          >
            <FolderOpen className="w-6 h-6 text-white" />
          </button>
        
          <button
            onClick={() => setActivePanel('terminal')}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${activePanel === 'terminal' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}
            title="Terminal"
          >
            <Terminal className="w-6 h-6 text-white" />
          </button>
        
          <button
            onClick={() => setActivePanel('settings')}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${activePanel === 'settings' ? 'bg-purple-600' : 'hover:bg-gray-700'}`}
            title="Settings"
          >
            <Settings className="w-6 h-6 text-white" />
          </button>
        
          <div className="flex-1" />
        
          <button
            onClick={handleSignOut}
            className="w-12 h-12 rounded-xl flex items-center justify-center hover:bg-red-600 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Chat History Sidebar */}
        <div className="w-64 bg-gray-850 flex flex-col border-r border-gray-700" style={{ backgroundColor: '#1a1f2e' }}>
          <div className="p-4 border-b border-gray-700">
            <button
              onClick={createNewChat}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Chat
            </button>
          </div>
        
          <div className="flex-1 overflow-y-auto p-2">
            <div className="text-gray-400 text-xs uppercase tracking-wider px-2 py-2">Chat History</div>
            {chatSessions.length === 0 ? (
              <div className="text-gray-500 text-sm px-2 py-4 text-center">
                No chats yet. Start a new conversation!
              </div>
            ) : (
              <div className="space-y-1">
                {[...chatSessions].reverse().map(session => (
                  <div
                    key={session.id}
                    onClick={() => selectChat(session.id)}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      currentSessionId === session.id 
                        ? 'bg-purple-600/30 border border-purple-500/50' 
                        : 'hover:bg-gray-700/50'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm truncate flex-1">
                      {session.title || 'New Chat'}
                    </span>
                    <button
                      onClick={(e) => deleteChat(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600/50 rounded transition-all"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 bg-gray-800 flex items-center justify-between px-4 border-b border-gray-700">
          <h1 className="text-white font-semibold">
            {activePanel === 'chat' && 'AI Chat'}
            {activePanel === 'browser' && 'Browser'}
            {activePanel === 'code' && 'Code Editor'}
            {activePanel === 'files' && 'File Explorer'}
            {activePanel === 'terminal' && 'Terminal'}
            {activePanel === 'settings' && 'Settings'}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">{user.email}</span>
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

                {/* Hosted URL Modal */}
                {hostedUrl && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-2xl p-6 max-w-lg w-full mx-4">
                      <h3 className="text-xl font-bold text-white mb-4">Your Page is Live!</h3>
                      <p className="text-gray-400 mb-4">Your HTML has been hosted and is accessible at:</p>
                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          value={hostedUrl}
                          readOnly
                          className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600"
                        />
                        <button
                          onClick={() => copyToClipboard(hostedUrl)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex gap-3">
                        <a
                          href={hostedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-5 h-5" />
                          Open in New Tab
                        </a>
                        <button
                          onClick={() => setHostedUrl(null)}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Panels */}
                <div className="flex-1 overflow-hidden">
          {/* Chat Panel */}
          {activePanel === 'chat' && (
            <div className="h-full flex flex-col">
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.length === 0 && (
                  <div className="text-center text-gray-400 mt-20">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">P</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome to PulseBuilder</h2>
                    <p>Your AI-powered development assistant. Ask me anything!</p>
                  </div>
                )}
                                {chatHistory.map((msg, idx) => (
                                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                    {msg.role === 'assistant' && (
                                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-sm font-bold text-white">P</span>
                                      </div>
                                    )}
                                    <div className={`max-w-3xl ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-100'}`}>
                                      <div className="p-4 rounded-2xl">
                                        <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                                      </div>
                                      {msg.role === 'assistant' && extractCodeBlocks(msg.content).length > 0 && (
                                        <div className="flex gap-2 px-4 pb-3 flex-wrap">
                                          <button
                                            onClick={() => downloadCode(msg.content, `code-${idx}`)}
                                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                                          >
                                            <Download className="w-4 h-4" />
                                            Download
                                          </button>
                                          {hasHtmlCode(msg.content) && (
                                            <>
                                              <button
                                                onClick={() => previewHtmlCode(msg.content)}
                                                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                                              >
                                                <Eye className="w-4 h-4" />
                                                Preview
                                              </button>
                                              <button
                                                onClick={() => hostHtmlCode(msg.content)}
                                                disabled={isHosting}
                                                className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm transition-colors disabled:opacity-50"
                                              >
                                                <Share2 className="w-4 h-4" />
                                                {isHosting ? 'Hosting...' : 'Host & Share'}
                                              </button>
                                            </>
                                          )}
                                          <button
                                            onClick={() => {
                                              const blocks = extractCodeBlocks(msg.content);
                                              if (blocks.length > 0) copyToClipboard(blocks[0].code);
                                            }}
                                            className="flex items-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                                          >
                                            <Copy className="w-4 h-4" />
                                            Copy
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    {msg.role === 'user' && (
                                      <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <UserIcon className="w-5 h-5 text-white" />
                                      </div>
                                    )}
                                  </div>
                                ))}
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-white">P</span>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-2xl">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-700">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

                    {/* Browser Panel */}
                    {activePanel === 'browser' && (
                      <div className="h-full flex flex-col">
                        <div className="p-3 bg-gray-800 border-b border-gray-700 flex gap-2">
                          {previewHtml && (
                            <button
                              onClick={() => setPreviewHtml(null)}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                              Exit Preview
                            </button>
                          )}
                          <input
                            type="text"
                            value={previewHtml ? 'Preview Mode - Generated HTML' : browserUrl}
                            onChange={(e) => !previewHtml && setBrowserUrl(e.target.value)}
                            disabled={!!previewHtml}
                            className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                            placeholder="Enter URL..."
                          />
                          {!previewHtml && (
                            <>
                              <button
                                onClick={() => setBrowserUrl(browserUrl)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                              >
                                Go
                              </button>
                              <button
                                onClick={() => window.open(browserUrl, '_blank')}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                              >
                                Open in New Tab
                              </button>
                            </>
                          )}
                        </div>
                        <div className="flex-1 bg-white relative">
                          {previewHtml ? (
                            <iframe
                              srcDoc={previewHtml}
                              className="w-full h-full border-0"
                              title="HTML Preview"
                              sandbox="allow-scripts"
                            />
                          ) : (
                            <>
                              <iframe
                                src={browserUrl}
                                className="w-full h-full border-0"
                                title="Browser"
                                sandbox="allow-scripts allow-same-origin allow-forms"
                              />
                              <div className="absolute bottom-4 left-4 right-4 bg-gray-800 text-gray-300 p-3 rounded-lg text-sm opacity-90">
                                Note: Some websites (like Google, Facebook, etc.) block being loaded in embedded frames for security. Use "Open in New Tab" to view them.
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

          {/* Code Editor Panel */}
          {activePanel === 'code' && (
            <div className="h-full flex flex-col">
              <div className="p-3 bg-gray-800 border-b border-gray-700 flex gap-2">
                <button
                  onClick={runCode}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Run Code
                </button>
                <button
                  onClick={() => setCodeContent('')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="flex-1 flex">
                <textarea
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  className="flex-1 bg-gray-900 text-green-400 p-4 font-mono text-sm resize-none focus:outline-none"
                  spellCheck={false}
                />
              </div>
              <div className="h-40 bg-gray-800 border-t border-gray-700 p-4 overflow-y-auto">
                <div className="text-gray-400 text-sm mb-2">Output:</div>
                <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">{codeOutput}</pre>
              </div>
            </div>
          )}

          {/* Files Panel */}
          {activePanel === 'files' && (
            <div className="h-full p-4">
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-4">Project Files</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-300 hover:bg-gray-700 p-2 rounded cursor-pointer">
                    <FolderOpen className="w-5 h-5 text-yellow-500" />
                    <span>src</span>
                  </div>
                  <div className="ml-6 space-y-1">
                    <div className="flex items-center gap-2 text-gray-300 hover:bg-gray-700 p-2 rounded cursor-pointer">
                      <Code className="w-4 h-4 text-blue-400" />
                      <span>App.tsx</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300 hover:bg-gray-700 p-2 rounded cursor-pointer">
                      <Code className="w-4 h-4 text-purple-400" />
                      <span>index.css</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300 hover:bg-gray-700 p-2 rounded cursor-pointer">
                    <Code className="w-4 h-4 text-green-400" />
                    <span>package.json</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300 hover:bg-gray-700 p-2 rounded cursor-pointer">
                    <Code className="w-4 h-4 text-gray-400" />
                    <span>README.md</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Terminal Panel */}
          {activePanel === 'terminal' && (
            <div className="h-full flex flex-col bg-black">
              <div className="flex-1 p-4 font-mono text-sm overflow-y-auto">
                {terminalHistory.map((line, idx) => (
                  <div key={idx} className="text-green-400">{line}</div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-800 flex gap-2">
                <span className="text-green-400 font-mono">$</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTerminalCommand()}
                  className="flex-1 bg-transparent text-green-400 font-mono focus:outline-none"
                  placeholder="Enter command..."
                />
              </div>
            </div>
          )}

          {/* Settings Panel */}
          {activePanel === 'settings' && (
            <div className="h-full p-4">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-4">Account</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
                      <UserIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{user.displayName}</div>
                      <div className="text-gray-400">{user.email}</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-4">AI Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-gray-400 text-sm">AI Model</label>
                      <div className="text-white">Claude 3.5 Sonnet</div>
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm">Status</label>
                      <div className="text-green-400">Connected</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-4">About</h3>
                  <div className="text-gray-400">
                    <p>PulseBuilder v1.0.0</p>
                    <p className="mt-2">Your AI-powered development assistant with chat, browser, code editor, file explorer, and terminal.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
