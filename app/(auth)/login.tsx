import { View, Text, TouchableOpacity, Image } from "react-native";
import { supabase } from "../../lib/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const handleGuestLogin = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error("[login]", error.message);
    }
  };

  return (
    <View className="flex-1 bg-background px-6 pt-24 pb-12 justify-between">
      {/* Top Section - Logo & Branding */}
      <View className="items-center">
        <Image 
          source={require("../../assets/images/fitty-logo.png")} 
          style={{ width: 100, height: 100 }}
          resizeMode="contain"
          className="mb-6 rounded-[24px]"
        />
        <Text className="text-4xl font-sans text-text-primary font-black tracking-tight mb-2">Fitty</Text>
        <Text className="text-base text-text-secondary mb-8">Your cat's personal health companion</Text>
        
        {/* Pagination Dots (Onboarding mockup) */}
        <View className="flex-row items-center space-x-2 gap-2">
          <View className="w-1.5 h-1.5 rounded-full bg-primary-cool-light" />
          <View className="w-1.5 h-1.5 rounded-full bg-primary-cool-light" />
          <View className="w-1.5 h-1.5 rounded-full bg-primary-cool-light" />
          <View className="w-4 h-1.5 rounded-full bg-primary-cool" />
        </View>
      </View>

      {/* Bottom Section - Actions */}
      <View className="w-full">
        <TouchableOpacity 
          className="w-full bg-background border border-border py-4 rounded-2xl flex-row justify-center items-center mb-4 shadow-sm opacity-50"
          onPress={() => console.log("Google Login Not Implemented Yet")}
          activeOpacity={0.7}
          disabled={true}
        >
          <Ionicons name="logo-google" size={20} color="#1A303F" className="mr-3" style={{ marginRight: 12 }} />
          <Text className="text-text-primary font-bold text-base">Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="w-full bg-primary-warm py-4 rounded-2xl flex-row justify-center items-center mb-8 opacity-50"
          onPress={handleGuestLogin}
          activeOpacity={0.8}
          disabled={true}
        >
          <Ionicons name="flash-outline" size={20} color="#1A303F" className="mr-3" style={{ marginRight: 12 }} />
          <Text className="text-[#1A303F] font-bold text-base">Continue as Guest (Judge Mode)</Text>
        </TouchableOpacity>

        <Text className="text-xs text-text-secondary text-center">
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
      </View>
    </View>
  );
}
