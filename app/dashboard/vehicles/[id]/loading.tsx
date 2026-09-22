import { Skeleton } from "@/components/ui/skeleton";

export default function VehicleDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
