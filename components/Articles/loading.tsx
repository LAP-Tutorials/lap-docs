import { Skeleton } from "../ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-[95rem] w-full mx-auto py-8 lg:pt-24 lg:pb-48">
      {/* Categories Filter Skeleton */}
      <div className="flex justify-end gap-4 mb-6">
        {[...Array(4)].map((_, index) => (
          <Skeleton key={index} className="bg-[#a1a1a1] h-10 w-20 rounded-md" />
        ))}
      </div>

      {/* Grid layout for the post cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, index) => (
          <div key={index} className="bg-[#a1a1a1] p-6 flex flex-col gap-4">
            {/* Date & Category */}
            <div className="flex justify-between items-center">
              <Skeleton className="bg-[#a1a1a1] h-4 w-28 rounded-md" />
              <Skeleton className="bg-[#a1a1a1] h-6 w-12 rounded-md" />
            </div>

            {/* Image Skeleton */}
            <Skeleton className="w-full h-60 bg-[#a1a1a1] rounded-md" />

            {/* Title */}
            <Skeleton className="h-6 w-3/4 bg-[#a1a1a1] rounded-md" />

            {/* Description */}
            <Skeleton className="h-4 w-full bg-[#a1a1a1] rounded-md" />
            <Skeleton className="h-4 w-5/6 bg-[#a1a1a1] rounded-md" />
            <Skeleton className="h-4 w-4/5 bg-[#a1a1a1] rounded-md" />

            {/* Author & Duration */}
            <div className="flex justify-between items-center mt-4">
              <div className="flex gap-2">
                <Skeleton className="bg-[#a1a1a1] h-4 w-16 rounded-md" />
                <Skeleton className="bg-[#a1a1a1] h-4 w-20 rounded-md" />
              </div>
              <Skeleton className="bg-[#a1a1a1] h-4 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
