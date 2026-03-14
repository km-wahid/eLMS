import React from 'react';
import { MessageCircle, ThumbsUp, Pin, CheckCircle } from 'lucide-react';

export default function CommentItem({ comment, isTeacher, onReply, onUpvote, onPin, onResolve, onDelete }) {
  const { id, user_name, user_avatar, content, upvotes, pinned, is_resolved, replies, reply_count, created_at } = comment;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`border-l-4 pl-4 mb-4 ${is_resolved ? 'border-green-500 bg-green-50' : pinned ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300'} p-4 rounded-lg`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          {user_avatar && (
            <img
              src={user_avatar}
              alt={user_name}
              className="w-8 h-8 rounded-full"
            />
          )}
          <div>
            <p className="font-semibold text-gray-900">{user_name}</p>
            <p className="text-xs text-gray-500">{formatDate(created_at)}</p>
          </div>
        </div>
        {pinned && <Pin size={16} className="text-yellow-600" />}
        {is_resolved && <CheckCircle size={16} className="text-green-600" />}
      </div>

      {/* Content */}
      <p className="text-gray-700 mb-3">{content}</p>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={() => onUpvote(id)}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <ThumbsUp size={16} />
          {upvotes > 0 && <span>{upvotes}</span>}
        </button>

        <button
          onClick={() => onReply(id)}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <MessageCircle size={16} />
          Reply {reply_count > 0 && <span>({reply_count})</span>}
        </button>

        {isTeacher && (
          <>
            <button
              onClick={() => onPin(id)}
              className={`flex items-center gap-1 text-sm transition-colors ${
                pinned ? 'text-yellow-600' : 'text-gray-600 hover:text-yellow-600'
              }`}
            >
              <Pin size={16} />
              {pinned ? 'Pinned' : 'Pin'}
            </button>

            <button
              onClick={() => onResolve(id)}
              className={`flex items-center gap-1 text-sm transition-colors ${
                is_resolved ? 'text-green-600' : 'text-gray-600 hover:text-green-600'
              }`}
            >
              <CheckCircle size={16} />
              {is_resolved ? 'Resolved' : 'Resolve'}
            </button>
          </>
        )}

        <button
          onClick={() => onDelete(id)}
          className="ml-auto text-sm text-red-600 hover:text-red-700 transition-colors"
        >
          Delete
        </button>
      </div>

      {/* Replies */}
      {replies && replies.length > 0 && (
        <div className="mt-4 ml-4 border-l-2 border-gray-200 pl-4 space-y-3">
          {replies.map((reply) => (
            <div key={reply.id} className="text-sm">
              <p className="font-semibold text-gray-900">{reply.user_name}</p>
              <p className="text-gray-600 text-xs mb-1">{formatDate(reply.created_at)}</p>
              <p className="text-gray-700">{reply.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
