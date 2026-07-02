import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, DeviceEventEmitter, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, CloudUpload, Save, Image as ImageIcon, Check, Edit2, LogOut, Pencil, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useActiveCat } from '../../lib/ActiveCatContext';
import { supabase } from '../../lib/supabase';
import { validateCatProfile, FieldError } from '../../lib/catProfileValidator';
import { Skeleton } from '../../components/ui/Skeleton';

/**
 * ProfileScreen provides the interface for managing owner and cat profiles.
 * It allows editing the owner's name and avatar, creating new cat profiles,
 * updating existing cat profiles, and switching between active cats.
 *
 * @returns The rendered React element for the Profile screen.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeCatId, setActiveCatId, showGuestModal } = useActiveCat();

  const [cats, setCats] = useState<any[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Owner form state
  const ownerInputRef = useRef<TextInput>(null);
  const [originalOwnerName, setOriginalOwnerName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerTextWidth, setOwnerTextWidth] = useState(60);
  const [ownerAvatarUri, setOwnerAvatarUri] = useState<string | null>(null);
  const [isSavingOwner, setIsSavingOwner] = useState(false);
  const [isEditingOwner, setIsEditingOwner] = useState(false);

  // Local form state for Cat
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const typingIntervals = useRef<{ [key: string]: NodeJS.Timeout | null }>({});

  const simulateTyping = (key: string, textToType: string, setter: (text: string) => void) => {
    if (typingIntervals.current[key]) {
      clearInterval(typingIntervals.current[key]!);
    }
    let i = 0;
    setter('');
    typingIntervals.current[key] = setInterval(() => {
      setter(textToType.substring(0, i + 1));
      i++;
      if (i === textToType.length) {
        if (typingIntervals.current[key]) {
          clearInterval(typingIntervals.current[key]!);
          typingIntervals.current[key] = null;
        }
      }
    }, 50);
  };
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const pendingAddCat = useRef(false);

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  // Computed state for UI
  const isComplete = name.trim() !== '' && age.trim() !== '' && weight.trim() !== '';
  
  const hasChanges = isCreatingNew || (() => {
    const cat = cats.find(c => c.id === activeCatId);
    if (!cat) return true;
    
    const originalName = cat.name || '';
    const originalBreed = cat.breed || '';
    const originalAge = cat.age_years ? String(cat.age_years) : '';
    const originalWeight = cat.base_weight_kg ? String(cat.base_weight_kg) : '';
    const originalAvatar = cat.avatar_url || null;

    return name !== originalName ||
           breed !== originalBreed ||
           age !== originalAge ||
           weight !== originalWeight ||
           avatarUri !== originalAvatar;
  })();

  const canSave = isComplete && hasChanges && !isSaving;

  /**
   * Fetches the authenticated user's profile and their associated cats
   * from Supabase to populate the form state on mount.
   */
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setIsGuest(user.is_anonymous || false);

      setOriginalOwnerName(user.user_metadata?.full_name || '');
      setOwnerName(user.user_metadata?.full_name || '');
      setOwnerAvatarUri(user.user_metadata?.avatar_url || null);

      const { data, error } = await supabase
        .from('cats')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) {
        setCats(data);
        // Clear stale activeCatId from a previous session if it doesn't belong to any of the current user's cats
        if (data.length === 0) {
          setActiveCatId(null);
          setIsCreatingNew(true);
        } else if (activeCatId && !data.find((c: any) => c.id === activeCatId)) {
          setActiveCatId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for cross-screen events
    const sub = DeviceEventEmitter.addListener('openAddCat', () => {
      pendingAddCat.current = true;
      setIsCreatingNew(true);
    });
    return () => sub.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Only reset if no pending 'Add Cat' intent (from index or history tab).
      // The openAddCat event sets pendingAddCat.current = true before navigation,
      // so we skip the reset and clear the flag instead.
      // Also keep isCreatingNew=true if user has no cats yet.
      if (pendingAddCat.current) {
        pendingAddCat.current = false;
      } else if (cats.length > 0) {
        setIsCreatingNew(false);
      }
    }, [cats.length])
  );

  useEffect(() => {
    if (isCreatingNew) {
      if (isGuest && cats.length >= 1) {
        setIsCreatingNew(false);
        showGuestModal("You cannot create more cats in this simulated experience. For the real Fitty experience, please log in with a Google account.");
        return;
      }
      
      if (isGuest) {
        // Leave them empty initially so the placeholders are visible
        // When the user taps the input, it will animate typing these values
        setName('');
        setBreed('');
        setAge('');
        setWeight('');
        setAvatarUri(null);
      } else {
        setName('');
        setBreed('');
        setAge('');
        setWeight('');
        setAvatarUri(null);
      }
      return;
    }

    if (cats.length > 0) {
      const cat = cats.find(c => c.id === activeCatId) || cats[0];
      if (cat) {
        if (cat.id !== activeCatId) setActiveCatId(cat.id);
        setName(cat.name || '');
        setBreed(cat.breed || '');
        setAge(cat.age_years ? String(cat.age_years) : '');
        setWeight(cat.base_weight_kg ? String(cat.base_weight_kg) : '');
        setAvatarUri(cat.avatar_url || null);
      }
    }
  }, [activeCatId, cats, isCreatingNew]);

  /**
   * Uploads an avatar image to a specified Supabase storage bucket.
   *
   * @param uri - The local file URI of the image to upload.
   * @param bucket - The Supabase storage bucket name.
   * @param prefix - A prefix used for constructing the file name.
   * @returns The public URL of the uploaded image.
   * @throws Will throw an error if the upload fails or user is not authenticated.
   */
  const uploadAvatar = async (uri: string, bucket: string, prefix: string): Promise<string> => {
    if (uri.startsWith('http')) return uri;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const ext = uri.substring(uri.lastIndexOf('.') + 1) || 'jpg';
    const fileName = `${session.user.id}_${prefix}_${Date.now()}.${ext}`;

    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, { upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  /**
   * Opens the device's native image library to allow the user to select
   * an avatar image for the owner. It automatically saves the selection.
   */
  const pickOwnerImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setOwnerAvatarUri(uri);
      await saveOwner(ownerName, uri);
    }
  };

  /**
   * Saves the owner's updated name and avatar to Supabase auth.users.
   *
   * @param nameToSave - The new full name of the owner.
   * @param uriToSave - The local URI of the new avatar (if any).
   */
  const saveOwner = async (nameToSave: string, uriToSave: string | null) => {
    setIsSavingOwner(true);
    try {
      const finalAvatarUrl = uriToSave ? await uploadAvatar(uriToSave, 'user_avatars', 'owner') : null;
      const { error } = await supabase.auth.updateUser({
        data: { full_name: nameToSave.trim(), avatar_url: finalAvatarUrl }
      });
      if (error) throw error;
      setOriginalOwnerName(nameToSave.trim());
      setOwnerAvatarUri(finalAvatarUrl);
      setIsEditingOwner(false);
      Alert.alert('Success', 'Owner profile updated!');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSavingOwner(false);
    }
  };

  /**
   * Opens the device's native image library to allow the user to select
   * an avatar image for the currently active cat.
   */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  /**
   * Validates the cat profile form and saves or updates the cat record
   * in the Supabase database. Handles avatar uploading if a new local URI is selected.
   */
  const handleSave = async () => {
    setErrors([]);
    const input = {
      name: name.trim(),
      breed: breed.trim() || undefined,
      age_years: age.trim() ? parseInt(age.trim(), 10) : null,
      base_weight_kg: weight.trim() ? parseFloat(weight.trim()) : null,
    };

    const validation = validateCatProfile(input);
    if (!validation.valid) {
      setErrors(validation.errors);
      DeviceEventEmitter.emit('showToast', validation.errors[0].message);
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const finalAvatarUrl = avatarUri ? await uploadAvatar(avatarUri, 'cat_avatars', 'cat') : null;
      const payload = {
        user_id: user.id,
        name: input.name,
        breed: input.breed,
        age_years: input.age_years,
        base_weight_kg: input.base_weight_kg,
        avatar_url: finalAvatarUrl,
      };

      // Data-driven decision: only UPDATE if activeCatId actually exists in the user's cat list.
      // This prevents stale activeCatId values (from previous anonymous sessions) from
      // silently running an RLS-blocked UPDATE instead of the intended INSERT.
      const existingCat = cats.find(c => c.id === activeCatId);
      const shouldUpdate = !!existingCat && !isCreatingNew;

      if (shouldUpdate) {
        const { error } = await supabase.from('cats').update(payload).eq('id', activeCatId);
        if (error) throw error;
        DeviceEventEmitter.emit('showToast', 'Profile updated successfully!');
      } else {
        const { data, error } = await supabase.from('cats').insert(payload).select('id').single();
        if (error) throw error;
        if (data?.id) {
          setIsCreatingNew(false);
          await setActiveCatId(data.id);
          DeviceEventEmitter.emit('showToast', 'Cat added successfully!');
        }
      }
      fetchData();
    } catch (err: any) {
      DeviceEventEmitter.emit('showToast', err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Logs the current user out of Supabase and clears the active session.
   * Navigation to the login screen is handled automatically by the auth listener.
   */
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  const confirmSignOut = () => {
    setIsSignOutModalVisible(true);
  };

  const getFieldError = (field: string) => errors.find(e => e.field === field)?.message;

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface">
        <View className="flex-1 bg-surface">
          <ScrollView ref={scrollViewRef} className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} bounces={false} keyboardShouldPersistTaps="handled">
            {/* Skeleton Dark Header Container */}
            <View 
              className="bg-[#1A2530] rounded-b-[2.5rem] px-6 pb-6 mb-6" 
              style={{ paddingTop: Platform.OS === 'web' ? 72 : Math.max(insets.top + 16, 60) }}
            >
              <View className="mb-8 flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <Text className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Owner Profile</Text>
                  <Skeleton width={150} height={36} borderRadius={8} className="bg-white/10" />
                </View>
                <Skeleton width={56} height={56} borderRadius={28} className="bg-white/10 border-2 border-[#2A3B4C]" />
              </View>

              <View className="mb-2">
                <Text className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Manage Your Cats</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                  <Skeleton width={120} height={40} borderRadius={20} className="mr-3 bg-white/20" />
                  <Skeleton width={100} height={40} borderRadius={20} className="mr-3 bg-white/10" />
                  <Skeleton width={100} height={40} borderRadius={20} className="bg-white/10" />
                </ScrollView>
              </View>
            </View>

            {/* Skeleton Body */}
            <View className="px-6 pt-6">
              <Skeleton width={160} height={28} borderRadius={8} className="mb-8" />
              
              <View className="items-center mb-10">
                <Skeleton width={128} height={128} borderRadius={32} />
                <Skeleton width={120} height={16} borderRadius={4} className="mt-4" />
              </View>

              <View className="flex-row gap-4 mb-5">
                <View style={{ flex: 2 }}>
                  <Skeleton width={80} height={20} borderRadius={4} className="mb-2" />
                  <Skeleton width="100%" height={56} borderRadius={16} />
                </View>
                <View style={{ flex: 1 }}>
                  <Skeleton width={40} height={20} borderRadius={4} className="mb-2" />
                  <Skeleton width="100%" height={56} borderRadius={16} />
                </View>
              </View>

              <View className="mb-5">
                <Skeleton width={60} height={20} borderRadius={4} className="mb-2" />
                <Skeleton width="100%" height={56} borderRadius={16} />
              </View>
              
              <View className="mb-8">
                <Skeleton width={60} height={20} borderRadius={4} className="mb-2" />
                <Skeleton width="100%" height={56} borderRadius={16} />
              </View>

              <Skeleton width="100%" height={56} borderRadius={28} />
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 bg-surface">
        <ScrollView ref={scrollViewRef} className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} bounces={false} keyboardShouldPersistTaps="handled">
          
          {/* Dark Header Container */}
          <View 
            className="bg-[#1A2530] rounded-b-[2.5rem] px-6 pb-6 mb-6" 
            style={{ paddingTop: Platform.OS === 'web' ? 72 : Math.max(insets.top + 16, 60) }}
          >
            <View className="mb-8 flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Owner Profile</Text>
                <View className="flex-row items-center relative">
                  {/* The visible text that dictates layout */}
                  <Text className={`text-3xl font-black tracking-tight ${isEditingOwner ? 'opacity-0' : 'text-white'}`}>
                    {ownerName || (isEditingOwner ? 'Your name' : 'Judge')}
                  </Text>

                  {/* The input overlays the text perfectly, constrained to its exact bounding box */}
                  {isEditingOwner && (
                    <TextInput
                      ref={ownerInputRef}
                      value={ownerName}
                      onChangeText={setOwnerName}
                      placeholder="Your name"
                      placeholderTextColor="#94a3b8"
                      className="absolute left-0 right-0 text-3xl font-black text-white tracking-tight p-0 m-0"
                      style={[
                        Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {},
                        { height: '100%', backgroundColor: 'transparent' }
                      ]}
                      autoFocus
                    />
                  )}

                  {/* The button, which follows the Text layout perfectly */}
                  <View className="z-10 ml-3">
                    {isEditingOwner ? (
                      <TouchableOpacity onPress={() => saveOwner(ownerName, ownerAvatarUri)} className="w-8 h-8 rounded-full bg-[#74B7B5] items-center justify-center">
                        {isSavingOwner ? <ActivityIndicator size="small" color="white" /> : <Check size={16} color="white" />}
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={() => setIsEditingOwner(true)} className="w-8 h-8 rounded-full bg-[#2A3B4C] items-center justify-center">
                        <Pencil size={14} color="#cbd5e1" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
              
              <TouchableOpacity onPress={pickOwnerImage} className="w-14 h-14 rounded-full border-2 border-[#2A3B4C] bg-surface-tertiary relative">
                <View className="w-full h-full rounded-full overflow-hidden">
                  {ownerAvatarUri ? (
                    <Image source={{ uri: ownerAvatarUri }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Image source={require('../../assets/images/vito-corleone.webp')} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  )}
                </View>
                <View className="absolute -bottom-1.5 -right-1.5 bg-[#74B7B5] w-7 h-7 rounded-full items-center justify-center border-[3px] border-white">
                  <CloudUpload size={12} color="white" />
                </View>
              </TouchableOpacity>
            </View>

            <View className="mb-2">
              <Text className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Manage Your Cats</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {isLoading && cats.length === 0 && (
                  <>
                    <Skeleton width={100} height={40} borderRadius={20} className="mr-3 bg-white/20" />
                    <Skeleton width={80} height={40} borderRadius={20} className="mr-3 bg-white/20" />
                  </>
                )}
                {[...cats].sort((a, b) => a.id === activeCatId ? -1 : b.id === activeCatId ? 1 : 0).map(c => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => { setActiveCatId(c.id); setIsCreatingNew(false); }}
                    className={`flex-row items-center px-4 py-2 rounded-full mr-3 ${c.id === activeCatId && !isCreatingNew ? 'bg-[#74B7B5]' : 'bg-[#2A3B4C]'}`}
                  >
                    {c.avatar_url ? (
                      <Image source={{ uri: c.avatar_url }} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }} />
                    ) : (
                      <Image source={require('../../assets/images/coding-kitty.jpg')} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }} />
                    )}
                    <Text className={`font-semibold ${c.id === activeCatId && !isCreatingNew ? 'text-white' : 'text-white/80'}`}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                
                {!isLoading && (
                  <TouchableOpacity
                    onPress={() => setIsCreatingNew(true)}
                    className={`flex-row items-center px-4 py-2 rounded-full ${isCreatingNew ? 'bg-[#74B7B5]' : 'border border-dashed border-[#74B7B5] bg-transparent'}`}
                  >
                    <Plus size={18} color={isCreatingNew ? 'white' : '#74B7B5'} />
                    <Text className={`font-semibold ml-1 ${isCreatingNew ? 'text-white' : 'text-[#74B7B5]'}`}>Add Cat</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </View>

          <View className="px-6 pt-6">
            <Text className="text-text-primary text-xl font-black tracking-tight mb-4">
              {isCreatingNew ? 'Add New Cat' : `Edit ${name || 'Cat'}`}
            </Text>
            
            <View className="items-center mb-5">
              <View className="relative">
                <TouchableOpacity onPress={pickImage} className="w-32 h-32 rounded-[2rem] bg-surface-tertiary items-center justify-center overflow-hidden border-2 border-border">
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Image source={require('../../assets/images/coding-kitty.jpg')} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={pickImage} className="absolute -bottom-2 -right-2 bg-[#74B7B5] w-10 h-10 rounded-full items-center justify-center border-4 border-surface shadow-sm">
                  <CloudUpload size={18} color="white" />
                </TouchableOpacity>
              </View>
              <Text className="text-text-secondary text-sm mt-4 font-medium">Tap to update photo</Text>
            </View>

            {/* Name and Age Row */}
            <View className="flex-row gap-4 mb-5">
              {/* Name */}
              <View style={{ flex: 2 }}>
                <Text className="text-text-primary font-bold mb-2">Cat's Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  onFocus={() => {
                    if (isGuest && name === '') {
                      simulateTyping('name', 'Coding Kitty', setName);
                    }
                  }}
                  placeholder="Coding Kitty"
                  placeholderTextColor="#94a3b8"
                  className={`bg-background border rounded-2xl px-4 py-4 text-text-primary text-base ${getFieldError('name') ? 'border-error' : 'border-border'}`}
                  style={Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}}
                />
                {getFieldError('name') && <Text className="text-error text-sm mt-1">{getFieldError('name')}</Text>}
              </View>

              {/* Age */}
              <View style={{ flex: 1 }}>
                <Text className="text-text-primary font-bold mb-2">Age (yrs)</Text>
                <TextInput
                  value={age}
                  onChangeText={setAge}
                  onFocus={() => {
                    if (isGuest && age === '') {
                      simulateTyping('age', '3', setAge);
                    }
                  }}
                  placeholder="3"
                  keyboardType="numeric"
                  placeholderTextColor="#94a3b8"
                  className={`bg-background border rounded-2xl px-4 py-4 text-text-primary text-base ${getFieldError('age_years') ? 'border-error' : 'border-border'}`}
                  style={Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}}
                />
                {getFieldError('age_years') && <Text className="text-error text-sm mt-1">{getFieldError('age_years')}</Text>}
              </View>
            </View>

            {/* Breed */}
            <View className="mb-5">
              <Text className="text-text-primary font-bold mb-2">Breed</Text>
              <TextInput
                value={breed}
                onChangeText={setBreed}
                onFocus={() => {
                  if (isGuest && breed === '') {
                    simulateTyping('breed', 'British Shorthair', setBreed);
                  }
                }}
                placeholder="British Shorthair"
                placeholderTextColor="#94a3b8"
                className="bg-background border border-border rounded-2xl px-4 py-4 text-text-primary text-base"
                style={Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}}
              />
            </View>

            {/* Weight */}
            <View className="mb-2">
              <Text className="text-text-primary font-bold mb-2">Base Weight (kg) <Text className="text-warning-dark">*</Text></Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                onFocus={() => {
                  if (isGuest && weight === '') {
                    simulateTyping('weight', '4.5', setWeight);
                  }
                }}
                placeholder="4.5"
                keyboardType="numeric"
                placeholderTextColor="#94a3b8"
                className={`bg-background border rounded-2xl px-4 py-4 text-text-primary text-base ${getFieldError('base_weight_kg') ? 'border-error' : 'border-border'}`}
                style={Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}}
              />
              {getFieldError('base_weight_kg') && <Text className="text-error text-sm mt-1">{getFieldError('base_weight_kg')}</Text>}
            </View>
            <Text className="text-text-secondary text-sm mb-6"><Text className="text-warning-dark">*</Text> Base weight is required to enable AI health checks.</Text>

            <TouchableOpacity
              onPress={handleSave}
              disabled={!canSave}
              className={`flex-row items-center justify-center rounded-2xl mb-8 ${canSave ? 'bg-[#74B7B5]' : 'bg-surface-tertiary'}`}
              style={{ height: 56 }}
            >
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Save size={22} color={canSave ? "white" : "#94a3b8"} />
                  <Text className={`font-bold text-lg ml-2 ${canSave ? "text-white" : "text-slate-400"}`}>
                    {isCreatingNew ? "Create Cat's Profile" : "Save Cat's Profile"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={confirmSignOut}
              className="flex-row items-center justify-center py-4 border border-[#e2e8f0] rounded-2xl bg-transparent mb-8"
            >
              <View style={{ transform: [{ scaleX: -1 }] }}>
                <LogOut size={20} color="#ef4444" />
              </View>
              <Text className="font-bold text-lg ml-2 text-[#ef4444]">
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>

    {/* Custom Sign Out Modal */}
    <Modal
      transparent
      visible={isSignOutModalVisible}
      animationType="fade"
      onRequestClose={() => setIsSignOutModalVisible(false)}
    >
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={() => setIsSignOutModalVisible(false)} 
        className="flex-1 bg-black/60 items-center justify-center px-6"
      >
        <TouchableOpacity 
          activeOpacity={1} 
          className="bg-surface w-full max-w-[340px] rounded-3xl p-6 items-center shadow-xl"
        >
          <View className="w-16 h-16 rounded-full bg-error-light items-center justify-center mb-4" style={{ transform: [{ scaleX: -1 }] }}>
            <LogOut size={28} color="#ef4444" />
          </View>
          <Text className="text-xl font-black text-text-primary mb-2 text-center">Sign Out</Text>
          <Text className="text-text-secondary text-center mb-8">
            Are you sure you want to leave? If you are using a Guest account, your data will be permanently lost.
          </Text>
          <View className="flex-row gap-3 w-full">
            <TouchableOpacity
              onPress={() => setIsSignOutModalVisible(false)}
              className="flex-1 py-3.5 rounded-2xl bg-surface-tertiary items-center justify-center"
            >
              <Text className="font-bold text-text-secondary text-base">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setIsSignOutModalVisible(false);
                handleSignOut();
              }}
              className="flex-1 py-3.5 rounded-2xl bg-error items-center justify-center"
            >
              <Text className="font-bold text-white text-base">Confirm</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
    </View>
  );
}
