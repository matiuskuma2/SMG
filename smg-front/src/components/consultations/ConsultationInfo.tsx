import { css } from "@/styled-system/css";
import { type ConsultationInfoProps } from "./types";
import React from "react";

// URLを検出してリンクに変換する関数
const linkifyText = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={css({
            color: 'blue.600',
            textDecoration: 'underline',
            _hover: {
              color: 'blue.800',
            },
          })}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export function ConsultationInfo({ startDate, endDate, description }: ConsultationInfoProps) {
  const formGroupStyles = css({
    mb: "6",
  });

  const sectionTitleStyles = css({
    fontSize: "lg",
    fontWeight: "semibold",
    mb: "4",
    pb: "2",
    borderBottom: "1px solid",
    borderColor: "gray.200",
  });

  const listItemStyles = css({
    fontSize: "sm",
  });

  const listSpaceStyles = css({
    display: "flex",
    flexDirection: "column",
    gap: "4",
  });

  const labelStyles = css({
    display: "block",
    mb: "2",
    fontWeight: "medium",
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={formGroupStyles}>
      <h3 className={sectionTitleStyles}>個別相談について</h3>
      <div className={css({ 
        mb: "6", 
        lineHeight: "1.6",
        whiteSpace: "pre-line",
        fontSize: "sm"
      })}>
        {description ? linkifyText(description) : '詳細情報はありません'}
      </div>
      <div className={css({ mt: "4" })}>
        <h3 className={labelStyles}>申込期間</h3>
        <p className={css({ fontSize: "sm" })}>
          {formatDate(startDate)} 〜 {formatDate(endDate)}
        </p>
      </div>
    </div>
  );
} 