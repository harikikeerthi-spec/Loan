const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

const token = jwt.sign(
    {
        email: 'jimawa1376@afterdo.com',
        role: 'staff',
        firstName: 'Jean',
        lastName: 'Gio',
        phoneNumber: '8238423890',
        sub: 'VL-STU-2026-00005'
    },
    JWT_SECRET,
    { expiresIn: '1h' }
);

const socket = io('http://localhost:5000/chat', {
    transports: ['websocket'],
    auth: { token }
});

socket.on('connect', () => {
    console.log('Connected to gateway, ID:', socket.id);
    const conversationId = 'ad1097dd-ab70-42f1-a879-1cacbef1fa01';
    socket.emit('send_message', {
        conversationId,
        customerPhone: 'BNK_AUXILO_FINSERVE_APP_f9dc43b9-689d-4136-bb10-c7c161c6bc80',
        content: 'Test message from Jean Gio'
    }, (res) => {
        console.log('Jean Gio Acknowledgement:', res);
        socket.disconnect();
    });
});

socket.on('connect_error', (err) => {
    console.error('Connection error:', err);
});
