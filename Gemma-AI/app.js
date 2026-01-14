// Configuration
const CONFIG = {
    ollamaUrl: 'http://localhost:11434',
    model: 'gemma3:4b',
    temperature: 0.7,
    maxTokens: 500,
    systemPrompt: 'אתה עוזר AI ידידותי ומועיל בשם דן. אתה עונה בעברית באופן ברור ומקצועי.'
};

// State
let chatHistory = [];
let isGenerating = false;

// DOM Elements
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const clearChatBtn = document.getElementById('clear-chat');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');
const saveSettingsBtn = document.getElementById('save-settings');
const testConnectionBtn = document.getElementById('test-connection');
const statusIndicator = document.getElementById('status');
const charCount = document.getElementById('char-count');
const attachBtn = document.getElementById('attach-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkOllamaConnection();
    loadChatHistory();
});

// Initialize App
function initializeApp() {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('danSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        Object.assign(CONFIG, settings);
        updateSettingsUI();
    }

    // Auto-resize textarea
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = userInput.scrollHeight + 'px';
        updateCharCount();
    });
}

// Setup Event Listeners
function setupEventListeners() {
    sendBtn.addEventListener('click', handleSendMessage);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    clearChatBtn.addEventListener('click', handleClearChat);
    settingsBtn.addEventListener('click', () => settingsModal.classList.add('active'));
    closeSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('active'));
    saveSettingsBtn.addEventListener('click', handleSaveSettings);
    testConnectionBtn.addEventListener('click', checkOllamaConnection);

    // Quick action buttons
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const prompt = btn.getAttribute('data-prompt');
            userInput.value = prompt;
            handleSendMessage();
        });
    });

    // Close modal on outside click
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
    });

    // Settings sliders
    document.getElementById('temperature').addEventListener('input', (e) => {
        document.getElementById('temp-value').textContent = e.target.value;
    });

    document.getElementById('max-tokens').addEventListener('input', (e) => {
        document.getElementById('tokens-value').textContent = e.target.value;
    });
}

// Handle Send Message
async function handleSendMessage() {
    const message = userInput.value.trim();

    if (!message || isGenerating) return;

    // Add user message
    addMessage('user', message);
    chatHistory.push({ role: 'user', content: message });

    // Clear input
    userInput.value = '';
    userInput.style.height = 'auto';
    updateCharCount();

    // Remove welcome message if exists
    const welcomeMsg = document.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }

    // Show typing indicator
    const typingId = showTypingIndicator();

    // Generate response
    isGenerating = true;
    sendBtn.disabled = true;

    try {
        const response = await generateResponse(message);
        removeTypingIndicator(typingId);
        addMessage('assistant', response);
        chatHistory.push({ role: 'assistant', content: response });
        saveChatHistory();
    } catch (error) {
        removeTypingIndicator(typingId);
        addMessage('assistant', 'מצטער, אירעה שגיאה. אנא בדוק שהשרת Ollama פועל ונסה שוב.');
        showToast('שגיאה בחיבור לשרת', 'error');
        console.error('Error:', error);
    } finally {
        isGenerating = false;
        sendBtn.disabled = false;
    }
}

// Generate Response from Ollama
async function generateResponse(prompt) {
    const response = await fetch(`${CONFIG.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: CONFIG.model,
            prompt: `${CONFIG.systemPrompt}\n\nמשתמש: ${prompt}\n\nדן:`,
            temperature: parseFloat(CONFIG.temperature),
            max_tokens: parseInt(CONFIG.maxTokens),
            stream: false
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.response || 'לא התקבלה תשובה מהמודל.';
}

// Add Message to Chat
function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';

    if (role === 'user') {
        avatar.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        `;
    } else {
        avatar.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
        `;
    }

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    messageText.textContent = content;

    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    messageTime.textContent = new Date().toLocaleTimeString('he-IL', {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageContent.appendChild(messageText);
    messageContent.appendChild(messageTime);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Show Typing Indicator
function showTypingIndicator() {
    const typingId = 'typing-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';
    messageDiv.id = typingId;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
        </svg>
    `;

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;

    messageContent.appendChild(typingIndicator);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return typingId;
}

// Remove Typing Indicator
function removeTypingIndicator(typingId) {
    const typingElement = document.getElementById(typingId);
    if (typingElement) {
        typingElement.remove();
    }
}

// Check Ollama Connection
async function checkOllamaConnection() {
    updateStatus('connecting', 'מתחבר...');

    try {
        const response = await fetch(`${CONFIG.ollamaUrl}/api/tags`, {
            method: 'GET',
        });

        if (response.ok) {
            const data = await response.json();
            const hasGemma = data.models?.some(m => m.name.includes('gemma'));

            if (hasGemma) {
                updateStatus('connected', 'מחובר');
                showToast('החיבור לשרת Ollama הצליח!', 'success');
            } else {
                updateStatus('connected', 'מחובר');
                showToast('שרת Ollama פועל, אך מודל Gemma לא נמצא. הרץ: ollama pull gemma3', 'warning');
            }
        } else {
            throw new Error('Connection failed');
        }
    } catch (error) {
        updateStatus('error', 'לא מחובר');
        showToast('לא ניתן להתחבר לשרת Ollama. ודא שהשרת פועל.', 'error');
        console.error('Connection error:', error);
    }
}

// Update Status Indicator
function updateStatus(status, text) {
    statusIndicator.className = `status-indicator ${status}`;
    statusIndicator.querySelector('.status-text').textContent = text;
}

// Handle Clear Chat
function handleClearChat() {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל ההיסטוריה?')) {
        chatHistory = [];
        chatContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
                    </svg>
                </div>
                <h2>שלום! אני דן 👋</h2>
                <p>העוזר האישי שלך מבוסס בינה מלאכותית. אני כאן לעזור לך עם כל שאלה או משימה.</p>
                <div class="quick-actions">
                    <button class="quick-action-btn" data-prompt="ספר לי על עצמך">
                        <span>מי אתה?</span>
                    </button>
                    <button class="quick-action-btn" data-prompt="עזור לי לכתוב קוד Python">
                        <span>עזרה בקוד</span>
                    </button>
                    <button class="quick-action-btn" data-prompt="תן לי רעיונות יצירתיים">
                        <span>רעיונות יצירתיים</span>
                    </button>
                </div>
            </div>
        `;

        // Re-attach event listeners to quick action buttons
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.getAttribute('data-prompt');
                userInput.value = prompt;
                handleSendMessage();
            });
        });

        saveChatHistory();
        showToast('ההיסטוריה נמחקה בהצלחה', 'success');
    }
}

// Handle Save Settings
function handleSaveSettings() {
    CONFIG.model = document.getElementById('model-select').value;
    CONFIG.temperature = document.getElementById('temperature').value;
    CONFIG.maxTokens = document.getElementById('max-tokens').value;
    CONFIG.ollamaUrl = document.getElementById('ollama-url').value;

    localStorage.setItem('danSettings', JSON.stringify(CONFIG));
    settingsModal.classList.remove('active');
    showToast('ההגדרות נשמרו בהצלחה', 'success');
    checkOllamaConnection();
}

// Update Settings UI
function updateSettingsUI() {
    document.getElementById('model-select').value = CONFIG.model;
    document.getElementById('temperature').value = CONFIG.temperature;
    document.getElementById('temp-value').textContent = CONFIG.temperature;
    document.getElementById('max-tokens').value = CONFIG.maxTokens;
    document.getElementById('tokens-value').textContent = CONFIG.maxTokens;
    document.getElementById('ollama-url').value = CONFIG.ollamaUrl;
}

// Update Character Count
function updateCharCount() {
    const count = userInput.value.length;
    charCount.textContent = `${count} / 2000`;

    if (count > 2000) {
        charCount.style.color = 'var(--color-error)';
    } else {
        charCount.style.color = 'var(--text-muted)';
    }
}

// Save Chat History
function saveChatHistory() {
    localStorage.setItem('danChatHistory', JSON.stringify(chatHistory));
}

// Load Chat History
function loadChatHistory() {
    const saved = localStorage.getItem('danChatHistory');
    if (saved) {
        chatHistory = JSON.parse(saved);

        if (chatHistory.length > 0) {
            // Remove welcome message
            const welcomeMsg = document.querySelector('.welcome-message');
            if (welcomeMsg) {
                welcomeMsg.remove();
            }

            // Restore messages
            chatHistory.forEach(msg => {
                addMessage(msg.role, msg.content);
            });
        }
    }
}

// Show Toast Notification
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : '⚠';
    toast.innerHTML = `
        <span style="font-size: 1.25rem;">${icon}</span>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastSlideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Handle file attachment (placeholder)
attachBtn.addEventListener('click', () => {
    showToast('תכונת צירוף קבצים תהיה זמינה בקרוב', 'warning');
});
