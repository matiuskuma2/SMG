import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  globalCss: {
    extend: {
      body: {
        height: "100vh",
        fontSize: '16px',
        position: "relative",
        fontFamily:
          "EmojiFontFamily,-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Oxygen','Ubuntu','Fira Sans','Droid Sans','Helvetica Neue',sans-serif",
      },
      "button[type='button']": {
        cursor: "pointer",
      }
    },
  },

  // Where to look for your css declarations
  include: ["./src/**/*.{js,jsx,ts,tsx}"],

  jsxFramework: "react",

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {
      breakpoints: {
        xl: '1200px',
      }
    },
  },

  // The output directory for your css system
  outdir: "styled-system",

  
});
