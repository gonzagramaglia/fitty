import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, ScrollView, Platform, TouchableOpacity, Image, DeviceEventEmitter } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { HistoryCard } from "../../components/ui/HistoryCard";
import { TrendChart } from "../../components/ui/TrendChart";
import { BCSInfoCard } from "../../components/ui/BCSInfoCard";
import { useHistory } from "../../hooks/useHistory";
import { Skeleton } from "../../components/ui/Skeleton";
import { Plus, ArrowUpDown } from "lucide-react-native";
import { useActiveCat } from "../../lib/ActiveCatContext";
import { supabase } from "../../lib/supabase";
import HistoryDetailView from "../../components/ui/HistoryDetailView";

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { history, isLoading, error } = useHistory();
  const { activeCatId, setActiveCatId, selectedCheckId, setSelectedCheckId, showGuestModal } = useActiveCat();
  const [allCats, setAllCats] = useState<any[]>([]);
  const [isCatsLoading, setIsCatsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      const fetchCats = async () => {
        setIsCatsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUser(user);
        const { data } = await supabase
          .from('cats')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        if (data) setAllCats(data);
        setIsCatsLoading(false);
      };
      fetchCats();
    }, [activeCatId])
  );

  useFocusEffect(
    useCallback(() => {
      // Clear selection when leaving the history screen
      return () => {
        setSelectedCheckId(null);
      };
    }, [setSelectedCheckId])
  );

  if (selectedCheckId) {
    return <HistoryDetailView />;
  }

  const renderCatSelector = (isSkeleton = false) => (
    <View className="mb-2 w-full mt-4">
      <Text className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Your Cats</Text>
      {isSkeleton ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          <Skeleton width={100} height={40} borderRadius={20} className="mr-3 bg-white/20" />
          <Skeleton width={80} height={40} borderRadius={20} className="mr-3 bg-white/10" />
          <Skeleton width={80} height={40} borderRadius={20} className="bg-white/10" />
        </ScrollView>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {[...allCats].sort((a, b) => a.id === activeCatId ? -1 : b.id === activeCatId ? 1 : 0).map(c => (
            <TouchableOpacity
              key={c.id}
              onPress={() => {
                if (c.id !== activeCatId) setActiveCatId(c.id);
              }}
              className={`flex-row items-center px-4 py-2 rounded-full mr-3 ${activeCatId === c.id ? 'bg-[#74B7B5]' : 'bg-[#2A3B4C]'}`}
            >
              {c.avatar_url ? (
                <Image source={{ uri: c.avatar_url }} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }} className="bg-surface-tertiary" />
              ) : (
                <Image source={require('../../assets/images/coding-kitty.jpg')} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }} className="bg-surface-tertiary" />
              )}
              <Text className={`font-semibold ${activeCatId === c.id ? 'text-white' : 'text-white/80'}`}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => {
              if (user?.is_anonymous) {
                showGuestModal();
                return;
              }
              router.push('/profile');
              setTimeout(() => DeviceEventEmitter.emit('openAddCat'), 100);
            }}
            className="flex-row items-center px-4 py-2 rounded-full border border-dashed border-[#74B7B5] bg-transparent"
          >
            <Plus size={18} color="#74B7B5" />
            <Text className="font-semibold ml-1 text-[#74B7B5]">Add</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );

  if (!isCatsLoading && allCats.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-1 items-center justify-center px-6 pt-12 pb-4">
          <Image
            source={require('../../assets/images/fitty-onboarding-how-it-works-1.png')}
            style={{ width: 220, height: 220, marginBottom: -8 }}
            resizeMode="contain"
          />
          <Text className="text-2xl font-bold text-text-primary mb-1 text-center">
            {user?.is_anonymous ? "Welcome, Judge! 👋" : "Welcome to History"}
          </Text>
          <Text className="text-text-secondary text-center mb-8 text-base px-4">
            {user?.is_anonymous ? "Thank you for checking out Fitty. Please create a cat profile to track history." : "Please create a cat profile to see their health history."}
          </Text>
          <TouchableOpacity
            onPress={() => {
              router.push('/profile');
              setTimeout(() => DeviceEventEmitter.emit('openAddCat'), 100);
            }}
            className="bg-primary-cool px-6 py-4 rounded-2xl w-full flex-row justify-center items-center shadow-sm"
          >
            <Plus size={20} color="white" />
            <Text className="text-white font-bold text-lg ml-2">Add Cat</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!activeCatId || isCatsLoading) {
    return (
      <View className="flex-1 bg-surface">
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} bounces={false}>
          <View
            className="bg-[#1A2530] rounded-b-[2.5rem] px-6 pb-8 mb-6"
            style={{ paddingTop: Platform.OS === 'web' ? 76 : Math.max(insets.top + 20, 64) }}
          >
            {/* Skeleton Header */}
            <View className="mb-6">
              <Skeleton width={100} height={12} borderRadius={4} className="mb-2 bg-white/10" />
              <Skeleton width={200} height={36} borderRadius={8} className="bg-white/10" />
            </View>

            {/* Skeleton Cat Selector */}
            <View className="mb-2">
              <Skeleton width={80} height={12} borderRadius={4} className="mb-3 bg-white/10" />
              <View className="flex-row">
                <Skeleton width={100} height={40} borderRadius={20} className="mr-3 bg-white/20" />
                <Skeleton width={80} height={40} borderRadius={20} className="mr-3 bg-white/10" />
                <Skeleton width={80} height={40} borderRadius={20} className="bg-white/10" />
              </View>
            </View>
          </View>

          {/* Body Skeleton */}
          <View className="px-6">
            {/* Trend Chart Skeleton */}
            <Skeleton width="100%" height={240} borderRadius={16} className="mb-6" />

            {/* History Cards Skeleton */}
            <Skeleton width={120} height={20} borderRadius={6} className="mb-4" />
            <Skeleton width="100%" height={80} borderRadius={16} className="mb-3" />
            <Skeleton width="100%" height={80} borderRadius={16} className="mb-3" />
            <Skeleton width="100%" height={80} borderRadius={16} className="mb-3" />
          </View>
        </ScrollView>
      </View>
    );
  }

  const chartData = history.map((record) => ({
    date: record.created_at,
    score: record.bcs_score,
  })).reverse();

  const getThumbnailSource = (url: string | null) => {
    if (!url) return null;
    if (url === 'https://raw.githubusercontent.com/gonzagramaglia/fitty/main/assets/images/coding-kitty.jpg' || url.includes('mock-')) {
      return require('../../assets/images/cat-top-view.png');
    }
    return url;
  };

  return (
    <View className="flex-1 bg-surface">
      {isLoading ? (
        <>
          {/* Skeleton Dark Header */}
          <View 
            className="bg-[#1A2530] rounded-b-[2.5rem] px-6 mb-6"
            style={{ 
              paddingTop: Platform.OS === 'web' ? 72 : Math.max(insets.top + 16, 60),
              minHeight: (Platform.OS === 'web' ? 72 : Math.max(insets.top + 16, 60)) + 188
            }}
          >
            <View className="flex-1 justify-center items-start pb-6">
              <Text className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">
                Health Journey
              </Text>
              <Text className="text-white text-3xl font-black tracking-tight mb-4">
                History & Trend
              </Text>
              {renderCatSelector(true)}
            </View>
          </View>

          <ScrollView ref={scrollViewRef} className="flex-1 px-6 mt-2" showsVerticalScrollIndicator={false}>
            <Skeleton width="100%" height={180} borderRadius={16} className="mb-6" />
            <Skeleton width={120} height={20} borderRadius={6} className="mb-4" />
            <Skeleton width="100%" height={80} borderRadius={16} className="mb-3" />
            <Skeleton width="100%" height={80} borderRadius={16} className="mb-3" />
            <Skeleton width="100%" height={80} borderRadius={16} className="mb-3" />
          </ScrollView>
        </>
      ) : error ? (
        <>
          {/* Real Dark Header (even for error state) */}
          <View 
            className="bg-[#1A2530] rounded-b-[2.5rem] px-6 mb-6"
            style={{ 
              paddingTop: Platform.OS === 'web' ? 72 : Math.max(insets.top + 16, 60),
              minHeight: (Platform.OS === 'web' ? 72 : Math.max(insets.top + 16, 60)) + 188
            }}
          >
            <View className="flex-1 justify-center items-start pb-6">
              <Text className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">
                Health Journey
              </Text>
              <Text className="text-white text-3xl font-black tracking-tight mb-4">
                History & Trend
              </Text>
              {renderCatSelector()}
            </View>
          </View>

          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-error text-center text-base">{error}</Text>
          </View>
        </>
      ) : history.length === 0 ? (
        <>
          {/* Real Dark Header */}
          <View 
            className="bg-[#1A2530] rounded-b-[2.5rem] px-6 mb-6"
            style={{ 
              paddingTop: Platform.OS === 'web' ? 72 : Math.max(insets.top + 16, 60),
              minHeight: (Platform.OS === 'web' ? 72 : Math.max(insets.top + 16, 60)) + 188
            }}
          >
            <View className="flex-1 justify-center items-start pb-6">
              <Text className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">
                Health Journey
              </Text>
              <Text className="text-white text-3xl font-black tracking-tight mb-4">
                History & Trend
              </Text>
              {renderCatSelector()}
            </View>
          </View>

          <View className="px-6 mt-2 mb-6">
            <TrendChart data={[]} catName={allCats.find(c => c.id === activeCatId)?.name} />
          </View>
        </>
      ) : (
        <>
          {/* Real Dark Header */}
          <View 
            className="bg-[#1A2530] rounded-b-[2.5rem] px-6 mb-6"
            style={{ 
              paddingTop: Platform.OS === 'web' ? 72 : Math.max(insets.top + 16, 60),
              minHeight: (Platform.OS === 'web' ? 72 : Math.max(insets.top + 16, 60)) + 188
            }}
          >
            <View className="flex-1 justify-center items-start pb-6">
              <Text className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">
                Health Journey
              </Text>
              <Text className="text-white text-3xl font-black tracking-tight mb-4">
                History & Trend
              </Text>
              {renderCatSelector()}
            </View>
          </View>
          
          <ScrollView ref={scrollViewRef} className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {chartData.length > 0 && (
            <View className="mb-6">
              <TrendChart data={chartData} catName={allCats.find(c => c.id === activeCatId)?.name} />
            </View>
          )}

          <View className="flex-row justify-between items-center mb-4 mt-2">
            <Text className="text-text-primary text-base font-semibold">
              Past Checks
            </Text>
            <TouchableOpacity 
              onPress={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="flex-row items-center bg-[#f1f5f9] px-3 py-1.5 rounded-full"
            >
              <ArrowUpDown size={14} color="#64748b" />
              <Text className="text-text-muted text-xs font-semibold uppercase tracking-wider ml-1">
                {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="pb-8">
            {(sortOrder === 'desc' ? history : [...history].reverse()).map((record) => (
              <HistoryCard
                key={record.id}
                dateString={record.created_at}
                bcsScore={record.bcs_score}
                thumbnailUrl={getThumbnailSource(record.top_photo_url)}
                hasTextNote={!!record.text_note}
                hasVoiceNote={!!record.voice_note_url}
                onPress={() => {
                  setSelectedCheckId(record.id);
                }}
              />
            ))}

            {/* BCS Info Section */}
            <View className="mt-7">
              <BCSInfoCard />
            </View>
          </View>
        </ScrollView>
        </>
      )}
    </View>
  );
}
