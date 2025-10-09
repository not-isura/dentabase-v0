import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm flex items-start gap-3",
  {
    variants: {
      variant: {
        default: "bg-blue-50 border-blue-200 text-blue-800",
        info: "bg-blue-50 border-blue-200 text-blue-800",
        success: "bg-green-50 border-green-200 text-green-800",
        warning: "bg-amber-50 border-amber-200 text-amber-800",
        error: "bg-red-50 border-red-200 text-red-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const iconVariants = cva("h-5 w-5 flex-shrink-0", {
  variants: {
    variant: {
      default: "text-blue-600",
      info: "text-blue-600",
      success: "text-green-600",
      warning: "text-amber-600",
      error: "text-red-600",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: React.ReactNode
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, icon, children, ...props }, ref) => {
    // Default icon components based on variant
    const DefaultIcon = {
      default: Info,
      info: Info,
      success: CheckCircle2,
      warning: AlertTriangle,
      error: XCircle,
    }[variant || 'default']

    const IconComponent = icon !== undefined ? icon : <DefaultIcon className={iconVariants({ variant })} />

    return (
      <div
        ref={ref}
        role="alert"
        className={alertVariants({ variant, className })}
        {...props}
      >
        {IconComponent}
        <div className="flex-1">{children}</div>
      </div>
    )
  }
)
Alert.displayName = "Alert"

export { Alert, alertVariants }
