import { css } from "../../../styled-system/css";

type TextInputProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
};

export const TextInput = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
}: TextInputProps) => {
  return (
    <div className={css({ mb: "6" })}>
      <label className={css({
        display: "block",
        mb: "2",
        fontWeight: "medium",
        ...(required && { display: "flex", alignItems: "center" })
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
      <input
        type="text"
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
        })}
        placeholder={placeholder}
      />
    </div>
  );
}; 