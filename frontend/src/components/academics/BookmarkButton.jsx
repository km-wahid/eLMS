import React, { useState } from 'react';
import { Heart } from 'lucide-react';

export default function BookmarkButton({ lectureId, materialId, isBookmarked, onBookmark, onRemove }) {
  const [loading, setLoading] = useState(false);
  const contentId = lectureId || materialId;

  const handleClick = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      if (isBookmarked) {
        await onRemove();
      } else {
        await onBookmark();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`p-2 rounded-lg transition-all ${
        isBookmarked
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } disabled:opacity-50`}
      title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      <Heart size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
    </button>
  );
}
