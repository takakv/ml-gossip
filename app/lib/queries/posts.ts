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
  createdAt: string;
  published: boolean;
  isLiked: boolean;
  likeCount: number;
};

export type PostsPage = {
  posts: Post[];
  currentPage: number;
  totalPages: number;
};

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
    mutationFn: (body: { title: string; content?: string; imageId?: string }) =>
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
