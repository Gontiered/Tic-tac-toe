const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let randomQueue = [];
let gameRooms = {};

console.log('Servidor de Tic-Tac-Toe iniciado en el puerto 8080...');

wss.on('connection', (ws) => {
    ws.nickname = null;

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'random':
                ws.nickname = data.nickname;
                handleRandomMatch(ws);
                break;
            case 'create':
                ws.nickname = data.nickname;
                handleCreateRoom(ws);
                break;
            case 'join':
                ws.nickname = data.nickname;
                handleJoinRoom(ws, data.roomId);
                break;
            case 'move':
                handleMove(ws, data.index);
                break;
        }
    });

    ws.on('close', () => {
        randomQueue = randomQueue.filter(player => player !== ws);
        handleDisconnection(ws);
    });
});

function handleRandomMatch(ws) {
    randomQueue.push(ws);
    if (randomQueue.length >= 2) {
        const player1 = randomQueue.shift();
        const player2 = randomQueue.shift();
        startGame(player1, player2);
    }
}

function handleCreateRoom(ws) {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    gameRooms[roomId] = {
        players: [ws],
        nicknames: [ws.nickname],
        board: Array(9).fill(null),
        turn: 0
    };
    ws.roomId = roomId;
    ws.send(JSON.stringify({ type: 'room_created', roomId: roomId }));
}

function handleJoinRoom(ws, roomId) {
    const room = gameRooms[roomId];
    if (room && room.players.length === 1) {
        room.players.push(ws);
        room.nicknames.push(ws.nickname);
        ws.roomId = roomId;
        startGame(room.players[0], room.players[1]);
    } else {
        ws.send(JSON.stringify({ type: 'error', message: 'La sala no existe o está llena.' }));
    }
}

function handleMove(ws, index) {
    const roomId = ws.roomId;
    const game = gameRooms[roomId];

    if (!game) return;

    const playerIndex = game.players.indexOf(ws);
    if (playerIndex === game.turn && game.board[index] === null) {
        game.board[index] = ws.symbol;

        const winnerLine = checkWinnerLine(game.board);
        const isDraw = !winnerLine && game.board.every(cell => cell !== null);

        broadcast(game, { type: 'update', board: game.board });

        if (winnerLine) {
            broadcast(game, {
                type: 'end',
                message: `¡${game.nicknames[playerIndex]} (${ws.symbol}) ha ganado!`,
                board: game.board,
                winningCells: winnerLine
            });
            delete gameRooms[roomId];
        } else if (isDraw) {
            broadcast(game, {
                type: 'end',
                message: '¡Es un empate!',
                board: game.board,
                winningCells: []
            });
            delete gameRooms[roomId];
        } else {
            game.turn = 1 - game.turn;
            game.players.forEach((player, idx) => {
                const isPlayerTurn = idx === game.turn;
                const message = isPlayerTurn
                    ? `Es tu turno, ${game.nicknames[idx]}`
                    : `Turno de ${game.nicknames[game.turn]}`;
                player.send(JSON.stringify({ type: 'turn', message, isMyTurn: isPlayerTurn }));
            });
        }
    }
}

function handleDisconnection(ws) {
    const roomId = ws.roomId;
    if (roomId && gameRooms[roomId]) {
        const game = gameRooms[roomId];
        if (game.players.length === 1 && game.players[0] === ws) {
            delete gameRooms[roomId];
        } else {
            const opponentIdx = game.players.findIndex(p => p !== ws);
            const opponent = game.players[opponentIdx];
            if (opponent && opponent.readyState === WebSocket.OPEN) {
                opponent.send(JSON.stringify({ type: 'end', message: `El oponente se ha desconectado. ¡Ganaste!` }));
            }
            delete gameRooms[roomId];
        }
    }
}

function startGame(player1, player2) {
    const roomId = player1.roomId || `game_${Date.now()}`;
    player1.roomId = player2.roomId = roomId;
    player1.symbol = 'X';
    player2.symbol = 'O';

    // Nicknames
    const nick1 = player1.nickname || 'Jugador X';
    const nick2 = player2.nickname || 'Jugador O';

    if (!gameRooms[roomId]) {
        gameRooms[roomId] = { players: [player1, player2], nicknames: [nick1, nick2], board: Array(9).fill(null), turn: 0 };
    } else {
        gameRooms[roomId].nicknames = [nick1, nick2];
    }

    // Enviar ambos nicknames a ambos jugadores
    const playersObj = { X: nick1, O: nick2 };
    player1.send(JSON.stringify({ type: 'start', symbol: 'X', players: playersObj, message: `La partida ha comenzado. Es tu turno, ${nick1}` }));
    player2.send(JSON.stringify({ type: 'start', symbol: 'O', players: playersObj, message: `La partida ha comenzado. Esperando a ${nick1}` }));
}

function broadcast(game, message) {
    game.players.forEach(player => {
        if (player.readyState === WebSocket.OPEN) {
            player.send(JSON.stringify(message));
        }
    });
}

function checkWinnerLine(board) {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    for (let line of lines) {
        const [a, b, c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return line;
        }
    }
    return null;
}