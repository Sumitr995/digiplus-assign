import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"
const badgeVariants=cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",{
  variants:{ variant:{
    default:"border-transparent bg-primary text-onPrimary",
    secondary:"border-hairline bg-canvas text-ink",
    soft:"border-transparent bg-surfaceSoft text-ink",
    info:"bg-[#dbeafe] text-[#1e40af] border-transparent",
    low:"bg-[#e0f2fe] text-[#0369a1] border-transparent",
    medium:"bg-[#fef3c7] text-[#92400e] border-transparent",
    critical:"bg-[#fce7f3] text-[#9b1c3e] border-transparent",
    flagged:"bg-[#fecaca] text-[#991b1b] border-transparent",
    dark:"bg-surfaceDark text-onDark border-transparent",
  }},
  defaultVariants:{variant:"default"}
})
export function Badge({className,variant,...p}){ return <span className={cn(badgeVariants({variant}),className)} {...p} /> }
export {badgeVariants}
