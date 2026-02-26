import { css } from "@/styled-system/css";
import { type SubmitButtonProps } from "./types";

export function SubmitButton({ isSubmitting, isBeforeStart, isAfterEnd, buttonText }: SubmitButtonProps) {
  const buttonStyles = css({
    display: "block",
    width: "100%",
    py: "3",
    px: "4",
    bg: "blue.600",
    color: "white",
    fontWeight: "semibold",
    borderRadius: "md",
    _hover: {
      bg: "blue.700",
    },
    _disabled: {
      bg: "gray.400",
      cursor: "not-allowed",
    },
  });

  return (
    <button 
      type="submit" 
      className={buttonStyles} 
      disabled={isSubmitting || isBeforeStart || isAfterEnd}
    >
      {isSubmitting 
        ? "送信中..." 
        : isBeforeStart 
          ? "申し込み開始前" 
          : isAfterEnd
            ? "申込終了"
            : buttonText || "申込を送信する"}
    </button>
  );
} 