import * as React from "react"
import { cn } from "@/lib/utils"
export const Card=React.forwardRef(({className,...p},ref)=><div ref={ref} className={cn("rounded-lg border border-hairline bg-canvas",className)} {...p} />)
Card.displayName="Card"
export const CardHeader=React.forwardRef(({className,...p},ref)=><div ref={ref} className={cn("p-6 pb-3",className)} {...p} />)
CardHeader.displayName="CardHeader"
export const CardTitle=React.forwardRef(({className,...p},ref)=><h3 ref={ref} className={cn("font-display font-medium text-[16px] flex items-center gap-2",className)} {...p} />)
CardTitle.displayName="CardTitle"
export const CardDescription=React.forwardRef(({className,...p},ref)=><p ref={ref} className={cn("text-sm text-designBody",className)} {...p} />)
CardDescription.displayName="CardDescription"
export const CardContent=React.forwardRef(({className,...p},ref)=><div ref={ref} className={cn("p-6 pt-0",className)} {...p} />)
CardContent.displayName="CardContent"
