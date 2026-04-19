import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Dimensions, FlatList, Image,
  Pressable, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Grid2x2, ImageOff } from 'lucide-react-native';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/authStore';
import { Post } from '../../types';

const GREEN = '#2ECC71';
const { width: SW } = Dimensions.get('window');
const THUMB = (SW - 3) / 3;

interface ProfileUser {
  id: string;
  name: string;
  profile_picture: string | null;
  posts_count: number;
}

// ─── Avatar ───────────────────────────────────────────────
function Avatar({ uri, name, size = 80 }: { uri?: string | null; name: string; size?: number }) {
  const colors = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }]}>
      {uri
        ? <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
        : <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.38 }}>{name[0]?.toUpperCase()}</Text>}
    </View>
  );
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useAuthStore();

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/users/${id}`);
      setProfile(res.data.data);
    } catch { }
  };

  const fetchPosts = async (p = 1) => {
    try {
      const res = await api.get(`/users/${id}/posts?page=${p}`);
      const { posts: newPosts, pagination } = res.data.data;
      if (p === 1) setPosts(newPosts);
      else setPosts(prev => [...prev, ...newPosts]);
      setHasMore(pagination.current_page < pagination.last_page);
      setPage(p);
    } catch { }
    finally { setLoading(false); setLoadingMore(false); }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchProfile();
    fetchPosts(1);
  }, [id]));

  const isMe = me?.id === id;

  if (loading) return (
    <SafeAreaView style={s.flex} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
      </View>
      <ActivityIndicator size="large" color={GREEN} style={{ marginTop: 60 }} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.flex} edges={['top']}>
      <FlatList
        data={posts}
        keyExtractor={p => p.id}
        numColumns={3}
        columnWrapperStyle={{ gap: 1.5 }}
        ItemSeparatorComponent={() => <View style={{ height: 1.5 }} />}
        onEndReached={() => { if (!hasMore || loadingMore) return; setLoadingMore(true); fetchPosts(page + 1); }}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Header nav */}
            <View style={s.header}>
              <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
                <ArrowLeft size={22} color="#111827" />
              </TouchableOpacity>
              <Text style={s.headerName}>{profile?.name ?? ''}</Text>
              <View style={{ width: 22 }} />
            </View>

            {/* Profile info */}
            <View style={s.profileSection}>
              <Avatar uri={profile?.profile_picture} name={profile?.name ?? 'U'} size={86} />
              <View style={s.statsRow}>
                <View style={s.statItem}>
                  <Text style={s.statNum}>{profile?.posts_count ?? 0}</Text>
                  <Text style={s.statLabel}>Postingan</Text>
                </View>
              </View>
            </View>

            <Text style={s.profileName}>{profile?.name}</Text>

            {isMe && (
              <TouchableOpacity style={s.editBtn} onPress={() => router.push('/edit-profile' as any)}>
                <Text style={s.editBtnText}>Edit Profil</Text>
              </TouchableOpacity>
            )}

            {/* Grid header */}
            <View style={s.gridHeader}>
              <Grid2x2 size={20} color={GREEN} />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <ImageOff size={48} color="#D1D5DB" />
            <Text style={s.emptyText}>Belum ada postingan</Text>
          </View>
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator color={GREEN} style={{ marginVertical: 16 }} /> : null}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedPost(item)} activeOpacity={0.85}>
            <Image source={{ uri: item.images[0] }} style={s.thumb} resizeMode="cover" />
            {item.images.length > 1 && (
              <View style={s.multiIndicator}>
                <Grid2x2 size={12} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      {/* Post detail overlay */}
      {selectedPost && (
        <Pressable style={s.overlay} onPress={() => setSelectedPost(null)}>
          <Pressable onPress={e => e.stopPropagation()} style={s.overlayCard}>
            {/* User row */}
            <View style={s.overlayHead}>
              <Avatar uri={selectedPost.user.profile_picture} name={selectedPost.user.name} size={34} />
              <Text style={s.overlayName}>{selectedPost.user.name}</Text>
              <TouchableOpacity onPress={() => setSelectedPost(null)} hitSlop={8} style={{ marginLeft: 'auto' }}>
                <Text style={{ fontSize: 20, color: '#6B7280' }}>✕</Text>
              </TouchableOpacity>
            </View>
            {/* Image */}
            <Image source={{ uri: selectedPost.images[0] }} style={s.overlayImg} resizeMode="cover" />
            {/* Caption */}
            {selectedPost.caption ? (
              <Text style={s.overlayCaption}>{selectedPost.caption}</Text>
            ) : null}
            {/* Stats */}
            <View style={s.overlayStats}>
              <Text style={s.overlayStat}>❤️ {selectedPost.likes_count}</Text>
              <Text style={s.overlayStat}>💬 {selectedPost.comments_count}</Text>
            </View>
          </Pressable>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerName: { fontSize: 15, fontWeight: '800', color: '#111827' },

  profileSection: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 24,
  },
  statsRow: { flexDirection: 'row', gap: 32 },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  profileName: { fontSize: 14, fontWeight: '700', color: '#111827', paddingHorizontal: 16, marginBottom: 12 },

  editBtn: {
    marginHorizontal: 16, marginBottom: 14,
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10,
    paddingVertical: 8, alignItems: 'center',
  },
  editBtnText: { fontSize: 13, fontWeight: '700', color: '#374151' },

  gridHeader: {
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
    alignItems: 'center', paddingVertical: 10,
  },

  thumb: { width: THUMB, height: THUMB, backgroundColor: '#F3F4F6' },
  multiIndicator: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 4, padding: 3,
  },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 14 },

  // Overlay
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center',
  },
  overlayCard: {
    width: SW - 40, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
  },
  overlayHead: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12,
  },
  overlayName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  overlayImg: { width: SW - 40, height: SW - 40 },
  overlayCaption: { fontSize: 13, color: '#374151', padding: 12, lineHeight: 19 },
  overlayStats: { flexDirection: 'row', gap: 16, paddingHorizontal: 12, paddingBottom: 14 },
  overlayStat: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
});
