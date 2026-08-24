import * as React from "react"
import { cn } from "@/lib/utils"
export const Table=React.forwardRef(({className,...p},ref)=><div className="rounded-lg border border-hairline overflow-hidden"><table ref={ref} className={cn("w-full",className)} {...p} /></div>)
Table.displayName="Table"
export const TableHeader=({className,...p})=><thead className={cn("bg-surfaceSoft",className)} {...p} />
export const TableHead=({className,...p})=><th className={cn("px-4 py-3 text-left text-xs font-medium text-mute uppercase tracking-wide",className)} {...p} />
export const TableBody=({className,...p})=><tbody className={cn("divide-y divide-hairline bg-canvas",className)} {...p} />
export const TableRow=React.forwardRef(({className,...p},ref)=><tr ref={ref} className={cn("hover:bg-surfaceSoft transition-colors",className)} {...p} />)
TableRow.displayName="TableRow"
export const TableCell=({className,...p})=><td className={cn("px-4 py-3 text-sm",className)} {...p} />
