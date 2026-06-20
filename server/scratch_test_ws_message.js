const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
console.log('JWT_SECRET exists:', !!JWT_SECRET);

// Generate a valid staff token
const token = jwt.sign(
    {
        email: 'staff@example.com',
        role: 'staff',
        firstName: 'Test',
        lastName: 'Staff',
        phoneNumber: '9876543210',
        sub: 'e5247513-4211-48ee-a877-a1ea6a2399c5' // a valid user ID in user table
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
    
    // Join conversation
    const conversationId = 'ad1097dd-ab70-42f1-a879-1cacbef1fa01';
    socket.emit('join_conversation', conversationId);
    
    // Send message
    console.log('Sending message...');
    socket.emit('send_message', {
        conversationId,
        customerPhone: 'BNK_AUXILO_FINSERVE_APP_f9dc43b9-689d-4136-bb10-c7c161c6bc80',
        content: 'Test message from WS test script'
    }, (res) => {
        console.log('Acknowledgement received:', res);
        socket.disconnect();
    });
});

socket.on('connect_error', (err) => {
    console.error('Connection error:', err);
});

socket.on('error', (err) => {
    console.error('Socket error:', err);
});
