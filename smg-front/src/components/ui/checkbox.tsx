import * as React from "react"
import { Check } from "lucide-react"
import { css } from "@/styled-system/css"
import { cva } from "@/styled-system/css"

const checkboxStyles = cva({
  base: {
    h: "4",
    w: "4",
    flexShrink: "0",
    appearance: "none",
    rounded: "sm",
    border: "1px solid",
    borderColor: "gray.300",
    bg: "white",
    ringOffset: "background",
    _focusVisible: {
      outline: "none",
      ring: "2",
      ringColor: "ring",
      ringOffset: "2"
    },
    _disabled: {
      cursor: "not-allowed",
      opacity: "0.5"
    },
    _checked: {
      bg: "blue.500",
      borderColor: "blue.500",
      color: "white"
    }
  }
})

const checkIconStyles = css({
  pointerEvents: "none",
  position: "absolute",
  left: "0",
  top: "0",
  h: "4",
  w: "4",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  opacity: "0",
  _peerChecked: {
    opacity: "100"
  }
})

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", checked, onChange, ...props }, ref) => {
    return (
      <div className={css({ position: "relative" })}>
        <input
          type="checkbox"
          ref={ref}
          className={checkboxStyles({ class: className })}
          checked={checked}
          onChange={onChange}
          {...props}
        />
        <div className={checkIconStyles}>
          <Check className={css({ h: "3", w: "3" })} />
        </div>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
