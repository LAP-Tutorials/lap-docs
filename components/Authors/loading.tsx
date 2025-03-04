import { Skeleton } from "../ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-[95rem] w-full mx-auto py-8 lg:pt-24 lg:pb-48">
      {/* Grid layout to match the provided image */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-[#a1a1a1] p-6 flex items-center gap-6">
            {/* Circular Profile Image Skeleton */}
            <Skeleton className="w-24 h-34 rounded-full bg-[#a1a1a1]" />
            <div className="flex flex-col flex-1">
              <Skeleton className="h-6 w-40 bg-[#a1a1a1] mb-2" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-16 bg-[#a1a1a1]" />
                <Skeleton className="h-4 w-24 bg-[#a1a1a1]" />
              </div>
              <div className="flex gap-4 mt-2">
                <Skeleton className="h-4 w-16 bg-[#a1a1a1]" />
                <Skeleton className="h-4 w-24 bg-[#a1a1a1]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
