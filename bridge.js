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

// Test function - send a test message when UDP is ready
function sendTestMessage() {
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
                } else {
                    console.log('✅ Test message sent successfully');
                    console.log(`📤 Test OSC: ${testMessage.address} [${testMessage.args.map(arg => `${arg.type}:${arg.value}`).join(', ')}]`);
                }
            });
        } else {
            console.warn('⚠️  UDP socket not ready for test message');
        }
    } catch (error) {
        console.error('❌ Test message failed:', error);
        console.error('❌ Error details:', error.message);
    }
}