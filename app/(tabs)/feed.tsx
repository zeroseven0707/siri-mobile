import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, Dimensions, FlatList, Image,
  KeyboardAvoidingView, Modal, Platform, RefreshControl,
  ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';import {
  Bookmark, Camera, Flag, Heart, ImageIcon, MessageCircle,
  MoreVertical, Plus, Send, Share2, Trash2, X,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../lib/authStore';
import api from '../../lib/api';
import { Post, PostComment } from '../../types';

const GREEN = '#2ECC71';
const DARK_GREEN = '#16a34a';
const { width: SW } = Dimensions.get('window');

// ─── Format timestamp ─────────────────────────────────────
function formatDistanceToNow(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'baru saja';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} hari lalu`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w} minggu lalu`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} bulan lalu`;
  return `${Math.floor(mo / 12)} tahun lalu`;
}

// ─── Format timestamp lengkap ────────────────────────────
function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// ─── Avatar ───────────────────────────────────────────────
function Avatar({ uri, name, size = 38 }: { uri?: string | null; name: string; size?: number }) {
  const colors = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <View style={[avStyles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      {uri
        ? <Image source={{ uri }} style={avStyles.img} />
        : <Text style={[avStyles.letter, { fontSize: size * 0.38 }]}>{name[0]?.toUpperCase()}</Text>}
    </View>
  );
}
const avStyles = StyleSheet.create({
  wrap: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  img: { width: '100%', height: '100%' },
  letter: { color: '#fff', fontWeight: '800' },
});

// ─── Post Card ────────────────────────────────────────────
function PostCard({
  item, userId, onLike, onSave, onComment, onShare, onDelete,
}: {
  item: Post; userId?: string;
  onLike: () => void; onSave: () => void;
  onComment: () => void; onShare: () => void; onDelete: () => void;
}) {
  const router = useRouter();
  const heartAnim = useRef(new Animated.Value(0)).current;
  const doubleTapRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);

  const isOwn = item.user.id === userId;

  const REPORT_REASONS = [
    { key: 'spam',        label: 'Spam' },
    { key: 'nudity',      label: 'Konten dewasa / nudity' },
    { key: 'hate_speech', label: 'Ujaran kebencian' },
    { key: 'violence',    label: 'Kekerasan' },
    { key: 'false_info',  label: 'Informasi palsu' },
    { key: 'harassment',  label: 'Pelecehan / bullying' },
    { key: 'other',       label: 'Lainnya' },
  ];

  const submitReport = async () => {
    if (!reportReason) { Alert.alert('Pilih alasan', 'Pilih alasan laporan terlebih dahulu'); return; }
    setReporting(true);
    try {
      await api.post(`/posts/${item.id}/report`, { reason: reportReason });
      setShowReport(false);
      setReportReason('');
      Alert.alert('Terima kasih', 'Laporan kamu sudah kami terima dan akan ditinjau.');
    } catch (e: any) {
      Alert.alert('Gagal', e.message);
    } finally { setReporting(false); }
  };

  const triggerHeartAnim = () => {
    setShowHeart(true);
    heartAnim.setValue(0);
    Animated.sequence([
      Animated.spring(heartAnim, { toValue: 1, useNativeDriver: true, speed: 20 }),
      Animated.delay(600),
      Animated.timing(heartAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setShowHeart(false));
  };

  const handleDoubleTap = () => {
    if (doubleTapRef.current) {
      clearTimeout(doubleTapRef.current);
      doubleTapRef.current = null;
      triggerHeartAnim();
      if (!item.is_liked) onLike();
    } else {
      doubleTapRef.current = setTimeout(() => { doubleTapRef.current = null; }, 280);
    }
  };

  return (
    <View style={cs.card}>
      {/* Header */}
      <View style={cs.cardHead}>
        <TouchableOpacity onPress={() => router.push(`/user-profile/${item.user.id}` as any)} activeOpacity={0.8}>
          <Avatar uri={item.user.profile_picture} name={item.user.name} size={40} />
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, marginLeft: 10 }} onPress={() => router.push(`/user-profile/${item.user.id}` as any)} activeOpacity={0.8}>
          <Text style={cs.cardName}>{item.user.name}</Text>
          <Text style={cs.cardTime}>{formatDistanceToNow(item.created_at)}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowMenu(true)} hitSlop={10} style={cs.moreBtn}>
          <MoreVertical size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Action menu */}
      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <TouchableOpacity style={cs.menuOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
          <View style={cs.menuSheet}>
            <View style={cs.menuHandle} />
            {isOwn ? (
              <TouchableOpacity style={cs.menuItem} onPress={() => { setShowMenu(false); onDelete(); }}>
                <Trash2 size={18} color="#EF4444" />
                <Text style={[cs.menuItemText, { color: '#EF4444' }]}>Hapus Postingan</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={cs.menuItem} onPress={() => { setShowMenu(false); setTimeout(() => setShowReport(true), 300); }}>
                <Flag size={18} color="#F59E0B" />
                <Text style={[cs.menuItemText, { color: '#F59E0B' }]}>Laporkan Postingan</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[cs.menuItem, { borderTopWidth: 1, borderTopColor: '#F3F4F6' }]} onPress={() => setShowMenu(false)}>
              <X size={18} color="#9CA3AF" />
              <Text style={cs.menuItemText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Report modal */}
      <Modal visible={showReport} transparent animationType="slide" onRequestClose={() => setShowReport(false)}>
        <TouchableOpacity style={cs.menuOverlay} activeOpacity={1} onPress={() => setShowReport(false)}>
          <View style={[cs.menuSheet, { paddingBottom: 24 }]}>
            <View style={cs.menuHandle} />
            <Text style={cs.reportTitle}>Laporkan Postingan</Text>
            <Text style={cs.reportSub}>Pilih alasan laporan kamu</Text>
            {REPORT_REASONS.map(r => (
              <TouchableOpacity
                key={r.key}
                style={[cs.reasonItem, reportReason === r.key && cs.reasonItemActive]}
                onPress={() => setReportReason(r.key)}
              >
                <View style={[cs.reasonRadio, reportReason === r.key && cs.reasonRadioActive]}>
                  {reportReason === r.key && <View style={cs.reasonRadioDot} />}
                </View>
                <Text style={[cs.reasonText, reportReason === r.key && { color: '#111827', fontWeight: '700' }]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[cs.reportBtn, (!reportReason || reporting) && { opacity: 0.45 }]}
              onPress={submitReport}
              disabled={!reportReason || reporting}
            >
              {reporting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={cs.reportBtnText}>Kirim Laporan</Text>}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Caption above image */}
      {item.caption ? (
        <Text style={cs.captionAbove}>{item.caption}</Text>
      ) : null}

      {/* Images */}
      <TouchableOpacity onPress={handleDoubleTap} activeOpacity={1} style={{ position: 'relative' }}>
        <FlatList
          data={item.images}
          horizontal pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          onMomentumScrollEnd={e => setImgIndex(Math.round(e.nativeEvent.contentOffset.x / SW))}
          renderItem={({ item: img }) => (
            <Image source={{ uri: img }} style={cs.postImg} resizeMode="cover" />
          )}
        />
        {/* Dot indicator */}
        {item.images.length > 1 && (
          <View style={cs.dots}>
            {item.images.map((_, i) => (
              <View key={i} style={[cs.dot, i === imgIndex && cs.dotActive]} />
            ))}
          </View>
        )}
        {/* Double-tap heart */}
        {showHeart && (
          <Animated.View style={[cs.heartOverlay, {
            opacity: heartAnim,
            transform: [{ scale: heartAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.2] }) }],
          }]}>
            <Heart size={80} color="#fff" fill="#fff" />
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* Actions */}
      <View style={cs.actions}>
        <View style={cs.actLeft}>
          <TouchableOpacity onPress={onLike} style={cs.actBtn} activeOpacity={0.7}>
            <Heart
              size={23} strokeWidth={2}
              color={item.is_liked ? '#EF4444' : '#1F2937'}
              fill={item.is_liked ? '#EF4444' : 'none'}
            />
            {item.likes_count > 0 && <Text style={[cs.actCount, item.is_liked && { color: '#EF4444' }]}>{item.likes_count}</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={onComment} style={cs.actBtn} activeOpacity={0.7}>
            <MessageCircle size={23} strokeWidth={2} color="#1F2937" />
            {item.comments_count > 0 && <Text style={cs.actCount}>{item.comments_count}</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={onShare} style={cs.actBtn} activeOpacity={0.7}>
            <Share2 size={22} strokeWidth={2} color="#1F2937" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onSave} activeOpacity={0.7}>
          <Bookmark
            size={23} strokeWidth={2}
            color={item.is_saved ? DARK_GREEN : '#1F2937'}
            fill={item.is_saved ? DARK_GREEN : 'none'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────
export default function FeedScreen() {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Create post
  const [showCreate, setShowCreate] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);

  // Comments
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [totalCommentCount, setTotalCommentCount] = useState(0);
  const commentInputRef = useRef<TextInput>(null);

  const fetchPosts = async (p = 1, refresh = false) => {
    try {
      const res = await api.get(`/posts?page=${p}`);
      const { posts: newPosts, pagination } = res.data.data;
      if (refresh || p === 1) setPosts(newPosts);
      else setPosts(prev => [...prev, ...newPosts]);
      setHasMore(pagination.current_page < pagination.last_page);
      setPage(p);
    } catch { }
    finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
  };

  useEffect(() => { fetchPosts(1); }, []);

  const handleLike = async (post: Post) => {
    setPosts(prev => prev.map(p => p.id === post.id
      ? { ...p, is_liked: !p.is_liked, likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1 }
      : p));
    try { await api.post(`/posts/${post.id}/like`); }
    catch { setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_liked: post.is_liked, likes_count: post.likes_count } : p)); }
  };

  const handleSave = async (post: Post) => {
    setPosts(prev => prev.map(p => p.id === post.id
      ? { ...p, is_saved: !p.is_saved, saves_count: p.is_saved ? p.saves_count - 1 : p.saves_count + 1 }
      : p));
    try { await api.post(`/posts/${post.id}/save`); }
    catch { setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_saved: post.is_saved, saves_count: post.saves_count } : p)); }
  };

  const handleShare = async (post: Post) => {
    try {
      await Share.share({ message: post.caption ? `${post.caption}\n\nDibagikan dari Push App` : 'Lihat postingan ini di Push App' });
    } catch { }
  };

  const openComments = async (post: Post) => {
    setCommentPost(post);
    setTotalCommentCount(post.comments_count);
    setLoadingComments(true);
    try {
      const res = await api.get(`/posts/${post.id}/comments`);
      setComments(res.data.data.comments);
      const realCount: number = res.data.data.total_count ?? post.comments_count;
      setTotalCommentCount(realCount);
      // Sync count di feed jika berbeda
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, comments_count: realCount } : p));
    } catch { }
    finally { setLoadingComments(false); }
  };

  const sendComment = async () => {
    if (!commentText.trim() || !commentPost) return;
    setSendingComment(true);
    try {
      const body: any = { body: commentText.trim() };
      if (replyTo) body.parent_id = replyTo.id;

      const res = await api.post(`/posts/${commentPost.id}/comments`, body);
      const newComment: PostComment = res.data.data;

      if (replyTo) {
        // Tambahkan reply ke dalam komentar parent
        setComments(prev => prev.map(c =>
          c.id === replyTo.id
            ? { ...c, replies: [...(c.replies ?? []), newComment] }
            : c
        ));
        // Update count di feed juga untuk reply
        setPosts(prev => prev.map(p => p.id === commentPost.id ? { ...p, comments_count: p.comments_count + 1 } : p));
        setTotalCommentCount(prev => prev + 1);
      } else {
        setComments(prev => [newComment, ...prev]);
        setPosts(prev => prev.map(p => p.id === commentPost.id ? { ...p, comments_count: p.comments_count + 1 } : p));
        setTotalCommentCount(prev => prev + 1);
      }

      setCommentText('');
      setReplyTo(null);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSendingComment(false); }
  };

  const likeComment = async (commentId: string, parentId?: string) => {
    if (!commentPost) return;
    // Optimistic update
    const toggle = (c: PostComment) =>
      c.id === commentId
        ? { ...c, is_liked: !c.is_liked, likes_count: c.is_liked ? c.likes_count - 1 : c.likes_count + 1 }
        : c;

    setComments(prev => prev.map(c => {
      if (parentId) {
        return c.id === parentId
          ? { ...c, replies: (c.replies ?? []).map(toggle) }
          : c;
      }
      return toggle(c);
    }));

    try {
      await api.post(`/posts/${commentPost.id}/comments/${commentId}/like`);
    } catch { }
  };

  const deleteComment = async (commentId: string) => {
    if (!commentPost) return;
    try {
      await api.delete(`/posts/${commentPost.id}/comments/${commentId}`);
      const deleted = comments.find(c => c.id === commentId);
      const totalRemoved = 1 + (deleted?.replies?.length ?? 0);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setPosts(prev => prev.map(p => p.id === commentPost.id
        ? { ...p, comments_count: Math.max(0, p.comments_count - totalRemoved) }
        : p));
      setTotalCommentCount(prev => Math.max(0, prev - totalRemoved));
    } catch { }
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, quality: 0.85, selectionLimit: 10,
    });
    if (!result.canceled) setSelectedImages(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 10));
  };

  const submitPost = async () => {
    if (!selectedImages.length) { Alert.alert('Pilih gambar', 'Minimal 1 gambar diperlukan'); return; }
    setPosting(true);
    try {
      const form = new FormData();
      if (caption.trim()) form.append('caption', caption.trim());
      selectedImages.forEach((uri, i) => {
        const ext = uri.split('.').pop() ?? 'jpg';
        form.append('images[]', { uri, name: `img_${i}.${ext}`, type: `image/${ext}` } as any);
      });
      const res = await api.post('/posts', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPosts(prev => [res.data.data, ...prev]);
      setShowCreate(false); setCaption(''); setSelectedImages([]);
    } catch (e: any) { Alert.alert('Gagal', e.message); }
    finally { setPosting(false); }
  };

  const confirmDelete = (post: Post) => {
    Alert.alert('Hapus Post', 'Yakin ingin menghapus postingan ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        try { await api.delete(`/posts/${post.id}`); setPosts(prev => prev.filter(p => p.id !== post.id)); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  if (loading) return (
    <SafeAreaView style={s.flex} edges={['top']}>
      <ActivityIndicator size="large" color={GREEN} style={{ marginTop: 60 }} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.flex} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Feed</Text>
        <TouchableOpacity style={s.newPostBtn} onPress={() => setShowCreate(true)} activeOpacity={0.85}>
          <Plus size={18} color="#fff" strokeWidth={2.5} />
          <Text style={s.newPostBtnText}>Buat Post</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={p => p.id}
        renderItem={({ item }) => (
          <PostCard
            item={item} userId={user?.id}
            onLike={() => handleLike(item)}
            onSave={() => handleSave(item)}
            onComment={() => openComments(item)}
            onShare={() => handleShare(item)}
            onDelete={() => confirmDelete(item)}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPosts(1, true); }} tintColor={GREEN} />}
        onEndReached={() => { if (!hasMore || loadingMore) return; setLoadingMore(true); fetchPosts(page + 1); }}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyIcon}><ImageIcon size={36} color="#D1D5DB" /></View>
            <Text style={s.emptyTitle}>Belum ada postingan</Text>
            <Text style={s.emptySub}>Jadilah yang pertama berbagi momen!</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => setShowCreate(true)}>
              <Text style={s.emptyBtnText}>Buat Postingan</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator color={GREEN} style={{ marginVertical: 20 }} /> : null}
      />

      {/* ── Create Post Modal ── */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreate(false)}>
        <SafeAreaView style={s.modalBg} edges={['top']}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {/* Modal header */}
            <View style={s.mHead}>
              <TouchableOpacity onPress={() => { setShowCreate(false); setCaption(''); setSelectedImages([]); }} style={s.mCloseBtn}>
                <X size={20} color="#374151" />
              </TouchableOpacity>
              <Text style={s.mTitle}>Buat Postingan</Text>
              <TouchableOpacity
                style={[s.shareBtn, (!selectedImages.length || posting) && s.shareBtnDisabled]}
                onPress={submitPost} disabled={!selectedImages.length || posting}
              >
                {posting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.shareBtnText}>Bagikan</Text>}
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* User row */}
              <View style={s.mUserRow}>
                <Avatar uri={user?.photo_url} name={user?.name ?? 'U'} size={44} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={s.mUserName}>{user?.name}</Text>
                  <View style={s.audienceBadge}><Text style={s.audienceText}>🌍 Semua orang</Text></View>
                </View>
              </View>

              {/* Caption input */}
              <TextInput
                style={s.captionInput}
                placeholder="Apa yang ingin kamu bagikan?"
                placeholderTextColor="#9CA3AF"
                multiline value={caption}
                onChangeText={setCaption}
                maxLength={2200}
              />

              {/* Char count */}
              {caption.length > 0 && (
                <Text style={s.charCount}>{caption.length}/2200</Text>
              )}

              {/* Image previews */}
              {selectedImages.length > 0 && (
                <View style={s.previewGrid}>
                  {selectedImages.map((uri, index) => (
                    <View key={index} style={[s.previewItem, selectedImages.length === 1 && s.previewItemFull]}>
                      <Image source={{ uri }} style={s.previewImg} resizeMode="cover" />
                      <TouchableOpacity
                        style={s.removeImgBtn}
                        onPress={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                      >
                        <X size={11} color="#fff" strokeWidth={3} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {selectedImages.length < 10 && (
                    <TouchableOpacity style={s.addMoreBtn} onPress={pickImages}>
                      <Plus size={24} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Bottom toolbar */}
            <View style={[s.mToolbar, { paddingBottom: insets.bottom + 8 }]}>
              <TouchableOpacity style={s.toolbarBtn} onPress={pickImages}>
                <ImageIcon size={22} color={GREEN} />
                <Text style={s.toolbarBtnText}>Galeri</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.toolbarBtn} onPress={async () => {
                const r = await ImagePicker.launchCameraAsync({ quality: 0.85 });
                if (!r.canceled) setSelectedImages(prev => [...prev, r.assets[0].uri].slice(0, 10));
              }}>
                <Camera size={22} color="#6366F1" />
                <Text style={[s.toolbarBtnText, { color: '#6366F1' }]}>Kamera</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ── Comments Modal ── */}
      <Modal
        visible={!!commentPost} animationType="slide" presentationStyle="pageSheet"
        onRequestClose={() => { setCommentPost(null); setComments([]); setCommentText(''); }}
      >
        <SafeAreaView style={s.modalBg} edges={['top']}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {/* Handle bar */}
            <View style={s.handleBar}><View style={s.handle} /></View>

            {/* Header */}
            <View style={s.cmHead}>
              <Text style={s.mTitle}>Komentar · {totalCommentCount}</Text>
              <TouchableOpacity onPress={() => { setCommentPost(null); setComments([]); setCommentText(''); }} style={s.mCloseBtn}>
                <X size={18} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Comments list */}
            {loadingComments
              ? <ActivityIndicator color={GREEN} style={{ marginTop: 40 }} />
              : (
                <FlatList
                  data={comments}
                  keyExtractor={c => c.id}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={s.noComment}>
                      <MessageCircle size={40} color="#E5E7EB" />
                      <Text style={s.noCommentText}>Belum ada komentar</Text>
                      <Text style={s.noCommentSub}>Jadilah yang pertama berkomentar</Text>
                    </View>
                  }
                  renderItem={({ item: c }) => (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onLongPress={() => {
                        if (c.user.id !== user?.id) return;
                        Alert.alert('Hapus Komentar', 'Yakin ingin menghapus komentar ini?', [
                          { text: 'Batal', style: 'cancel' },
                          { text: 'Hapus', style: 'destructive', onPress: () => deleteComment(c.id) },
                        ]);
                      }}
                    >
                      <View style={s.cmItem}>
                        <Avatar uri={c.user.profile_picture} name={c.user.name} size={36} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View style={s.cmMeta}>
                            <Text style={s.cmName}>{c.user.name}</Text>
                            <Text style={s.cmTime}>{formatTime(c.created_at)}</Text>
                          </View>
                          <Text style={s.cmBody}>{c.body}</Text>
                          <TouchableOpacity hitSlop={8} style={{ marginTop: 4 }} onPress={() => {
                            setReplyTo({ id: c.id, name: c.user.name });
                            commentInputRef.current?.focus();
                          }}>
                            <Text style={s.cmReply}>Balas</Text>
                          </TouchableOpacity>

                          {/* Replies */}
                          {(c.replies ?? []).length > 0 && (
                            <View style={{ marginTop: 10, gap: 10 }}>
                              {(c.replies ?? []).map(r => (
                                <View key={r.id} style={s.replyItem}>
                                  <Avatar uri={r.user.profile_picture} name={r.user.name} size={26} />
                                  <View style={{ flex: 1, marginLeft: 8 }}>
                                    <View style={s.cmMeta}>
                                      <Text style={[s.cmName, { fontSize: 12 }]}>{r.user.name}</Text>
                                      <Text style={[s.cmTime, { fontSize: 10 }]}>{formatTime(r.created_at)}</Text>
                                    </View>
                                    <Text style={[s.cmBody, { fontSize: 13 }]}>{r.body}</Text>
                                  </View>
                                  <TouchableOpacity onPress={() => likeComment(r.id, c.id)} hitSlop={8} style={s.cmRight}>
                                    <Heart size={13} color={r.is_liked ? '#EF4444' : '#9CA3AF'} fill={r.is_liked ? '#EF4444' : 'none'} strokeWidth={1.8} />
                                    {r.likes_count > 0 && <Text style={[s.cmLikeCount, r.is_liked && { color: '#EF4444' }]}>{r.likes_count}</Text>}
                                  </TouchableOpacity>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>

                        {/* Like */}
                        <TouchableOpacity onPress={() => likeComment(c.id)} hitSlop={8} style={s.cmRight}>
                          <Heart size={16} color={c.is_liked ? '#EF4444' : '#9CA3AF'} fill={c.is_liked ? '#EF4444' : 'none'} strokeWidth={1.8} />
                          {c.likes_count > 0 && <Text style={[s.cmLikeCount, c.is_liked && { color: '#EF4444' }]}>{c.likes_count}</Text>}
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}

            {/* Emoji reactions bar */}
            <View style={s.emojiBar}>
              {['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'].map(e => (
                <TouchableOpacity
                  key={e}
                  style={s.emojiBtn}
                  onPress={() => setCommentText(prev => prev + e)}
                >
                  <Text style={s.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Input */}
            <View style={[s.commentInputRow, { paddingBottom: insets.bottom + 8 }]}>
              {replyTo && (
                <View style={s.replyBanner}>
                  <Text style={s.replyBannerText}>Membalas <Text style={{ fontWeight: '700' }}>@{replyTo.name}</Text></Text>
                  <TouchableOpacity onPress={() => setReplyTo(null)} hitSlop={8}>
                    <X size={14} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
                <Avatar uri={user?.photo_url} name={user?.name ?? 'U'} size={34} />
                <View style={s.commentInputWrap}>
                  <TextInput
                    ref={commentInputRef}
                    style={s.commentInput}
                    placeholder={replyTo ? `Balas @${replyTo.name}...` : 'Apa pendapat Anda tentang ini?'}
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
                  {sendingComment
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Send size={15} color="#fff" strokeWidth={2.5} />}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────
const cs = StyleSheet.create({
  card: { backgroundColor: '#fff', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  cardHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  cardName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  cardTime: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  moreBtn: { padding: 4 },
  captionAbove: { fontSize: 14, color: '#374151', lineHeight: 20, paddingHorizontal: 14, paddingBottom: 10 },
  postImg: { width: SW, height: SW, backgroundColor: '#F3F4F6' },
  dots: { position: 'absolute', bottom: 10, alignSelf: 'center', flexDirection: 'row', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 18 },
  heartOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
  actLeft: { flexDirection: 'row', gap: 18 },
  actBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actCount: { fontSize: 13, fontWeight: '600', color: '#374151' },

  // Menu & Report
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  menuSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 8, paddingHorizontal: 16, paddingBottom: 16,
  },
  menuHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  menuItemText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  reportTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 4, marginTop: 4 },
  reportSub: { fontSize: 13, color: '#6B7280', marginBottom: 14 },
  reasonItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  reasonItemActive: { backgroundColor: '#F0FDF4', borderRadius: 10, paddingHorizontal: 10 },
  reasonRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  reasonRadioActive: { borderColor: GREEN },
  reasonRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: GREEN },
  reasonText: { fontSize: 14, color: '#374151' },
  reportBtn: {
    backgroundColor: GREEN, borderRadius: 14, paddingVertical: 13,
    alignItems: 'center', marginTop: 16,
  },
  reportBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  newPostBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: GREEN, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  newPostBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Empty
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyBtn: { backgroundColor: GREEN, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Modal shared
  modalBg: { flex: 1, backgroundColor: '#fff' },
  mHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  mTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  mCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },

  // Create post
  shareBtn: { backgroundColor: GREEN, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  shareBtnDisabled: { opacity: 0.45 },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  mUserRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  mUserName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  audienceBadge: { backgroundColor: '#F0FDF4', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 3 },
  audienceText: { fontSize: 11, color: DARK_GREEN, fontWeight: '600' },
  captionInput: { fontSize: 16, color: '#111827', paddingHorizontal: 16, paddingVertical: 8, minHeight: 100, textAlignVertical: 'top', lineHeight: 24 },
  charCount: { textAlign: 'right', paddingHorizontal: 16, fontSize: 11, color: '#9CA3AF', marginBottom: 8 },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingBottom: 16 },
  previewItem: { width: (SW - 44) / 3, height: (SW - 44) / 3, borderRadius: 12, overflow: 'hidden' },
  previewItemFull: { width: SW - 32, height: 220 },
  previewImg: { width: '100%', height: '100%' },
  removeImgBtn: {
    position: 'absolute', top: 5, right: 5,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, width: 20, height: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  addMoreBtn: {
    width: (SW - 44) / 3, height: (SW - 44) / 3, borderRadius: 12,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB', borderStyle: 'dashed',
  },
  mToolbar: {
    flexDirection: 'row', gap: 4,
    paddingHorizontal: 12, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  toolbarBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F9FAFB' },
  toolbarBtnText: { fontSize: 13, fontWeight: '600', color: GREEN },

  // Comments — TikTok style
  handleBar: { alignItems: 'center', paddingTop: 10, paddingBottom: 2 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' },
  cmHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  cmItem: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  cmMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  cmName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  cmTime: { fontSize: 11, color: '#9CA3AF' },
  cmBody: { fontSize: 14, color: '#374151', lineHeight: 20 },
  cmReply: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  cmRight: { alignItems: 'center', paddingLeft: 12, paddingTop: 2 },
  cmLikeCount: { fontSize: 11, color: '#9CA3AF', marginTop: 2, fontWeight: '600' },
  replyItem: { flexDirection: 'row', alignItems: 'flex-start' },
  replyBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    marginBottom: 6,
  },
  replyBannerText: { fontSize: 12, color: '#6B7280' },
  emojiBar: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  emojiBtn: { padding: 6 },
  emojiText: { fontSize: 22 },
  noComment: { alignItems: 'center', paddingTop: 60 },
  noCommentText: { fontSize: 15, fontWeight: '700', color: '#374151', marginTop: 14 },
  noCommentSub: { fontSize: 13, color: '#9CA3AF', marginTop: 5 },
  commentInputRow: {
    flexDirection: 'column',
    paddingHorizontal: 14, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  commentInputWrap: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 22,
    paddingHorizontal: 14, paddingVertical: 8, minHeight: 40, justifyContent: 'center',
  },
  commentInput: { fontSize: 14, color: '#111827', maxHeight: 100 },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center',
  },
});
