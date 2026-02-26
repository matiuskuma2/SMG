import { css } from "../../../styled-system/css";

type Option = {
  value: string;
  label: string;
};

type RadioGroupProps = {
  label: string;
  name: string;
  options: Option[];
  selectedValue: string;
  onChange: (name: string, value: string) => void;
  required?: boolean;
};

export const RadioGroup = ({
  label,
  name,
  options,
  selectedValue,
  onChange,
  required = false,
}: RadioGroupProps) => {
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
      
      <div className={css({ display: "flex", flexDirection: "column", gap: "2" })}>
        {options.map((option) => (
          <label key={option.value} className={css({ display: "flex", alignItems: "center", cursor: "pointer" })}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selectedValue === option.value}
              onChange={() => onChange(name, option.value)}
              className={css({ mr: "2" })}
              required={required}
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}; 