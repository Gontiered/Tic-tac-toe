// Elementos del DOM
const menu = document.getElementById('menu');
const gameContainer = document.getElementById('game-container');
const statusDisplay = document.getElementById('status');
const gameBoard = document.getElementById('game-board');
const cells = document.querySelectorAll('.cell');
const playAgainButton = document.getElementById('play-again');
const backToMenuButton = document.getElementById('back-to-menu-btn');

// Barra de nombres
const playersBar = document.getElementById('players-bar');
const nicknameX = document.getElementById('nickname-x');
const nicknameO = document.getElementById('nickname-o');

// Nickname
let myNickname = '';
let mySymbol = null;
let isMyTurn = false;
let players = { X: '', O: '' };

// Botones y campos del menú
const randomMatchBtn = document.getElementById('random-match-btn');
const createRoomBtn = document.getElementById('create-room-btn');
const joinRoomBtn = document.getElementById('join-room-btn');
const roomIdInput = document.getElementById('room-id-input');
const nicknameInput = document.getElementById('nickname-input');

// Conexión WebSocket
const socket = new WebSocket('ws://localhost:8080');

function getNickname() {
    return nicknameInput.value.trim().substring(0, 15);
}

// ---- Lógica del Menú ----
randomMatchBtn.addEventListener('click', () => {
    myNickname = getNickname();
    if (!myNickname) {
        nicknameInput.focus();
        nicknameInput.classList.add('input-error');
        setTimeout(() => nicknameInput.classList.remove('input-error'), 800);
        return;
    }
    socket.send(JSON.stringify({ type: 'random', nickname: myNickname }));
    statusDisplay.textContent = 'Buscando oponente...';
    showGameContainer();
    backToMenuButton.style.display = 'block';
    playersBar.style.display = 'none';
});

createRoomBtn.addEventListener('click', () => {
    myNickname = getNickname();
    if (!myNickname) {
        nicknameInput.focus();
        nicknameInput.classList.add('input-error');
        setTimeout(() => nicknameInput.classList.remove('input-error'), 800);
        return;
    }
    socket.send(JSON.stringify({ type: 'create', nickname: myNickname }));
});

joinRoomBtn.addEventListener('click', () => {
    myNickname = getNickname();
    if (!myNickname) {
        nicknameInput.focus();
        nicknameInput.classList.add('input-error');
        setTimeout(() => nicknameInput.classList.remove('input-error'), 800);
        return;
    }
    const roomId = roomIdInput.value.trim().toUpperCase();
    if (roomId) {
        socket.send(JSON.stringify({ type: 'join', roomId: roomId, nickname: myNickname }));
    }
});

backToMenuButton.addEventListener('click', () => {
    menu.style.display = 'flex';
    gameContainer.style.display = 'none';
    statusDisplay.textContent = '';
    backToMenuButton.style.display = 'none';
    playersBar.style.display = 'none';
    window.location.reload();
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
            statusDisplay.innerHTML = `Sala creada. Comparte este ID: <br><strong>${data.roomId}</strong>`;
            showGameContainer();
            backToMenuButton.style.display = 'block';
            playersBar.style.display = 'none';
            break;
        case 'start':
            mySymbol = data.symbol;
            players = data.players;
            updatePlayersBar();
            isMyTurn = (mySymbol === 'X');
            statusDisplay.textContent = data.message;
            gameBoard.classList.remove('disabled');
            showGameContainer();
            resetBoard();
            backToMenuButton.style.display = 'none';
            playersBar.style.display = 'flex';
            break;
        case 'update':
            updateBoard(data.board);
            break;
        case 'turn':
            isMyTurn = data.isMyTurn;
            statusDisplay.textContent = data.message;
            gameBoard.classList.toggle('disabled', !isMyTurn);
            break;
        case 'end':
            statusDisplay.textContent = data.message;
            gameBoard.classList.add('disabled');
            playAgainButton.style.display = 'block';
            backToMenuButton.style.display = 'none';
            break;
        case 'error':
            alert(data.message);
            backToMenuButton.style.display = 'none';
            break;
    }
};

socket.onclose = () => {
    statusDisplay.textContent = 'Desconectado del servidor.';
    gameBoard.classList.add('disabled');
    backToMenuButton.style.display = 'none';
    playersBar.style.display = 'none';
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

function updatePlayersBar() {
    if (!players || !players.X || !players.O) {
        playersBar.style.display = 'none';
        nicknameX.textContent = '';
        nicknameO.textContent = '';
        return;
    }
    nicknameX.textContent = `${players.X} (X)`;
    nicknameO.textContent = `${players.O} (O)`;
    playersBar.style.display = 'flex';
}