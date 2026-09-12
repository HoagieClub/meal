import type { Config } from 'tailwindcss';

const config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  // Utilities must beat the classes Evergreen generates for its style props.
  important: true,
  theme: {
    extend: {
      colors: {
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        muted: {
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        'hoagiemeal-dark-green': '#008001',
        // The page background: one mint for every meal.
        'hoagiemeal-mint': '#daefe8',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
} satisfies Config;

export default config;
