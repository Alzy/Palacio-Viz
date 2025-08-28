# Configuration Guide

This application can be fully configured using environment variables. Copy `.env.example` to `.env` and modify the values as needed.

## Environment Variables

### Bridge Configuration
- `BRIDGE_WEBSOCKET_PORT` - Port for the WebSocket bridge server (default: 8080)
- `TOUCHDESIGNER_HOST` - IP address of TouchDesigner instance (default: 127.0.0.1)
- `TOUCHDESIGNER_PORT` - OSC port in TouchDesigner (default: 7000)

### Frontend Configuration
- `NEXT_PUBLIC_OSC_BRIDGE_HOST` - Host where frontend connects to bridge (default: localhost)
- `NEXT_PUBLIC_OSC_BRIDGE_PORT` - Port where frontend connects to bridge (default: 8080)

## Setup Instructions

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your specific configuration:
   ```bash
   # Example for remote TouchDesigner setup
   BRIDGE_WEBSOCKET_PORT=8080
   TOUCHDESIGNER_HOST=192.168.1.100
   TOUCHDESIGNER_PORT=7000
   NEXT_PUBLIC_OSC_BRIDGE_HOST=localhost
   NEXT_PUBLIC_OSC_BRIDGE_PORT=8080
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the application:
   ```bash
   npm run dev:all
   ```

## Common Configurations

### Local Development (Default)
```env
BRIDGE_WEBSOCKET_PORT=8080
TOUCHDESIGNER_HOST=127.0.0.1
TOUCHDESIGNER_PORT=7000
NEXT_PUBLIC_OSC_BRIDGE_HOST=localhost
NEXT_PUBLIC_OSC_BRIDGE_PORT=8080
```

### Remote TouchDesigner
```env
BRIDGE_WEBSOCKET_PORT=8080
TOUCHDESIGNER_HOST=192.168.1.100
TOUCHDESIGNER_PORT=7000
NEXT_PUBLIC_OSC_BRIDGE_HOST=localhost
NEXT_PUBLIC_OSC_BRIDGE_PORT=8080
```

### Different Bridge Port
```env
BRIDGE_WEBSOCKET_PORT=9090
TOUCHDESIGNER_HOST=127.0.0.1
TOUCHDESIGNER_PORT=7000
NEXT_PUBLIC_OSC_BRIDGE_HOST=localhost
NEXT_PUBLIC_OSC_BRIDGE_PORT=9090
```

### Remote Bridge Access
```env
BRIDGE_WEBSOCKET_PORT=8080
TOUCHDESIGNER_HOST=127.0.0.1
TOUCHDESIGNER_PORT=7000
NEXT_PUBLIC_OSC_BRIDGE_HOST=192.168.1.50
NEXT_PUBLIC_OSC_BRIDGE_PORT=8080
```

## Notes

- The `.env` file is ignored by git for security
- Always use `.env.example` as a template
- `NEXT_PUBLIC_*` variables are exposed to the browser
- Bridge variables are only used by the Node.js bridge process
- All ports must be available and not blocked by firewalls