import type { Config } from 'tailwindcss';
import tailwindAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class', '[data-color-scheme="dark"]'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Variable', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['13px', { lineHeight: '18px' }],
        'base': ['14px', { lineHeight: '20px' }],
        'md': ['15px', { lineHeight: '22px' }],
        'lg': ['18px', { lineHeight: '26px' }],
        'xl': ['22px', { lineHeight: '30px', letterSpacing: '-0.02em' }],
        '2xl': ['28px', { lineHeight: '36px', letterSpacing: '-0.02em' }],
        '3xl': ['36px', { lineHeight: '44px', letterSpacing: '-0.02em' }],
      },
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          hover: 'var(--bg-hover)',
          elevated: 'var(--bg-elevated)',
        },
        border: {
          default: 'var(--border-default)',
          hover: 'var(--border-hover)',
          active: 'var(--border-active)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          quaternary: 'var(--text-quaternary)',
        },
        accent: {
          blue: 'var(--accent-blue)',
          purple: 'var(--accent-purple)',
          green: 'var(--accent-green)',
          amber: 'var(--accent-amber)',
          red: 'var(--accent-red)',
        },
        glass: {
          bg: 'var(--glass-bg)',
          border: 'var(--glass-border)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-full)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        'ease-out-custom': 'var(--ease-out)',
        'ease-in-custom': 'var(--ease-in)',
        'ease-spring': 'var(--ease-spring)',
      },
      boxShadow: {
        'glass': '0 0 0 1px var(--glass-border), 0 1px 2px rgba(0,0,0,0.3)',
        'glass-hover': '0 0 0 1px var(--border-hover), 0 4px 12px rgba(0,0,0,0.4)',
        'glow-blue': '0 0 0 1px var(--accent-blue), 0 0 0 4px rgba(91,127,255,0.15)',
        'glow-red': '0 0 0 1px var(--accent-red), 0 0 0 4px rgba(239,68,68,0.15)',
      },
      spacing: {
        'sidebar': 'var(--sidebar-width)',
      },
    },
  },
  plugins: [tailwindAnimate],
};

export default config;
