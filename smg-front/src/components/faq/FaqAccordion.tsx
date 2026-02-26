import { EditButton } from "@/components/ui/EditButton";
import { useIsInstructor } from "@/hooks/useIsInstructor";
import { DASHBOARD_URL } from "@/const";
import type { FaqItem } from "@/lib/api/faq";
import { css } from "@/styled-system/css";
import { useEffect, useRef, useState } from "react";
import { FaArrowDown, FaArrowUp } from "react-icons/fa6";

export interface FaqAccordionProps {
  faq: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}

const FaqAccordion: React.FC<FaqAccordionProps> = ({
  faq,
  isOpen,
  onToggle,
}) => {
  const [height, setHeight] = useState("0px");
  const contentRef = useRef<HTMLDivElement>(null);
  const { isInstructor, loading: isInstructorLoading } = useIsInstructor();

  const handleEdit = () => {
    window.open(`${DASHBOARD_URL}/faq/${faq.id}`, '_blank');
  };

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? `${contentRef.current.scrollHeight}px` : "0px");
    }
  }, [isOpen]);

  return (
    <div
      className={css({
        border: "1px solid",
        borderColor: "gray.200",
        borderRadius: "lg",
        marginBottom: "1rem",
        overflow: "hidden",
        backgroundColor: "white",
      })}
    >
      {/* ヘッダー部分 */}
      <button
        type="button"
        onClick={onToggle}
        className={css({
          width: "100%",
          padding: "1rem",
          textAlign: "left",
          backgroundColor: isOpen ? "blue.50" : "white",
          borderBottom: isOpen ? "1px solid" : "none",
          borderBottomColor: "gray.200",
          cursor: "pointer",
          transition: "all 0.2s",
          "&:hover": {
            backgroundColor: "gray.50",
          },
        })}
      >
        <div
          className={css({
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          })}
        >
          <div className={css({ flex: "1", minWidth: "0" })}>
            <h3
              className={css({
                fontSize: "lg",
                fontWeight: "semibold",
                color: "gray.900",
                wordBreak: "break-word",
              })}
            >
              {faq.title}
            </h3>
          </div>
          <div className={css({ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "1rem" })}>
            {!isInstructorLoading && isInstructor && (
              <span onClick={(e) => e.stopPropagation()}>
                <EditButton
                  onClick={handleEdit}
                  className={css({
                    position: "static",
                    top: "unset",
                    right: "unset",
                    px: "3",
                    py: "1",
                    fontSize: "xs",
                  })}
                />
              </span>
            )}
            <div
              className={css({
                color: "gray.400",
                transition: "transform 0.2s",
                transform: isOpen ? "rotate(0deg)" : "rotate(0deg)",
              })}
            >
              {isOpen ? <FaArrowUp size={16} /> : <FaArrowDown size={16} />}
            </div>
          </div>
        </div>
      </button>

      {/* コンテンツ部分 */}
      <div
        ref={contentRef}
        className={css({
          overflow: "hidden",
          transition: "height 0.3s ease-in-out",
        })}
        style={{ height }}
      >
        <div
          className={css({
            padding: "1rem",
          })}
        >
          <div
            className={css({
              color: "gray.700",
              lineHeight: "1.6",
              whiteSpace: "pre-wrap",
            })}
          >
            {faq.description}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaqAccordion;
