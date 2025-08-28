// bridge.js - WebSocket to UDP OSC Bridge
const WebSocket = require('ws');
const osc = require('osc');
const dgram = require('dgram');
require('dotenv').config();

// Configuration with environment variable fallbacks
const WEBSOCKET_PORT = parseInt(process.env.BRIDGE_WEBSOCKET_PORT) || 8080;
const TOUCHDESIGNER_HOST = process.env.TOUCHDESIGNER_HOST || '127.0.0.1';
const TOUCHDESIGNER_PORT = parseInt(process.env.TOUCHDESIGNER_PORT) || 7000;

console.log('🌉 Starting OSC WebSocket-to-UDP Bridge...');
console.log(`📦 Using osc library version: ${require('./node_modules/osc/package.json').version}`);
console.log(`⚙️  Configuration:`);
console.log(`   WebSocket Port: ${WEBSOCKET_PORT}`);
console.log(`   TouchDesigner Host: ${TOUCHDESIGNER_HOST}`);
console.log(`   TouchDesigner Port: ${TOUCHDESIGNER_PORT}`);

// Create UDP socket using Node.js dgram for better reliability
const udpSocket = dgram.createSocket('udp4');
let udpSocketReady = false;

// Track UDP port readiness
let udpPortReady = false;

// Create WebSocket server for web clients
const wss = new WebSocket.Server({
    port: WEBSOCKET_PORT,
    perMessageDeflate: false
});

// Setup UDP socket with dgram
udpSocket.on('listening', () => {
    const address = udpSocket.address();
    udpSocketReady = true;
    console.log(`✅ UDP socket ready - bound to ${address.address}:${address.port}`);
    console.log(`🎯 Sending to TouchDesigner at ${TOUCHDESIGNER_HOST}:${TOUCHDESIGNER_PORT}`);
    
    // Send test message once UDP is ready
    setTimeout(() => {
        sendTestMessage();
    }, 1000);
});

udpSocket.on('error', (error) => {
    console.error('❌ UDP Socket Error:', error);
    console.error('❌ This might be a firewall or port binding issue');
});

udpSocket.on('message', (msg, rinfo) => {
    console.log(`📥 Received UDP message from ${rinfo.address}:${rinfo.port}`);
    try {
        const oscMessage = osc.readPacket(msg, {});
        console.log('📥 OSC Message:', oscMessage);
    } catch (error) {
        console.log('📥 Raw UDP:', msg.toString());
    }
});

// Bind the UDP socket
console.log('🔌 Binding UDP socket to port 57121...');
try {
    udpSocket.bind(57121, '127.0.0.1');
} catch (error) {
    console.error('❌ Failed to bind UDP socket:', error);
}


// Handle WebSocket connections
wss.on('connection', (ws, request) => {
    const clientIP = request.socket.remoteAddress;
    console.log(`🔗 Web client connected from ${clientIP}`);

    // Handle incoming WebSocket messages
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());

            // Validate OSC message format
            if (!message.address || !message.address.startsWith('/')) {
                console.warn('⚠️  Invalid OSC address:', message.address);
                return;
            }

            // Process and validate arguments
            let processedArgs = [];
            if (message.args) {
                const args = Array.isArray(message.args) ? message.args : [message.args];

                // Convert and validate each argument
                processedArgs = args.map(arg => {
                    if (typeof arg === 'number') {
                        return { type: 'f', value: arg }; // Float
                    } else if (typeof arg === 'string') {
                        return { type: 's', value: arg }; // String
                    } else if (typeof arg === 'boolean') {
                        return { type: 'i', value: arg ? 1 : 0 }; // Boolean as integer
                    } else {
                        // Try to convert to string as fallback
                        return { type: 's', value: String(arg) };
                    }
                });
            }

            // Create OSC message with typed arguments
            const oscMessage = {
                address: message.address,
                args: processedArgs
            };

            // Send via UDP to TouchDesigner using dgram socket
            if (udpSocketReady) {
                try {
                    // Convert OSC message to binary
                    const oscBuffer = osc.writePacket(oscMessage, {});
                    
                    console.log(`🔍 Debug - OSC message:`, oscMessage);
                    console.log(`🔍 Debug - Buffer size: ${oscBuffer.length} bytes`);
                    console.log(`🔍 Debug - Sending to ${TOUCHDESIGNER_HOST}:${TOUCHDESIGNER_PORT}`);
                    
                    udpSocket.send(oscBuffer, TOUCHDESIGNER_PORT, TOUCHDESIGNER_HOST, (error) => {
                        if (error) {
                            console.error('❌ Failed to send OSC message:', error);
                            if (error.code === 'ENETUNREACH') {
                                console.error(`❌ Network unreachable: Cannot reach ${TOUCHDESIGNER_HOST}:${TOUCHDESIGNER_PORT}`);
                                console.error(`❌ Please check:`);
                                console.error(`   • Is ${TOUCHDESIGNER_HOST} the correct IP address?`);
                                console.error(`   • Is the target device on the same network?`);
                                console.error(`   • Is there a firewall blocking UDP traffic?`);
                                console.error(`   • Is TouchDesigner running and listening on port ${TOUCHDESIGNER_PORT}?`);
                            } else if (error.code === 'EHOSTUNREACH') {
                                console.error(`❌ Host unreachable: ${TOUCHDESIGNER_HOST} is not reachable`);
                                console.error(`❌ Check network connectivity and IP address`);
                            } else if (error.code === 'ECONNREFUSED') {
                                console.error(`❌ Connection refused: ${TOUCHDESIGNER_HOST}:${TOUCHDESIGNER_PORT} is not accepting connections`);
                                console.error(`❌ Check if TouchDesigner is running and OSC In is configured`);
                            }
                        } else {
                            console.log(`📤 OSC: ${oscMessage.address} [${processedArgs.map(arg => `${arg.type}:${arg.value}`).join(', ')}]`);
                        }
                    });
                } catch (error) {
                    console.error('❌ Failed to encode OSC message:', error);
                    console.error('❌ Error details:', error.message);
                    console.error('❌ OSC message was:', oscMessage);
                }
            } else {
                console.warn('⚠️  UDP socket not ready, message dropped');
            }

        } catch (error) {
            console.error('❌ Error processing WebSocket message:', error);
            console.error('❌ Original message:', data.toString());
        }
    });

    // Handle client disconnect
    ws.on('close', () => {
        console.log(`🔌 Web client disconnected from ${clientIP}`);
    });

    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
    });

    // Send welcome message
    ws.send(JSON.stringify({
        type: 'status',
        message: 'Connected to OSC bridge',
        touchdesignerHost: TOUCHDESIGNER_HOST,
        touchdesignerPort: TOUCHDESIGNER_PORT
    }));
});

// Handle WebSocket server events
wss.on('listening', () => {
    console.log(`🚀 WebSocket server listening on port ${WEBSOCKET_PORT}`);
    console.log(`🎯 Ready to bridge messages to TouchDesigner!`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. Open TouchDesigner`);
    console.log(`   2. Add OSC In CHOP, set port to ${TOUCHDESIGNER_PORT}`);
    console.log(`   3. Start your Next.js app: npm run dev`);
});

wss.on('error', (error) => {
    console.error('❌ WebSocket server error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down bridge...');
    wss.close();
    if (udpSocketReady) {
        udpSocket.close();
    }
    process.exit(0);
});

// Network connectivity test function
function testNetworkConnectivity() {
    const net = require('net');
    console.log(`🔍 Testing network connectivity to ${TOUCHDESIGNER_HOST}...`);
    
    // Test if we can reach the host (try a TCP connection first)
    const socket = new net.Socket();
    socket.setTimeout(3000);
    
    socket.on('connect', () => {
        console.log(`✅ TCP connectivity to ${TOUCHDESIGNER_HOST} confirmed`);
        socket.destroy();
        
        // If TCP works, test UDP specifically
        setTimeout(() => {
            testUDPConnectivity();
        }, 500);
    });
    
    socket.on('timeout', () => {
        console.log(`⚠️  TCP connection to ${TOUCHDESIGNER_HOST} timed out`);
        console.log(`⚠️  Host may be reachable but not accepting TCP connections`);
        socket.destroy();
    });
    
    socket.on('error', (error) => {
        if (error.code === 'ENETUNREACH') {
            console.log(`❌ Network unreachable: Cannot reach ${TOUCHDESIGNER_HOST}`);
            console.log(`❌ Check if ${TOUCHDESIGNER_HOST} is on the same network`);
        } else if (error.code === 'EHOSTUNREACH') {
            console.log(`❌ Host unreachable: ${TOUCHDESIGNER_HOST} is not responding`);
        } else if (error.code === 'ECONNREFUSED') {
            console.log(`✅ Host ${TOUCHDESIGNER_HOST} is reachable (connection refused is normal for UDP-only services)`);
            
            // If TCP works, test UDP specifically
            setTimeout(() => {
                testUDPConnectivity();
            }, 500);
        } else {
            console.log(`⚠️  Network test error:`, error.code);
        }
        socket.destroy();
    });
    
    // Try to connect to a common port (we expect this to fail, but it tests reachability)
    socket.connect(80, TOUCHDESIGNER_HOST);
}

// UDP-specific connectivity test
function testUDPConnectivity() {
    console.log(`🔍 Testing UDP connectivity to ${TOUCHDESIGNER_HOST}:${TOUCHDESIGNER_PORT}...`);
    
    // Create a simple test UDP socket
    const testSocket = dgram.createSocket('udp4');
    const testMessage = Buffer.from('UDP_TEST');
    
    testSocket.send(testMessage, TOUCHDESIGNER_PORT, TOUCHDESIGNER_HOST, (error) => {
        if (error) {
            console.log(`❌ UDP test failed:`, error.code);
            if (error.code === 'ENETUNREACH') {
                console.log(`❌ UDP traffic to ${TOUCHDESIGNER_HOST}:${TOUCHDESIGNER_PORT} is blocked`);
                console.log(`🔧 Possible solutions:`);
                console.log(`   • Check Windows Firewall settings on both machines`);
                console.log(`   • Check router/network firewall settings`);
                console.log(`   • Try temporarily disabling firewalls for testing`);
                console.log(`   • Verify TouchDesigner OSC In CHOP is configured and active`);
                console.log(`   • Try a different port (e.g., 7001, 8000)`);
            }
        } else {
            console.log(`✅ UDP connectivity to ${TOUCHDESIGNER_HOST}:${TOUCHDESIGNER_PORT} appears to work`);
            console.log(`✅ The issue might be with TouchDesigner OSC configuration`);
        }
        testSocket.close();
    });
}

// Test function - send a test message when UDP is ready
function sendTestMessage() {
    // First test network connectivity
    testNetworkConnectivity();
    
    // Wait a bit then try the OSC test
    setTimeout(() => {
        console.log('🧪 Sending test OSC message...');
        try {
            const testMessage = {
                address: '/test',
                args: [
                    { type: 's', value: 'bridge_ready' },
                    { type: 'f', value: 1.0 }
                ]
            };
            
            if (udpSocketReady) {
                console.log(`🔍 Debug - Test message:`, testMessage);
                
                // Send via dgram socket
                const oscBuffer = osc.writePacket(testMessage, {});
                console.log(`🔍 Debug - Test buffer size: ${oscBuffer.length} bytes`);
                console.log(`🔍 Debug - Test buffer hex:`, oscBuffer.toString('hex'));
                
                udpSocket.send(oscBuffer, TOUCHDESIGNER_PORT, TOUCHDESIGNER_HOST, (error) => {
                    if (error) {
                        console.error('❌ Test message failed:', error);
                        console.error(`❌ Cannot reach TouchDesigner at ${TOUCHDESIGNER_HOST}:${TOUCHDESIGNER_PORT}`);
                        console.error(`❌ This means OSC messages will not be delivered to TouchDesigner`);
                        console.error(`❌ WebSocket clients can still connect, but OSC forwarding will fail`);
                        
                        if (error.code === 'ENETUNREACH') {
                            console.error(`\n🔧 Troubleshooting steps:`);
                            console.error(`   1. Verify ${TOUCHDESIGNER_HOST} is the correct IP address`);
                            console.error(`   2. Check if the target device is on the same network`);
                            console.error(`   3. Try pinging: ping ${TOUCHDESIGNER_HOST}`);
                            console.error(`   4. Check firewall settings on both machines`);
                            console.error(`   5. Verify TouchDesigner is running with OSC In CHOP on port ${TOUCHDESIGNER_PORT}`);
                            console.error(`\n💡 For local testing, try setting TOUCHDESIGNER_HOST=127.0.0.1 in .env`);
                        }
                    } else {
                        console.log('✅ Test message sent successfully');
                        console.log(`📤 Test OSC: ${testMessage.address} [${testMessage.args.map(arg => `${arg.type}:${arg.value}`).join(', ')}]`);
                        console.log('✅ TouchDesigner connectivity confirmed!');
                    }
                });
            } else {
                console.warn('⚠️  UDP socket not ready for test message');
            }
        } catch (error) {
            console.error('❌ Test message failed:', error);
            console.error('❌ Error details:', error.message);
        }
    }, 1000);
}