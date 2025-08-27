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

## Endpoint map

### Prompts
`/prompt-a`: (string) Left prompt 
`/prompt-b`: (string) Right prompt
`/prompt-ratio`: (float; range: 0-1; default: 0.5)


### Pre/Post Processing
`/pre-tint`: (float[3]; range: 0-1;)
`/pre-zoom`: (float[2]; range: 0-1; default: 0.0)
`/pre-pan`: (float[2]; range: 0-1; default: 0.0)
`/post-tint`: (float[3]; range: 0-1;)
`/post-pan`: (float[2]; range: 0-1; default: 0.0)
