import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  globalCss: {
    extend: {
      body: {
        height: "100vh",
      },
      "button[type='button']": {
        cursor: "pointer",
      },
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
        '2xs': "380px",
        xs: "480px",
        xl: "1200px",
      },
      tokens: {
        colors: {
          primary: { value: "#9e7631" },
          "bg-black": { value: "#242323" },
          "bg-gray": { value: "#cecece" },
        },
        fonts: {
          notosansjp: { value: "Noto Sans JP" },
        },
        shadows: {
          primary: { value: "3px 4px 3px 0px rgba(0, 0, 0, 0.3)" },
        },
        // SEE: https://github.com/chakra-ui/chakra-ui/tree/main/packages/react/src/theme
        zIndex: {
          overlay: { value: 1300 },
          modal: { value: 1400 },
        },
      },
    },
  },

  // The output directory for your css system
  outdir: "styled-system",
});
