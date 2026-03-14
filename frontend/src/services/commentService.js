import api from './api';

const commentService = {
  // Get comments for a lecture
  getCommentsByLecture: (lectureId) =>
    api.get(`/academics/comments/?lecture=${lectureId}`),

  // Post a comment on a lecture
  postComment: (lectureId, content, parentId = null) =>
    api.post('/academics/comments/', {
      lecture: lectureId,
      content,
      parent: parentId,
    }),

  // Reply to a comment
  replyComment: (parentCommentId, content) =>
    api.post('/academics/comments/', {
      parent: parentCommentId,
      content,
    }),

  // Upvote a comment
  upvoteComment: (commentId) => api.post(`/academics/comments/${commentId}/upvote/`),

  // Pin a comment (teacher only)
  pinComment: (commentId) => api.post(`/academics/comments/${commentId}/pin/`),

  // Resolve a comment (teacher only)
  resolveComment: (commentId) => api.post(`/academics/comments/${commentId}/resolve/`),

  // Delete a comment
  deleteComment: (commentId) => api.delete(`/academics/comments/${commentId}/`),
};

export default commentService;
