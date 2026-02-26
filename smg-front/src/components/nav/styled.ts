import { css } from "@/styled-system/css";

export const root = css({
  display: "flex",
  justifyContent: "flex-start",
  gap: "2rem",
  overflowX: "auto",
  textWrap: "nowrap",
  fontWeight: "bold",
  scrollSnapType: "x mandatory",
  WebkitOverflowScrolling: "touch",
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(0, 0, 0, 0.3) transparent",
  paddingBottom: "0.5rem",

  "&::-webkit-scrollbar": {
    height: "2px",
  },
  "&::-webkit-scrollbar-track": {
    background: "transparent",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "rgba(0, 0, 0, 0.3)",
    borderRadius: "1px",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    background: "rgba(0, 0, 0, 0.5)",
  },

  // モバイル表示時の設定
  "@media (max-width: 768px)": {
    justifyContent: "flex-start",
    gap: "0.5rem",
    paddingX: "1rem",
    minWidth: "100%",
    width: "100%",
    position: "relative",
    zIndex: 5,
  },
});

export const item = css({
  display: "block",
  padding: "1rem 0.5rem",
  scrollSnapAlign: "start",
  position: "relative",
  flexShrink: 0,
  minWidth: "fit-content",
  whiteSpace: "nowrap",

  // モバイル表示時の設定
  "@media (max-width: 768px)": {
    padding: "1rem 1rem",
    minWidth: "auto",
    flex: "0 0 auto",
  },

  _hover: {
    bg: "rgba(0, 0, 0, 0.08)",
    boxSizing: "border-box",

    _before: {
      content: '""',
      position: "absolute",
      bottom: "0",
      left: "50%",
      transform: "translate(-50%, 0)",
      h: "2px",
      w: "70%",
      bg: "black",
    },
  },

  '[data-active="true"] &': {
    _before: {
      content: '""',
      position: "absolute",
      bottom: "0",
      left: "50%",
      transform: "translate(-50%, 0)",
      h: "2px",
      w: "70%",
      bg: "black",
    },
  },
});
