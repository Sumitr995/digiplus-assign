import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"
const buttonVariants = cva("inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focusRing disabled:opacity-50 active:scale-[0.98]",{
  variants:{
    variant:{
      primary:"bg-primary text-onPrimary hover:bg-inkDeep rounded-full h-9 px-5",
      secondary:"bg-canvas text-ink border border-hairlineStrong hover:bg-surfaceSoft rounded-full h-9 px-5",
      ghost:"hover:bg-surfaceSoft rounded-full h-9 px-4",
      soft:"bg-surfaceSoft text-ink hover:bg-hairline rounded-full h-9 px-4",
    },
    size:{ default:"h-9", sm:"h-8 px-3", lg:"h-10 px-6", icon:"h-9 w-9" }
  },
  defaultVariants:{ variant:"primary", size:"default"}
})
const Button=React.forwardRef(({className,variant,size,...props},ref)=><button ref={ref} className={cn(buttonVariants({variant,size,className}))} {...props} />)
Button.displayName="Button"
export {Button,buttonVariants}
