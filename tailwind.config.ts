import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: { colors: { bg: '#0a0a0f', surface: '#13131a', surface2: '#1c1c28', accent: '#7c5cfc', accent2: '#c084fc' } } },
  plugins: [],
}
export default config
