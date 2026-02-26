import { css } from "@/styled-system/css";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type FirstTimeCheckboxProps = {
  isFirstTime: boolean;
  setIsFirstTime: (value: boolean) => void;
};

export function FirstTimeCheckbox({ isFirstTime, setIsFirstTime }: FirstTimeCheckboxProps) {
  const formGroupStyles = css({
    mb: "6",
  });

  const checkboxContainerStyles = css({
    display: "flex",
    alignItems: "center",
    gap: "2",
    "& input[type='checkbox']": {
      accentColor: "gray.500",
      "&:checked": {
        backgroundColor: "gray.500",
        borderColor: "gray.500",
      },
    },
  });

  return (
    <div className={formGroupStyles}>
      <div className={checkboxContainerStyles}>
        <Checkbox 
          id="firstTime" 
          checked={isFirstTime} 
          onChange={(e) => setIsFirstTime(e.target.checked)}
        />
        <Label htmlFor="firstTime" className={css({ fontWeight: "medium" })}>
          初めての方
        </Label>
      </div>
    </div>
  );
} 