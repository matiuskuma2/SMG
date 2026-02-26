import { Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { css } from "../../../styled-system/css";
import '../ui/EventCard.css'; // CSSファイルをインポート
import type { EventCardProps } from "@/types/event";

const EventCard: React.FC<EventCardProps> = ({
  event_id,
  event_name,
  event_start_datetime,
  event_end_datetime,
  event_location,
  event_city,
  event_description,
  event_capacity,
  event_type,
  image_url,
  has_consultation,
  has_gather,
  consultation_capacity,
  gather_capacity,
  gather_price,
  participants_count,
}) => {
  const router = useRouter();

  // 正規化されたタイプ名をCSSクラス名に使用
  const getNormalizedTypeName = (type: string): string => {
    const cleanType = type.trim();
    return ['定例会', 'PDCA実践会議', '5大都市グループ相談会&交流会', '簿記講座', 'オンラインセミナー', '特別セミナー'].includes(cleanType)
      ? cleanType
      : 'default';
  };

  const typeClassName = `eventType eventType-${getNormalizedTypeName(event_type)}`;

  const handleClick = () => {
    router.push(`/events/${event_id}`);
  };

  // 日付と時間のフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // イベントの詳細情報を配列に変換
  const eventDetails = [
    event_description,
    event_city ? `開催地: ${event_city}` : null,
    `定員: ${event_capacity}名 / 参加人数: ${participants_count ?? 0}名`,
    has_consultation ? `相談会定員: ${consultation_capacity}名` : null,
    has_gather ? `交流会定員: ${gather_capacity}名` : null,
    has_gather && gather_price ? `交流会参加費: ${gather_price}円` : null,
  ].filter(Boolean) as string[];

  return (
    <div
      className={css({
        bg: "white",
        p: "6",
        rounded: "sm",
        shadow: "sm",
        mb: "4",
        overflow: "hidden",
        margin: "0 auto",
        cursor: "pointer",
        _hover: {
          shadow: "md",
        },
      })}
      onClick={handleClick}
    >
      <div
        className={css({
          display: "grid",
          gridTemplateColumns: { base: "1fr", md: "1.5fr 2fr 1fr" },
          gap: "4",
          alignItems: "center",
        })}
      >
        {/* 左側：画像 */}
        <div
          className={css({
            w: "full",
            h: { base: "180px", md: "200px" },
            bg: "white",
            rounded: "md",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          {image_url ? (
            <img
              src={image_url}
              alt={event_name}
              className={css({
                w: "100%",
                h: "100%",
                objectFit: "contain",
                objectPosition: "center",
              })}
            />
          ) : (
            <div
              className={css({
                w: "full",
                h: { base: "180px", md: "200px" },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "gray.400",
                bg: "gray.100",
                rounded: "md",
              })}
            >
              <Calendar size={48} />
            </div>
          )}
        </div>

        {/* 中央：タイトルと詳細 */}
        <div
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: "2",
            textAlign: { base: "center", md: "left" },
          })}
        >
          <div
            className={css({
              display: "flex",
              alignItems: "center",
              gap: "2",
              justifyContent: { base: "center", md: "flex-start" },
            })}
          >
            <span className={typeClassName}>
              {event_type}
            </span>
          </div>
          <h3
            className={css({
              fontWeight: "bold",
              fontSize: { base: "lg", md: "xl" },
            })}
          >
            {event_name}
          </h3>
          <div
            className={css({
              fontSize: "sm",
              color: "gray.600",
            })}
          >
            <div className={css({ mb: "1" })}>会場: {event_location}</div>
            {eventDetails.map((detail: string, index: number) => (
              <div key={index}>
                {index === 0 ? (
                  <span className={css({ fontWeight: "900", color: "black" })}>{detail}</span>
                ) : (
                  detail
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 右側：日付と申し込みボタン */}
        <div
          className={css({
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3",
            mt: { base: "2", md: "0" },
          })}
        >
          <div
            className={css({
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1",
              fontSize: "lg",
              fontWeight: "bold",
              p: "3",
              rounded: "md",
              w: "full",
            })}
          >
            <div
              className={css({
                display: "flex",
                alignItems: "center",
                gap: "2",
              })}
            >
              <Calendar size={20} />
              <span>開催日時</span>
            </div>
            <span
              className={css({
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1",
                mt: "1",
              })}
            >
              <span
                className={css({
                  fontSize: "xl",
                  fontWeight: "bold",
                })}
              >
                {formatDate(event_start_datetime)}
              </span>
              <span
                className={css({
                  fontSize: "md",
                  fontWeight: "medium",
                })}
              >
                {formatTime(event_start_datetime)} - {formatTime(event_end_datetime)}
              </span>
            </span>
          </div>
          <div
            className={css({
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2",
              w: { base: "full", md: "auto" },
            })}
          >
            <button
              className={css({
                bg: "blue.500",
                color: "white",
                rounded: "md",
                fontSize: "sm",
                px: "4",
                py: "2",
                w: { base: "full", md: "auto" },
                cursor: "pointer",
                _hover: {
                  bg: "blue.600",
                },
              })}
            >
              申し込む
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
