import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/', // <-- Fixed for Vercel deployment
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // manualChunks: (id) => {
        //   if (id.includes('/src/components/ui/')) return 'ui';
        //   if (id.includes('/src/integrations/supabase/')) return 'supabase';
        //   if (id.includes('/src/pages/')) return 'pages';
        //   if (id.includes('/src/lib/') || id.includes('/src/hooks/')) return 'utils';
        //   if (id.includes('node_modules')) {
        //     // React and React-related libraries - must be loaded first
        //     if (
        //       id.includes('react') ||
        //       id.includes('react-dom') ||
        //       id.includes('react-router-dom') ||
        //       id.includes('@tanstack/react-query') ||
        //       id.includes('react-hook-form') ||
        //       id.includes('react-resizable-panels') ||
        //       id.includes('react-day-picker')
        //     ) {
        //       return 'react-vendor';
        //     }
        //     // Supabase and database libraries
        //     if (id.includes('@supabase/supabase-js')) {
        //       return 'supabase-vendor';
        //     }
        //     // Other utility libraries
        //     if (
        //       id.includes('@hookform/resolvers') ||
        //       id.includes('zod') ||
        //       id.includes('serve')
        //     ) {
        //       return 'utils-vendor';
        //     }
        //     // UI/Design libraries - depends on React, so separate chunk
        //     if (
        //       id.includes('@radix-ui') ||
        //       id.includes('lucide-react') ||
        //       id.includes('class-variance-authority') ||
        //       id.includes('clsx') ||
        //       id.includes('cmdk') ||
        //       id.includes('date-fns') ||
        //       id.includes('embla-carousel-react') ||
        //       id.includes('input-otp') ||
        //       id.includes('next-themes') ||
        //       id.includes('recharts') ||
        //       id.includes('sonner') ||
        //       id.includes('tailwind-merge') ||
        //       id.includes('tailwindcss-animate') ||
        //       id.includes('vaul')
        //     ) {
        //       return 'ui-vendor';
        //     }
        //     // Fallback for any remaining node_modules
        //     return 'vendor';
        //   }
        // },
      },
    },
  },
}));
