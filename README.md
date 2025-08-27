# Palacio Vizzy OSC Panel

This project holds an OSC control panel to control live visuals

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## OSC Endpoint Documentation

This application sends OSC messages to control live visuals. All endpoints use WebSocket communication through a bridge server (default: `ws://localhost:8080`).

### Prompt Controls

| Endpoint | Parameters | Range | Description |
|----------|------------|-------|-------------|
| `/prompt` | `leftPrompt` (string), `rightPrompt` (string), `bias` (float) | bias: 0.0-1.0 | Mixes between two text prompts with bias control |
| `/seed_travel_speed` | `speed` (float) | 0.0-1.0 | Controls the speed of seed transitions |

### PreFX Controls (Pre-Processing Effects)

| Endpoint | Parameters | Range | Description |
|----------|------------|-------|-------------|
| `/pre/brightness_contrast` | `x` (float), `y` (float) | 0.0-1.0 each | X: Brightness, Y: Contrast control |
| `/pre/tint` | `r` (float), `g` (float), `b` (float), `a` (float) | 0.0-1.0 each | RGBA color tinting effect |
| `/pre/black_level` | `level` (float) | 0.0-1.0 | Controls the black point/lift |
| `/pre/saturation` | `saturation` (float) | 0.0-2.0 | Color intensity (1.0 = normal, >1.0 = enhanced) |
| `/pre/zoom` | `x` (float), `y` (float) | 0.0-1.0 each | X: Zoom X scaling, Y: Zoom Y scaling |
| `/pre/pan` | `x` (float), `y` (float) | 0.0-1.0 each | X: Pan X position, Y: Pan Y position |

### PostFX Controls (Post-Processing Effects)

| Endpoint | Parameters | Range | Description |
|----------|------------|-------|-------------|
| `/post/brightness_contrast` | `x` (float), `y` (float) | 0.0-1.0 each | X: Brightness, Y: Contrast control |
| `/post/tint` | `r` (float), `g` (float), `b` (float), `a` (float) | 0.0-1.0 each | RGBA color tinting effect |
| `/post/black_level` | `level` (float) | 0.0-1.0 | Controls the black point/lift |
| `/post/saturation` | `saturation` (float) | 0.0-2.0 | Color intensity (1.0 = normal, >1.0 = enhanced) |
| `/post/zoom` | `x` (float), `y` (float) | 0.0-1.0 each | X: Zoom X scaling, Y: Zoom Y scaling |
| `/post/pan` | `x` (float), `y` (float) | 0.0-1.0 each | X: Pan X position, Y: Pan Y position |

### Feedback Controls

| Endpoint | Parameters | Range | Description |
|----------|------------|-------|-------------|
| `/feedback/brightness_contrast` | `x` (float), `y` (float) | 0.0-1.0 each | X: Brightness, Y: Contrast control |
| `/feedback/black_level` | `level` (float) | 0.0-1.0 | Controls the black point/lift |
| `/feedback/saturation` | `saturation` (float) | 0.0-2.0 | Color intensity (1.0 = normal, >1.0 = enhanced) |

### Message Format

All OSC messages are sent as JSON over WebSocket:

```json
{
  "address": "/endpoint/path",
  "args": [param1, param2, ...]
}
```

### Control Types

- **XY Controls**: Send two float parameters (x, y) representing 2D coordinates
- **Knobs**: Send single float parameter with specified range and step precision
- **Color Picker**: Sends four float parameters (r, g, b, a) normalized to 0.0-1.0 range
- **Text Inputs**: Send string parameters with debounced updates
- **Sliders**: Send single float parameter within specified range

### Bridge Server

The application connects to a WebSocket bridge server that converts JSON messages to OSC protocol. Default configuration:
- Host: `localhost`
- Port: `8080`
- Auto-reconnect: Enabled (max 5 attempts)
- Reconnect delay: 3 seconds
