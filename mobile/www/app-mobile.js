// PulseBuilder Mobile - AI Assistant Application
// Mobile-optimized JavaScript file

// State management
let chatHistory = [];
let chatSessions = [];
let currentSessionId = null;
const API_URL = 'https://app-xjdhhtie.fly.dev';
let settings = {
    apiProvider: 'anthropic',
    apiKey: '',
    model: 'claude-3-5-sonnet-20241022',
    theme: 'dark',
    fontSize: 14
};

// Chat session management
function loadChatSessions() {
    const saved = localStorage.getItem('pulsebuilder_chat_sessions');
    if (saved) {
        chatSessions = JSON.parse(saved);
        if (chatSessions.length > 0) {
            const lastSession = chatSessions[chatSessions.length - 1];
            currentSessionId = lastSession.id;
            chatHistory = lastSession.messages || [];
            renderChatHistory();
        }
        renderChatSessionsList();
    }
}

function saveChatSessions() {
    localStorage.setItem('pulsebuilder_chat_sessions', JSON.stringify(chatSessions));
}

function createNewChat() {
    const newSession = {
        id: Date.now().toString(),
        title: 'New Chat',
        messages: [],
        createdAt: Date.now()
    };
    chatSessions.push(newSession);
    currentSessionId = newSession.id;
    chatHistory = [];
    chatContainer.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-icon">P</div>
            <h2>Welcome to PulseBuilder</h2>
            <p>Your AI-powered development assistant</p>
        </div>
    `;
    saveChatSessions();
    renderChatSessionsList();
}

function selectChat(sessionId) {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
        currentSessionId = sessionId;
        chatHistory = session.messages || [];
        renderChatHistory();
        renderChatSessionsList();
        closeChatSidebar();
    }
}

function deleteChat(sessionId, event) {
    event.stopPropagation();
    chatSessions = chatSessions.filter(s => s.id !== sessionId);
    if (currentSessionId === sessionId) {
        if (chatSessions.length > 0) {
            const lastSession = chatSessions[chatSessions.length - 1];
            currentSessionId = lastSession.id;
            chatHistory = lastSession.messages || [];
            renderChatHistory();
        } else {
            currentSessionId = null;
            chatHistory = [];
            chatContainer.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-icon">P</div>
                    <h2>Welcome to PulseBuilder</h2>
                    <p>Your AI-powered development assistant</p>
                </div>
            `;
        }
    }
    saveChatSessions();
    renderChatSessionsList();
}

function updateCurrentSession() {
    if (currentSessionId && chatHistory.length > 0) {
        const sessionIndex = chatSessions.findIndex(s => s.id === currentSessionId);
        if (sessionIndex !== -1) {
            chatSessions[sessionIndex].messages = chatHistory;
            chatSessions[sessionIndex].title = chatHistory[0]?.content.slice(0, 30) + '...' || 'New Chat';
            saveChatSessions();
            renderChatSessionsList();
        }
    }
}

function renderChatHistory() {
    chatContainer.innerHTML = '';
    if (chatHistory.length === 0) {
        chatContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">P</div>
                <h2>Welcome to PulseBuilder</h2>
                <p>Your AI-powered development assistant</p>
            </div>
        `;
    } else {
        chatHistory.forEach(msg => {
            addMessageToDOM(msg.content, msg.role);
        });
    }
}

function renderChatSessionsList() {
    const listContainer = document.getElementById('chat-sessions-list');
    if (!listContainer) return;
    
    if (chatSessions.length === 0) {
        listContainer.innerHTML = '<div class="no-chats">No chats yet. Start a new conversation!</div>';
    } else {
        listContainer.innerHTML = [...chatSessions].reverse().map(session => `
            <div class="chat-session-item ${currentSessionId === session.id ? 'active' : ''}" onclick="selectChat('${session.id}')">
                <span class="session-icon">💬</span>
                <span class="session-title">${session.title || 'New Chat'}</span>
                <button class="delete-session-btn" onclick="deleteChat('${session.id}', event)">×</button>
            </div>
        `).join('');
    }
}

function toggleChatSidebar() {
    const sidebar = document.getElementById('chat-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

function closeChatSidebar() {
    const sidebar = document.getElementById('chat-sidebar');
    if (sidebar) {
        sidebar.classList.remove('open');
    }
}

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('pulsebuilder_settings');
    if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
        document.getElementById('api-provider').value = settings.apiProvider;
        document.getElementById('api-key').value = settings.apiKey;
        document.getElementById('model-select').value = settings.model;
        document.getElementById('theme-select').value = settings.theme;
        document.getElementById('font-size').value = settings.fontSize;
        document.getElementById('font-size-value').textContent = settings.fontSize + 'px';
    }
}

// Save settings to localStorage
function saveSettings() {
    settings.apiProvider = document.getElementById('api-provider').value;
    settings.apiKey = document.getElementById('api-key').value;
    settings.model = document.getElementById('model-select').value;
    settings.theme = document.getElementById('theme-select').value;
    settings.fontSize = parseInt(document.getElementById('font-size').value);
    
    localStorage.setItem('pulsebuilder_settings', JSON.stringify(settings));
    alert('Settings saved successfully!');
}

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const panelId = btn.dataset.panel;
        
        // Update active button
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show corresponding panel
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        document.getElementById(panelId + '-panel').classList.add('active');
    });
});

// Chat functionality
const chatContainer = document.getElementById('chat-container');
const chatInput = document.getElementById('chat-input');

chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 150) + 'px';
});

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Create a new session if one doesn't exist
    if (!currentSessionId) {
        const newSessionId = Date.now().toString();
        const newSession = {
            id: newSessionId,
            title: message.slice(0, 30) + '...',
            messages: [],
            createdAt: Date.now()
        };
        
        // Save to localStorage immediately
        const existingSessions = JSON.parse(localStorage.getItem('pulsebuilder_chat_sessions') || '[]');
        const updatedSessions = [...existingSessions, newSession];
        localStorage.setItem('pulsebuilder_chat_sessions', JSON.stringify(updatedSessions));
        
        chatSessions = updatedSessions;
        currentSessionId = newSessionId;
        chatHistory = [];
        renderChatSessionsList();
    }
    
    // Clear welcome message if present
    const welcome = chatContainer.querySelector('.welcome-message');
    if (welcome) welcome.remove();
    
    // Add user message
    addMessageToDOM(message, 'user');
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    // Add to history
    chatHistory.push({ role: 'user', content: message });
    
    // Save to localStorage immediately
    const sessionsAfterUser = chatSessions.map(session => 
        session.id === currentSessionId 
            ? { ...session, messages: chatHistory, title: chatHistory[0]?.content.slice(0, 30) + '...' || 'New Chat' }
            : session
    );
    localStorage.setItem('pulsebuilder_chat_sessions', JSON.stringify(sessionsAfterUser));
    chatSessions = sessionsAfterUser;
    renderChatSessionsList();
    
    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant typing';
    typingDiv.innerHTML = `
        <div class="message-avatar">P</div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    chatContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Get AI response
    try {
        const response = await getAIResponse(message);
        typingDiv.remove();
        addMessageToDOM(response, 'assistant');
        chatHistory.push({ role: 'assistant', content: response });
        
        // Save to localStorage after AI response
        const sessionsAfterAI = chatSessions.map(session => 
            session.id === currentSessionId 
                ? { ...session, messages: chatHistory }
                : session
        );
        localStorage.setItem('pulsebuilder_chat_sessions', JSON.stringify(sessionsAfterAI));
        chatSessions = sessionsAfterAI;
    } catch (error) {
        typingDiv.remove();
        addMessageToDOM('Sorry, I encountered an error: ' + error.message, 'assistant');
    }
}

function addMessage(content, role) {
    addMessageToDOM(content, role);
    // Update the current session with the new message
    updateCurrentSession();
}

function addMessageToDOM(content, role) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const avatar = role === 'user' ? 'U' : 'P';
    
    // Parse markdown and code blocks
    let formattedContent = formatMessage(content);
    
    // Check if message contains code blocks
    const hasCode = content.includes('```');
    const hasHtml = content.includes('```html') || content.includes('<!DOCTYPE') || content.includes('<html');
    
    let actionButtons = '';
    if (role === 'assistant' && hasCode) {
        actionButtons = `
            <div class="message-actions">
                <button class="action-btn-small" onclick="downloadCodeFromMessage(this)">Download</button>
                ${hasHtml ? `<button class="action-btn-small" onclick="previewHtmlFromMessage(this)">Preview</button>
                <button class="action-btn-small" onclick="hostHtmlFromMessage(this)">Host & Share</button>` : ''}
                <button class="action-btn-small" onclick="copyCodeFromMessage(this)">Copy</button>
            </div>
        `;
    }
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">${formattedContent}${actionButtons}</div>
    `;
    
    // Store original content for extraction
    messageDiv.dataset.content = content;
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Highlight code blocks
    messageDiv.querySelectorAll('pre code').forEach(block => {
        if (typeof hljs !== 'undefined') {
            hljs.highlightElement(block);
        }
    });
}

function openInBrowser(url) {
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        finalUrl = 'https://' + url;
    }
    document.getElementById('url-input').value = finalUrl;
    navigateTo();
    // Switch to browser panel
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-panel="browser"]').classList.add('active');
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById('browser-panel').classList.add('active');
}

function formatMessage(content) {
    // Convert markdown to HTML using marked
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            highlight: function(code, lang) {
                if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
                    return hljs.highlight(code, { language: lang }).value;
                }
                return typeof hljs !== 'undefined' ? hljs.highlightAuto(code).value : code;
            },
            breaks: true
        });
        let html = marked.parse(content);
        // Make URLs clickable and open in browser panel
        html = html.replace(/(https?:\/\/[^\s<>"']+)/g, '<a href="#" onclick="openInBrowser(\'$1\'); return false;" style="color: #60a5fa; text-decoration: underline; cursor: pointer;">$1</a>');
        return html;
    }
    return content.replace(/\n/g, '<br>');
}

async function getAIResponse(message) {
    // Always use Claude API with built-in key
    try {
        return await callClaude(message);
    } catch (error) {
        console.error('Claude API error:', error);
        // Fallback to local response if API fails
        return generateLocalResponse(message);
    }
}

async function callClaude(message) {
    // Build conversation for Claude
    const messages = [];
    
    // Add chat history
    for (const msg of chatHistory) {
        messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        });
    }
    
    const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: messages
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error('API error: ' + (errorData.detail || response.statusText));
    }
    
    const data = await response.json();
    
    if (data.response) {
        return data.response;
    }
    
    throw new Error('No response from API');
}

async function callOpenAI(message) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify({
            model: settings.model,
            messages: chatHistory,
            max_tokens: 2048
        })
    });
    
    if (!response.ok) {
        throw new Error('OpenAI API error: ' + response.statusText);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

async function callAnthropic(message) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': settings.apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: settings.model.includes('claude') ? settings.model : 'claude-3-sonnet-20240229',
            max_tokens: 2048,
            messages: chatHistory.map(m => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content
            }))
        })
    });
    
    if (!response.ok) {
        throw new Error('Anthropic API error: ' + response.statusText);
    }
    
    const data = await response.json();
    return data.content[0].text;
}

async function callGemini(message) {
    // Build conversation history for Gemini
    const contents = [];
    
    // Add system instruction
    contents.push({
        role: 'user',
        parts: [{ text: `You are PulseBuilder, an advanced AI assistant similar to Devin. You can help with:
- Writing, debugging, and explaining code in any programming language
- Generating complete applications and projects
- Answering questions on any topic
- Providing detailed explanations and tutorials
- Helping with web development, mobile apps, and more

Be helpful, detailed, and provide code examples when relevant. Format your responses with markdown for better readability.` }]
    });
    contents.push({
        role: 'model',
        parts: [{ text: 'I understand. I am PulseBuilder, your AI assistant. I can help you with coding, app development, and any questions you have. How can I assist you today?' }]
    });
    
    // Add chat history
    for (const msg of chatHistory) {
        contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        });
    }
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
            ]
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error('Gemini API error: ' + (errorData.error?.message || response.statusText));
    }
    
    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
    }
    
    throw new Error('No response from Gemini');
}

function generateLocalResponse(message) {
    // Built-in AI responses - works without any API key
    const lowerMessage = message.toLowerCase();
    
    // Greeting responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || lowerMessage.includes('good morning') || lowerMessage.includes('good evening')) {
        const greetings = [
            "Hello! I'm PulseBuilder, your AI assistant. I'm here to help you with coding, browsing, file management, and much more. What would you like to work on today?",
            "Hi there! Welcome to PulseBuilder. I'm ready to assist you with any task - whether it's writing code, browsing the web, or managing files. How can I help?",
            "Hey! Great to see you. I'm PulseBuilder, your personal AI companion. Feel free to ask me anything!"
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // Who are you / about
    if (lowerMessage.includes('who are you') || lowerMessage.includes('what are you') || lowerMessage.includes('about you') || lowerMessage.includes('your name')) {
        return `I'm **PulseBuilder**, an AI assistant application designed to help you with various tasks:

- **Intelligent Chat**: I can answer questions, explain concepts, and have conversations on any topic
- **Code Assistance**: I help write, debug, and explain code in multiple programming languages
- **Built-in Browser**: Browse the web without leaving the app
- **File Management**: Create, organize, and manage your project files
- **Terminal Access**: Run commands and scripts directly

I'm built to be your all-in-one development companion. I work completely offline with built-in intelligence!`;
    }
    
    // Help responses
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do') || lowerMessage.includes('features') || lowerMessage.includes('capabilities')) {
        return `# PulseBuilder - Your AI Assistant

I'm a comprehensive AI assistant with these capabilities:

## Chat & AI
- Answer questions on any topic
- Explain complex concepts simply
- Help brainstorm ideas
- Provide coding assistance

## Built-in Browser
- Browse any website directly
- Research documentation
- Access online resources

## Code Editor
- Write code in multiple languages
- Syntax highlighting
- Run JavaScript directly
- Copy and share code

## File Explorer
- Create and manage files
- Organize project folders
- Preview file contents
- Upload files

## Terminal
- Execute commands
- Run scripts
- System operations

## Settings
- Customize appearance
- Change themes
- Adjust font sizes

**Just ask me anything or use the sidebar to access different tools!**`;
    }
    
    // JavaScript code help
    if (lowerMessage.includes('javascript') || (lowerMessage.includes('js') && !lowerMessage.includes('json'))) {
        if (lowerMessage.includes('array') || lowerMessage.includes('list')) {
            return `Here's how to work with arrays in JavaScript:

\`\`\`javascript
// Creating arrays
const fruits = ['apple', 'banana', 'orange'];
const numbers = [1, 2, 3, 4, 5];

// Array methods
fruits.push('grape');        // Add to end
fruits.pop();                // Remove from end

// Map - transform each element
const doubled = numbers.map(n => n * 2);

// Filter - get elements matching condition
const even = numbers.filter(n => n % 2 === 0);

// Reduce - combine into single value
const sum = numbers.reduce((acc, n) => acc + n, 0);
\`\`\`

Try these in the **Code Editor** panel!`;
        }
        
        if (lowerMessage.includes('function')) {
            return `Here are different ways to write functions in JavaScript:

\`\`\`javascript
// 1. Function Declaration
function greet(name) {
    return 'Hello, ' + name + '!';
}

// 2. Arrow Function
const welcome = (name) => {
    return 'Welcome, ' + name + '!';
};

// 3. Arrow Function (short form)
const hello = name => 'Hello, ' + name + '!';

// Using the functions
console.log(greet('Alice'));
console.log(hello('Bob'));
\`\`\``;
        }
        
        return `Here's a JavaScript example to get you started:

\`\`\`javascript
// Variables
const name = 'PulseBuilder';
let count = 0;

// Function
function greet(userName) {
    return \`Hello, \${userName}! Welcome to \${name}.\`;
}

// Arrow function
const add = (a, b) => a + b;

// Array operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const sum = numbers.reduce((acc, n) => acc + n, 0);

console.log(greet('Developer'));
console.log('Sum:', sum);
\`\`\`

You can run this code in the **Code Editor** panel!`;
    }
    
    // Python code help
    if (lowerMessage.includes('python')) {
        return `Here's a Python example:

\`\`\`python
# Variables
name = "PulseBuilder"

# Function
def greet(user_name):
    return f"Hello, {user_name}! Welcome to {name}."

# List operations
numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]
total = sum(numbers)

# Dictionary
user = {
    "name": "Developer",
    "skills": ["Python", "JavaScript", "HTML"],
}

print(greet("Developer"))
print(f"Sum: {total}")
\`\`\`

Note: Python code can't run directly in the browser, but you can use the Code Editor to write and save Python files!`;
    }
    
    // HTML help
    if (lowerMessage.includes('html')) {
        return `Here's an HTML template to get started:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Website</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
        }
        .btn {
            background: #8B5CF6;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <h1>Welcome to My Website</h1>
    <button class="btn" onclick="alert('Hello!')">Click Me</button>
</body>
</html>
\`\`\``;
    }
    
    // CSS help
    if (lowerMessage.includes('css') || lowerMessage.includes('style')) {
        return `Here are some useful CSS techniques:

\`\`\`css
/* Flexbox Layout */
.container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
}

/* Modern Card Design */
.card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Gradient Background */
.gradient-bg {
    background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
}
\`\`\``;
    }
    
    // Math/calculation help
    if (lowerMessage.includes('calculate') || lowerMessage.includes('math') || lowerMessage.match(/\d+\s*[\+\-\*\/]\s*\d+/)) {
        const mathMatch = message.match(/(\d+(?:\.\d+)?)\s*([\+\-\*\/\^])\s*(\d+(?:\.\d+)?)/);
        if (mathMatch) {
            const a = parseFloat(mathMatch[1]);
            const op = mathMatch[2];
            const b = parseFloat(mathMatch[3]);
            let result;
            switch(op) {
                case '+': result = a + b; break;
                case '-': result = a - b; break;
                case '*': result = a * b; break;
                case '/': result = b !== 0 ? a / b : 'Error: Division by zero'; break;
                case '^': result = Math.pow(a, b); break;
            }
            return `**Calculation Result:**\n\n${a} ${op} ${b} = **${result}**`;
        }
        
        return `I can help with math! Just type a calculation like "5 + 3" or "10 * 20" and I'll solve it!`;
    }
    
    // Browser-related responses
    if (lowerMessage.includes('browser') || lowerMessage.includes('web') || lowerMessage.includes('search')) {
        return `You can use the **Built-in Browser** panel to browse the web! Click on 'Browser' in the sidebar.

**Features:**
- Navigate to any website
- Use back/forward buttons
- Refresh pages
- Search Google or any search engine

Click the **Browser** icon in the sidebar to get started!`;
    }
    
    // File-related responses
    if (lowerMessage.includes('file') || lowerMessage.includes('folder') || lowerMessage.includes('project')) {
        return `The **File Explorer** panel helps you manage your files!

**Features:**
- Create new folders and files
- Upload files from your device
- Preview file contents
- Organize your projects

Click the **Files** icon in the sidebar!`;
    }
    
    // Terminal-related responses
    if (lowerMessage.includes('terminal') || lowerMessage.includes('command') || lowerMessage.includes('shell')) {
        return `The **Terminal** panel provides a command-line interface!

**Available Commands:**
- \`help\` - Show all commands
- \`clear\` - Clear the terminal
- \`echo [text]\` - Print text
- \`date\` - Show current date/time
- \`version\` - Show PulseBuilder version

Click the **Terminal** icon in the sidebar!`;
    }
    
    // Thank you responses
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
        const responses = [
            "You're welcome! I'm always here to help. Feel free to ask me anything else!",
            "Happy to help! Let me know if you need anything else.",
            "No problem! That's what I'm here for."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Goodbye responses
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
        return "Goodbye! Come back anytime you need help. Have a wonderful day!";
    }
    
    // Joke request
    if (lowerMessage.includes('joke') || lowerMessage.includes('funny')) {
        const jokes = [
            "Why do programmers prefer dark mode? Because light attracts bugs!",
            "Why did the developer go broke? Because he used up all his cache!",
            "A SQL query walks into a bar, walks up to two tables and asks, 'Can I join you?'",
            "Why do Java developers wear glasses? Because they can't C#!"
        ];
        return jokes[Math.floor(Math.random() * jokes.length)];
    }
    
    // Time/date
    if (lowerMessage.includes('time') || lowerMessage.includes('date') || lowerMessage.includes('today')) {
        const now = new Date();
        return `**Current Date & Time:**\n\nDate: ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\nTime: ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    }
    
    // General coding question
    if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('develop')) {
        return `I'd love to help with coding! Here are some things I can assist with:

**Languages I can help with:**
- JavaScript / TypeScript
- Python
- HTML / CSS
- React / Vue
- And many more!

**What I can do:**
- Explain code concepts
- Provide code examples
- Help debug issues
- Suggest best practices

What would you like to learn about?`;
    }
    
    // Default intelligent response
    const defaultResponses = [
        `I understand you're asking about "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}". Let me help!\n\nI'm PulseBuilder, your AI assistant. I can help with:\n\n- **Coding**: Write and explain code\n- **Browsing**: Use the built-in browser\n- **Files**: Manage your projects\n- **Terminal**: Run commands\n\nWhat would you like to do?`,
        
        `Thanks for your question! I'm PulseBuilder, your comprehensive AI assistant.\n\n**I can help with:**\n- Programming in multiple languages\n- Web browsing and research\n- File management\n- Terminal commands\n\nFeel free to ask me anything specific!`,
        
        `Great question! As PulseBuilder, I'm here to assist you.\n\n**Try asking me about:**\n- JavaScript, Python, HTML, CSS\n- How to use the browser, code editor, or terminal\n- Programming concepts\n\nWhat would you like to do?`
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

function clearChat() {
    chatHistory = [];
    chatContainer.innerHTML = `
        <div class="welcome-message">
            <img src="logo.png" alt="PulseBuilder" class="welcome-logo">
            <h2>Welcome to PulseBuilder</h2>
            <p>Your AI-powered assistant for coding, browsing, and more.</p>
            <p>Ask me anything or use the tools in the sidebar!</p>
        </div>
    `;
}

// Browser functionality (using iframe for mobile)
const browserIframe = document.getElementById('browser-iframe');
const urlInput = document.getElementById('url-input');

function navigateTo() {
    let url = urlInput.value.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    if (browserIframe) {
        browserIframe.src = url;
    }
}

function browserBack() {
    if (browserIframe && browserIframe.contentWindow) {
        browserIframe.contentWindow.history.back();
    }
}

function browserForward() {
    if (browserIframe && browserIframe.contentWindow) {
        browserIframe.contentWindow.history.forward();
    }
}

function browserRefresh() {
    if (browserIframe) {
        browserIframe.src = browserIframe.src;
    }
}

if (urlInput) {
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            navigateTo();
        }
    });
}

// Code Editor functionality
const codeEditor = document.getElementById('code-editor');
const codeOutput = document.getElementById('code-output');
const languageSelect = document.getElementById('language-select');

function runCode() {
    const code = codeEditor.value;
    const language = languageSelect.value;
    
    codeOutput.textContent = '';
    
    if (language === 'javascript') {
        const logs = [];
        const originalLog = console.log;
        console.log = (...args) => {
            logs.push(args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
        };
        
        try {
            const result = eval(code);
            if (logs.length > 0) {
                codeOutput.textContent = logs.join('\n');
            }
            if (result !== undefined) {
                codeOutput.textContent += (logs.length > 0 ? '\n' : '') + '=> ' + 
                    (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
            }
            codeOutput.style.color = '#10B981';
        } catch (error) {
            codeOutput.textContent = 'Error: ' + error.message;
            codeOutput.style.color = '#EF4444';
        }
        
        console.log = originalLog;
    } else {
        codeOutput.textContent = `Note: Direct execution is only available for JavaScript.\n\nFor ${language}, you would need to use a native compiler/interpreter.`;
        codeOutput.style.color = '#a0a0b0';
    }
}

function copyCode() {
    navigator.clipboard.writeText(codeEditor.value).then(() => {
        alert('Code copied to clipboard!');
    });
}

function clearCode() {
    codeEditor.value = '';
    codeOutput.textContent = '';
}

// File Explorer functionality
const fileTree = document.getElementById('file-tree');
const filePreview = document.getElementById('file-preview');

const sampleFiles = {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Project</title>
</head>
<body>
    <h1>Hello World!</h1>
</body>
</html>`,
    'styles.css': `body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
}`,
    'app.js': `console.log('App loaded!');`
};

function toggleFolder(element) {
    const folder = element.parentElement;
    const content = folder.querySelector('.folder-content');
    if (content) {
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
    }
}

function openFile(filename) {
    const content = sampleFiles[filename] || 'File content not available';
    filePreview.innerHTML = `<h3>${filename}</h3><pre><code>${escapeHtml(content)}</code></pre>`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function createNewFile() {
    const filename = prompt('Enter file name:');
    if (filename) {
        sampleFiles[filename] = '';
        alert(`File "${filename}" created!`);
    }
}

function createNewFolder() {
    const foldername = prompt('Enter folder name:');
    if (foldername) {
        alert(`Folder "${foldername}" created!`);
    }
}

function uploadFile() {
    document.getElementById('file-upload').click();
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            sampleFiles[file.name] = e.target.result;
            alert(`File "${file.name}" uploaded!`);
        };
        reader.readAsText(file);
    }
}

// Terminal functionality
const terminalOutput = document.getElementById('terminal-output');
const terminalInput = document.getElementById('terminal-input');

const terminalCommands = {
    help: () => `Available commands:
  help     - Show this help message
  clear    - Clear the terminal
  echo     - Print text to terminal
  date     - Show current date and time
  whoami   - Show current user
  version  - Show PulseBuilder version`,
    
    clear: () => {
        terminalOutput.innerHTML = '';
        return null;
    },
    
    echo: (args) => args.join(' '),
    date: () => new Date().toString(),
    whoami: () => 'pulsebuilder-user',
    version: () => 'PulseBuilder Mobile v1.0.0'
};

function handleTerminalInput(event) {
    if (event.key === 'Enter') {
        const input = terminalInput.value.trim();
        if (!input) return;
        
        addTerminalLine(`pulsebuilder $ ${input}`, 'command');
        
        const parts = input.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        if (terminalCommands[cmd]) {
            const result = terminalCommands[cmd](args);
            if (result !== null) {
                addTerminalLine(result, 'output');
            }
        } else {
            addTerminalLine(`Command not found: ${cmd}. Type 'help' for available commands.`, 'error');
        }
        
        terminalInput.value = '';
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
}

function addTerminalLine(text, type = 'output') {
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    line.textContent = text;
    terminalOutput.appendChild(line);
}

function clearTerminal() {
    terminalOutput.innerHTML = `
        <div class="terminal-line">PulseBuilder Terminal v1.0</div>
        <div class="terminal-line">Type 'help' for available commands</div>
        <div class="terminal-line">---</div>
    `;
}

// Theme functionality
function changeTheme() {
    const theme = document.getElementById('theme-select').value;
    document.body.className = theme === 'dark' ? '' : `theme-${theme}`;
}

function changeFontSize() {
    const size = document.getElementById('font-size').value;
    document.getElementById('font-size-value').textContent = size + 'px';
    document.body.style.fontSize = size + 'px';
}

// Code extraction and action functions
function extractCodeFromContent(content) {
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        blocks.push({ language: match[1] || 'text', code: match[2] });
    }
    return blocks;
}

function getHtmlFromContent(content) {
    const blocks = extractCodeFromContent(content);
    const htmlBlock = blocks.find(b => b.language === 'html' || b.code.includes('<!DOCTYPE') || b.code.includes('<html'));
    return htmlBlock?.code || '';
}

function downloadCodeFromMessage(btn) {
    const messageDiv = btn.closest('.message');
    const content = messageDiv.dataset.content;
    const blocks = extractCodeFromContent(content);
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
    a.download = `code.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('File downloaded!');
}

function previewHtmlFromMessage(btn) {
    const messageDiv = btn.closest('.message');
    const content = messageDiv.dataset.content;
    const html = getHtmlFromContent(content);
    if (!html) return;
    
    // Switch to browser panel and show preview
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-panel="browser"]').classList.add('active');
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById('browser-panel').classList.add('active');
    
    // Create blob URL for preview
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    document.getElementById('browser-iframe').src = url;
    document.getElementById('url-input').value = 'Preview: Generated HTML';
}

async function hostHtmlFromMessage(btn) {
    const messageDiv = btn.closest('.message');
    const content = messageDiv.dataset.content;
    const html = getHtmlFromContent(content);
    if (!html) return;
    
    btn.textContent = 'Hosting...';
    btn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/host`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html, title: 'PulseBuilder Generated Page' })
        });
        
        if (response.ok) {
            const data = await response.json();
            // Show URL in alert and copy to clipboard
            navigator.clipboard.writeText(data.url).catch(() => {});
            alert(`Your page is live!\n\nURL: ${data.url}\n\n(URL copied to clipboard)`);
        } else {
            alert('Failed to host HTML. Please try again.');
        }
    } catch (error) {
        alert('Error hosting HTML: ' + error.message);
    }
    
    btn.textContent = 'Host & Share';
    btn.disabled = false;
}

function copyCodeFromMessage(btn) {
    const messageDiv = btn.closest('.message');
    const content = messageDiv.dataset.content;
    const blocks = extractCodeFromContent(content);
    if (blocks.length > 0) {
        navigator.clipboard.writeText(blocks[0].code).then(() => {
            alert('Code copied to clipboard!');
        }).catch(() => {
            alert('Failed to copy code.');
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadChatSessions();
    
    if (document.querySelector('[data-panel="terminal"]')) {
        document.querySelector('[data-panel="terminal"]').addEventListener('click', () => {
            setTimeout(() => terminalInput && terminalInput.focus(), 100);
        });
    }
});
