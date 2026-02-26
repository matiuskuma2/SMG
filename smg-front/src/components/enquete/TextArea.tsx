import { css } from "../../../styled-system/css";

type TextAreaProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
};

export const TextArea = ({
  label,
  name,
  value,
  onChange,
  required = false,
}: TextAreaProps) => {
  return (
    <div className={css({ mb: "6" })}>
      <label className={css({
        mb: "2",
        fontWeight: "medium",
        display: "flex",
        alignItems: "center"
      })}>
        {label}
        {required && (
          <span className={css({
            ml: "2",
            px: "1.5",
            py: "0.5",
            bg: "red.500",
            color: "white",
            fontSize: "xs",
            rounded: "sm"
          })}>必須</span>
        )}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={css({
          w: "full",
          p: "2",
          border: "1px solid",
          borderColor: "gray.300",
          rounded: "md",
          minH: "100px",
        })}
      />
    </div>
  );
}; 