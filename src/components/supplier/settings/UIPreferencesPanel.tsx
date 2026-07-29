"use client";

import React from 'react';
import { useUIPreferences } from '@/store/useUIPreferences';

export function UIPreferencesPanel() {
  const dragScrollEnabled = useUIPreferences((state) => state.dragScrollEnabled);
  const setDragScrollEnabled = useUIPreferences((state) => state.setDragScrollEnabled);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-6">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">UI / UX Preferences</h2>
        <p className="text-sm text-gray-500 mt-1">Configure your dashboard interaction experience.</p>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Enable Drag Scroll Cursor</h3>
            <p className="text-xs text-gray-500 mt-1">
              Allow scrolling by clicking and dragging anywhere on the dashboard. 
              Useful for touch devices, but may interfere with text selection on desktop.
            </p>
          </div>
          <button
            onClick={() => setDragScrollEnabled(!dragScrollEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              dragScrollEnabled ? 'bg-rose' : 'bg-gray-200'
            }`}
          >
            <span className="sr-only">Toggle Drag Scroll</span>
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                dragScrollEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
