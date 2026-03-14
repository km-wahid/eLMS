import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useBookmarkStore } from '../store/bookmarkStore';
import Layout from '../components/layout/Layout';

export default function BookmarksPage() {
  const { isAuthenticated } = useAuthStore();
  const { bookmarks, loading, fetchBookmarks, removeBookmark } = useBookmarkStore();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookmarks();
    }
  }, [isAuthenticated]);

  const lectureBookmarks = bookmarks?.filter((b) => b.lecture) || [];
  const materialBookmarks = bookmarks?.filter((b) => b.material) || [];
  const displayBookmarks = filter === 'lectures' ? lectureBookmarks : filter === 'materials' ? materialBookmarks : bookmarks;

  const handleRemove = async (bookmarkId) => {
    if (window.confirm('Remove this bookmark?')) {
      await removeBookmark(bookmarkId);
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Please log in to view bookmarks</h2>
            <p className="text-gray-600">You need to be signed in to save and manage bookmarks.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Bookmarks</h1>
            <p className="text-gray-600">Manage your saved lectures and materials</p>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-8">
            {['All', 'Lectures', 'Materials'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab.toLowerCase())}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filter === tab.toLowerCase()
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab} {tab === 'All' && `(${bookmarks?.length || 0})`}
                {tab === 'Lectures' && `(${lectureBookmarks.length})`}
                {tab === 'Materials' && `(${materialBookmarks.length})`}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {/* Bookmarks List */}
          {!loading && displayBookmarks?.length > 0 ? (
            <div className="space-y-3">
              {displayBookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {bookmark.lecture_title || bookmark.material_title}
                    </p>
                    <p className="text-sm text-gray-500">
                      Saved {new Date(bookmark.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-indigo-600 mt-1">
                      {bookmark.content_type === 'lecture' ? '🎥 Lecture' : '📄 Material'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(bookmark.id)}
                    className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-500 text-lg">
                  {filter === 'all'
                    ? 'No bookmarks yet. Start saving your favorite lectures and materials!'
                    : `No ${filter} bookmarks yet.`}
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </Layout>
  );
}
