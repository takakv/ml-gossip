import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { apiFetch } from "~/lib/api-client";

export type Post = {
  id: string;
  title: string;
  content: string | null;
  imageId: string | null;
  videoId: string | null;
  createdAt: string;
  published: boolean;
  isLiked: boolean;
  likeCount: number;
  commentCount: number;
};

export type PostsPage = {
  posts: Post[];
  currentPage: number;
  totalPages: number;
};

export type Comment = {
  id: string;
  content: string;
  createdAt: string;
  isAuthor: boolean;
};

export type CommentsPage = {
  comments: Comment[];
  currentPage: number;
  totalPages: number;
};

export type PostConfig = {
  maxVideoDurationSeconds: number;
  maxImageSizeBytes: number;
  maxVideoSizeBytes: number;
};

export function usePostConfig() {
  return useQuery({
    queryKey: ["post-config"],
    queryFn: () => apiFetch<PostConfig>("/posts/config"),
    staleTime: 60 * 60 * 1000,
  });
}

function normalizePage(page: number) {
  return Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
}

export function usePosts(page: number) {
  const pageNumber = normalizePage(page);
  return useQuery({
    queryKey: ["posts", "feed", pageNumber],
    queryFn: () => apiFetch<PostsPage>(`/posts?page=${pageNumber}`),
    placeholderData: keepPreviousData,
  });
}

export function useMyPosts(page: number) {
  const pageNumber = normalizePage(page);
  return useQuery({
    queryKey: ["posts", "my", pageNumber],
    queryFn: () => apiFetch<PostsPage>(`/posts/my?page=${pageNumber}`),
    placeholderData: keepPreviousData,
  });
}

export function useLikedPosts(page: number) {
  const pageNumber = normalizePage(page);
  return useQuery({
    queryKey: ["posts", "liked", pageNumber],
    queryFn: () => apiFetch<PostsPage>(`/posts/liked?page=${pageNumber}`),
    placeholderData: keepPreviousData,
  });
}

export function useWaitlistPosts(page: number) {
  const pageNumber = normalizePage(page);
  return useQuery({
    queryKey: ["posts", "waitlist", pageNumber],
    queryFn: () => apiFetch<PostsPage>(`/posts/waitlist?page=${pageNumber}`),
    placeholderData: keepPreviousData,
  });
}

export function usePost(postId: string) {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: () => apiFetch<{ post: Post }>(`/posts/${postId}`),
    select: (data) => data.post,
    enabled: Boolean(postId),
  });
}

export function useComments(postId: string, page: number) {
  const pageNumber = normalizePage(page);
  return useQuery({
    queryKey: ["comments", postId, pageNumber],
    queryFn: () =>
      apiFetch<CommentsPage>(`/posts/${postId}/comments?page=${pageNumber}`),
    placeholderData: keepPreviousData,
    enabled: Boolean(postId),
  });
}

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      apiFetch<{ commentId: string }>(`/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      void queryClient.invalidateQueries({ queryKey: ["post", postId] });
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      apiFetch(`/posts/${postId}/comments/${commentId}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      void queryClient.invalidateQueries({ queryKey: ["post", postId] });
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useSetPostLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      postId,
      userId,
      liked,
    }: {
      postId: string;
      userId: string;
      liked: boolean;
    }) =>
      apiFetch(`/posts/${postId}/likes/${userId}`, {
        method: liked ? "DELETE" : "PUT",
      }),
    onSuccess: (_data, { postId }) => {
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
      void queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
}

export function useApprovePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) =>
      apiFetch(`/posts/${postId}`, {
        method: "PATCH",
        body: JSON.stringify({ published: true }),
      }),
    onSuccess: (_data, postId) => {
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
      void queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) =>
      apiFetch(`/posts/${postId}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      title: string;
      content?: string;
      imageId?: string;
      videoId?: string;
    }) =>
      apiFetch<{ postId: string }>("/posts", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useUploadPostImage() {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return apiFetch<{ fileName: string }>("/posts/images", {
        method: "POST",
        body: formData,
      });
    },
  });
}

export function useUploadPostVideo() {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("video", file);
      return apiFetch<{ videoId: string }>("/posts/videos", {
        method: "POST",
        body: formData,
      });
    },
  });
}
