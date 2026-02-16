import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        
        <Skeleton className="h-[500px] w-full rounded-xl shadow-sm" />
    </div>
  );
}
