const net = require('net');

const host = 'aws-1-ap-southeast-2.pooler.supabase.com';
const port = 6543;

console.log(`Connecting to ${host}:${port}...`);
const client = new net.Socket();

client.connect(port, host, function() {
    console.log('Connected!');
    client.destroy(); // kill client after server's response
});

client.on('error', function(err) {
    console.error('Connection Error: ', err.message);
});
