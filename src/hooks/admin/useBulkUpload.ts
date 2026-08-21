import { useState } from 'react';
import { compressImage } from '@/lib/utils/imageUtils';

export type BulkUploadResult = { name: string; url: string; error?: string };
export type BulkUploadHistoryItem = BulkUploadResult & { timestamp: number };

export function useBulkUpload(
  setActiveTab: (tab: string) => void,
  setProductFormImage: (url: string) => void,
  setProductFormNameSlug: (name: string) => void
) {
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkUploadResult[] | null>(null);
  const [bulkProductLink, setBulkProductLink] = useState(''); // product name to link images to
  const [allUploadHistory, setAllUploadHistory] = useState<BulkUploadHistoryItem[]>([]);

  const handleBulkImageUpload = async () => {
    if (bulkFiles.length === 0) return;

    // Validate file sizes (max 10MB per file)
    const maxSize = 10 * 1024 * 1024;
    const oversizedFiles = bulkFiles.filter(f => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      alert(`File too large: ${oversizedFiles.map(f => f.name).join(', ')}\nMax size: 10MB per file`);
      return;
    }

    setBulkUploading(true);
    setBulkResults(null);

    try {
      const formData = new FormData();
      for (const file of bulkFiles) {
        const compressedFile = await compressImage(file);
        formData.append('files', compressedFile);
      }
      formData.append('bucket', 'products');

      const res = await fetch('/api/admin/upload-images', {
        method: 'POST',
        body: formData
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        alert('Server error: ' + text.slice(0, 200));
        return;
      }

      if (!res.ok || data.error) {
        alert('Upload failed: ' + (data.error || `HTTP ${res.status}`));
        return;
      }

      // Save to history (accumulate all uploads)
      const newResults = (data.results as BulkUploadResult[]).map(r => ({
        ...r,
        timestamp: Date.now()
      }));
      setAllUploadHistory(prev => [...prev, ...newResults]);
      setBulkResults(data.results as BulkUploadResult[]);

      // Show summary
      if (data.summary) {
        const { uploaded } = data.summary;
        const total = data.results?.length || 0;
        if (uploaded === 0) {
          alert('Upload failed: All files failed.');
        } else if (uploaded < total) {
          alert(`Partially succeeded: ${uploaded}/${total} files uploaded.`);
        } else {
          alert(`Success: ${uploaded} files uploaded!`);
        }
      }

      // Update product with first successful image
      const firstSuccess = data.results?.find((r: BulkUploadResult) => r.url);
      if (firstSuccess) {
        setProductFormImage(firstSuccess.url);
        if (bulkProductLink.trim()) {
          setProductFormNameSlug(bulkProductLink.trim());
        }
        setActiveTab('products');
      }
    } catch (err) {
      alert('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setBulkUploading(false);
    }
  };

  const openBulkUpload = () => {
    setBulkFiles([]);
    setBulkResults(null);
    setBulkProductLink('');
    setActiveTab('upload');
  };

  const handleBulkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 1000) {
      alert('Maximum 1000 files per batch. Please split your selection.');
      setBulkFiles(selected.slice(0, 1000));
    } else {
      setBulkFiles(selected);
    }
  };

  return {
    bulkFiles,
    setBulkFiles,
    bulkUploading,
    bulkResults,
    bulkProductLink,
    setBulkProductLink,
    allUploadHistory,
    handleBulkImageUpload,
    openBulkUpload,
    handleBulkFileSelect
  };
}
