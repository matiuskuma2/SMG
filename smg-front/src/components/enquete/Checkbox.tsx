import { css } from "../../../styled-system/css";

type CheckboxProps = {
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const Checkbox = ({
  label,
  name,
  checked,
  onChange,
}: CheckboxProps) => {
  return (
    <div className={css({ mb: "6" })}>
      <label className={css({
        display: "flex",
        alignItems: "center",
        gap: "2",
        cursor: "pointer"
      })}>
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          className={css({
            w: "4",
            h: "4",
            borderColor: "gray.300",
            rounded: "sm"
          })}
        />
        <span className={css({ fontWeight: "medium" })}>{label}</span>
      </label>
    </div>
  );
}; 