# My Personal Portfolio
Welcome!

This is a website built for displaying my personal portfolio. Visits and feedback are always appreciated. Feel free to reach out as my contact information is also listed.

## Tech Stack
- [Next.js](https://nextjs.org) v16 (App Router)
- React v19
- TypeScript v5
- [Tailwind CSS](https://tailwindcss.com) v4
- WebGL2: Home's 3D parallax net background, adapted from [Vanta.js](https://www.vantajs.com) NET without three.js

## Getting Started
*Requires Node.js 20.9 or later.

### 1. Clone the Repository
```bash
git clone https://github.com/rymatata/rymata-portfolio.git
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

### 5. Lint and Type Check
```bash
npm run check
```

## Project Architecture
```
rymata-portfolio/
├── public/                         # Static assets, served from "/"
│   ├── images/
│   └── logos/                      # Full-color skill logos, lowercase kebab-case
│       ├── data-tools/  frameworks-libs/  markup-format/
│       ├── programming-langs/  software/
│       ├── linkedin/               # Temporary: path moves into code, then delete
│       └── loyola/
├── src/
│   ├── app/                        # App Router: routes, layouts, global CSS
│   │   ├── layout.tsx              # Root layout
│   │   ├── globals.css             # Tailwind import, @theme tokens
│   │   ├── not-found.tsx           # Custom 404
│   │   ├── (fixed)/                # Viewport-locked pages
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            # /
│   │   │   ├── contact/            # /contact
│   │   │   ├── projects/page.tsx   # /projects
│   │   │   └── resume/page.tsx     # /resume
│   │   └── (scroll)/               # Normally scrolling pages
│   │       ├── layout.tsx
│   │       └── about/page.tsx      # /about
│   ├── components/
│   │   ├── layout/
│   │   ├── ui/                     # Shared primitives
│   │   ├── contact/                # ContactForm (client: react-hook-form + zod)
│   │   └── about/  home/  projects/  resume/   # Page-specific sections
│   └── lib/
│       ├── data/                   # Site content as typed TS
│       ├── schemas/contact.ts      # Zod schema shared by ContactForm and actions.ts
│       ├── parallax-net/           # Home's 3D net background in raw WebGL2: scene, shaders, renderer
│       └── hooks/                  # Custom React hooks
├── next.config.ts
├── tsconfig.json                   # Strict mode, "@/*" → "./src/*"
├── postcss.config.mjs              # Tailwind 4 plugin only
└── eslint.config.mjs
```

## Scripts
| Command             | Description                                      |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Start the development server with hot reload     |
| `npm run build`     | Create a production build                        |
| `npm run start`     | Serve the production build locally               |
| `npm run lint`      | Check the code with ESLint                       |
| `npm run lint:fix`  | Fix ESLint issues automatically where possible   |
| `npm run typecheck` | Generate route types and type-check the project  |
| `npm run check`     | Run `lint` and `typecheck` together              |
