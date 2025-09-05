/**
 * Main JavaScript file for ChillBot UI interactions.
 */

/**
 * A simple markdown-to-HTML parser.
 * Handles paragraphs, bold text, and numbered lists.
 * @param {string} text The raw text from the bot.
 * @returns {string} The formatted HTML string.
 */
function parseMarkdown(text) {
    // Process block-level elements first (lists), then inline elements.
    const lines = text.split('\n');
    let html = '';
    let inList = false;

    for (const line of lines) {
        if (/^\d+\.\s/.test(line)) { // Handle numbered lists
            if (!inList) {
                html += '<ol>';
                inList = true;
            }
            html += `<li>${line.replace(/^\d+\.\s/, '')}</li>`;
        } else { // Handle paragraphs
            if (inList) {
                html += '</ol>';
                inList = false;
            }
            if (line.trim()) {
                html += `<p>${line}</p>`;
            }
        }
    }

    if (inList) { // Close any open list at the end
        html += '</ol>';
    }

    // Process inline elements like bold
    return html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

document.addEventListener('DOMContentLoaded', () => {
    // Mobile tooltip functionality
    const handleMobileTooltip = (event) => {
        if (window.innerWidth > 768) return; // Only for mobile
        
        const element = event.currentTarget;
        element.classList.add('show-tooltip');
        
        // Remove any existing timeout to prevent multiple timeouts
        if (element.tooltipTimeout) {
            clearTimeout(element.tooltipTimeout);
        }
        
        // Hide tooltip after 3 seconds
        element.tooltipTimeout = setTimeout(() => {
            element.classList.remove('show-tooltip');
        }, 3000);
    };
    
    // Add touch event listeners to all elements with data-tooltip on mobile
    const addMobileTooltipListeners = () => {
        if (window.innerWidth <= 768) {
            document.querySelectorAll('[data-tooltip]').forEach(element => {
                element.addEventListener('touchstart', handleMobileTooltip);
            });
        }
    };
    
    // Initialize mobile tooltips
    addMobileTooltipListeners();
    
    // Re-initialize on window resize
    window.addEventListener('resize', addMobileTooltipListeners);

    let startAnimation = () => {};
    let stopAnimation = () => {};

    // --- Theme Dropdown Functionality ---
    const settingsBtn = document.querySelector('.settings-btn');
    const rightHeaderDiv = document.querySelector('.right-header-div');

    if (settingsBtn && rightHeaderDiv) {
        settingsBtn.addEventListener('click', (event) => {
            // Toggles the dropdown visibility
            rightHeaderDiv.classList.toggle('show-themes');
            // Prevents the window click listener from immediately closing the dropdown
            event.stopPropagation();
        });
    }

    // Add a listener to the whole window to close the dropdown when clicking anywhere else
    window.addEventListener('click', (event) => {
        // Close theme dropdown
        if (rightHeaderDiv.classList.contains('show-themes')) {
            rightHeaderDiv.classList.remove('show-themes');
        }

        // Close emoji picker
        if (emojiPicker && !emojiPicker.classList.contains('hidden')) {
            emojiPicker.classList.add('hidden');
        }
    });

    // --- Theme Switching Functionality ---
    const lightModeBtn = document.querySelector('.light-mode-btn');
    const darkModeBtn = document.querySelector('.dark-mode-btn');
    const systemModeBtn = document.querySelector('.system-mode-btn');

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            if (canvas) {
                canvas.classList.add('active');
                startAnimation();
            }
        } else {
            document.body.classList.remove('dark-theme');
            if (canvas) {
                canvas.classList.remove('active');
                stopAnimation();
            }
        }
    };

    const handleSystemTheme = () => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            applyTheme('dark');
        } else {
            applyTheme('light');
        }
    };

    const loadTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            applyTheme(savedTheme);
        } else {
            // Default to system theme if nothing is saved
            handleSystemTheme();
        }
    };

    lightModeBtn.addEventListener('click', () => {
        localStorage.setItem('theme', 'light');
        applyTheme('light');
    });
    darkModeBtn.addEventListener('click', () => {
        localStorage.setItem('theme', 'dark');
        applyTheme('dark');
    });
    systemModeBtn.addEventListener('click', () => {
        localStorage.removeItem('theme');
        handleSystemTheme();
    });

    // Listen for changes in OS theme preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        // Only update if user has not set a specific preference (i.e., is on 'system')
        if (!localStorage.getItem('theme')) {
            handleSystemTheme();
        }
    });

    // --- Chat Input Button Toggle ---
    const chatInput = document.querySelector('.chat-input input[type="text"]');
    const micBtn = document.querySelector('.mic-btn');
    const sendBtn = document.querySelector('.send-btn');

    if (chatInput && micBtn && sendBtn) {
        chatInput.addEventListener('input', () => {
            if (chatInput.value.trim() !== '') {
                // User is typing, show send button
                micBtn.classList.add('hidden');
                sendBtn.classList.remove('hidden');
            } else {
                // Input is empty, show mic button
                micBtn.classList.remove('hidden');
                sendBtn.classList.add('hidden');
            }
        });
    }

    // --- Emoji Picker Functionality ---
    const emojiBtn = document.querySelector('.emoji-btn');
    const emojiPicker = document.querySelector('emoji-picker');

    if (emojiBtn && emojiPicker && chatInput) {
        emojiBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent window listener from closing it immediately
            emojiPicker.classList.toggle('hidden');

            // If we are showing the picker, calculate its position
            if (!emojiPicker.classList.contains('hidden')) {
                const btnRect = emojiBtn.getBoundingClientRect();
                
                // Position the bottom of the picker 10px above the top of the button
                emojiPicker.style.left = `${btnRect.left}px`;
                emojiPicker.style.bottom = `${window.innerHeight - btnRect.top + 10}px`;
                
                emojiPicker.style.top = ''; // Clear top property to avoid conflicts
            }
        });

        emojiPicker.addEventListener('emoji-click', event => {
            chatInput.value += event.detail.unicode;
            // Manually trigger the input event to update the send/mic button visibility
            chatInput.dispatchEvent(new Event('input'));
            // Focus the input after adding an emoji
            chatInput.focus();
        });

        // Prevent clicks inside the picker from closing it
        emojiPicker.addEventListener('click', event => {
            event.stopPropagation();
        });
    }

    // --- Suggested Prompts Functionality ---
    const suggestedPromptButtons = document.querySelectorAll('.suggested-prompts button');

    if (suggestedPromptButtons.length > 0 && chatInput) {
        suggestedPromptButtons.forEach(button => {
            button.addEventListener('click', () => {
                const promptText = button.textContent;
                chatInput.value = promptText;

                // Manually trigger the input event to update the send/mic button visibility
                chatInput.dispatchEvent(new Event('input'));

                // Set focus to the input field for a better user experience
                chatInput.focus();
            });
        });
    }

    // --- Dynamic Suggested Prompts ---
    const allPrompts = [
        'How can I reduce stress?',
        'Give me a motivational quote',
        'Suggest a 5-minute meditation',
        'Tell me a fun fact',
        'What are some good breathing exercises?',
        'Write a short, calming story',
        'How can I improve my focus?',
        'Give me a positive affirmation',
        'Suggest a relaxing activity',
        'What is a simple mindfulness exercise?',
        'Tell me a joke'

    ];

    const updateSuggestedPrompts = () => {
        if (suggestedPromptButtons.length === 0) {
            return;
        }

        // 1. Add a class to trigger the fade-out animation
        suggestedPromptButtons.forEach(button => {
            button.classList.add('prompt-fade-out');
        });

        // 2. Wait for the animation to finish before changing the text
        setTimeout(() => {
            const shuffledPrompts = [...allPrompts].sort(() => 0.5 - Math.random());

            suggestedPromptButtons.forEach((button, index) => {
                button.textContent = shuffledPrompts[index];
            });

            // 3. Remove the class to trigger the fade-in animation
            suggestedPromptButtons.forEach(button => {
                button.classList.remove('prompt-fade-out');
            });
        }, 200); // This duration should match the CSS transition
    };

    // --- Send Message Functionality ---
    const chatMessagesContainer = document.querySelector('.chat-messages');

    const mainElement = document.querySelector('main');
    const chatHeader = document.querySelector('.chat-header');
    const headerTitle = document.querySelector('.header-title');
    const newChatBtn = document.querySelector('.new-chat-btn');

    const handleSendMessage = () => {
        const messageText = chatInput.value.trim();

        if (messageText === '') {
            return; // Don't send empty messages
        }

        // On first message, hide header and show "New Chat" button
        if (chatHeader && !chatHeader.classList.contains('hidden')) {
            chatHeader.classList.add('hidden');
            if (headerTitle) headerTitle.classList.add('hidden');
            if (newChatBtn) newChatBtn.classList.remove('hidden');
            if (mainElement) mainElement.classList.add('is-chatting');
        }

        // 1. Create and display the user's message bubble
        const userMessageElement = document.createElement('div');
        userMessageElement.classList.add('message', 'user-message');
        userMessageElement.textContent = messageText;
        chatMessagesContainer.appendChild(userMessageElement);

        // 2. Clear the input field
        chatInput.value = '';

        // 3. Reset the input buttons (show mic, hide send)
        chatInput.dispatchEvent(new Event('input'));

        // 4. Scroll to the new message
        userMessageElement.scrollIntoView({ behavior: 'smooth' });

        // 5. Show typing indicator and get bot response
        showBotResponse(messageText);

        // 6. Update suggested prompts for the next interaction
        updateSuggestedPrompts();
    };

    const showBotResponse = async (userMessage) => {
        // 1. Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('typing-indicator');
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        chatMessagesContainer.appendChild(typingIndicator);
        typingIndicator.scrollIntoView({ behavior: 'smooth' });
        
        try {
            // 2. Get the actual response from the Gemini API
            const botResponseText = await getGeminiResponse(userMessage);

            // 3. Remove the typing indicator once the response is received
            typingIndicator.remove();

            // 4. Create and display the bot's message bubble
            const botMessageElement = document.createElement('div');
            botMessageElement.classList.add('message', 'bot-message');

            // Message text
            const contentElement = document.createElement('div');
            contentElement.innerHTML = parseMarkdown(botResponseText);

            // Action buttons
            const actionsContainer = document.createElement('div');
            actionsContainer.classList.add('message-actions');

            const actions = [
                { icon: 'regenerate', tooltip: 'Regenerate' },
                { icon: 'copy', tooltip: 'Copy' },
                { icon: 'share', tooltip: 'Share' },
                { icon: 'like', tooltip: 'Like' },
                { icon: 'dislike', tooltip: 'Dislike' }
            ];

            actions.forEach(action => {
                const button = document.createElement('button');
                button.dataset.tooltip = action.tooltip;
                const img = document.createElement('img');
                img.src = `assets/icons/${action.icon}.svg`;
                img.alt = action.tooltip;
                button.appendChild(img);
                actionsContainer.appendChild(button);
            });

            botMessageElement.appendChild(contentElement);
            botMessageElement.appendChild(actionsContainer);
            chatMessagesContainer.appendChild(botMessageElement);

            // 5. Scroll to the new message
            botMessageElement.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            // If there's an error, remove the indicator and show an error message
            typingIndicator.remove();
            console.error("Failed to show bot response:", error);
        }
    };

    // --- New Chat Functionality ---
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            chatMessagesContainer.innerHTML = ''; // Clear messages
            if (chatHeader) chatHeader.classList.remove('hidden');
            if (headerTitle) headerTitle.classList.remove('hidden');
            newChatBtn.classList.add('hidden');
            if (mainElement) mainElement.classList.remove('is-chatting');
            updateSuggestedPrompts();
        });
    }
    
    // --- Starry Night Effect ---
    const canvas = document.getElementById('stars-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let animationFrameId = null;
        let stars = [];
        let shootingStars = [];

        const STAR_COUNT = 200;
        const SHOOTING_STAR_COUNT = 2;

        class Star {
            constructor() {
                this.x = Math.random() * window.innerWidth;
                this.y = Math.random() * window.innerHeight;
                this.radius = Math.random() * 1.2;
                this.alpha = Math.random() * 0.5 + 0.5; // Start with random opacity for twinkling
                this.vx = (Math.random() - 0.5) * 0.1; // Slow horizontal velocity
                this.vy = (Math.random() - 0.5) * 0.1; // Slow vertical velocity
                this.alphaVelocity = (Math.random() - 0.5) * 0.02;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
                ctx.fill();
            }

            update() {
                // Twinkling effect
                if (this.alpha <= 0.2 || this.alpha >= 1) {
                    this.alphaVelocity = -this.alphaVelocity;
                }
                this.alpha += this.alphaVelocity;

                // Movement
                this.x += this.vx;
                this.y += this.vy;

                // Wrap around screen edges
                if (this.x < 0) this.x = window.innerWidth;
                if (this.x > window.innerWidth) this.x = 0;
                if (this.y < 0) this.y = window.innerHeight;
                if (this.y > window.innerHeight) this.y = 0;

                this.draw();
            }
        }

        /* Shooting Star Class */
        class ShootingStar {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * window.innerWidth;
                this.y = 0;
                this.len = (Math.random() * 80) + 10;
                this.speed = (Math.random() * 10) + 6;
                this.size = (Math.random() * 1) + 0.1;
                this.waitTime = new Date().getTime() + (Math.random() * 3000) + 500;
                this.active = false;
            }

            update() {
                if (this.active) {
                    this.x -= this.speed;
                    this.y += this.speed;
                    if (this.x < 0 || this.y >= window.innerHeight) {
                        this.reset();
                    }
                } else {
                    if (this.waitTime < new Date().getTime()) {
                        this.active = true;
                    }
                }
            }
            /* drawing shooting stars */
            draw() {
                if (this.active) {
                    const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.len, this.y - this.len);
                    gradient.addColorStop(0, `rgba(255, 255, 255, ${this.size})`);
                    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = this.size;
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.x + this.len, this.y - this.len);
                    ctx.stroke();
                }
            }
        }

        function setupCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            stars = Array.from({ length: STAR_COUNT }, () => new Star());
            shootingStars = Array.from({ length: SHOOTING_STAR_COUNT }, () => new ShootingStar());
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            stars.forEach(star => star.update());
            shootingStars.forEach(star => {
                star.update();
                star.draw();
            });
            animationFrameId = requestAnimationFrame(animate);
        }

        startAnimation = function() {
            if (!animationFrameId) {
                setupCanvas();
                animate();
            }
        }

        stopAnimation = function() {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
                setTimeout(() => {
                    if (!canvas.classList.contains('active')) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                }, 1500); // Clear after fade out (matches CSS transition)
            }
        }

        window.addEventListener('resize', () => {
            if (canvas.classList.contains('active')) setupCanvas();
        });
    }

    if (sendBtn && chatInput && chatMessagesContainer) {
        sendBtn.addEventListener('click', handleSendMessage);

        chatInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault(); // Prevent new line on Enter
                handleSendMessage();
            }
        });
    }

    // --- Initial Setup ---

    loadTheme(); // Set theme on page load
    updateSuggestedPrompts(); // Set initial random prompts

    // Set an interval to change prompts periodically
    setInterval(updateSuggestedPrompts, 7000); // Change prompts every 7 seconds
});