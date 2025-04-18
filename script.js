const socket = io();

// Ambil username dari URL
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');

// Validasi username
if (!username) {
  window.location = '/';
}

// Tampilkan username di header
document.getElementById('usernameDisplay').textContent = username;

// Set username ke server saat pertama koneksi
socket.emit('set-username', username);

// Handle pengiriman pesan
function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if(message) {
        socket.emit('send-message', {
            username: username,
            message: message
        });
        input.value = '';
    }
}

// Handle update user list
socket.on('update-users', (users) => {
    const userList = document.getElementById('userList');
    userList.innerHTML = users
        .filter(u => u !== null) // Filter null
        .map(user => `<li>${user}</li>`)
        .join('');
});

// Handle pesan baru
socket.on('new-message', (msg) => {
    const chatBox = document.getElementById('chatBox');
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.innerHTML = `
        <div class="message-header">
            <strong>${msg.username}</strong>
            <span>${new Date(msg.timestamp).toLocaleTimeString()}</span>
        </div>
        <p>${msg.message}</p>
    `;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
});

// Handle history pesan
socket.on('load-messages', (messages) => {
    const chatBox = document.getElementById('chatBox');
    messages.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.innerHTML = `
            <div class="message-header">
                <strong>${msg.username}</strong>
                <span>${new Date(msg.timestamp).toLocaleTimeString()}</span>
            </div>
            <p>${msg.message}</p>
        `;
        chatBox.appendChild(messageElement);
    });
});