import { View, Text, TouchableOpacity, Linking } from "react-native";
import { Info, ExternalLink } from "lucide-react-native";

/**
 * BCSInfoCard explains what the Body Condition Score is and why it matters.
 * Displayed below the main content on Dashboard and History pages.
 *
 * @returns A card component with BCS educational content.
 */
export function BCSInfoCard() {
  return (
    <View className="bg-background border border-border rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <View className="flex-row items-center mb-3" style={{ gap: 6 }}>
        <Info size={20} color="#589694" />
        <Text className="text-text-primary text-base font-bold">What is BCS?</Text>
      </View>

      <Text className="text-text-secondary text-sm leading-relaxed mb-4">
        The Body Condition Score is a 1–9 scale used by veterinarians to assess a cat's body fat — without needing a scale.
      </Text>

      {/* Scale legend */}
      <View className="bg-surface rounded-xl p-4">
        <View className="flex-row items-center mb-2.5">
          <View className="bg-error-light rounded-md mr-3" style={{ width: 36, paddingVertical: 3, alignItems: 'center' }}>
            <Text className="text-error-dark text-xs font-bold">1–2</Text>
          </View>
          <Text className="text-text-secondary text-sm">Severely underweight</Text>
        </View>

        <View className="flex-row items-center mb-2.5">
          <View className="bg-warning-light rounded-md mr-3" style={{ width: 36, paddingVertical: 3, alignItems: 'center' }}>
            <Text className="text-warning-dark text-xs font-bold">3–4</Text>
          </View>
          <Text className="text-text-secondary text-sm">Slightly underweight</Text>
        </View>

        <View className="flex-row items-center mb-2.5">
          <View className="bg-success-light rounded-md mr-3" style={{ width: 36, paddingVertical: 3, alignItems: 'center' }}>
            <Text className="text-success-dark text-xs font-bold">5</Text>
          </View>
          <Text className="text-text-secondary text-sm font-bold">Ideal weight ✓</Text>
        </View>

        <View className="flex-row items-center mb-2.5">
          <View className="bg-warning-light rounded-md mr-3" style={{ width: 36, paddingVertical: 3, alignItems: 'center' }}>
            <Text className="text-warning-dark text-xs font-bold">6–7</Text>
          </View>
          <Text className="text-text-secondary text-sm">Slightly overweight</Text>
        </View>

        <View className="flex-row items-center">
          <View className="bg-error-light rounded-md mr-3" style={{ width: 36, paddingVertical: 3, alignItems: 'center' }}>
            <Text className="text-error-dark text-xs font-bold">8–9</Text>
          </View>
          <Text className="text-text-secondary text-sm">Severely overweight</Text>
        </View>

        <View style={{ borderTopWidth: 1, borderTopColor: '#e2e8f0', marginTop: 14, paddingTop: 12 }}>
          <TouchableOpacity 
            onPress={() => Linking.openURL('https://wsava.org/wp-content/uploads/2020/08/Body-Condition-Score-cat-updated-August-2020.pdf')}
            className="flex-row items-center justify-center"
          >
            <Text className="text-primary-cool-dark text-sm font-semibold mr-1.5">View WSAVA BCS Chart</Text>
            <ExternalLink size={14} color="#589694" />
          </TouchableOpacity>
        </View>
      </View>

      <Text className="text-text-muted text-xs mt-4 leading-relaxed text-center font-bold">
        Regular tracking helps detect weight changes early — preventing health issues before they become serious.
      </Text>
    </View>
  );
}
