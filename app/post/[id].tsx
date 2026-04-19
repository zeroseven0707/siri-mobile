import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Dimensions, FlatList, Image, Modal,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
  Alert, KeyboardAvoidingView, Platform, Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft, Bookmark, Flag, Heart, MessageCircle,
  MoreVertical, Send, Share2, Trash2, X,
} from 'lucide-react-native';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/authStore';
import { Post, PostComment } from '../../types';

const GREEN = '#2ECC71';
const DARK_GREEN = '#16a34a';
const { width: SW } = Dimensions.get('window');

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function Avatar({ uri, name, size = 38 }: { uri?: string | null; name: string; size?: number }) {
  const colors = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      {uri
        ? <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
        : <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.38 }}>{name[0]?.toUpperCase()}</Text>}
    </View>
  );
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);

  // Comments
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const commentInputRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

  const fetchPost = async () => {
    try {
      const res = await api.get(`/posts/${id}`);
      setPost(res.data.data);
    } catch { }
    finally { setLoading(false); }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await api.get(`/posts/${id}/comments`);
      setComments(res.data.data.comments);
      setTotalCount(res.data.data.total_count ?? 0);
    } catch { }
    finally { setLoadingComments(false); }
  };

  const handleLike = async () => {
    if (!post) return;
    setPost(p => p ? { ...p, is_liked: !p.is_liked, likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1 } : p);
    try { await api.post(`/posts/${post.id}/like`); }
    catch { setPost(p => p ? { ...p, is_liked: post.is_liked, likes_count: post.likes_count } : p); }
  };

  const handleSave = async () => {
    if (!post) return;
    setPost(p => p ? { ...p, is_saved: !p.is_saved } : p);
    try { await api.post(`/posts/${post.id}/save`); }
    catch { setPost(p => p ? { ...p, is_saved: post.is_saved } : p); }
  };

  const handleShare = async () => {
    if (!post) return;
    const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') ?? '';
    const url = `${baseUrl}/post/${post.id}`;
    await Share.share({ title: `${post.user.name} di Push App`, message: post.caption ? `${post.caption}\n\n${url}` : url, url });
  };

  const sendComment = async () => {
    if (!commentText.trim() || !post) return;
    setSendingComment(true);
    try {
      const body: any = { body: commentText.trim() };
      if (replyTo) body.parent_id = replyTo.id;
      const res = await api.post(`/posts/${post.id}/comments`, body);
      const newComment: PostComment = res.data.data;
      if (replyTo) {
        setComments(prev => prev.map(c => c.id === replyTo.id ? { ...c, replies: [...(c.replies ?? []), newComment] } : c));
      } else {
        setComments(prev => [newComment, ...prev]);
      }
      setTotalCount(prev => prev + 1);
      setPost(p => p ? { ...p, comments_count: p.comments_count + 1 } : p);
      setCommentText('');
      setReplyTo(null);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSendingComment(false); }
  };

  const deleteComment = async (commentId: string) => {
    if (!post) return;
    try {
      await api.delete(`/posts/${post.id}/comments/${commentId}`);
      const deleted = comments.find(c => c.id === commentId);
      const removed = 1 + (deleted?.replies?.length ?? 0);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setTotalCount(prev => Math.max(0, prev - removed));
      setPost(p => p ? { ...p, comments_count: Math.max(0, p.comments_count - removed) } : p);
    } catch { }
  };

  if (loading) return (
    <SafeAreaView style={s.flex} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}><ArrowLeft size={22} color="#111827" /></TouchableOpacity>
      </View>
      <ActivityIndicator size="large" color={GREEN} style={{ marginTop: 60 }} />
    </SafeAreaView>
  );

  if (!post) return (
    <SafeAreaView style={s.flex} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}><ArrowLeft size={22} color="#111827" /></TouchableOpacity>
        <Text style={s.headerTitle}>Postingan</Text>
        <View style={{ width: 22 }} />
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#9CA3AF' }}>Postingan tidak ditemukan</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.flex} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}><ArrowLeft size={22} color="#111827" /></TouchableOpacity>
          <Text style={s.headerTitle}>Postingan</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Post header */}
          <View style={s.postHead}>
            <TouchableOpacity onPress={() => router.push(`/user-profile/${post.user.id}` as any)}>
              <Avatar uri={post.user.profile_picture} name={post.user.name} size={40} />
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, marginLeft: 10 }} onPress={() => router.push(`/user-profile/${post.user.id}` as any)}>
              <Text style={s.postName}>{post.user.name}</Text>
              <Text style={s.postTime}>{formatTime(post.created_at)}</Text>
            </TouchableOpacity>
          </View>

          {/* Caption */}
          {post.caption ? <Text style={s.caption}>{post.caption}</Text> : null}

          {/* Images */}
          <FlatList
            data={post.images}
            horizontal pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            onMomentumScrollEnd={e => setImgIndex(Math.round(e.nativeEvent.contentOffset.x / SW))}
            renderItem={({ item: img }) => <Image source={{ uri: img }} style={s.postImg} resizeMode="cover" />}
          />
          {post.images.length > 1 && (
            <View style={s.dots}>
              {post.images.map((_, i) => <View key={i} style={[s.dot, i === imgIndex && s.dotActive]} />)}
            </View>
          )}

          {/* Actions */}
          <View style={s.actions}>
            <View style={s.actLeft}>
              <TouchableOpacity onPress={handleLike} style={s.actBtn}>
                <Heart size={23} color={post.is_liked ? '#EF4444' : '#1F2937'} fill={post.is_liked ? '#EF4444' : 'none'} strokeWidth={2} />
                {post.likes_count > 0 && <Text style={[s.actCount, post.is_liked && { color: '#EF4444' }]}>{post.likes_count}</Text>}
              </TouchableOpacity>
              <View style={s.actBtn}>
                <MessageCircle size={23} color="#1F2937" strokeWidth={2} />
                {totalCount > 0 && <Text style={s.actCount}>{totalCount}</Text>}
              </View>
              <TouchableOpacity onPress={handleShare} style={s.actBtn}>
                <Share2 size={22} color="#1F2937" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleSave}>
              <Bookmark size={23} color={post.is_saved ? DARK_GREEN : '#1F2937'} fill={post.is_saved ? DARK_GREEN : 'none'} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Comments section */}
          <View style={s.cmSection}>
            <Text style={s.cmTitle}>Komentar · {totalCount}</Text>
            {loadingComments
              ? <ActivityIndicator color={GREEN} style={{ marginVertical: 20 }} />
              : comments.length === 0
                ? <Text style={s.cmEmpty}>Belum ada komentar</Text>
                : comments.map(c => (
                  <TouchableOpacity
                    key={c.id} activeOpacity={0.8}
                    onLongPress={() => {
                      if (c.user.id !== user?.id) return;
                      Alert.alert('Hapus Komentar', 'Yakin?', [
                        { text: 'Batal', style: 'cancel' },
                        { text: 'Hapus', style: 'destructive', onPress: () => deleteComment(c.id) },
                      ]);
                    }}
                  >
                    <View style={s.cmItem}>
                      <Avatar uri={c.user.profile_picture} name={c.user.name} size={34} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <View style={s.cmMeta}>
                          <Text style={s.cmName}>{c.user.name}</Text>
                          <Text style={s.cmTime}>{formatTime(c.created_at)}</Text>
                        </View>
                        <Text style={s.cmBody}>{c.body}</Text>
                        <TouchableOpacity hitSlop={8} style={{ marginTop: 4 }} onPress={() => { setReplyTo({ id: c.id, name: c.user.name }); commentInputRef.current?.focus(); }}>
                          <Text style={s.cmReply}>Balas</Text>
                        </TouchableOpacity>
                        {(c.replies ?? []).map(r => (
                          <View key={r.id} style={[s.cmItem, { marginTop: 10 }]}>
                            <Avatar uri={r.user.profile_picture} name={r.user.name} size={26} />
                            <View style={{ flex: 1, marginLeft: 8 }}>
                              <View style={s.cmMeta}>
                                <Text style={[s.cmName, { fontSize: 12 }]}>{r.user.name}</Text>
                                <Text style={[s.cmTime, { fontSize: 10 }]}>{formatTime(r.created_at)}</Text>
                              </View>
                              <Text style={[s.cmBody, { fontSize: 13 }]}>{r.body}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
            }
          </View>
        </ScrollView>

        {/* Comment input */}
        <View style={[s.inputArea, { paddingBottom: insets.bottom + 8 }]}>
          {replyTo && (
            <View style={s.replyBanner}>
              <Text style={s.replyBannerText}>Membalas <Text style={{ fontWeight: '700' }}>@{replyTo.name}</Text></Text>
              <TouchableOpacity onPress={() => setReplyTo(null)} hitSlop={8}><X size={14} color="#6B7280" /></TouchableOpacity>
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
            <Avatar uri={user?.photo_url} name={user?.name ?? 'U'} size={32} />
            <View style={s.inputWrap}>
              <TextInput
                ref={commentInputRef}
                style={s.input}
                placeholder={replyTo ? `Balas @${replyTo.name}...` : 'Tulis komentar...'}
                placeholderTextColor="#9CA3AF"
                value={commentText}
                onChangeText={setCommentText}
                multiline maxLength={500}
              />
            </View>
            <TouchableOpacity
              onPress={sendComment}
              disabled={!commentText.trim() || sendingComment}
              style={[s.sendBtn, (!commentText.trim() || sendingComment) && { opacity: 0.35 }]}
            >
              {sendingComment ? <ActivityIndicator size="small" color="#fff" /> : <Send size={15} color="#fff" strokeWidth={2.5} />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  postHead: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  postName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  postTime: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  caption: { fontSize: 14, color: '#374151', lineHeight: 20, paddingHorizontal: 14, paddingBottom: 10 },
  postImg: { width: SW, height: SW, backgroundColor: '#F3F4F6' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D1D5DB' },
  dotActive: { backgroundColor: GREEN, width: 18 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
  actLeft: { flexDirection: 'row', gap: 18 },
  actBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actCount: { fontSize: 13, fontWeight: '600', color: '#374151' },
  cmSection: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  cmTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 14 },
  cmEmpty: { color: '#9CA3AF', textAlign: 'center', paddingVertical: 24 },
  cmItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  cmMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  cmName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  cmTime: { fontSize: 11, color: '#9CA3AF' },
  cmBody: { fontSize: 14, color: '#374151', lineHeight: 20 },
  cmReply: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  cmRight: { alignItems: 'center', paddingLeft: 10, paddingTop: 2 },
  cmLikeCount: { fontSize: 11, color: '#9CA3AF', marginTop: 2, fontWeight: '600' },
  inputArea: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingHorizontal: 14, paddingTop: 8, backgroundColor: '#fff' },
  replyBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 6 },
  replyBannerText: { fontSize: 12, color: '#6B7280' },
  inputWrap: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, minHeight: 38, justifyContent: 'center' },
  input: { fontSize: 14, color: '#111827', maxHeight: 100 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
});
