import { css } from "@/styled-system/css";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { type UrgentCheckboxProps } from "./types";

export function UrgentCheckbox({ isUrgent, setIsUrgent }: UrgentCheckboxProps) {
  const checkboxContainerStyles = css({
    display: "flex",
    alignItems: "center",
    gap: "2",
    marginBottom: "4",
  });

  return (
    <div className={checkboxContainerStyles}>
      <Checkbox 
        id="urgent" 
        checked={isUrgent} 
        onChange={(e) => setIsUrgent(e.target.checked)}
        className={css({ 
          _checked: {
            bg: "blue.500",
            borderColor: "blue.500",
            color: "white"
          }
        })}
      />
      <Label htmlFor="urgent" className={css({ fontWeight: "medium" })}>
        緊急の相談である（できるだけ早く対応が必要）
      </Label>
    </div>
  );
} 