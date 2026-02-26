import * as React from "react"
import { css } from "@/styled-system/css"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
  className?: string
}

const selectStyles = css({
  display: "flex",
  h: "10",
  w: "full",
  alignItems: "center",
  justifyContent: "between",
  rounded: "md",
  border: "1px solid",
  borderColor: "#e5e5e5",
  bg: "background",
  px: "3",
  py: "2",
  textStyle: "sm",
  ringOffset: "background",
  _placeholder: {
    color: "muted.foreground"
  },
  _focus: {
    outline: "none",
    ring: "2",
    ringColor: "ring",
    ringOffset: "2"
  },
  _disabled: {
    cursor: "not-allowed",
    opacity: "0.5"
  }
})

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={selectStyles}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = "Select"

interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  children: React.ReactNode
  className?: string
}

const selectItemStyles = css({
  position: "relative",
  display: "flex",
  w: "full",
  cursor: "default",
  userSelect: "none",
  alignItems: "center",
  rounded: "sm",
  py: "1.5",
  pl: "8",
  pr: "2",
  textStyle: "sm",
  outline: "none",
  _focus: {
    bg: "accent",
    color: "accent.foreground"
  },
  _disabled: {
    pointerEvents: "none",
    opacity: "0.5"
  }
})

const SelectItem = React.forwardRef<HTMLOptionElement, SelectItemProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <option
        ref={ref}
        className={selectItemStyles}
        {...props}
      >
        {children}
      </option>
    )
  }
)
SelectItem.displayName = "SelectItem"

export { Select, SelectItem }