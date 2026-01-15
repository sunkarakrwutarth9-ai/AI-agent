// PulseBuilder - AI Assistant Application
// Main JavaScript file

// State management
let chatHistory = [];
let settings = {
    apiProvider: 'openai',
    apiKey: '',
    model: 'gpt-4',
    theme: 'dark',
    fontSize: 14
};

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
    
    // Clear welcome message if present
    const welcome = chatContainer.querySelector('.welcome-message');
    if (welcome) welcome.remove();
    
    // Add user message
    addMessage(message, 'user');
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    // Add to history
    chatHistory.push({ role: 'user', content: message });
    
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
        addMessage(response, 'assistant');
        chatHistory.push({ role: 'assistant', content: response });
    } catch (error) {
        typingDiv.remove();
        addMessage('Sorry, I encountered an error: ' + error.message, 'assistant');
    }
}

function addMessage(content, role) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const avatar = role === 'user' ? 'U' : 'P';
    
    // Parse markdown and code blocks
    let formattedContent = formatMessage(content);
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">${formattedContent}</div>
    `;
    
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
    // Check if API key is set
    if (!settings.apiKey) {
        return generateLocalResponse(message);
    }
    
    // Call AI API based on provider
    if (settings.apiProvider === 'openai') {
        return await callOpenAI(message);
    } else if (settings.apiProvider === 'anthropic') {
        return await callAnthropic(message);
    } else {
        return generateLocalResponse(message);
    }
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

function generateLocalResponse(message) {
    // Local AI simulation for when no API key is provided
    const lowerMessage = message.toLowerCase();
    
    // Greeting responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return "Hello! I'm PulseBuilder, your AI assistant. I can help you with coding, browsing, file management, and much more. How can I assist you today?\n\nTo unlock my full AI capabilities, please add your OpenAI or Anthropic API key in the Settings panel.";
    }
    
    // Help responses
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
        return `# PulseBuilder Features

I'm a comprehensive AI assistant with the following capabilities:

## Chat
- Answer questions on any topic
- Help with coding problems
- Explain concepts and provide tutorials

## Built-in Browser
- Browse the web directly within the app
- Research information
- Access documentation

## Code Editor
- Write and edit code in multiple languages
- Syntax highlighting
- Run JavaScript code directly

## File Explorer
- Manage your files and folders
- Create, edit, and organize projects

## Terminal
- Execute commands
- Run scripts
- Manage your development environment

## Settings
- Configure AI provider (OpenAI/Anthropic)
- Customize appearance
- Adjust preferences

**Tip:** Add your API key in Settings to unlock full AI capabilities!`;
    }
    
    // Code-related responses
    if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('javascript') || lowerMessage.includes('python')) {
        return `I'd be happy to help with coding! Here's an example:

\`\`\`javascript
// Example: A simple greeting function
function greet(name) {
    return \`Hello, \${name}! Welcome to PulseBuilder.\`;
}

// Using the function
console.log(greet('Developer'));
\`\`\`

You can use the **Code Editor** panel to write and run your code. I support multiple programming languages including JavaScript, Python, HTML, CSS, and more.

For full AI-powered code assistance, please add your API key in Settings.`;
    }
    
    // Browser-related responses
    if (lowerMessage.includes('browser') || lowerMessage.includes('web') || lowerMessage.includes('search')) {
        return "You can use the **Built-in Browser** panel to browse the web! Click on 'Browser' in the sidebar to access it. You can:\n\n- Navigate to any website\n- Use the back/forward buttons\n- Refresh pages\n- Search the web\n\nThis is great for researching documentation, looking up solutions, or accessing web-based tools.";
    }
    
    // File-related responses
    if (lowerMessage.includes('file') || lowerMessage.includes('folder') || lowerMessage.includes('project')) {
        return "The **File Explorer** panel helps you manage your files and projects. You can:\n\n- Create new files and folders\n- Upload files from your computer\n- Browse your project structure\n- Preview file contents\n\nClick on 'Files' in the sidebar to get started!";
    }
    
    // Terminal-related responses
    if (lowerMessage.includes('terminal') || lowerMessage.includes('command') || lowerMessage.includes('shell')) {
        return "The **Terminal** panel provides a command-line interface. You can:\n\n- Run basic commands\n- Execute scripts\n- Manage your environment\n\nType `help` in the terminal to see available commands. Click on 'Terminal' in the sidebar to access it.";
    }
    
    // Settings-related responses
    if (lowerMessage.includes('setting') || lowerMessage.includes('api') || lowerMessage.includes('config')) {
        return "You can configure PulseBuilder in the **Settings** panel:\n\n**AI Configuration:**\n- Choose your AI provider (OpenAI or Anthropic)\n- Enter your API key\n- Select your preferred model\n\n**Appearance:**\n- Change the theme\n- Adjust font size\n\nClick on 'Settings' in the sidebar to customize your experience!";
    }
    
    // Default response
    return `Thank you for your message! I'm PulseBuilder, your AI assistant.

I can help you with:
- **Coding** - Write, debug, and explain code
- **Browsing** - Search the web and access documentation
- **File Management** - Organize your projects
- **Terminal** - Run commands and scripts

To unlock my full AI capabilities with advanced reasoning and comprehensive responses, please add your OpenAI or Anthropic API key in the **Settings** panel.

Is there something specific I can help you with?`;
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    
    // Focus terminal input when terminal panel is shown
    document.querySelector('[data-panel="terminal"]').addEventListener('click', () => {
        setTimeout(() => terminalInput.focus(), 100);
    });
});
