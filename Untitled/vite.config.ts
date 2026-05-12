import fs from 'fs'
import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function figmaAssetResolver() {
  const assetDir = path.resolve(__dirname, './src/assets')

  return {
    name: 'figma-asset-resolver',
    enforce: 'pre' as const,
    resolveId(source: string) {
      if (!source.startsWith('figma:asset/')) {
        return null
      }

      const assetName = source.slice('figma:asset/'.length)
      const assetPath = path.resolve(assetDir, assetName)

      if (fs.existsSync(assetPath)) {
        return assetPath
      }

      return `\0figma-asset:${assetName}`
    },
    load(id: string) {
      if (!id.startsWith('\0figma-asset:')) {
        return null
      }

      const assetName = id.slice('\0figma-asset:'.length)
      const label = assetName.split('/').pop() ?? 'missing-asset'
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
          <rect width="600" height="400" fill="#f8fafc" />
          <rect x="20" y="20" width="560" height="360" rx="24" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2" />
          <text x="300" y="190" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#334155">
            Missing Figma asset
          </text>
          <text x="300" y="225" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#64748b">
            ${label}
          </text>
        </svg>
      `.trim()

      return `export default ${JSON.stringify(`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`)}`
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
