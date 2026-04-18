import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, FlatList, Image, Pressable,
  RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View,
  KeyboardAvoidingView, Platform, Modal, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, MessageCircle, Bookmark, Share2, Plus, X, Send, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../lib/authStore';
import api from '../../lib/api';
import { Post, PostComment } from '../../types';
import { formatDistanceToNow } from '../../lib/timeAgo';

const GREEN = '#2ECC71';
const { width: SCREEN_W } = Dimensions.get('window');

export default function FeedScreen() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Create post modal
  const [showCreate, setShowCreate] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);

  // Comment modal
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  const fetchPosts = async (p = 1, refresh = false) => {
    try {
      const res = await api.get(`/posts?page=${p}`);
      const { posts: newPosts, pagination } = res.data.data;
      if (refresh || p === 1) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }
      setHasMore(pagination.current_page < pagination.last_page);
      setPage(p);
    } catch { }
    finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
  };

  useEffect(() => { fetchPosts(1); }, []);

  const onRefresh = () => { setRefreshing(true); fetchPosts(1, true); };

  const onEndReached = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    fetchPosts(page + 1);
  };

  // ── Like ──────────────────────────────────────────────
  const handleLike = async (post: Post) => {
    // Optimistic update
    setPosts(prev => prev.map(p => p.id === post.id
      ? { ...p, is_liked: !p.is_liked, likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1 }
      : p
    ));
    try {
      await api.post(`/posts/${post.id}/like`);
    } catch {
      // revert
      setPosts(prev => prev.map(p => p.id === post.id
        ? { ...p, is_liked: post.is_liked, likes_count: post.likes_count }
        : p
      ));
    }
  };

  // ── Save ──────────────────────────────────────────────
  const handleSave = async (post: Post) => {
    setPosts(prev => prev.map(p => p.id === post.id
      ? { ...p, is_saved: !p.is_saved, saves_count: p.is_saved ? p.saves_count - 1 : p.saves_count + 1 }
      : p
    ));
    try {
      await api.post(`/posts/${post.id}/save`);
    } catch {
      setPosts(prev => prev.map(p => p.id === post.id
        ? { ...p, is_saved: post.is_saved, saves_count: post.saves_count }
        : p
      ));
    }
  };

  // ── Share ─────────────────────────────────────────────
  const handleShare = async (post: Post) => {
    try {
      await Share.share({
        message: post.caption
          ? `${post.caption}\n\nDibagikan dari Push App`
          : 'Lihat postingan ini di Push App',
        url: post.images[0] ?? undefined,
      });
    } catch { }
  };

  // ── Comments ──────────────────────────────────────────
  const openComments = async (post: Post) => {
    setCommentPost(post);
    setLoadingComments(true);
    try {
      const res = await api.get(`/posts/${post.id}/comments`);
      setComments(res.data.data.comments);
    } catch { }
    finally { setLoadingComments(false); }
  };

  const sendComment = async () => {
    if (!commentText.trim() || !commentPost) return;
    setSendingComment(true);
    try {
      const res = await api.post(`/posts/${commentPost.id}/comments`, { body: commentText.trim() });
      setComments(prev => [res.data.data, ...prev]);
      setCommentText('');
      setPosts(prev => prev.map(p => p.id === commentPost.id
        ? { ...p, comments_count: p.comments_count + 1 }
        : p
      ));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setSendingComment(false); }
  };

  const deleteComment = async (commentId: string) => {
    if (!commentPost) return;
    try {
      await api.delete(`/posts/${commentPost.id}/comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setPosts(prev => prev.map(p => p.id === commentPost.id
        ? { ...p, comments_count: Math.max(0, p.comments_count - 1) }
        : p
      ));
    } catch { }
  };

  // ── Create Post ───────────────────────────────────────
  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });
    if (!result.canceled) {
      setSelectedImages(result.assets.map(a => a.uri));
    }
  };

  const submitPost = async () => {
    if (!selectedImages.length) {
      Alert.alert('Pilih gambar', 'Minimal 1 gambar diperlukan');
      return;
    }
    setPosting(true);
    try {
      const form = new FormData();
      if (caption) form.append('caption', caption);
      selectedImages.forEach((uri, i) => {
        const ext = uri.split('.').pop() ?? 'jpg';
        form.append('images[]', { uri, name: `image_${i}.${ext}`, type: `image/${ext}` } as any);
      });

      const res = await api.post('/posts', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setPosts(prev => [res.data.data, ...prev]);
      setShowCreate(false);
      setCaption('');
      setSelectedImages([]);
    } catch (e: any) {
      Alert.alert('Gagal', e.message);
    } finally { setPosting(false); }
  };

  // ── Post Card ─────────────────────────────────────────
  const PostCard = useCallback(({ item }: { item: Post }) => {
    const doubleTapRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleDoubleTap = () => {
      if (doubleTapRef.current) {
        clearTimeout(doubleTapRef.current);
        doubleTapRef.current = null;
        if (!item.is_liked) handleLike(item);
      } else {
        doubleTapRef.current = setTimeout(() => {
          doubleTapRef.current = null;
        }, 300);
      }
    };

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            {item.user.profile_picture
              ? <Image source={{ uri: item.user.profile_picture }} style={styles.avatarImg} />
              : <Text style={styles.avatarText}>{item.user.name[0]?.toUpperCase()}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{item.user.name}</Text>
            <Text style={styles.timeAgo}>{formatDistanceToNow(item.created_at)}</Text>
          </View>
          {item.user.id === user?.id && (
            <TouchableOpacity onPress={() => confirmDelete(item)} hitSlop={8}>
              <Trash2 size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Images */}
        <Pressable onPress={handleDoubleTap} activeOpacity={1}>
          <FlatList
            data={item.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item: img }) => (
              <Image source={{ uri: img }} style={styles.postImage} resizeMode="cover" />
            )}
          />
        </Pressable>

        {/* Actions */}
        <View style={styles.actions}>
          <View style={styles.actionsLeft}>
            <TouchableOpacity onPress={() => handleLike(item)} style={styles.actionBtn}>
              <Heart size={24} color={item.is_liked ? '#EF4444' : '#374151'} fill={item.is_liked ? '#EF4444' : 'none'} />
              <Text style={styles.actionCount}>{item.likes_count}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openComments(item)} style={styles.actionBtn}>
              <MessageCircle size={24} color="#374151" />
              <Text style={styles.actionCount}>{item.comments_count}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleShare(item)} style={styles.actionBtn}>
              <Share2 size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => handleSave(item)}>
            <Bookmark size={24} color={item.is_saved ? GREEN : '#374151'} fill={item.is_saved ? GREEN : 'none'} />
          </TouchableOpacity>
        </View>

        {/* Caption */}
        {item.caption ? (
          <View style={styles.captionWrap}>
            <Text style={styles.captionUser}>{item.user.name} </Text>
            <Text style={styles.captionText}>{item.caption}</Text>
          </View>
        ) : null}
      </View>
    );
  }, [posts]);

  const confirmDelete = (post: Post) => {
    Alert.alert('Hapus Post', 'Yakin ingin menghapus postingan ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/posts/${post.id}`);
            setPosts(prev => prev.filter(p => p.id !== post.id));
          } catch (e: any) { Alert.alert('Error', e.message); }
        }
      },
    ]);
  };

  if (loading) return (
    <SafeAreaView style={styles.center}>
      <ActivityIndicator size="large" color={GREEN} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={p => p.id}
        renderItem={({ item }) => <PostCard item={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Belum ada postingan</Text>
            <Text style={styles.emptySubText}>Jadilah yang pertama berbagi!</Text>
          </View>
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator color={GREEN} style={{ marginVertical: 16 }} /> : null}
        showsVerticalScrollIndicator={false}
      />

      {/* ── Create Post Modal ── */}
      <Modal visible={showCreate} animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <SafeAreaView style={styles.flex}>
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <X size={24} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Buat Postingan</Text>
              <TouchableOpacity
                style={[styles.postBtn, (!selectedImages.length || posting) && { opacity: 0.5 }]}
                onPress={submitPost}
                disabled={!selectedImages.length || posting}
              >
                {posting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.postBtnText}>Bagikan</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.createBody}>
              <View style={styles.createUser}>
                <View style={styles.avatar}>
                  {user?.photo_url
                    ? <Image source={{ uri: user.photo_url }} style={styles.avatarImg} />
                    : <Text style={styles.avatarText}>{user?.name[0]?.toUpperCase()}</Text>}
                </View>
                <Text style={styles.userName}>{user?.name}</Text>
              </View>

              <TextInput
                style={styles.captionInput}
                placeholder="Tulis caption..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={caption}
                onChangeText={setCaption}
                maxLength={2200}
              />

              {selectedImages.length > 0 && (
                <FlatList
                  data={selectedImages}
                  horizontal
                  keyExtractor={(_, i) => String(i)}
                  contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
                  renderItem={({ item: uri, index }) => (
                    <View>
                      <Image source={{ uri }} style={styles.previewImg} />
                      <TouchableOpacity
                        style={styles.removeImg}
                        onPress={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                      >
                        <X size={12} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              )}

              <TouchableOpacity style={styles.pickImgBtn} onPress={pickImages}>
                <Plus size={20} color={GREEN} />
                <Text style={styles.pickImgText}>Pilih Gambar</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ── Comments Modal ── */}
      <Modal
        visible={!!commentPost}
        animationType="slide"
        onRequestClose={() => { setCommentPost(null); setComments([]); }}
      >
        <SafeAreaView style={styles.flex}>
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { setCommentPost(null); setComments([]); }}>
                <X size={24} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Komentar</Text>
              <View style={{ width: 24 }} />
            </View>

            {loadingComments
              ? <ActivityIndicator color={GREEN} style={{ marginTop: 32 }} />
              : (
                <FlatList
                  data={comments}
                  keyExtractor={c => c.id}
                  contentContainerStyle={{ padding: 16, gap: 16 }}
                  ListEmptyComponent={
                    <Text style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 32 }}>
                      Belum ada komentar
                    </Text>
                  }
                  renderItem={({ item: c }) => (
                    <View style={styles.commentRow}>
                      <View style={[styles.avatar, { width: 32, height: 32, borderRadius: 16 }]}>
                        {c.user.profile_picture
                          ? <Image source={{ uri: c.user.profile_picture }} style={styles.avatarImg} />
                          : <Text style={[styles.avatarText, { fontSize: 12 }]}>{c.user.name[0]?.toUpperCase()}</Text>}
                      </View>
                      <View style={styles.commentBubble}>
                        <Text style={styles.commentUser}>{c.user.name}</Text>
                        <Text style={styles.commentBody}>{c.body}</Text>
                      </View>
                      {c.user.id === user?.id && (
                        <TouchableOpacity onPress={() => deleteComment(c.id)} hitSlop={8}>
                          <Trash2 size={14} color="#9CA3AF" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                />
              )}

            <View style={styles.commentInput}>
              <TextInput
                style={styles.commentTextInput}
                placeholder="Tulis komentar..."
                placeholderTextColor="#9CA3AF"
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                onPress={sendComment}
                disabled={!commentText.trim() || sendingComment}
                style={[styles.sendBtn, (!commentText.trim() || sendingComment) && { opacity: 0.4 }]}
              >
                {sendingComment
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Send size={16} color="#fff" />}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  createBtn: {
    backgroundColor: GREEN, width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },

  card: { marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  userName: { fontWeight: '700', color: '#111827', fontSize: 13 },
  timeAgo: { color: '#9CA3AF', fontSize: 11, marginTop: 1 },

  postImage: { width: SCREEN_W, height: SCREEN_W, backgroundColor: '#F3F4F6' },

  actions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  actionsLeft: { flexDirection: 'row', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCount: { fontSize: 13, fontWeight: '600', color: '#374151' },

  captionWrap: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 12 },
  captionUser: { fontWeight: '700', color: '#111827', fontSize: 13 },
  captionText: { color: '#374151', fontSize: 13, flex: 1 },

  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySubText: { color: '#9CA3AF', marginTop: 6 },

  // Modal
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  postBtn: { backgroundColor: GREEN, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  createBody: { flex: 1, padding: 16 },
  createUser: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  captionInput: { fontSize: 15, color: '#111827', minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  previewImg: { width: 100, height: 100, borderRadius: 12 },
  removeImg: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 3,
  },
  pickImgBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: GREEN, borderStyle: 'dashed',
    borderRadius: 12, padding: 14, marginTop: 16, justifyContent: 'center',
  },
  pickImgText: { color: GREEN, fontWeight: '700' },

  // Comments
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  commentBubble: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 10 },
  commentUser: { fontWeight: '700', color: '#111827', fontSize: 12, marginBottom: 2 },
  commentBody: { color: '#374151', fontSize: 13 },
  commentInput: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  commentTextInput: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827', maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: GREEN, width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
});
