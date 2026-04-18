const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Create HTTP server for serving static files
const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './Epic Platformer v0.48.html'; // Serve our THICK PINK SQUARE BORDER version!
    }
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };
    
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// WebSocket server setup
const wss = new WebSocket.Server({ port: 8082 });

// Room management
const rooms = new Map();

// Room class
class Room {
    constructor(name, password) {
        this.name = name;
        this.password = password;
        this.players = new Map();
        this.gamePlayers = new Map();
        this.host = null;
    }
    
    addPlayer(ws, playerName, avatar) {
        const player = {
            ws: ws,
            name: playerName,
            avatar: avatar,
            x: Math.random() * 700 + 50,
            y: Math.random() * 300 + 50,
            vx: 0,
            vy: 0
        };
        
        this.players.set(ws, player);
        
        // Set host if first player
        if (this.players.size === 1) {
            this.host = ws;
        }
        
        return player;
    }
    
    removePlayer(ws) {
        const player = this.players.get(ws);
        if (player) {
            this.players.delete(ws);
            
            // If host leaves, assign new host
            if (this.host === ws && this.players.size > 0) {
                this.host = this.players.keys().next().value;
                this.broadcast({
                    type: 'newHost',
                    hostName: this.players.get(this.host).name
                }, this.host);
            }
            
            return player.name;
        }
        return null;
    }
    
    getPlayers() {
        const players = [];
        this.players.forEach((player, ws) => {
            players.push({
                name: player.name,
                x: player.x || 200,
                y: player.y || 200,
                avatar: player.avatar
            });
        });
        return players;
    }
    
    addGamePlayer(ws, playerData) {
        this.gamePlayers.set(ws, playerData);
    }
    
    removeGamePlayer(ws) {
        this.gamePlayers.delete(ws);
    }
    
    broadcast(message, excludeWs = null) {
        this.players.forEach((player, ws) => {
            if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        });
    }
    
    addChatMessage(author, text) {
        const message = { author, text, timestamp: Date.now() };
        this.chatMessages.push(message);
        
        // Keep only last 50 messages
        if (this.chatMessages.length > 50) {
            this.chatMessages.shift();
        }
        
        this.broadcast({
            type: 'chatMessage',
            ...message
        });
    }
    
    updatePlayerPosition(ws, x, y, vx, vy) {
        const player = this.players.get(ws);
        if (player) {
            player.x = x;
            player.y = y;
            player.vx = vx;
            player.vy = vy;
            
            // Broadcast position to other players
            this.broadcast({
                type: 'playerMove',
                playerName: player.name,
                x: x,
                y: y,
                vx: vx,
                vy: vy
            }, ws);
        }
    }
}

// WebSocket connection handling
wss.on('connection', (ws) => {
    let currentRoom = null;
    let playerData = null;
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'joinRoom':
                    console.log('Player joining:', data.playerName);
                    const room = rooms.get(data.roomName);
                    if (room && room.password === data.roomPassword) {
                        currentRoom = room;
                        playerData = room.addPlayer(ws, data.playerName, data.avatar);
                        
                        // Send success
                        ws.send(JSON.stringify({
                            type: 'joinSuccess',
                            roomName: room.name,
                            players: room.getPlayers()
                        }));
                        
                        // Notify others
                        room.broadcast({
                            type: 'playerJoined',
                            player: {
                                name: data.playerName,
                                x: 200, // Default starting position
                                y: 200,
                                avatar: data.avatar
                            }
                        }, ws);
                    } else {
                        ws.send(JSON.stringify({
                            type: 'joinError',
                            message: 'Invalid room'
                        }));
                    }
                    break;
                    
                case 'createRoom':
                    if (!rooms.has(data.roomName)) {
                        const newRoom = new Room(data.roomName, data.roomPassword);
                        rooms.set(data.roomName, newRoom);
                        currentRoom = newRoom;
                        playerData = newRoom.addPlayer(ws, data.playerName, data.avatar);
                        
                        ws.send(JSON.stringify({
                            type: 'createSuccess',
                            roomName: newRoom.name,
                            isHost: true
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            type: 'createError',
                            message: 'Room already exists'
                        }));
                    }
                    break;
                    
                case 'chatMessage':
                    if (currentRoom) {
                        currentRoom.broadcast({
                            type: 'chatMessage',
                            author: playerData.name,
                            text: data.text
                        });
                    }
                    break;
                    
                case 'gameChat':
                    if (currentRoom) {
                        currentRoom.broadcast({
                            type: 'gameChat',
                            playerName: playerData.name,
                            message: data.message
                        });
                    }
                    break;
                    
                case 'playerMove':
                    if (currentRoom) {
                        currentRoom.broadcast({
                            type: 'playerMove',
                            playerName: playerData.name,
                            x: data.x,
                            y: data.y
                        }, ws);
                    }
                    break;
                    
                case 'startGame':
                    if (currentRoom) {
                        console.log(`${playerData.name} started the platformer game!`);
                        currentRoom.broadcast({
                            type: 'gameStarted',
                            playerName: data.playerName
                        });
                    }
                    break;
                    
                case 'playerJoinedGame':
                    if (currentRoom) {
                        console.log(`${data.playerName} joined the platformer game`);
                        currentRoom.broadcast({
                            type: 'playerJoinedGame',
                            playerName: data.playerName,
                            x: data.x,
                            y: data.y,
                            avatar: data.avatar
                        });
                    }
                    break;
                    
                case 'gamePlayerMove':
                    if (currentRoom) {
                        currentRoom.broadcast({
                            type: 'gamePlayerMove',
                            playerName: data.playerName,
                            x: data.x,
                            y: data.y,
                            facing: data.facing
                        });
                    }
                    break;
                    
                case 'grabAction':
                    if (currentRoom) {
                        console.log(`${data.playerName} performed grab action`);
                        
                        // Broadcast grab state to ALL players
                        currentRoom.broadcast({
                            type: 'grabAction',
                            grabs: data.grabs,
                            message: data.message
                        });
                    }
                    break;
                    
                case 'collectItem':
                    if (currentRoom) {
                        console.log(`${data.playerName} collected ${data.itemId}`);
                        
                        // Broadcast the item collection to ALL players
                        currentRoom.broadcast({
                            type: 'itemCollected',
                            playerName: data.playerName,
                            itemId: data.itemId,
                            score: data.value
                        });
                    }
                    break;
                    
                case 'keyFound':
                    if (currentRoom) {
                        console.log(`${data.playerName} found the key!`);
                        currentRoom.broadcast({
                            type: 'keyFound',
                            playerName: data.playerName,
                            itemId: data.itemId
                        });
                    }
                    break;
                    
                case 'levelChange':
                    if (currentRoom) {
                        console.log(`Level changed to: ${data.level}`);
                        currentRoom.broadcast({
                            type: 'levelChange',
                            level: data.level
                        });
                    }
                    break;
                    
                case 'joinGame':
                    if (currentRoom) {
                        // Add player to game room
                        const gamePlayer = {
                            id: data.playerId,
                            name: data.playerName,
                            x: data.playerData.x,
                            y: data.playerData.y,
                            vx: data.playerData.vx,
                            vy: data.playerData.vy,
                            color: data.playerData.color,
                            eyeColor: data.playerData.eyeColor
                        };
                        
                        currentRoom.addGamePlayer(ws, gamePlayer);
                        
                        // Send current game players to new player
                        const gamePlayers = Array.from(currentRoom.gamePlayers.values());
                        ws.send(JSON.stringify({
                            type: 'gamePlayersUpdate',
                            players: gamePlayers
                        }));
                    }
                    break;
                    
                case 'startGame':
                    if (currentRoom && currentRoom.host === ws) {
                        currentRoom.broadcast({
                            type: 'gameStart'
                        });
                    }
                    break;
                    
                case 'gameUpdate':
                    if (currentRoom) {
                        currentRoom.broadcast({
                            type: 'gameUpdate',
                            playerName: playerData.name,
                            ...data.gameState
                        }, ws);
                    }
                    break;
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
    
    ws.on('close', () => {
        if (currentRoom && playerData) {
            const playerName = currentRoom.removePlayer(ws);
            if (playerName) {
                currentRoom.broadcast({
                    type: 'playerLeft',
                    playerName: playerName
                });
            }
        }
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

console.log('WebSocket server started on port 8082');
console.log('HTTP server started on port 3001');

// Start HTTP server
server.listen(3001, () => {
    console.log('Server running at http://localhost:3001/');
});
