# Relief

> **"Schauen tut man mit den ~~Augen~~ Händen"** (Austrian Proverb)  
> *"You see with your hands [not eyes]"*

Convert depth maps and images into 3D relief models (STL files) for tactile graphics and 3D printing. Built with accessibility in mind - create physical representations of visual content that can be experienced through touch.

## Features

- 📸 **Load depth maps** from files or demo gallery
- 🤖 **AI-powered depth generation** - Convert regular images to depth maps using Depth Anything V2 (~25MB model, runs in browser)
- 🎨 **Real-time 3D preview** with texture mapping
- 📏 **Precise control** over physical dimensions (width, height, depth)
- ✨ **Depth enhancement** with adaptive histogram equalization
- 🏔️ **Contour flattening** for cleaner relief transitions
- 💾 **Export to STL** for 3D printing
- 🖱️ **Drag & drop** support for easy image loading

## Quick Start

### Web Application

```bash
# Navigate to web app
cd apps/web

# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Open http://localhost:5173
```

**Requirements**: Node.js 18+, pnpm

### Building for Production

```bash
cd apps/web
pnpm build       # Build to dist/
pnpm preview     # Preview production build
```

### Running Tests

```bash
cd apps/web
pnpm test            # Run all tests
pnpm test:ui         # Interactive test UI
pnpm test:coverage   # Coverage report
```

## Project Structure

```
relief/
├── apps/
│   ├── api/              # Python Flask depth service (Docker)
│   └── web/              # Vue 3 frontend application
│       ├── src/
│       │   ├── components/   # UI components
│       │   ├── stores/       # Pinia state management
│       │   ├── utils/        # Image & mesh utilities
│       │   ├── styles/       # Global SCSS
│       │   └── plugins/      # Vue plugins
│       └── test/             # Test utilities
├── infra/                # Cloud infrastructure (future)
└── .github/
    └── copilot-instructions.md   # AI development guidelines
```

## Tech Stack

- **Frontend**: Vue 3, Vite, Pinia
- **3D Rendering**: TresJS (declarative Three.js), Three.js
- **AI/ML**: Transformers.js (Depth Anything V2 Small for depth estimation)
- **Styling**: SCSS
- **Testing**: Vitest
- **Package Manager**: pnpm workspaces

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for:
- Design philosophy and architecture decisions
- Code patterns and conventions
- Common mistakes to avoid
- Git workflow and commit guidelines

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for:
- AI assistant guidelines
- Build and test commands
- Critical architecture rules

## API (Optional Legacy Depth Service)

The web app now includes built-in AI-powered depth generation using [Depth Anything V2](https://github.com/DepthAnything/Depth-Anything-V2) running directly in the browser via [Transformers.js](https://huggingface.co/docs/transformers.js).

The Python Flask API is still available as an alternative depth service using MiDaS:

```bash
docker build -t relief-depth-api ./apps/api
docker run --rm -p 8080:8080 relief-depth-api

# Health check
curl http://localhost:8080/healthz

# Generate depth map
curl -X POST -F image=@/path/to/image.jpg \
  http://localhost:8080/depth -o depth.png -D headers.txt
  
# View metadata
sed -n 's/^X-Depth-Meta: //p' headers.txt
```

## License

[Add your license here]

## Contributing

1. Read [DEVELOPMENT.md](DEVELOPMENT.md) for design principles
2. Check [.github/copilot-instructions.md](.github/copilot-instructions.md) for guidelines
3. Run tests before committing: `pnpm test`
4. Use conventional commit messages

## Acknowledgments

Built with accessibility in mind - for creating tactile graphics that make visual content accessible through touch.