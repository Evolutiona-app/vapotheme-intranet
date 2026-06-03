import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        vt: {
          violet: '#6964FC',
          blue: '#0F68F8',
          'violet-dark': '#5249CC',
          'violet-50': '#E9E8FE',
          ink: '#201516',
        }
      }
    }
  },
  plugins: [],
}
export default config
