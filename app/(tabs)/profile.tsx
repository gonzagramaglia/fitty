import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, CloudUpload, Save, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useActiveCat } from '../../lib/ActiveCatContext';
import { supabase } from '../../lib/supabase';
import { validateCatProfile, FieldError } from '../../lib/catProfileValidator';

export default function ProfileScreen() {
  const { activeCatId, setActiveCatId } = useActiveCat();

  const [cats, setCats] = useState<any[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Local form state
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FieldError[]>([]);

  // Computed state for UI
  const isComplete = name.trim() !== '' && age.trim() !== '' && weight.trim() !== '';

  const fetchCats = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data, error } = await supabase
        .from('cats')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setCats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCats();
  }, []);

  useEffect(() => {
    if (isCreatingNew) {
      setName('');
      setBreed('');
      setAge('');
      setWeight('');
      setAvatarUri(null);
      return;
    }

    if (cats.length > 0) {
      // Find the active cat, or default to the first one if activeCatId is invalid
      const cat = cats.find(c => c.id === activeCatId) || cats[0];
      if (cat) {
        if (cat.id !== activeCatId) setActiveCatId(cat.id);
        setName(cat.name || '');
        setBreed(cat.breed || '');
        setAge(cat.age_years ? String(cat.age_years) : '');
        setWeight(cat.base_weight_kg ? String(cat.base_weight_kg) : '');
        setAvatarUri(cat.avatar_url || null);
      }
    } else if (!isLoading) {
      // If no cats exist, force create new mode
      setIsCreatingNew(true);
    }
  }, [activeCatId, cats, isCreatingNew, isLoading]);

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

  const uploadAvatar = async (uri: string): Promise<string> => {
    if (uri.startsWith('http')) return uri;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const ext = uri.substring(uri.lastIndexOf('.') + 1) || 'jpg';
    const fileName = `${session.user.id}_${Date.now()}.${ext}`;

    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('cat_avatars')
      .upload(fileName, blob, { upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('cat_avatars')
      .getPublicUrl(fileName);

    return publicUrl;
  };

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
      Alert.alert('Validation Error', validation.errors[0].message);
      return;
    }

    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      let finalAvatarUrl = avatarUri;
      if (avatarUri && !avatarUri.startsWith('http')) {
        finalAvatarUrl = await uploadAvatar(avatarUri);
      }

      const payload = {
        user_id: session.user.id,
        name: input.name,
        breed: input.breed,
        age_years: input.age_years,
        base_weight_kg: input.base_weight_kg,
        avatar_url: finalAvatarUrl,
      };

      if (!isCreatingNew && activeCatId) {
        // Update existing
        const { error } = await supabase
          .from('cats')
          .update(payload)
          .eq('id', activeCatId);
        if (error) throw error;
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('cats')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        if (data?.id) {
          await setActiveCatId(data.id);
          setIsCreatingNew(false);
          Alert.alert('Success', 'Cat added successfully!');
        }
      }

      // Refresh list
      fetchCats();

    } catch (err: any) {
      console.error('Error saving profile:', err);
      Alert.alert('Error', err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getFieldError = (field: string) => errors.find(e => e.field === field)?.message;

  if (isLoading && cats.length === 0) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#74B7B5" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-10" contentContainerStyle={{ paddingBottom: 40 }}>

          <Text className="text-3xl font-bold text-text-primary mb-6">Cat Profile</Text>

          {/* Cat Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-8">
            {cats.map(cat => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => { setActiveCatId(cat.id); setIsCreatingNew(false); }}
                className={`flex-row items-center px-4 py-2 rounded-full mr-3 border ${activeCatId === cat.id && !isCreatingNew ? 'bg-text-primary border-text-primary' : 'bg-background border-border'}`}
              >
                {cat.avatar_url ? (
                  <Image source={{ uri: cat.avatar_url }} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }} className="bg-surface-tertiary" />
                ) : (
                  <Image source={require('../../assets/images/coding-kitty.jpg')} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }} className="bg-surface-tertiary" />
                )}
                <Text className={`font-semibold ${activeCatId === cat.id && !isCreatingNew ? 'text-white' : 'text-text-primary'}`}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setIsCreatingNew(true)}
              className={`flex-row items-center px-4 py-2 rounded-full border ${isCreatingNew ? 'bg-primary-cool border-primary-cool' : 'border-dashed bg-background border-primary-cool'}`}
            >
              <Plus size={18} color={isCreatingNew ? 'white' : '#589694'} />
              <Text className={`font-semibold ml-1 ${isCreatingNew ? 'text-white' : 'text-primary-cool-dark'}`}>Add Cat</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Avatar Picker */}
          <View className="items-center mb-10">
            <View className="relative">
              <TouchableOpacity
                onPress={pickImage}
                className="w-32 h-32 rounded-[2rem] bg-surface-tertiary items-center justify-center overflow-hidden border border-border"
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
                ) : !isCreatingNew ? (
                  <Image source={require('../../assets/images/coding-kitty.jpg')} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
                ) : (
                  <ImageIcon size={32} color="#94a3b8" />
                )}
              </TouchableOpacity>
              {/* Upload Badge */}
              <TouchableOpacity
                onPress={pickImage}
                className="absolute -bottom-2 -right-2 bg-primary-cool w-10 h-10 rounded-full items-center justify-center border-4 border-surface"
              >
                <CloudUpload size={18} color="white" />
              </TouchableOpacity>
            </View>
            <Text className="text-text-secondary text-sm mt-4 font-medium">Tap to upload photo</Text>
          </View>

          {/* Form Fields */}
          <View className="space-y-6">

            {/* Name and Age Row */}
            <View className="flex-row gap-4 mb-4">
              {/* Name */}
              <View style={{ flex: 2 }}>
                <Text className="text-text-primary font-bold mb-2">Cat's Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Luna"
                  placeholderTextColor="#94a3b8"
                  className={`bg-background border rounded-2xl px-4 py-4 text-text-primary text-base ${getFieldError('name') ? 'border-error' : 'border-border'}`}
                />
                {getFieldError('name') && <Text className="text-error text-sm mt-1">{getFieldError('name')}</Text>}
              </View>

              {/* Age */}
              <View style={{ flex: 1 }}>
                <Text className="text-text-primary font-bold mb-2">Age (yrs)</Text>
                <TextInput
                  value={age}
                  onChangeText={setAge}
                  placeholder="3"
                  keyboardType="numeric"
                  placeholderTextColor="#94a3b8"
                  className={`bg-background border rounded-2xl px-4 py-4 text-text-primary text-base ${getFieldError('age_years') ? 'border-error' : 'border-border'}`}
                />
                {getFieldError('age_years') && <Text className="text-error text-sm mt-1">{getFieldError('age_years')}</Text>}
              </View>
            </View>

            {/* Breed */}
            <View className="mb-4">
              <Text className="text-text-primary font-bold mb-2">Breed</Text>
              <TextInput
                value={breed}
                onChangeText={setBreed}
                placeholder="British Shorthair"
                placeholderTextColor="#94a3b8"
                className="bg-background border border-border rounded-2xl px-4 py-4 text-text-primary text-base"
              />
            </View>

            {/* Weight */}
            <View className="mb-2">
              <Text className="text-text-primary font-bold mb-2">Base Weight (kg) <Text className="text-warning-dark">*</Text></Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                placeholder="4.3"
                keyboardType="numeric"
                placeholderTextColor="#94a3b8"
                className={`bg-background border rounded-2xl px-4 py-4 text-text-primary text-base ${getFieldError('base_weight_kg') ? 'border-error' : 'border-border'}`}
              />
              {getFieldError('base_weight_kg') && <Text className="text-error text-sm mt-1">{getFieldError('base_weight_kg')}</Text>}
            </View>
            <Text className="text-text-secondary text-sm mb-10"><Text className="text-warning-dark">*</Text> Base weight is required to enable AI health checks</Text>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={!isComplete || isSaving}
              className={`flex-row items-center justify-center py-4 mb-8 rounded-2xl ${isComplete ? 'bg-primary-cool' : 'bg-surface-tertiary'}`}
            >
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Save size={22} color={isComplete ? 'white' : '#94a3b8'} />
                  <Text className={`font-bold text-lg ml-2 ${isComplete ? 'text-white' : 'text-slate-400'}`}>
                    {isCreatingNew ? 'Create Profile' : 'Save Profile'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
