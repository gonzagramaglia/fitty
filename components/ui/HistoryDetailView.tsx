import React, { useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Image, TouchableOpacity, Platform, Modal } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Head from "expo-router/head";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, FileText, Mic, X } from "lucide-react-native";
import { useHealthCheck } from "../../hooks/useHealthCheck";
import { useActiveCat } from "../../lib/ActiveCatContext";
import { BCSGauge } from "../../components/ui/BCSGauge";
import { AIReasoningCard } from "../../components/ui/AIReasoningCard";
import { RecommendationsList } from "../../components/ui/RecommendationsList";
import { Skeleton } from "../../components/ui/Skeleton";

/**
 * HistoryDetailView is the comprehensive screen displaying a single health check record.
 * It renders the original images, the calculated BCS score on a visual gauge,
 * any provided owner notes, and the detailed AI reasoning and recommendations.
 */
export default function HistoryDetailView() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedCheckId, setSelectedCheckId } = useActiveCat();
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  
  // Need to handle missing ID gracefully since we rely on Context now
  const { healthCheck, isLoading, error } = useHealthCheck(selectedCheckId || '');

  const headerPadding = Platform.OS === 'web' ? 48 : Math.max(insets.top, 20);

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface">
        {/* Skeleton Header */}
        <View 
          className="flex-row items-center px-4 pb-4 mb-2 bg-background border-b border-border"
          style={{ paddingTop: headerPadding }}
        >
          <View className="p-2 -ml-2">
            <ChevronLeft color="#cbd5e1" size={28} />
          </View>
          <View className="flex-1 items-center mr-8">
            <Skeleton width={80} height={20} borderRadius={4} className="mb-1" />
            <Skeleton width={120} height={12} borderRadius={4} />
          </View>
        </View>

        <ScrollView className="flex-1 px-6 pt-4 pb-24" showsVerticalScrollIndicator={false}>
          {/* Skeleton Photos Row */}
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1">
              <Skeleton width={60} height={12} borderRadius={4} className="mb-2 ml-1" />
              <Skeleton width="100%" height={128} borderRadius={16} />
            </View>
            <View className="flex-1">
              <Skeleton width={60} height={12} borderRadius={4} className="mb-2 ml-1" />
              <Skeleton width="100%" height={128} borderRadius={16} />
            </View>
          </View>

          {/* Skeleton BCS Gauge */}
          <Skeleton width="100%" height={120} borderRadius={16} className="mb-6" />

          {/* Skeleton AI Reasoning */}
          <Skeleton width="100%" height={160} borderRadius={16} className="mb-6" />

          {/* Skeleton Recommendations */}
          <Skeleton width="100%" height={200} borderRadius={16} className="mb-12" />
        </ScrollView>
      </View>
    );
  }

  if (error || !healthCheck) {
    return (
      <View className="flex-1 bg-surface justify-center items-center px-6">
        <Text className="text-error text-center mb-4">{error || "Health check not found"}</Text>
        <TouchableOpacity 
          className="bg-primary-cool px-6 py-3 rounded-xl"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)/history");
            }
          }}
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dateFormatted = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(healthCheck.created_at));

  return (
    <>
      <Head>
        <title>{healthCheck.cats?.name ? `${healthCheck.cats.name}'s Results` : 'Results'} | Fitty</title>
      </Head>
      <View className="flex-1 bg-surface">
      {/* Header */}
      <View 
        className="flex-row items-center px-4 pb-4 mb-2 bg-background border-b border-border"
        style={{ paddingTop: headerPadding }}
      >
        <TouchableOpacity 
          onPress={() => setSelectedCheckId(null)}
          className="p-2 -ml-2"
        >
          <ChevronLeft color="#1A303F" size={28} />
        </TouchableOpacity>
        <View className="flex-1 items-center mr-8">
          <Text className="text-text-primary text-lg font-bold">
            {healthCheck.cats?.name ? `${healthCheck.cats.name}'s Results` : 'Results'}
          </Text>
          <Text className="text-text-muted text-xs">{dateFormatted}</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-4 pb-24" showsVerticalScrollIndicator={false}>
        {/* Photos Row */}
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1">
            <Text className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-2 ml-1">Top View</Text>
            {healthCheck.top_photo_url ? (
              <TouchableOpacity onPress={() => setExpandedImage(healthCheck.top_photo_url)} activeOpacity={0.8}>
                <Image 
                  source={{ uri: healthCheck.top_photo_url }} 
                  className="w-full h-32 bg-surface-secondary rounded-2xl border border-border"
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : (
              <View className="w-full h-32 bg-surface-secondary rounded-2xl border border-border items-center justify-center">
                <Text className="text-text-muted text-xs">No image</Text>
              </View>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-2 ml-1">Side View</Text>
            {healthCheck.side_photo_url ? (
              <TouchableOpacity onPress={() => setExpandedImage(healthCheck.side_photo_url)} activeOpacity={0.8}>
                <Image 
                  source={{ uri: healthCheck.side_photo_url }} 
                  className="w-full h-32 bg-surface-secondary rounded-2xl border border-border"
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : (
              <View className="w-full h-32 bg-surface-secondary rounded-2xl border border-border items-center justify-center">
                <Text className="text-text-muted text-xs">No image</Text>
              </View>
            )}
          </View>
        </View>

        {/* User Context Card */}
        {(healthCheck.text_note || healthCheck.voice_note_url) && (
          <View className="bg-background border border-border rounded-2xl p-6 shadow-sm mb-6">
            <View className="flex-row items-center mb-4">
              <FileText color="#1A303F" size={20} className="mr-2" />
              <Text className="text-text-primary text-base font-semibold">
                Additional Context
              </Text>
            </View>
            
            {healthCheck.text_note && (
              <Text className="text-text-primary leading-relaxed mb-3">
                "{healthCheck.text_note}"
              </Text>
            )}
            
            {healthCheck.voice_note_url && (
              <View className="flex-row items-center bg-surface-secondary self-start px-3 py-2 rounded-lg">
                <Mic size={16} color="#74B7B5" className="mr-2" />
                <Text className="text-text-muted text-sm font-medium">Voice note attached</Text>
              </View>
            )}
          </View>
        )}

        {/* BCS Gauge Card */}
        <View className="bg-background border border-border rounded-2xl p-6 shadow-sm mb-6">
          <Text className="text-text-primary text-base font-semibold mb-4">
            Body Condition Score
          </Text>
          <BCSGauge score={healthCheck.bcs_score} />
        </View>


        {/* AI Reasoning */}
        <View className="mb-6">
          <AIReasoningCard reasoning={healthCheck.ai_reasoning} />
        </View>

        {/* Recommendations */}
        <View className="mb-12">
          <RecommendationsList recommendations={healthCheck.recommendations} />
        </View>
      </ScrollView>

      {/* Fullscreen Image */}
      {Platform.OS === 'web' ? (
        expandedImage && (
          <View className="absolute top-0 bottom-0 left-0 right-0 z-50 bg-black/95 justify-center items-center">
            <TouchableOpacity 
              className="absolute top-12 right-6 p-3 z-10 bg-white/10 rounded-full"
              onPress={() => setExpandedImage(null)}
            >
              <X color="white" size={24} />
            </TouchableOpacity>
            <Image 
              source={{ uri: expandedImage }} 
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
        )
      ) : (
        <Modal visible={!!expandedImage} transparent={true} animationType="fade">
          <View className="flex-1 justify-center items-center bg-black/95">
            <TouchableOpacity 
              className="absolute top-12 right-6 p-3 z-10 bg-white/10 rounded-full"
              onPress={() => setExpandedImage(null)}
            >
              <X color="white" size={24} />
            </TouchableOpacity>
            {expandedImage && (
              <Image 
                source={{ uri: expandedImage }} 
                className="w-full h-full"
                resizeMode="cover"
              />
            )}
          </View>
        </Modal>
      )}
    </View>
    </>
  );
}
