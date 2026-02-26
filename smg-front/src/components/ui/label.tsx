import * as React from "react"
import { css } from "@/styled-system/css"

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string
}

const labelStyles = css({
  textStyle: "sm",
  fontWeight: "medium",
  lineHeight: "none",
  _peerDisabled: {
    cursor: "not-allowed",
    opacity: "0.7"
  }
})

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={labelStyles}
        {...props}
      />
    )
  }
)
Label.displayName = "Label"

export { Label }
