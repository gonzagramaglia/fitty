import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, ScrollView, ActivityIndicator, Platform, TouchableOpacity, Image, DeviceEventEmitter } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { HistoryCard } from "../../components/ui/HistoryCard";
import { TrendChart } from "../../components/ui/TrendChart";
import { useHistory } from "../../hooks/useHistory";
import { Skeleton } from "../../components/ui/Skeleton";
import { Activity, Plus, ArrowUpDown } from "lucide-react-native";
import { useActiveCat } from "../../lib/ActiveCatContext";
import { supabase } from "../../lib/supabase";
import HistoryDetailView from "../../components/ui/HistoryDetailView";

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { history, isLoading, error } = useHistory();
  const { activeCatId, setActiveCatId, selectedCheckId, setSelectedCheckId } = useActiveCat();
  const [allCats, setAllCats] = useState<any[]>([]);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  useEffect(() => {
    const fetchCats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('cats')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (data) setAllCats(data);
    };
    fetchCats();
  }, []);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('tabPress', (tabName) => {
      if (tabName === 'history') {
        setSelectedCheckId(null);
      }
    });
    return () => subscription.remove();
  }, [setSelectedCheckId]);

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

  if (!activeCatId) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-text-muted text-center text-base">
            Please create or select a cat profile first.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const chartData = history.map((record) => ({
    date: record.created_at,
    score: record.bcs_score,
  }));

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

          <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 bg-surface-secondary rounded-full items-center justify-center mb-4">
            <Activity color="#94a3b8" size={32} />
          </View>
          <Text className="text-text-primary font-semibold text-lg mb-2">
            No history yet
          </Text>
          <Text className="text-text-muted text-center">
            Complete your first health check to see history and trends here.
          </Text>
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
          
          <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {chartData.length > 1 && (
            <View className="mb-6">
              <TrendChart data={chartData} />
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

          <View className="pb-24">
            {(sortOrder === 'desc' ? history : [...history].reverse()).map((record) => (
              <HistoryCard
                key={record.id}
                dateString={record.created_at}
                bcsScore={record.bcs_score}
                thumbnailUrl={record.top_photo_url}
                hasTextNote={!!record.text_note}
                hasVoiceNote={!!record.voice_note_url}
                onPress={() => {
                  setSelectedCheckId(record.id);
                }}
              />
            ))}
          </View>
        </ScrollView>
        </>
      )}
    </View>
  );
}
