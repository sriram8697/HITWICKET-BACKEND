const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const port = 8080;

// Game state
let gameState = {
  board: Array(5).fill(null).map(() => Array(5).fill(null)),
  currentPlayer: 'A',
  players: {},
  moveHistory: [],
  gameOver: false,
  winner: null,
};

// WebSocket connection handler
wss.on('connection', ws => {
  console.log('Client connected');

  ws.on('message', message => {
    const data = JSON.parse(message);

    if (data.type === 'MOVE') {
      handleMove(data.move, ws);
    } else if (data.type === 'INIT') {
      ws.send(JSON.stringify({ type: 'UPDATE', gameState }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Handle a move from a player
function handleMove(move, ws) {
  if (gameState.gameOver) {
    ws.send(JSON.stringify({ type: 'INVALID_MOVE', message: 'Game over' }));
    return;
  }

  const { player, row, col, character, moveType } = move;
  if (gameState.currentPlayer !== player) {
    ws.send(JSON.stringify({ type: 'INVALID_MOVE', message: 'Not your turn' }));
    return;
  }

  // Add game logic here for move validation, updating board, checking for wins, etc.
  const validMove = validateMove(row, col, character, moveType);

  if (!validMove) {
    ws.send(JSON.stringify({ type: 'INVALID_MOVE', message: 'Invalid move' }));
    return;
  }

  // Apply move and update game state
  applyMove(row, col, character, moveType);
  gameState.moveHistory.push(move);

  if (checkWin()) {
    gameState.gameOver = true;
    gameState.winner = gameState.currentPlayer;
    broadcast(JSON.stringify({ type: 'GAME_OVER', winner: gameState.winner }));
  } else {
    gameState.currentPlayer = gameState.currentPlayer === 'A' ? 'B' : 'A';
    broadcast(JSON.stringify({ type: 'UPDATE', gameState }));
  }
}

// Validate move (basic implementation)
function validateMove(row, col, character, moveType) {
  if (row < 0 || row >= 5 || col < 0 || col >= 5) return false; // Out of bounds
  if (gameState.board[row][col] && gameState.board[row][col][0] === gameState.currentPlayer) return false; // Friendly fire

  // Implement more detailed move validation based on character type
  return true;
}

// Apply move to game state
function applyMove(row, col, character, moveType) {
  // Implement logic for updating the board based on moveType
  // This is a simplified example:
  gameState.board[row][col] = character;
}

// Check for win condition
function checkWin() {
  // Implement win condition check based on game rules
  return false;
}

// Broadcast a message to all clients
function broadcast(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Serve the static files
app.use(express.static('public'));

// Start the server
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
