// Game State Management
class GameState {
    constructor() {
        this.currentScreen = 'login';
        this.roomName = '';
        this.roomPassword = '';
        this.playerName = '';
        this.playerAvatar = {
            bodyColor: '#4CAF50',
            eyeColor: '#000000',
            accessory: 'none'
        };
        this.players = new Map();
        this.ws = null;
        this.isHost = false;
    }
}

const gameState = new GameState();

// Debug Logging
function debugLog(message) {
    const debugLog = document.getElementById('debugLog');
    if (debugLog) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.innerHTML = `<span style="color: #0ff;">[${timestamp}]</span> ${message}`;
        debugLog.appendChild(logEntry);
        debugLog.scrollTop = debugLog.scrollHeight;
    }
    console.log(message);
}

function clearDebugLog() {
    const debugLog = document.getElementById('debugLog');
    if (debugLog) {
        debugLog.innerHTML = '';
    }
}

// Screen Management
function showScreen(screenId) {
    debugLog(`Switching to screen: ${screenId}`);
    
    // Check if screen element exists
    const screenElement = document.getElementById(screenId);
    debugLog(`Screen element found: ${!!screenElement}`);
    
    if (!screenElement) {
        debugLog(`ERROR: Screen element '${screenId}' not found!`);
        return;
    }
    
    try {
        // Log current screens before switching
        debugLog(`Current active screens before switch:`);
        document.querySelectorAll('.screen').forEach((screen, index) => {
            debugLog(`  Screen ${index}: ${screen.id} - Active: ${screen.classList.contains('active')}`);
        });
        
        // Remove active class from all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Add active class to target screen
        screenElement.classList.add('active');
        
        // Verify the switch worked
        debugLog(`Screens after switch:`);
        document.querySelectorAll('.screen').forEach((screen, index) => {
            debugLog(`  Screen ${index}: ${screen.id} - Active: ${screen.classList.contains('active')}`);
        });
        
        // Check if the target screen is actually visible
        const isVisible = screenElement.offsetParent !== null;
        debugLog(`Target screen visibility: ${isVisible}`);
        debugLog(`Target screen display style: ${window.getComputedStyle(screenElement).display}`);
        
        gameState.currentScreen = screenId;
        debugLog(`Screen switched successfully to: ${screenId}`);
    } catch (error) {
        debugLog(`ERROR in showScreen: ${error.message}`);
    }
}

// Avatar Drawing
function drawAvatar(canvas, avatar) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 64, 64);
    
    // Body (16x16 pixel character scaled to 64x64)
    ctx.fillStyle = avatar.bodyColor;
    ctx.fillRect(24, 32, 16, 20); // Body
    ctx.fillRect(20, 20, 24, 16); // Head
    
    // Eyes
    ctx.fillStyle = avatar.eyeColor;
    ctx.fillRect(26, 24, 4, 4); // Left eye
    ctx.fillRect(34, 24, 4, 4); // Right eye
    
    // Accessory
    if (avatar.accessory === 'hat') {
        ctx.fillStyle = '#FF5722';
        ctx.fillRect(20, 16, 24, 4); // Hat
    } else if (avatar.accessory === 'glasses') {
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.strokeRect(24, 24, 16, 6); // Glasses frame
    }
    
    // Legs
    ctx.fillStyle = avatar.bodyColor;
    ctx.fillRect(26, 52, 4, 8); // Left leg
    ctx.fillRect(34, 52, 4, 8); // Right leg
    
    // Arms
    ctx.fillRect(18, 32, 4, 12); // Left arm
    ctx.fillRect(42, 32, 4, 12); // Right arm
}

// Character Creation
function initCharacterCreation() {
    debugLog('initCharacterCreation called!');
    const canvas = document.getElementById('avatarCanvas');
    debugLog(`Avatar canvas found: ${!!canvas}`);
    
    if (!canvas) {
        debugLog('ERROR: Avatar canvas not found!');
        return;
    }
    
    debugLog('Setting up color options...');
    
    // Color options
    const bodyColors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#FFEB3B', '#795548', '#607D8B'];
    const eyeColors = ['#000000', '#4CAF50', '#2196F3', '#FF5722', '#FFC107', '#E91E63'];
    const accessories = ['none', 'hat', 'glasses'];
    
    debugLog(`Colors ready - Body: ${bodyColors.length}, Eyes: ${eyeColors.length}, Accessories: ${accessories.length}`);
    
    // Randomize function
    function randomizeAvatar() {
        debugLog('Randomizing avatar...');
        const randomBodyColor = bodyColors[Math.floor(Math.random() * bodyColors.length)];
        const randomEyeColor = eyeColors[Math.floor(Math.random() * eyeColors.length)];
        const randomAccessory = accessories[Math.floor(Math.random() * accessories.length)];
        
        debugLog(`Random colors - Body: ${randomBodyColor}, Eyes: ${randomEyeColor}, Accessory: ${randomAccessory}`);
        
        gameState.playerAvatar = {
            bodyColor: randomBodyColor,
            eyeColor: randomEyeColor,
            accessory: randomAccessory
        };
        
        // Update UI selections
        updateColorSelection('bodyColors', randomBodyColor);
        updateColorSelection('eyeColors', randomEyeColor);
        updateAccessorySelection(randomAccessory);
        
        // Redraw avatar
        drawAvatar(canvas, gameState.playerAvatar);
        debugLog('Avatar randomized and drawn!');
    }
    
    function updateColorSelection(containerId, selectedColor) {
        const container = document.getElementById(containerId);
        Array.from(container.children).forEach(child => {
            child.classList.remove('selected');
            if (child.style.backgroundColor === selectedColor || 
                rgbToHex(child.style.backgroundColor) === selectedColor.toUpperCase()) {
                child.classList.add('selected');
            }
        });
    }
    
    function updateAccessorySelection(selectedAccessory) {
        const container = document.getElementById('accessories');
        Array.from(container.children).forEach(child => {
            child.classList.remove('selected');
            if (child.textContent.toLowerCase() === selectedAccessory) {
                child.classList.add('selected');
            }
        });
    }
    
    function rgbToHex(rgb) {
        if (!rgb || rgb.indexOf('rgb') !== 0) return rgb;
        const values = rgb.match(/\d+/g);
        if (!values || values.length < 3) return rgb;
        return '#' + values.slice(0, 3).map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('').toUpperCase();
    }
    
    // Add randomize button event listener
    document.getElementById('randomizeAvatarBtn').addEventListener('click', randomizeAvatar);
    debugLog('Randomize button event listener added');
    
    // Create body color options
    debugLog('Creating body color options...');
    const bodyColorContainer = document.getElementById('bodyColors');
    debugLog(`Body color container found: ${!!bodyColorContainer}`);
    
    bodyColors.forEach((color, index) => {
        const colorDiv = document.createElement('div');
        colorDiv.className = 'color-option';
        colorDiv.style.backgroundColor = color;
        colorDiv.addEventListener('click', () => {
            document.querySelectorAll('#bodyColors .color-option').forEach(opt => opt.classList.remove('selected'));
            colorDiv.classList.add('selected');
            gameState.playerAvatar.bodyColor = color;
            drawAvatar(canvas, gameState.playerAvatar);
            debugLog(`Body color changed to: ${color}`);
        });
        bodyColorContainer.appendChild(colorDiv);
    });
    debugLog(`Created ${bodyColors.length} body color options`);
    
    // Create eye color options
    debugLog('Creating eye color options...');
    const eyeColorContainer = document.getElementById('eyeColors');
    debugLog(`Eye color container found: ${!!eyeColorContainer}`);
    
    eyeColors.forEach((color, index) => {
        const colorDiv = document.createElement('div');
        colorDiv.className = 'color-option';
        colorDiv.style.backgroundColor = color;
        colorDiv.addEventListener('click', () => {
            document.querySelectorAll('#eyeColors .color-option').forEach(opt => opt.classList.remove('selected'));
            colorDiv.classList.add('selected');
            gameState.playerAvatar.eyeColor = color;
            drawAvatar(canvas, gameState.playerAvatar);
            debugLog(`Eye color changed to: ${color}`);
        });
        eyeColorContainer.appendChild(colorDiv);
    });
    debugLog(`Created ${eyeColors.length} eye color options`);
    
    // Create accessory options
    debugLog('Creating accessory options...');
    const accessoryContainer = document.getElementById('accessories');
    debugLog(`Accessory container found: ${!!accessoryContainer}`);
    
    accessories.forEach((accessory, index) => {
        const accDiv = document.createElement('div');
        accDiv.className = 'accessory-option';
        accDiv.textContent = accessory.charAt(0).toUpperCase() + accessory.slice(1);
        accDiv.addEventListener('click', () => {
            document.querySelectorAll('#accessories .accessory-option').forEach(opt => opt.classList.remove('selected'));
            accDiv.classList.add('selected');
            gameState.playerAvatar.accessory = accessory;
            drawAvatar(canvas, gameState.playerAvatar);
            debugLog(`Accessory changed to: ${accessory}`);
        });
        accessoryContainer.appendChild(accDiv);
    });
    debugLog(`Created ${accessories.length} accessory options`);
    
    // Set default selections and draw initial avatar
    debugLog('Initializing with random avatar...');
    randomizeAvatar();
    debugLog('Character creation setup complete!');
}

// WebSocket Connection
function connectWebSocket() {
    try {
        ws = new WebSocket('ws://localhost:8082');
    } catch (error) {
        console.error('Error connecting to WebSocket:', error);
    }
    // In a real implementation, this would connect to a WebSocket server
    console.log('WebSocket connection simulated');
    
    // Simulate receiving messages
    setTimeout(() => {
        if (gameState.currentScreen === 'lounge') {
            addSystemMessage('Welcome to the lounge! Use arrow keys to move around.');
        }
    }, 1000);
}

// Chat System
function addChatMessage(author, text) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.innerHTML = `
        <div class="author">${author}</div>
        <div class="text">${text}</div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addSystemMessage(text) {
    addChatMessage('System', text);
}

// Lounge System
class Lounge {
    constructor() {
        this.canvas = document.getElementById('loungeCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.players = new Map();
        this.localPlayer = {
            x: 400,
            y: 200,
            vx: 0,
            vy: 0,
            width: 32,
            height: 32,
            color: gameState.playerAvatar.bodyColor,
            name: gameState.playerName
        };
        this.keys = {};
        this.init();
    }
    
    init() {
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 400;
        
        // Add local player
        this.players.set('local', this.localPlayer);
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Start game loop
        this.gameLoop();
    }
    
    update() {
        const player = this.localPlayer;
        const speed = 3;
        
        // Movement
        if (this.keys['ArrowLeft']) player.vx = -speed;
        else if (this.keys['ArrowRight']) player.vx = speed;
        else player.vx = 0;
        
        if (this.keys['ArrowUp']) player.vy = -speed;
        else if (this.keys['ArrowDown']) player.vy = speed;
        else player.vy = 0;
        
        // Update position
        player.x += player.vx;
        player.y += player.vy;
        
        // Boundaries
        player.x = Math.max(0, Math.min(this.canvas.width - player.width, player.x));
        player.y = Math.max(0, Math.min(this.canvas.height - player.height, player.y));
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid pattern
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < this.canvas.width; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // Draw players
        this.players.forEach(player => {
            // Draw shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.fillRect(player.x + 4, player.y + 28, player.width - 8, 4);
            
            // Draw player
            this.ctx.fillStyle = player.color;
            this.ctx.fillRect(player.x, player.y, player.width, player.height);
            
            // Draw face
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(player.x + 8, player.y + 8, 4, 4); // Left eye
            this.ctx.fillRect(player.x + 20, player.y + 8, 4, 4); // Right eye
            
            // Draw name
            this.ctx.fillStyle = '#333';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(player.name, player.x + player.width/2, player.y - 5);
        });
    }
    
    gameLoop() {
        this.update();
class PlatformerGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.players = new Map();
        this.platforms = [];
        this.collectibles = [];
        this.particles = [];
        this.localPlayer = null;
        this.ws = null;
        this.playerId = Math.random().toString(36).substr(2, 9); // Random ID
        
        this.init();
    }
    
    init() {
        // Connect to WebSocket for multiplayer
        this.connectWebSocket();
        
        // Initialize local player
        this.localPlayer = {
            id: this.playerId,
            name: gameState.playerName,
            x: 100,
            y: 200,
            vx: 0,
            vy: 0,
            width: 32,
            height: 32,
            color: gameState.playerAvatar.bodyColor,
            eyeColor: gameState.playerAvatar.eyeColor,
            isLocal: true,
            score: 0,
            jumping: false,
            grounded: false
        };
        
        this.players.set(this.playerId, this.localPlayer);
        
        // Set canvas size
        this.canvas.width = 900;
        this.canvas.height = 500;
        
        // Create platforms
        this.platforms = [
            { x: 0, y: 450, width: 900, height: 50, color: '#4CAF50' }, // Ground
            { x: 200, y: 350, width: 150, height: 20, color: '#2196F3' },
            { x: 450, y: 280, width: 120, height: 20, color: '#2196F3' },
            { x: 650, y: 350, width: 150, height: 20, color: '#2196F3' },
            { x: 100, y: 200, width: 100, height: 20, color: '#FF9800' },
            { x: 400, y: 150, width: 100, height: 20, color: '#FF9800' },
            { x: 700, y: 200, width: 100, height: 20, color: '#FF9800' }
        ];
        
        // Create collectibles
        this.collectibles = [
            { x: 250, y: 320, size: 15, color: '#FFD700', collected: false, type: 'coin' },
            { x: 500, y: 250, size: 15, color: '#FFD700', collected: false, type: 'coin' },
            { x: 750, y: 320, size: 15, color: '#FFD700', collected: false, type: 'coin' },
            { x: 150, y: 170, size: 20, color: '#FF69B4', collected: false, type: 'gem' },
            { x: 450, y: 120, size: 20, color: '#FF69B4', collected: false, type: 'gem' }
        ];
        
        // Setup controls
        this.setupControls();
        
        // Start game loop
        this.gameLoop();
        
        // Start sending position updates
        setInterval(() => this.sendPositionUpdate(), 50);
    }
    
    connectWebSocket() {
        try {
            this.ws = new WebSocket('ws://localhost:8082');
            
            this.ws.onopen = () => {
                console.log('Platformer: Connected to server');
                
                this.ws.send(JSON.stringify({
                    type: 'joinGame',
                    roomName: gameState.roomName,
                    playerName: gameState.playerName,
                    playerData: this.localPlayer
                }));
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleServerMessage(data);
            };
            
            this.ws.onclose = () => {
                console.log('Platformer: Disconnected');
                setTimeout(() => this.connectWebSocket(), 3000);
            };
        } catch (error) {
            console.error('Platformer: Connection failed:', error);
        }
    }
    
    handleServerMessage(data) {
        switch (data.type) {
            case 'gamePlayersUpdate':
                data.players.forEach(playerData => {
                    if (playerData.id !== this.playerId) {
                        this.players.set(playerData.id, playerData);
                    }
                });
                break;
                
            case 'playerMove':
                if (data.playerId !== this.playerId) {
                    const player = this.players.get(data.playerId);
                    if (player) {
                        player.x = data.x;
                        player.y = data.y;
                        player.vx = data.vx;
                        player.vy = data.vy;
                    }
                }
                break;
                
            case 'playerJoin':
                this.players.set(data.player.id, data.player);
                this.createParticleEffect(data.player.x, data.player.y, '#00FF00');
                break;
                
            case 'playerLeave':
                this.players.delete(data.playerId);
                this.createParticleEffect(data.x, data.y, '#FF0000');
                break;
        }
    }
    
    sendPositionUpdate() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'playerMove',
                playerId: this.playerId,
                x: this.localPlayer.x,
                y: this.localPlayer.y,
                vx: this.localPlayer.vx,
                vy: this.localPlayer.vy
            }));
        }
    }
    
    setupControls() {
        this.keys = {};
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }
    
    update() {
        const player = this.localPlayer;
        
        // Horizontal movement
        if (this.keys['ArrowLeft']) {
            player.vx = -5;
        } else if (this.keys['ArrowRight']) {
            player.vx = 5;
        } else {
            player.vx *= 0.8; // Friction
        }
        
        // Jumping
        if (this.keys[' '] && player.grounded) {
            player.vy = -12;
            player.jumping = true;
            player.grounded = false;
            this.createParticleEffect(player.x + 16, player.y + 32, '#87CEEB');
        }
        
        // Gravity
        player.vy += 0.5;
        
        // Update position
        player.x += player.vx;
        player.y += player.vy;
        
        // Platform collision
        player.grounded = false;
        this.platforms.forEach(platform => {
            if (this.checkCollision(player, platform)) {
                // Landing on top
                if (player.vy > 0 && player.y < platform.y) {
                    player.y = platform.y - player.height;
                    player.vy = 0;
                    player.grounded = true;
                    player.jumping = false;
                }
            }
        });
        
        // Collectible collision
        this.collectibles.forEach(item => {
            if (!item.collected && this.checkCollision(player, item)) {
                item.collected = true;
                player.score += item.type === 'coin' ? 10 : 50;
                this.createParticleEffect(item.x, item.y, item.color);
            }
        });
        
        // Boundaries
        player.x = Math.max(0, Math.min(this.canvas.width - player.width, player.x));
        player.y = Math.max(0, Math.min(this.canvas.height - player.height, player.y));
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            return p.life > 0;
        });
    }
    
    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
    
    createParticleEffect(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                color: color,
                life: 30
            });
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw platforms
        this.platforms.forEach(platform => {
            this.ctx.fillStyle = platform.color;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            this.ctx.fillStyle = '#8B4513';
        });
        
        // Draw players
        this.players.forEach(player => {
            // Draw shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.fillRect(player.x + 4, player.y + 28, player.width - 8, 4);
            
            // Draw player
            this.ctx.fillStyle = player.color;
            this.ctx.fillRect(player.x, player.y, player.width, player.height);
            
            // Draw face
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(player.x + 8, player.y + 8, 4, 4); // Left eye
            this.ctx.fillRect(player.x + 20, player.y + 8, 4, 4); // Right eye
            
            // Draw name
            this.ctx.fillStyle = '#333';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(player.name, player.x + player.width/2, player.y - 5);
        });
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    debugLog('DOM Content Loaded - Script is working!');
    
    // Check if elements exist
    debugLog(`Login screen element: ${!!document.getElementById('loginScreen')}`);
    debugLog(`Character screen element: ${!!document.getElementById('characterScreen')}`);
    debugLog(`Join button: ${!!document.getElementById('joinRoomBtn')}`);
    
    // Login screen
    document.getElementById('joinRoomBtn').addEventListener('click', () => {
        try {
            debugLog('Join room button clicked!');
            const roomName = document.getElementById('roomName').value.trim();
            const roomPassword = document.getElementById('roomPassword').value.trim();
            
            debugLog(`Room details: ${roomName}/${roomPassword}`);
            
            if (roomName && roomPassword) {
                gameState.roomName = roomName;
                gameState.roomPassword = roomPassword;
                gameState.isHost = false;
                debugLog('Switching to character screen...');
                showScreen('character');
                debugLog('Initializing character creation...');
                initCharacterCreation();
                debugLog('Character creation initialized!');
            } else {
                alert('Please enter both room name and password');
            }
        } catch (error) {
            debugLog(`ERROR in join room: ${error.message}`);
            console.error(error);
        }
    });
    
    document.getElementById('createRoomBtn').addEventListener('click', () => {
        debugLog('Create room button clicked!');
        const roomName = document.getElementById('roomName').value.trim();
        const roomPassword = document.getElementById('roomPassword').value.trim();
        
        debugLog(`Room details: ${roomName}/${roomPassword}`);
        
        if (roomName && roomPassword) {
            gameState.roomName = roomName;
            gameState.roomPassword = roomPassword;
            gameState.isHost = true;
            debugLog('Switching to character screen...');
            showScreen('character');
            debugLog('Initializing character creation...');
            initCharacterCreation();
        } else {
            alert('Please enter both room name and password');
        }
    });
    
    // Character screen
    document.getElementById('confirmCharacterBtn').addEventListener('click', confirmCharacter);
    
    function confirmCharacter() {
        console.log('=== CONFIRMING CHARACTER ===');
        const playerName = document.getElementById('playerName').value.trim();
        
        console.log('Player name:', playerName);
        console.log('Avatar:', gameState.playerAvatar);
        
        if (playerName && gameState.playerAvatar.characterId) {
            gameState.playerName = playerName;
            
            // Save player name to localStorage for game to use
            localStorage.setItem('playerName', playerName);
            
            // SIMPLE METHOD: Always try to create room first
            sendToServer('createRoom', {
                roomName: gameState.roomName,
                roomPassword: gameState.roomPassword,
                playerName: playerName,
                avatar: gameState.playerAvatar
            });
            
            // Update lounge with player info
            document.getElementById('roomTitle').textContent = gameState.roomName;
            
            // Draw pixel character on player element
            const playerElement = document.getElementById('player');
            drawPlayerCharacter(playerElement, gameState.playerAvatar);
            
            // Add welcome message
            addMessage('System', ` ${playerName} joined the lounge! Use arrow keys to move, SPACE to jump!`);
            
            console.log('Character confirmed, switching to lounge...');
            showScreen('loungeScreen');
            
            // Start platformer physics
            setTimeout(startLoungePhysics, 100);
        } else {
            alert('');
        }
    });
    
    // Chat functionality
    document.getElementById('sendChatBtn').addEventListener('click', sendMessage);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    function sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (message) {
            addChatMessage(gameState.playerName, message);
            input.value = '';
            
            // In a real implementation, this would send the message via WebSocket
            console.log('Message sent:', message);
        }
    // Start game button
    document.getElementById('startGameBtn').addEventListener('click', () => {
        showScreen('game');
        // Simple platformer - no complex multiplayer yet
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        // Clear any existing game
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw simple message
        ctx.fillStyle = '#FFF';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎮 PLATFORMER LOADING...', canvas.width/2, canvas.height/2);
        ctx.font = '16px Arial';
        ctx.fillText('Multiplayer features coming soon!', canvas.width/2, canvas.height/2 + 40);
    });
    
    // Back to lounge button
    document.getElementById('backToLoungeBtn').addEventListener('click', () => {
        showScreen('lounge');
    });
});
