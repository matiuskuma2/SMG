import { css } from "../../../styled-system/css";

type SubmitButtonProps = {
  label: string;
};

export const SubmitButton = ({ label }: SubmitButtonProps) => {
  return (
    <div className={css({ mt: "8", textAlign: "center" })}>
      <button
        type="submit"
        className={css({
          bg: "orange.400",
          color: "white",
          py: "3",
          px: "6",
          rounded: "md",
          fontWeight: "bold",
          w: "full",
          maxW: "400px",
          _hover: { bg: "orange.500" },
          transition: "all 0.2s",
        })}
      >
        {label}
      </button>
    </div>
  );
}; 