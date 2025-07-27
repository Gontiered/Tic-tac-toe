// Elementos del DOM
const menu = document.getElementById('menu');
const gameContainer = document.getElementById('game-container');
const statusDisplay = document.getElementById('status');
const gameBoard = document.getElementById('game-board');
const cells = document.querySelectorAll('.cell');
const playAgainButton = document.getElementById('play-again');

// Botones y campos del menú
const randomMatchBtn = document.getElementById('random-match-btn');
const createRoomBtn = document.getElementById('create-room-btn');
const joinRoomBtn = document.getElementById('join-room-btn');
const roomIdInput = document.getElementById('room-id-input');

// Conexión WebSocket
const socket = new WebSocket('ws://localhost:8080');

let mySymbol = null;
let isMyTurn = false;

// ---- Lógica del Menú ----
randomMatchBtn.addEventListener('click', () => {
    socket.send(JSON.stringify({ type: 'random' }));
    statusDisplay.textContent = 'Buscando oponente...';
    showGameContainer();
});

createRoomBtn.addEventListener('click', () => {
    socket.send(JSON.stringify({ type: 'create' }));
});

joinRoomBtn.addEventListener('click', () => {
    const roomId = roomIdInput.value.trim().toUpperCase();
    if (roomId) {
        socket.send(JSON.stringify({ type: 'join', roomId: roomId }));
    }
});

function showGameContainer() {
    menu.style.display = 'none';
    gameContainer.style.display = 'flex';
}

// ---- Lógica del WebSocket ----
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
        case 'room_created':
            // Corregido: Usar innerHTML para interpretar las etiquetas HTML
            statusDisplay.innerHTML = `Sala creada. Comparte este ID: <br><strong>${data.roomId}</strong>`;
            showGameContainer();
            break;
        case 'start':
            mySymbol = data.symbol;
            isMyTurn = (mySymbol === 'X');
            statusDisplay.textContent = data.message;
            gameBoard.classList.remove('disabled');
            showGameContainer();
            resetBoard();
            break;
        case 'update':
            updateBoard(data.board);
            break;
        case 'turn':
            isMyTurn = data.message.includes('tu turno');
            statusDisplay.textContent = data.message;
            gameBoard.classList.toggle('disabled', !isMyTurn);
            break;
        case 'end':
            statusDisplay.textContent = data.message;
            gameBoard.classList.add('disabled');
            playAgainButton.style.display = 'block';
            break;
        case 'error':
            alert(data.message);
            break;
    }
};

socket.onclose = () => {
    statusDisplay.textContent = 'Desconectado del servidor.';
    gameBoard.classList.add('disabled');
};

// ---- Lógica del Juego ----
cells.forEach(cell => {
    cell.addEventListener('click', () => {
        if (isMyTurn && cell.textContent === '') {
            const index = cell.getAttribute('data-index');
            socket.send(JSON.stringify({ type: 'move', index: parseInt(index) }));
            isMyTurn = false;
        }
    });
});

playAgainButton.addEventListener('click', () => {
    window.location.reload();
});

function updateBoard(board) {
    board.forEach((value, index) => {
        const cell = cells[index];
        cell.textContent = value;
        cell.classList.remove('x', 'o');
        if (value === 'X') cell.classList.add('x');
        else if (value === 'O') cell.classList.add('o');
    });
}

function resetBoard() {
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o');
    });
    playAgainButton.style.display = 'none';
}
