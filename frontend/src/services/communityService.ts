import api, { unwrap } from './api';

export interface CommunityPost {
  id: string;
  author_id: string;
  author_name: string;
  author_role: 'student' | 'instructor' | 'admin' | string;
  author_avatar?: string;
  content: string;
  tag: string;
  image_url?: string;
  created_at: string;
  like_count: number;
  is_liked: boolean;
  comment_count: number;
  share_count: number;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  author_avatar?: string;
  content: string;
  created_at: string;
}

export async function getCommunityPosts(tag?: string): Promise<CommunityPost[]> {
  const params = tag && tag !== 'All' ? { tag } : {};
  const res = await api.get('/community/posts', { params });
  return unwrap<CommunityPost[]>(res);
}

export async function createCommunityPost(
  content: string,
  tag?: string,
  imageUrl?: string
): Promise<CommunityPost> {
  const res = await api.post('/community/posts', {
    content,
    tag: tag || 'General',
    image_url: imageUrl || undefined,
  });
  return unwrap<CommunityPost>(res);
}

export async function toggleLikePost(postId: string): Promise<{ post_id: string; is_liked: boolean; like_count: number }> {
  const res = await api.post(`/community/posts/${postId}/like`);
  return unwrap<{ post_id: string; is_liked: boolean; like_count: number }>(res);
}

export async function getPostComments(postId: string): Promise<CommunityComment[]> {
  const res = await api.get(`/community/posts/${postId}/comments`);
  return unwrap<CommunityComment[]>(res);
}

export async function createPostComment(postId: string, content: string): Promise<CommunityComment> {
  const res = await api.post(`/community/posts/${postId}/comments`, { content });
  return unwrap<CommunityComment>(res);
}

export async function shareCommunityPost(postId: string): Promise<{ share_count: number }> {
  const res = await api.post(`/community/posts/${postId}/share`);
  return unwrap<{ share_count: number }>(res);
}

export async function deleteCommunityPost(postId: string): Promise<void> {
  await api.delete(`/community/posts/${postId}`);
}
