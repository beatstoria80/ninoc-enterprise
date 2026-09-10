export default function LedgerLoading() {
  return (
    <div className="space-y-8 animate-pulse w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="h-8 w-64 bg-gray-200 rounded-md"></div>
          <div className="h-4 w-48 bg-gray-100 rounded-md mt-2"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-100 p-6 h-40 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gray-100"></div>
              <div className="h-4 w-32 bg-gray-100 rounded-md"></div>
            </div>
            <div className="h-8 w-40 bg-gray-200 rounded-md mt-2"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white border border-gray-100 overflow-hidden h-96 flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between">
              <div className="h-6 w-40 bg-gray-200 rounded-md"></div>
              <div className="h-6 w-16 bg-gray-100 rounded-md"></div>
            </div>
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 rounded-md"></div>
                      <div className="h-3 w-20 bg-gray-100 rounded-md"></div>
                    </div>
                  </div>
                  <div className="h-4 w-24 bg-gray-200 rounded-md"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
