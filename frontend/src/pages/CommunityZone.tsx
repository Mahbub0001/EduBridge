import { useEffect, useState } from 'react';
import {
  Users, Heart, MessageSquare, Share2, Send, Tag, Image, Trash2,
  Check, Sparkles, HelpCircle, BookOpen, Megaphone, Search
} from 'lucide-react';
import { useAuthStore } from '../store';
import PageHeader from '../components/layout/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import {
  getCommunityPosts, createCommunityPost, toggleLikePost,
  getPostComments, createPostComment, shareCommunityPost, deleteCommunityPost,
  type CommunityPost, type CommunityComment
} from '../services/communityService';

const TOPICS = [
  { id: 'All', label: 'All Posts', icon: Users },
  { id: 'Q&A', label: 'Q & A', icon: HelpCircle },
  { id: 'Study Group', label: 'Study Group', icon: BookOpen },
  { id: 'Tips', label: 'Tips & Tricks', icon: Sparkles },
  { id: 'Announcement', label: 'Announcements', icon: Megaphone },
  { id: 'General', label: 'General Discussion', icon: Tag },
];

export default function CommunityZone() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Post state
  const [postContent, setPostContent] = useState('');
  const [postTag, setPostTag] = useState('General');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Comment drawers state per post
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [postComments, setPostComments] = useState<Record<string, CommunityComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<Record<string, boolean>>({});

  // Copied share links state
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await getCommunityPosts(selectedTag);
      setPosts(data);
    } catch {
      setError('Failed to load community posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedTag]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    setSubmitting(true);
    try {
      const newPost = await createCommunityPost(postContent.trim(), postTag, imageUrl.trim() || undefined);
      setPosts((prev) => [newPost, ...prev]);
      setPostContent('');
      setImageUrl('');
      setShowImageInput(false);
    } catch {
      alert('Failed to submit post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.is_liked;
          return {
            ...p,
            is_liked: isLiked,
            like_count: isLiked ? p.like_count + 1 : Math.max(0, p.like_count - 1),
          };
        }
        return p;
      })
    );

    try {
      await toggleLikePost(postId);
    } catch {
      // Revert if error
      fetchPosts();
    }
  };

  const handleToggleComments = async (postId: string) => {
    const isNowOpen = !openComments[postId];
    setOpenComments((prev) => ({ ...prev, [postId]: isNowOpen }));

    if (isNowOpen && !postComments[postId]) {
      setCommentLoading((prev) => ({ ...prev, [postId]: true }));
      try {
        const comments = await getPostComments(postId);
        setPostComments((prev) => ({ ...prev, [postId]: comments }));
      } catch {
        console.error('Failed to load comments');
      } finally {
        setCommentLoading((prev) => ({ ...prev, [postId]: false }));
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    setCommentSubmitting((prev) => ({ ...prev, [postId]: true }));
    try {
      const newComment = await createPostComment(postId, text);
      setPostComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p))
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch {
      alert('Failed to post comment.');
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleShare = async (postId: string) => {
    const shareUrl = `${window.location.origin}/student/community#post-${postId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedPostId(postId);
    setTimeout(() => setCopiedPostId(null), 3000);

    try {
      const res = await shareCommunityPost(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, share_count: res.share_count } : p))
      );
    } catch {}
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await deleteCommunityPost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      alert('Failed to delete post.');
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.content.toLowerCase().includes(q) ||
      p.author_name.toLowerCase().includes(q) ||
      p.tag.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <PageHeader
        title="Community Zone 💬"
        description="Share ideas, ask questions, react to posts, and collaborate with students & teachers across EduBridge."
      />

      {/* Create Post Box */}
      <Card className="space-y-4 shadow-md border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="w-10 h-10 rounded-full bg-navy-900 text-amber-400 font-extrabold flex items-center justify-center text-sm shadow-xs">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h4 className="text-sm font-bold text-navy-950 dark:text-white">{user?.name || 'You'}</h4>
            <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400">
              Posting as {user?.role || 'Student'}
            </span>
          </div>
        </div>

        <form onSubmit={handleCreatePost} className="space-y-3">
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="Share an update, learning resource, or ask a question..."
            rows={3}
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 text-sm text-black dark:text-white dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-navy-900 dark:focus:ring-teal-500 resize-none"
          />

          {showImageInput && (
            <div className="flex items-center gap-2">
              <Image size={16} className="text-slate-400 shrink-0" />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste image URL (optional e.g. https://...)"
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-black dark:text-white dark:bg-slate-900 focus:outline-hidden"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              {/* Topic Selector */}
              <select
                value={postTag}
                onChange={(e) => setPostTag(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-xs font-semibold px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="General">📌 General</option>
                <option value="Q&A">❓ Q & A</option>
                <option value="Study Group">👥 Study Group</option>
                <option value="Tips">💡 Tips & Tricks</option>
                <option value="Announcement">📢 Announcement</option>
              </select>

              <button
                type="button"
                onClick={() => setShowImageInput(!showImageInput)}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  showImageInput ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Image size={14} /> Add Image
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting || !postContent.trim()}
              className="!bg-navy-900 dark:!bg-teal-600 dark:!text-white font-bold gap-2 px-5"
            >
              <Send size={14} /> {submitting ? 'Posting...' : 'Post to Community'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          {/* Topic Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {TOPICS.map((t) => {
              const Icon = t.icon;
              const active = selectedTag === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTag(t.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-navy-900 text-white dark:bg-teal-600 dark:text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 p-4 text-xs text-red-700 dark:text-rose-450">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse py-8 text-center text-slate-400 text-xs">
              Loading posts...
            </Card>
          ))}
        </div>
      )}

      {/* Feed Posts */}
      {!loading && filteredPosts.length > 0 && (
        <div className="space-y-6">
          {filteredPosts.map((post) => {
            const isAuthor = user?.uid === post.author_id || user?.role === 'admin';
            const isInstructor = post.author_role === 'instructor' || post.author_role === 'teacher';
            const isCommentsOpen = openComments[post.id];
            const commentsList = postComments[post.id] || [];

            return (
              <Card key={post.id} id={`post-${post.id}`} className="space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                {/* Author & Header Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {post.author_avatar ? (
                      <img src={post.author_avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm text-white shadow-xs ${
                        isInstructor ? 'bg-teal-600' : 'bg-navy-900'
                      }`}>
                        {post.author_name ? post.author_name[0].toUpperCase() : 'U'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-navy-950 dark:text-white">
                          {post.author_name}
                        </h4>
                        <Badge className={`!text-[9px] uppercase font-bold px-2 py-0.5 ${
                          isInstructor
                            ? '!bg-amber-100 !text-amber-800 border !border-amber-300 dark:!bg-amber-950/60 dark:!text-amber-300'
                            : '!bg-slate-100 !text-slate-700 dark:!bg-slate-800 dark:!text-slate-300'
                        }`}>
                          {isInstructor ? '⚡ Teacher' : 'Student'}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        {new Date(post.created_at || Date.now()).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-[10px] font-bold border border-slate-300 dark:border-slate-600">
                      {post.tag}
                    </Badge>
                    {isAuthor && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-lg"
                        title="Delete post"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </div>

                {/* Optional Attached Image */}
                {post.image_url && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-96">
                    <img src={post.image_url} alt="Post attachment" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Interactive Action Buttons (Like, Comment, Share) */}
                <div className="flex items-center gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    className={`flex items-center gap-1.5 font-bold transition-colors ${
                      post.is_liked
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-500 dark:text-slate-400 hover:text-rose-600'
                    }`}
                  >
                    <Heart size={16} className={post.is_liked ? 'fill-rose-600 text-rose-600' : ''} />
                    <span>{post.like_count} {post.like_count === 1 ? 'Like' : 'Likes'}</span>
                  </button>

                  <button
                    onClick={() => handleToggleComments(post.id)}
                    className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    <MessageSquare size={16} />
                    <span>{post.comment_count} {post.comment_count === 1 ? 'Comment' : 'Comments'}</span>
                  </button>

                  <button
                    onClick={() => handleShare(post.id)}
                    className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white transition-colors"
                  >
                    {copiedPostId === post.id ? <Check size={16} className="text-emerald-500" /> : <Share2 size={16} />}
                    <span>{copiedPostId === post.id ? 'Link Copied!' : `${post.share_count} Share`}</span>
                  </button>
                </div>

                {/* Collapsible Comments Section */}
                {isCommentsOpen && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-fade-in">
                    {/* Add Comment Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Write a comment..."
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs text-black dark:text-white focus:outline-hidden"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={commentSubmitting[post.id] || !commentInputs[post.id]?.trim()}
                        onClick={() => handleAddComment(post.id)}
                        className="!bg-navy-900 dark:!bg-teal-600 dark:!text-white text-xs px-3"
                      >
                        <Send size={12} />
                      </Button>
                    </div>

                    {/* Comments List */}
                    {commentLoading[post.id] ? (
                      <p className="text-xs text-slate-400">Loading comments...</p>
                    ) : commentsList.length > 0 ? (
                      <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800/60">
                        {commentsList.map((c) => {
                          const isCInstructor = c.author_role === 'instructor' || c.author_role === 'teacher';
                          return (
                            <div key={c.id} className="pt-3 first:pt-0 flex items-start gap-2.5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                                isCInstructor ? 'bg-teal-600' : 'bg-slate-700'
                              }`}>
                                {c.author_name ? c.author_name[0].toUpperCase() : 'U'}
                              </div>
                              <div className="flex-1 bg-slate-50 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-navy-950 dark:text-white">{c.author_name}</span>
                                    {isCInstructor && (
                                      <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">Teacher</span>
                                    )}
                                  </div>
                                  <span className="text-[9px] text-slate-400 font-mono">
                                    {new Date(c.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{c.content}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No comments yet. Be the first to reply!</p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {!loading && filteredPosts.length === 0 && (
        <Card className="text-center py-12 space-y-3">
          <Users size={48} className="mx-auto text-slate-300 dark:text-slate-700" />
          <h3 className="text-base font-bold text-navy-950 dark:text-white">No posts in this topic yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Be the first to share an update, question, or study tip with the EduBridge community!
          </p>
        </Card>
      )}
    </div>
  );
}
