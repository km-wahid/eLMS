import React, { useEffect, useState } from 'react';
import { Bookmark, MessageCircle, Send, ThumbsUp } from 'lucide-react';
import toast from 'react-hot-toast';
import bookmarkService from '../../services/bookmarkService';
import commentService from '../../services/commentService';

export default function ContentDiscussion({ contentId }) {
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState('');

  const load = async () => {
    if (!contentId) return;
    const response = await commentService.getCommentsByContent(contentId);
    setComments(response.data.results || response.data);
  };

  useEffect(() => { load(); }, [contentId]);

  const post = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    await commentService.postContentComment(contentId, message.trim());
    setMessage('');
    await load();
  };

  const bookmark = async () => {
    try {
      await bookmarkService.bookmarkContent(contentId);
      toast.success('Content bookmarked');
    } catch (error) {
      toast.error(error.response?.status === 400 ? 'Already bookmarked' : 'Could not bookmark content');
    }
  };

  const upvote = async (id) => {
    await commentService.upvoteComment(id);
    await load();
  };

  return (
    <section className="mt-8 border-t border-gray-200 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2"><MessageCircle size={18} /> Discussion</h3>
        <button onClick={bookmark} className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100">
          <Bookmark size={16} /> Bookmark
        </button>
      </div>
      <form onSubmit={post} className="flex gap-2 mb-5">
        <input value={message} onChange={(event) => setMessage(event.target.value)} className="input flex-1" placeholder="Ask a question or share a note" />
        <button className="btn btn-primary" type="submit"><Send size={16} /></button>
      </form>
      <div className="space-y-3">
        {comments.map((comment) => (
          <article key={comment.id} className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between gap-3">
              <div><p className="text-sm font-semibold">{comment.user_name}</p><p className="text-sm text-gray-700 mt-1">{comment.content}</p></div>
              <button onClick={() => upvote(comment.id)} className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1"><ThumbsUp size={14} />{comment.upvotes}</button>
            </div>
          </article>
        ))}
        {!comments.length && <p className="text-sm text-gray-500">No discussion yet.</p>}
      </div>
    </section>
  );
}
