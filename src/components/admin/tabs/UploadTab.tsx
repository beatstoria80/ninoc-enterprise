import React from 'react';
import { motion } from 'framer-motion';
import { X, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function UploadTab({
  bulkFiles,
  bulkProductLink,
  setBulkProductLink,
  handleBulkFileSelect,
  handleBulkImageUpload,
  bulkUploading,
  bulkResults,
  allUploadHistory,
  setActiveTab
}: {
  bulkFiles: File[];
  bulkProductLink: string;
  setBulkProductLink: (v: string) => void;
  handleBulkFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBulkImageUpload: () => void;
  bulkUploading: boolean;
  bulkResults: { name: string; url: string; error?: string }[] | null;
  allUploadHistory: { name: string; url: string; error?: string; timestamp: number }[];
  setActiveTab: (t: string) => void;
}) {
  return (
    <motion.div
      key="bulk-upload"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Upload Images</h2>
          <span className="text-[9px] text-gray-400">— {bulkFiles.length > 0 ? `${bulkFiles.length} file${bulkFiles.length > 1 ? 's' : ''} selected` : 'batch upload'}</span>
        </div>
        <button
          onClick={() => setActiveTab('overview')}
          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
        >
          <X size={14} />
        </button>
      </div>

      {/* Product name link */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">
          Product Name (optional — auto-fills product form)
        </label>
        <input
          type="text"
          value={bulkProductLink}
          onChange={(e) => setBulkProductLink(e.target.value)}
          placeholder="e.g. Essential Oversized Tee — images will link to this product"
          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
        />
      </div>

      {/* Drop zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
          bulkFiles.length > 0 ? "border-rose/30 bg-rose/5" : "border-gray-200 hover:border-rose/30"
        )}
      >
        {bulkFiles.length > 0 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center max-h-40 overflow-y-auto">
              {bulkFiles.slice(0, 50).map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-gray-200 text-[10px] text-gray-600">
                  <span className="font-medium">{i + 1}.</span>
                  <span className="truncate max-w-[120px]">{f.name}</span>
                </div>
              ))}
              {bulkFiles.length > 50 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-[10px] text-gray-500 font-medium">
                  + {bulkFiles.length - 50} more
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-3 pt-4">
              <label className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded hover:bg-gray-50 cursor-pointer transition-colors">
                Change Selection
                <input type="file" multiple accept="image/*" onChange={handleBulkFileSelect} className="hidden" />
              </label>
              <button
                onClick={handleBulkImageUpload}
                disabled={bulkUploading}
                className="flex items-center gap-2 px-6 py-2 bg-rose text-white text-xs font-medium rounded hover:bg-rose/90 disabled:opacity-50 transition-colors"
              >
                {bulkUploading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
                ) : (
                  <><Upload size={16} /> Upload {bulkFiles.length} Image{bulkFiles.length > 1 ? 's' : ''}</>
                )}
              </button>
            </div>
          </div>
        ) : (
          <label className="cursor-pointer block">
            <Upload size={32} className="mx-auto text-gray-400 mb-4" />
            <span className="block text-sm font-medium text-gray-900 mb-1">Select Images to Upload</span>
            <span className="block text-[10px] uppercase tracking-wider text-gray-500">
              Drag & drop or click to select
            </span>
            <input type="file" multiple accept="image/*" onChange={handleBulkFileSelect} className="hidden" />
          </label>
        )}
      </div>

      {/* Upload Results (Current Batch) */}
      {bulkResults && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide mb-3">Upload Results</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {bulkResults.map((result, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-xs">
                <div className="flex items-center gap-3">
                  {result.error ? <AlertCircle size={14} className="text-red-500" /> : <CheckCircle2 size={14} className="text-emerald-500" />}
                  <span className="font-medium text-gray-700">{result.name}</span>
                </div>
                {result.error ? (
                  <span className="text-red-500">{result.error}</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-medium truncate max-w-[200px]">{result.url}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(result.url);
                        alert('URL Copied!');
                      }}
                      className="px-2 py-1 bg-white border border-gray-200 rounded text-[9px] uppercase tracking-wider text-gray-600 hover:bg-gray-50"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload History */}
      {allUploadHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Upload History</h3>
            <span className="text-[9px] text-gray-400">{allUploadHistory.length} files total</span>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="pb-2 font-medium w-1/4">File Name</th>
                  <th className="pb-2 font-medium w-1/6">Status</th>
                  <th className="pb-2 font-medium w-1/4">Time</th>
                  <th className="pb-2 font-medium w-1/3">Image URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...allUploadHistory].reverse().map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-2 pr-4 font-medium text-gray-700 truncate max-w-[150px]">{item.name}</td>
                    <td className="py-2 pr-4">
                      {item.error ? (
                        <span className="text-red-500 flex items-center gap-1"><AlertCircle size={10} /> Error</span>
                      ) : (
                        <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={10} /> Success</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-gray-500">
                      {new Date(item.timestamp).toLocaleString('id-ID', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="py-2">
                      {item.error ? (
                        <span className="text-red-500 truncate block max-w-[200px]" title={item.error}>{item.error}</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="relative w-6 h-6 rounded overflow-hidden bg-gray-100 shrink-0">
                            <Image src={item.url} alt="" fill className="object-cover" />
                          </div>
                          <span className="text-emerald-600 truncate block max-w-[150px]" title={item.url}>{item.url}</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(item.url);
                              alert('URL Copied!');
                            }}
                            className="shrink-0 text-rose hover:underline"
                          >
                            Copy
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
