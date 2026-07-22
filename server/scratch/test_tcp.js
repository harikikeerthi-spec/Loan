const net = require('net');

function testPort(host, port) {
  return new Promise((resolve) => {
    console.log(`Connecting to ${host}:${port}...`);
    const socket = new net.Socket();
    socket.setTimeout(5000);
    socket.on('connect', () => {
      console.log(`SUCCESS: Connected to ${host}:${port}`);
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      console.log(`TIMEOUT: ${host}:${port}`);
      socket.destroy();
      resolve(false);
    });
    socket.on('error', (err) => {
      console.log(`ERROR: ${host}:${port} - ${err.message}`);
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function run() {
  await testPort('13.239.87.90', 5432);
  await testPort('13.239.87.90', 6543);
  await testPort('db.mhhmqdbzsmwyizmvwtsx.supabase.co', 5432);
  await testPort('aws-0-ap-south-1.pooler.supabase.com', 6543);
}

run();
