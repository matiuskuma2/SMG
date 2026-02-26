import { css } from "@/styled-system/css";
import { Label } from "@/components/ui/label";
import { type RemarksFieldProps } from "./types";

export function RemarksField({ remarks, setRemarks }: RemarksFieldProps) {
  const formGroupStyles = css({
    mb: "6",
  });

  const labelStyles = css({
    display: "block",
    mb: "2",
    fontWeight: "medium",
  });

  const textareaStyles = css({
    width: "full",
    height: "32",
    px: "3",
    py: "2",
    border: "1px solid",
    borderColor: "gray.300",
    borderRadius: "md",
    _focus: {
      outline: "none",
      ring: "2",
      ringColor: "blue.500",
    },
  });

  return (
    <div className={formGroupStyles}>
      <Label htmlFor="remarks" className={labelStyles}>
        備考欄（ご希望の具体的な時間帯や相談内容の概要などをご記入ください）
      </Label>
      <textarea
        id="remarks"
        className={textareaStyles}
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        placeholder="選択した日程の中で、ご希望の具体的な時間帯や相談したい内容について簡単にお書きください"
      />
    </div>
  );
} 