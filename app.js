// Elementos del DOM
const menu = document.getElementById('menu');
const gameContainer = document.getElementById('game-container');
const statusDisplay = document.getElementById('status');
const gameBoard = document.getElementById('game-board');
const cells = document.querySelectorAll('.cell');
const playAgainButton = document.getElementById('play-again');
const backToMenuButton = document.getElementById('back-to-menu-btn');
const playersBar = document.getElementById('players-bar');
const nicknameX = document.getElementById('nickname-x');
const nicknameO = document.getElementById('nickname-o');
const randomMatchBtn = document.getElementById('random-match-btn');
const createRoomBtn = document.getElementById('create-room-btn');
const joinRoomBtn = document.getElementById('join-room-btn');
const roomIdInput = document.getElementById('room-id-input');
const nicknameInput = document.getElementById('nickname-input');

// Login/registro
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const loginMessage = document.getElementById('login-message');
const showRegisterFromLogin = document.getElementById('show-register-from-login');
const registerModal = document.getElementById('register-modal');
const registerForm = document.getElementById('register-form');
const registerUsername = document.getElementById('register-username');
const registerPassword = document.getElementById('register-password');
const registerCancel = document.getElementById('register-cancel');
const registerMessage = document.getElementById('register-message');

// Estado de usuario
let myNickname = '';
let mySymbol = null;
let isMyTurn = false;
let players = { X: '', O: '' };

// --------- Login y Registro ---------
showRegisterFromLogin.addEventListener('click', () => {
    loginModal.style.display = 'none';
    registerModal.style.display = 'flex';
    registerForm.reset();
    registerMessage.textContent = '';
    registerUsername.focus();
});

registerCancel.addEventListener('click', () => {
    registerModal.style.display = 'none';
    loginModal.style.display = 'flex';
    loginForm.reset();
    loginMessage.textContent = '';
    loginUsername.focus();
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    registerMessage.textContent = '';
    const username = registerUsername.value.trim();
    const password = registerPassword.value;
    if (username.length < 3 || password.length < 6) {
        registerMessage.textContent = 'Usuario o contraseña inválidos.';
        return;
    }
    try {
        const res = await fetch('http://localhost:8080/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
            registerMessage.style.color = '#27ae60';
            registerMessage.textContent = '¡Registro exitoso! Ahora puedes iniciar sesión.';
            setTimeout(() => {
                registerModal.style.display = 'none';
                loginModal.style.display = 'flex';
                loginForm.reset();
                loginMessage.textContent = '';
                loginUsername.focus();
                registerMessage.style.color = '#e74c3c';
            }, 1200);
        } else {
            registerMessage.style.color = '#e74c3c';
            registerMessage.textContent = data.error || 'Error en el registro';
        }
    } catch (err) {
        registerMessage.style.color = '#e74c3c';
        registerMessage.textContent = 'Error de conexión con el servidor';
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginMessage.textContent = '';
    const username = loginUsername.value.trim();
    const password = loginPassword.value;
    if (username.length < 3 || password.length < 6) {
        loginMessage.textContent = 'Usuario o contraseña inválidos.';
        return;
    }
    try {
        const res = await fetch('http://localhost:8080/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.token) {
            localStorage.setItem('ttt_token', data.token);
            localStorage.setItem('ttt_user', data.username);
            myNickname = data.username;
            loginModal.style.display = 'none';
            menu.style.display = 'flex';
            if (nicknameInput) nicknameInput.value = data.username;
        } else {
            loginMessage.textContent = data.error || 'Credenciales incorrectas';
        }
    } catch (err) {
        loginMessage.textContent = 'Error de conexión con el servidor';
    }
});

// ---------- FIN Login y Registro ----------

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
const socket = new WebSocket('ws://localhost:8080');
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