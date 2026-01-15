// PulseBuilder - AI Assistant Application
// Main JavaScript file

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
        hljs.highlightElement(block);
    });
}

function formatMessage(content) {
    // Convert markdown to HTML using marked
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    return hljs.highlight(code, { language: lang }).value;
                }
                return hljs.highlightAuto(code).value;
            },
            breaks: true
        });
        return marked.parse(content);
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

I'm built to be your all-in-one development companion, similar to advanced AI assistants like Devin. I work completely offline with built-in intelligence!`;
    }
    
    // Help responses
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do') || lowerMessage.includes('features') || lowerMessage.includes('capabilities')) {
        return `# PulseBuilder - Your AI Assistant

I'm a comprehensive AI assistant with these capabilities:

## 💬 Chat & AI
- Answer questions on any topic
- Explain complex concepts simply
- Help brainstorm ideas
- Provide coding assistance

## 🌐 Built-in Browser
- Browse any website directly
- Research documentation
- Access online resources

## 💻 Code Editor
- Write code in multiple languages
- Syntax highlighting
- Run JavaScript directly
- Copy and share code

## 📁 File Explorer
- Create and manage files
- Organize project folders
- Preview file contents
- Upload files

## ⌨️ Terminal
- Execute commands
- Run scripts
- System operations

## ⚙️ Settings
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
fruits.unshift('mango');     // Add to beginning
fruits.shift();              // Remove from beginning

// Iterating
fruits.forEach(fruit => console.log(fruit));

// Map - transform each element
const doubled = numbers.map(n => n * 2);

// Filter - get elements matching condition
const even = numbers.filter(n => n % 2 === 0);

// Find - get first matching element
const found = numbers.find(n => n > 3);

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

// 2. Function Expression
const sayHi = function(name) {
    return 'Hi, ' + name + '!';
};

// 3. Arrow Function
const welcome = (name) => {
    return 'Welcome, ' + name + '!';
};

// 4. Arrow Function (short form)
const hello = name => 'Hello, ' + name + '!';

// 5. Default Parameters
function greetWithDefault(name = 'Guest') {
    return 'Hello, ' + name + '!';
}

// Using the functions
console.log(greet('Alice'));
console.log(hello('Bob'));
console.log(greetWithDefault());
\`\`\``;
        }
        
        if (lowerMessage.includes('loop') || lowerMessage.includes('iterate')) {
            return `Here are different loops in JavaScript:

\`\`\`javascript
// 1. For Loop
for (let i = 0; i < 5; i++) {
    console.log('Count:', i);
}

// 2. While Loop
let count = 0;
while (count < 5) {
    console.log('While:', count);
    count++;
}

// 3. For...of (for arrays)
const colors = ['red', 'green', 'blue'];
for (const color of colors) {
    console.log('Color:', color);
}

// 4. For...in (for objects)
const person = { name: 'John', age: 30 };
for (const key in person) {
    console.log(key + ':', person[key]);
}

// 5. forEach (array method)
colors.forEach((color, index) => {
    console.log(index + ':', color);
});
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

// Object
const user = {
    name: 'Developer',
    skills: ['JavaScript', 'Python', 'HTML'],
    greet() {
        return \`Hi, I'm \${this.name}\`;
    }
};

console.log(greet('Developer'));
console.log('Sum:', sum);
console.log('Doubled:', doubled);
\`\`\`

You can run this code in the **Code Editor** panel! Ask me about specific topics like arrays, functions, loops, or async/await.`;
    }
    
    // Python code help
    if (lowerMessage.includes('python')) {
        if (lowerMessage.includes('list') || lowerMessage.includes('array')) {
            return `Here's how to work with lists in Python:

\`\`\`python
# Creating lists
fruits = ['apple', 'banana', 'orange']
numbers = [1, 2, 3, 4, 5]

# Adding elements
fruits.append('grape')       # Add to end
fruits.insert(0, 'mango')    # Add at index

# Removing elements
fruits.remove('banana')      # Remove by value
last = fruits.pop()          # Remove and return last

# List comprehension
doubled = [n * 2 for n in numbers]
even = [n for n in numbers if n % 2 == 0]

# Slicing
first_three = numbers[:3]
last_two = numbers[-2:]

# Useful functions
print(len(fruits))           # Length
print(sum(numbers))          # Sum
print(max(numbers))          # Maximum
print(sorted(numbers))       # Sorted copy
\`\`\``;
        }
        
        return `Here's a Python example:

\`\`\`python
# Variables
name = "PulseBuilder"
count = 0

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

# Class
class Assistant:
    def __init__(self, name):
        self.name = name
    
    def greet(self):
        return f"Hi, I'm {self.name}"

# Using the code
print(greet("Developer"))
print(f"Sum: {total}")
print(f"Doubled: {doubled}")

assistant = Assistant("PulseBuilder")
print(assistant.greet())
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 { color: #333; }
        .btn {
            background: #8B5CF6;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        .btn:hover { background: #7C3AED; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to My Website</h1>
        <p>This is a sample HTML page.</p>
        <button class="btn" onclick="alert('Hello!')">Click Me</button>
    </div>
</body>
</html>
\`\`\`

You can edit this in the **Code Editor** and preview it in the **Browser**!`;
    }
    
    // CSS help
    if (lowerMessage.includes('css') || lowerMessage.includes('style') || lowerMessage.includes('design')) {
        return `Here are some useful CSS techniques:

\`\`\`css
/* Flexbox Layout */
.container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
}

/* Grid Layout */
.grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

/* Modern Card Design */
.card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
}

/* Gradient Background */
.gradient-bg {
    background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
}

/* Responsive Design */
@media (max-width: 768px) {
    .grid {
        grid-template-columns: 1fr;
    }
}

/* Smooth Animations */
.animated {
    animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
\`\`\``;
    }
    
    // React help
    if (lowerMessage.includes('react')) {
        return `Here's a React component example:

\`\`\`jsx
import React, { useState, useEffect } from 'react';

// Functional Component with Hooks
function Counter() {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
        document.title = \`Count: \${count}\`;
    }, [count]);
    
    return (
        <div className="counter">
            <h2>Count: {count}</h2>
            <button onClick={() => setCount(count + 1)}>
                Increment
            </button>
            <button onClick={() => setCount(count - 1)}>
                Decrement
            </button>
        </div>
    );
}

// Component with Props
function Greeting({ name, age }) {
    return (
        <div>
            <h1>Hello, {name}!</h1>
            <p>You are {age} years old.</p>
        </div>
    );
}

// List Rendering
function TodoList({ items }) {
    return (
        <ul>
            {items.map((item, index) => (
                <li key={index}>{item}</li>
            ))}
        </ul>
    );
}

export default Counter;
\`\`\`

React is great for building interactive UIs!`;
    }
    
    // API/fetch help
    if (lowerMessage.includes('api') || lowerMessage.includes('fetch') || lowerMessage.includes('http') || lowerMessage.includes('request')) {
        return `Here's how to make API requests in JavaScript:

\`\`\`javascript
// Using fetch (modern approach)
async function fetchData() {
    try {
        const response = await fetch('https://api.example.com/data');
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

// POST request with data
async function postData(url, data) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    return response.json();
}

// Using async/await with error handling
async function getUser(id) {
    try {
        const response = await fetch(\`https://api.example.com/users/\${id}\`);
        const user = await response.json();
        return user;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

// Example usage
fetchData();
postData('/api/users', { name: 'John', email: 'john@example.com' });
\`\`\``;
    }
    
    // Math/calculation help
    if (lowerMessage.includes('calculate') || lowerMessage.includes('math') || lowerMessage.match(/\d+\s*[\+\-\*\/]\s*\d+/)) {
        // Try to evaluate simple math expressions
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
        
        return `I can help with math! Here are some examples:

**Basic Operations:**
- Addition: 5 + 3 = 8
- Subtraction: 10 - 4 = 6
- Multiplication: 6 * 7 = 42
- Division: 20 / 4 = 5

**JavaScript Math Functions:**
\`\`\`javascript
Math.round(4.7)    // 5 (round to nearest)
Math.floor(4.7)    // 4 (round down)
Math.ceil(4.2)     // 5 (round up)
Math.abs(-5)       // 5 (absolute value)
Math.pow(2, 3)     // 8 (2 to the power of 3)
Math.sqrt(16)      // 4 (square root)
Math.random()      // Random number 0-1
Math.max(1, 5, 3)  // 5 (maximum)
Math.min(1, 5, 3)  // 1 (minimum)
\`\`\`

Just type a calculation like "5 + 3" or "10 * 20" and I'll solve it!`;
    }
    
    // Browser-related responses
    if (lowerMessage.includes('browser') || lowerMessage.includes('web') || lowerMessage.includes('search') || lowerMessage.includes('google')) {
        return `You can use the **Built-in Browser** panel to browse the web! Click on 'Browser' in the sidebar to access it.

**Features:**
- Navigate to any website by entering the URL
- Use back/forward buttons for navigation history
- Refresh pages with the reload button
- Search Google or any search engine

**Tips:**
- Just type a URL like "google.com" and press Enter
- Use it to research documentation, tutorials, or any information
- Great for testing web applications you're building

Click the **Browser** icon in the sidebar to get started!`;
    }
    
    // File-related responses
    if (lowerMessage.includes('file') || lowerMessage.includes('folder') || lowerMessage.includes('project') || lowerMessage.includes('directory')) {
        return `The **File Explorer** panel helps you manage your files and projects!

**Features:**
- 📁 Create new folders to organize your work
- 📄 Create new files with any extension
- ⬆️ Upload files from your computer
- 👁️ Preview file contents with syntax highlighting

**How to use:**
1. Click the **Files** icon in the sidebar
2. Use the toolbar buttons to create files/folders or upload
3. Click on any file to preview its contents
4. Expand/collapse folders by clicking on them

**Supported file types:**
- Code: .js, .py, .html, .css, .json, etc.
- Text: .txt, .md, .log
- And many more!`;
    }
    
    // Terminal-related responses
    if (lowerMessage.includes('terminal') || lowerMessage.includes('command') || lowerMessage.includes('shell') || lowerMessage.includes('cmd')) {
        return `The **Terminal** panel provides a command-line interface!

**Available Commands:**
- \`help\` - Show all available commands
- \`clear\` - Clear the terminal screen
- \`echo [text]\` - Print text to terminal
- \`date\` - Show current date and time
- \`whoami\` - Show current user
- \`pwd\` - Print working directory
- \`ls\` - List files in current directory
- \`cat [file]\` - Display file contents
- \`version\` - Show PulseBuilder version
- \`about\` - About PulseBuilder

**How to use:**
1. Click the **Terminal** icon in the sidebar
2. Type a command and press Enter
3. View the output in the terminal window

Try typing \`help\` to see all commands!`;
    }
    
    // Code editor responses
    if (lowerMessage.includes('editor') || lowerMessage.includes('write code') || lowerMessage.includes('run code')) {
        return `The **Code Editor** panel lets you write and run code!

**Features:**
- Syntax highlighting for multiple languages
- Run JavaScript code directly in the browser
- Copy code to clipboard
- Clear and start fresh

**Supported Languages:**
- JavaScript (can run directly!)
- Python
- HTML
- CSS
- JSON
- And more...

**How to use:**
1. Click the **Code** icon in the sidebar
2. Select your programming language
3. Write your code in the editor
4. Click **Run** to execute (JavaScript only)
5. See output in the panel below

**Tip:** Try running this JavaScript:
\`\`\`javascript
console.log('Hello from PulseBuilder!');
\`\`\``;
    }
    
    // Thank you responses
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
        const responses = [
            "You're welcome! I'm always here to help. Feel free to ask me anything else!",
            "Happy to help! Let me know if you need anything else.",
            "No problem! That's what I'm here for. What else can I assist you with?",
            "Glad I could help! Don't hesitate to ask more questions."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Goodbye responses
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') || lowerMessage.includes('see you')) {
        return "Goodbye! It was great chatting with you. Come back anytime you need help. Have a wonderful day! 👋";
    }
    
    // Joke request
    if (lowerMessage.includes('joke') || lowerMessage.includes('funny')) {
        const jokes = [
            "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
            "Why did the developer go broke? Because he used up all his cache! 💰",
            "A SQL query walks into a bar, walks up to two tables and asks, 'Can I join you?' 🍺",
            "Why do Java developers wear glasses? Because they can't C#! 👓",
            "There are only 10 types of people in the world: those who understand binary and those who don't.",
            "Why was the JavaScript developer sad? Because he didn't Node how to Express himself! 😢",
            "What's a programmer's favorite hangout place? Foo Bar! 🍻"
        ];
        return jokes[Math.floor(Math.random() * jokes.length)];
    }
    
    // Time/date
    if (lowerMessage.includes('time') || lowerMessage.includes('date') || lowerMessage.includes('today')) {
        const now = new Date();
        return `**Current Date & Time:**\n\n📅 Date: ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n🕐 Time: ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    }
    
    // Weather (simulated)
    if (lowerMessage.includes('weather')) {
        return "I don't have access to real-time weather data, but you can check the weather using the **Built-in Browser**!\n\nTry visiting:\n- weather.com\n- google.com/search?q=weather\n\nClick on **Browser** in the sidebar and search for your local weather!";
    }
    
    // General coding question
    if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('develop')) {
        return `I'd love to help with coding! Here are some things I can assist with:

**Languages I can help with:**
- JavaScript / TypeScript
- Python
- HTML / CSS
- React / Vue / Angular
- Node.js
- SQL
- And many more!

**What I can do:**
- Explain code concepts
- Provide code examples
- Help debug issues
- Suggest best practices
- Write code snippets

**Just ask me something specific like:**
- "How do I create a function in JavaScript?"
- "Show me a Python loop example"
- "How do I center a div in CSS?"
- "Explain async/await"

What would you like to learn about?`;
    }
    
    // Default intelligent response
    const defaultResponses = [
        `I understand you're asking about "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}". Let me help you with that!\n\nI'm PulseBuilder, your AI assistant. I can help you with:\n\n- **Coding**: Write, debug, and explain code in various languages\n- **Browsing**: Use the built-in browser to research anything\n- **Files**: Manage your project files and folders\n- **Terminal**: Run commands and scripts\n\nCould you provide more details about what you'd like to accomplish? I'm here to help!`,
        
        `Thanks for your question! I'm PulseBuilder, and I'm designed to be your comprehensive AI assistant.\n\n**Here's what I can do:**\n- Answer questions and explain concepts\n- Help with programming in multiple languages\n- Assist with web browsing and research\n- Manage files and run terminal commands\n\nFeel free to ask me anything specific, or explore the different panels using the sidebar!`,
        
        `Great question! As PulseBuilder, I'm here to assist you with a wide range of tasks.\n\n**Try asking me about:**\n- JavaScript, Python, HTML, CSS, or other languages\n- How to use the built-in browser, code editor, or terminal\n- General programming concepts and best practices\n\n**Or explore the app:**\n- 💬 Chat - You're here!\n- 🌐 Browser - Browse the web\n- 💻 Code - Write and run code\n- 📁 Files - Manage files\n- ⌨️ Terminal - Run commands\n\nWhat would you like to do?`
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

// Browser functionality
const webview = document.getElementById('browser-webview');
const urlInput = document.getElementById('url-input');

function navigateTo() {
    let url = urlInput.value.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    webview.src = url;
}

function browserBack() {
    if (webview.canGoBack()) {
        webview.goBack();
    }
}

function browserForward() {
    if (webview.canGoForward()) {
        webview.goForward();
    }
}

function browserRefresh() {
    webview.reload();
}

// Update URL input when navigation occurs
if (webview) {
    webview.addEventListener('did-navigate', (e) => {
        urlInput.value = e.url;
    });
    
    webview.addEventListener('did-navigate-in-page', (e) => {
        urlInput.value = e.url;
    });
}

urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        navigateTo();
    }
});

// Code Editor functionality
const codeEditor = document.getElementById('code-editor');
const codeOutput = document.getElementById('code-output');
const languageSelect = document.getElementById('language-select');

function runCode() {
    const code = codeEditor.value;
    const language = languageSelect.value;
    
    codeOutput.textContent = '';
    
    if (language === 'javascript') {
        // Capture console.log output
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
        codeOutput.textContent = `Note: Direct execution is only available for JavaScript.\n\nFor ${language}, you would need to:\n1. Save the file with appropriate extension\n2. Run it using the terminal with the appropriate compiler/interpreter`;
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

// Sample file contents
const sampleFiles = {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Project</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>Hello World!</h1>
    <script src="app.js"></script>
</body>
</html>`,
    'styles.css': `body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background: #f5f5f5;
}

h1 {
    color: #333;
}`,
    'app.js': `// Main application file
console.log('App loaded!');

function init() {
    console.log('Initializing...');
}

init();`
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
    filePreview.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
    });
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
        // In a real app, this would update the file tree
    }
}

function createNewFolder() {
    const foldername = prompt('Enter folder name:');
    if (foldername) {
        alert(`Folder "${foldername}" created!`);
        // In a real app, this would update the file tree
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
  pwd      - Print working directory
  ls       - List files
  cat      - Display file contents
  version  - Show PulseBuilder version
  about    - About PulseBuilder`,
    
    clear: () => {
        terminalOutput.innerHTML = '';
        return null;
    },
    
    echo: (args) => args.join(' '),
    
    date: () => new Date().toString(),
    
    whoami: () => 'pulsebuilder-user',
    
    pwd: () => '/home/pulsebuilder/projects',
    
    ls: () => `index.html
styles.css
app.js
logo.png
package.json`,
    
    cat: (args) => {
        const filename = args[0];
        if (sampleFiles[filename]) {
            return sampleFiles[filename];
        }
        return `cat: ${filename}: No such file or directory`;
    },
    
    version: () => 'PulseBuilder v1.0.0',
    
    about: () => `PulseBuilder - AI Assistant
Version: 1.0.0
Built with Electron
Your AI-powered development companion`
};

function handleTerminalInput(event) {
    if (event.key === 'Enter') {
        const input = terminalInput.value.trim();
        if (!input) return;
        
        // Add command to output
        addTerminalLine(`pulsebuilder $ ${input}`, 'command');
        
        // Parse command
        const parts = input.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        // Execute command
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
    
    // Focus terminal input when terminal panel is shown
    document.querySelector('[data-panel="terminal"]').addEventListener('click', () => {
        setTimeout(() => terminalInput.focus(), 100);
    });
});
