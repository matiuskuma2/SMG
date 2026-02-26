import { css } from "@/styled-system/css";

export function OfflineConsultationHeader() {
  const headerStyles = css({
    bg: "blue.900",
    color: "white",
    p: "4",
  });

  const headerTitleStyles = css({
    fontSize: "xl",
    fontWeight: "bold",
    textAlign: "center",
  });

  return (
    <div className={headerStyles}>
      <h1 className={headerTitleStyles}>個別相談のご案内</h1>
    </div>
  );
} 