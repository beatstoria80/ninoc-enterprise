export default function InventoryLoading() {
  return (
    <div className="space-y-6 animate-pulse w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6 mb-6 mt-2">
        <div>
          <div className="h-8 w-64 bg-gray-200 rounded-md"></div>
          <div className="h-4 w-96 bg-gray-100 rounded-md mt-2"></div>
        </div>
        <div className="h-10 w-40 bg-gray-200 rounded-lg"></div>
      </div>

      <div className="bg-white border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4 justify-between">
          <div className="h-10 w-80 bg-gray-100 rounded-md"></div>
          <div className="h-10 w-24 bg-gray-100 rounded-md"></div>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 border-b border-gray-50 pb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-md"></div>
              <div className="space-y-2 flex-1">
                <div className="h-5 w-48 bg-gray-200 rounded-md"></div>
                <div className="h-4 w-24 bg-gray-100 rounded-md"></div>
              </div>
              <div className="h-8 w-24 bg-gray-200 rounded-md"></div>
              <div className="h-8 w-24 bg-gray-200 rounded-md"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
