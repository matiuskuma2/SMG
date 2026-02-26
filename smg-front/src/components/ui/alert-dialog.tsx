import * as React from "react"
import { css } from "@/styled-system/css"
import { styled } from "@/styled-system/jsx"

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

const AlertDialog = ({ open, onOpenChange, children }: AlertDialogProps) => {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className={css({
        position: "fixed",
        inset: 0,
        zIndex: 50,
        backgroundColor: "black/80",
        animation: "fade-in 0.2s ease-in-out"
      })}
      onClick={() => onOpenChange(false)}
    >
      {children}
    </div>
  )
}

const AlertDialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={css({
      position: "fixed",
      left: "50%",
      top: "50%",
      zIndex: 50,
      display: "grid",
      width: "100%",
      maxWidth: "32rem",
      transform: "translate(-50%, -50%)",
      gap: 4,
      borderWidth: 1,
      backgroundColor: "background",
      padding: 6,
      boxShadow: "lg",
      animation: "slide-in-from-left-1/2 slide-in-from-top-48 fade-in zoom-in-95 0.2s ease-in-out",
      "@media (min-width: 640px)": {
        borderRadius: "lg"
      }
    })}
    onClick={(e) => e.stopPropagation()}
    {...props}
  />
))
AlertDialogContent.displayName = "AlertDialogContent"

const AlertDialogHeader = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    textAlign: "center",
    "@media (min-width: 640px)": {
      textAlign: "left"
    }
  }
})

const AlertDialogFooter = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column-reverse",
    gap: 2,
    "@media (min-width: 640px)": {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 2
    }
  }
})

const AlertDialogTitle = styled("h2", {
  base: {
    fontSize: "lg",
    fontWeight: "semibold"
  }
})

const AlertDialogDescription = styled("p", {
  base: {
    fontSize: "sm",
    color: "muted.foreground"
  }
})

const AlertDialogAction = styled("button", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "md",
    fontSize: "sm",
    fontWeight: "medium",
    transition: "colors",
    height: 10,
    paddingX: 4,
    backgroundColor: "primary",
    color: "primary.foreground",
    "&:hover": {
      backgroundColor: "primary/90"
    }
  }
})

const AlertDialogCancel = styled("button", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "md",
    fontSize: "sm",
    fontWeight: "medium",
    transition: "colors",
    height: 10,
    paddingX: 4,
    borderWidth: 1,
    backgroundColor: "transparent",
    marginTop: 2,
    "@media (min-width: 640px)": {
      marginTop: 0
    }
  }
})

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
