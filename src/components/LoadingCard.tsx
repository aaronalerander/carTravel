export default function LoadingCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-4 animate-pulse">
      <div>
        <div className="h-5 bg-gray-200 rounded w-40 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-3/4 mt-1" />
      </div>
      <div className="flex items-start gap-3">
        <div className="h-6 w-6 bg-gray-200 rounded" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
          <div className="h-3 bg-gray-100 rounded w-48" />
        </div>
      </div>
      <div className="flex items-start gap-3">
        <div className="h-6 w-6 bg-gray-200 rounded" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-28 mb-1" />
          <div className="h-3 bg-gray-100 rounded w-40" />
        </div>
      </div>
      <div className="border-t border-gray-100 pt-3 flex justify-between">
        <div className="h-4 bg-gray-100 rounded w-24" />
        <div className="h-6 bg-gray-200 rounded w-20" />
      </div>
    </div>
  );
}
