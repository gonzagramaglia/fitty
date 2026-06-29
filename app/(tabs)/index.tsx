import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, DeviceEventEmitter, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useActiveCat } from '../../lib/ActiveCatContext';
import { AlertCircle, ChevronRight, Activity, Plus, Camera } from 'lucide-react-native';
import { useCallback } from 'react';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeCatId, setActiveCatId, isLoading: isCatLoading } = useActiveCat();
  
  const [user, setUser] = useState<any>(null);
  const [allCats, setAllCats] = useState<any[]>([]);
  const [cat, setCat] = useState<any>(null);
  const [latestCheck, setLatestCheck] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (isCatLoading) return;
    if (!activeCatId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUser(user);

      // Fetch all cats
      const { data: allCatsData, error: allCatsError } = await supabase
        .from('cats')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (allCatsError) throw allCatsError;
      setAllCats(allCatsData || []);

      // Set active cat
      const activeCat = allCatsData?.find((c: any) => c.id === activeCatId) || allCatsData?.[0];
      setCat(activeCat);

      // Fetch Latest Health Check
      const { data: checkData, error: checkError } = await supabase
        .from('health_checks')
        .select('*')
        .eq('cat_id', activeCatId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      setLatestCheck(checkData);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [activeCatId, isCatLoading])
  );

  // Compute if profile is incomplete
  const isProfileIncomplete = cat && (!cat.base_weight_kg || !cat.age_years);

  if (isLoading || isCatLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#74B7B5" />
      </View>
    );
  }

  // Empty state if absolutely no cats exist
  if (!cat) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-xl font-bold text-text-primary mb-2 text-center">Welcome to Fitty!</Text>
          <Text className="text-text-secondary text-center mb-8">Please create a cat profile to get started.</Text>
          <TouchableOpacity 
            onPress={() => router.push('/profile')}
            className="bg-primary-cool px-6 py-4 rounded-2xl w-full flex-row justify-center items-center"
          >
            <Plus size={20} color="white" />
            <Text className="text-white font-bold text-lg ml-2">Add a Cat</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} bounces={false}>
        
        {/* Dark Header Container */}
        <View 
          className="bg-[#1A2530] rounded-b-[2.5rem] px-6 pb-6 mb-6" 
          style={{ paddingTop: Platform.OS === 'web' ? 72 : Math.max(insets.top + 16, 60) }}
        >
          {/* Welcome Header */}
          <View className="flex-row items-center justify-between mb-8">
            <View>
              <Text className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Good Morning,</Text>
              <Text className="text-3xl font-black text-white tracking-tight">
                {user?.user_metadata?.full_name?.split(' ')[0] || 'Judge'} 👋
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/profile')} className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#2A3B4C] bg-surface-tertiary">
              {user?.user_metadata?.avatar_url ? (
                <Image source={{ uri: user.user_metadata.avatar_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <Image source={require('../../assets/images/vito-corleone.webp')} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              )}
            </TouchableOpacity>
          </View>

          {/* Cat Selector Tags */}
          <View className="mb-2">
            <Text className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Your Cats</Text>
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
          </View>
        </View>

        {/* Main Content */}
        <View className="px-6">
          {/* Active Cat Sneak Peek */}
        {cat && (
          <View className="bg-background border border-border rounded-2xl p-4 mb-8 flex-row items-center">
            <View className="w-16 h-16 rounded-full overflow-hidden border border-border mr-4">
              {cat.avatar_url ? (
                <Image source={{ uri: cat.avatar_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <Image source={require('../../assets/images/coding-kitty.jpg')} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-text-primary font-bold text-lg mb-1">{cat.name}</Text>
              <View className="flex-row items-center flex-wrap">
                <Text className="text-text-secondary text-xs mr-3 font-medium">• {cat.breed || 'Mixed'}</Text>
                <Text className="text-text-secondary text-xs mr-3 font-medium">• {cat.age_years ? `${cat.age_years} yrs` : 'Age N/A'}</Text>
                <Text className="text-text-secondary text-xs font-medium">• {cat.base_weight_kg ? `${cat.base_weight_kg} kg` : 'Weight N/A'}</Text>
              </View>
            </View>

            <View className="ml-2 items-center justify-center px-3.5 py-2 rounded-2xl bg-[#E8EEF2]">
              <Text className="text-[11px] font-bold uppercase tracking-widest mb-0.5 text-[#1E293B]">BCS</Text>
              <Text className="font-black text-[22px] text-primary-cool">
                {latestCheck?.bcs_score ? latestCheck.bcs_score : '?'}
                <Text className="text-sm font-bold text-primary-cool">/9</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Incomplete Profile Banner */}
        {isProfileIncomplete && (
          <TouchableOpacity 
            onPress={() => router.push('/profile')}
            className="bg-warning-light border border-warning rounded-2xl p-4 mb-8 flex-row items-center shadow-sm"
          >
            <View className="bg-warning w-10 h-10 rounded-full items-center justify-center mr-3">
              <AlertCircle size={20} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-warning-dark font-bold text-base mb-0.5">Profile Incomplete</Text>
              <Text className="text-warning-dark text-sm">Add weight and age to enable AI health checks.</Text>
            </View>
            <ChevronRight size={20} color="#b45309" />
          </TouchableOpacity>
        )}

        {/* Start New Health Check CTA */}
        <TouchableOpacity 
          onPress={() => router.push('/camera')} 
          className="bg-primary-cool rounded-[2rem] p-5 mb-8 flex-row items-center justify-between"
        >
          <View className="flex-1 mr-3">
            <View className="bg-[#FDE047] px-2.5 py-0.5 rounded-full self-start mb-2 shadow-sm">
              <Text className="text-[#854D0E] text-[10px] font-black uppercase tracking-widest">AI Analysis</Text>
            </View>
            <Text className="text-white font-black text-xl mb-1 tracking-tight">New Health Check</Text>
            <Text className="text-white/90 text-sm font-medium leading-tight">Scan {cat.name} for an instant AI body analysis.</Text>
          </View>
          <View className="bg-white w-12 h-12 rounded-full items-center justify-center shadow-sm">
            <Camera size={26} color="#EAB308" strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        {/* Recent Checks */}
        <View className="mb-5 flex-row justify-between items-center">
          <Text className="text-text-primary font-black text-2xl tracking-tight">Recent Checks</Text>
          <TouchableOpacity onPress={() => router.push('/history')} className="bg-surface-tertiary px-4 py-1.5 rounded-full">
            <Text className="text-primary-cool-dark font-bold text-sm">See all</Text>
          </TouchableOpacity>
        </View>

        {latestCheck ? (
          <TouchableOpacity 
            onPress={() => router.push(`/history/${latestCheck.id}`)}
            className="bg-background border border-border rounded-2xl p-5 shadow-sm mb-4"
          >
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-text-secondary font-medium">
                {new Date(latestCheck.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
              <View className={`px-3 py-1 rounded-full ${latestCheck.status === 'completed' ? 'bg-[#E6F4F1]' : 'bg-surface-tertiary'}`}>
                <Text className={`font-bold text-xs ${latestCheck.status === 'completed' ? 'text-primary-cool' : 'text-text-muted'}`}>
                  {latestCheck.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-text-primary font-bold text-lg">BCS Score</Text>
                <Text className="text-primary-cool font-black text-3xl mt-1">{latestCheck.bcs_score || '-'}<Text className="text-lg text-text-secondary font-bold">/9</Text></Text>
              </View>
              <ChevronRight size={24} color="#94a3b8" />
            </View>
          </TouchableOpacity>
        ) : (
          <View className="bg-background border border-border border-dashed rounded-2xl p-8 items-center justify-center">
            <Activity size={32} color="#cbd5e1" />
            <Text className="text-text-secondary font-medium text-center mt-3">No health checks yet.</Text>
            <Text className="text-slate-400 text-sm text-center mt-1">Start a new scan to track {cat.name}'s progress.</Text>
          </View>
        )}

        </View>
      </ScrollView>
    </View>
  );
}
