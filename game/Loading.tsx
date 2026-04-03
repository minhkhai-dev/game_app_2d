import React from 'react'

export default function Loading() {
  return (
    <div className="flex items-center justify-center p-8 min-h-screen bg-gray-950">
      <div 
        className="animate-spin rounded-full sm:h-20 sm:w-20 h-15 w-15 sm:border-10 border-8 border-gray-700 border-t-red-500"
        style={{
          animationDuration: '0.8s'
        }}
      />
    </div>
  );
}
