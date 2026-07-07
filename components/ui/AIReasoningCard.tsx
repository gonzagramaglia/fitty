import { View, Text } from "react-native";
import { Brain } from "lucide-react-native";

type Props = {
  reasoning: string;
};

/**
 * Parses markdown-style **bold** text into React Native Text components.
 */
function renderBoldText(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, index) => {
    // Odd indices are the bold content (captured group)
    if (index % 2 === 1) {
      return <Text key={index} className="font-bold text-text-primary">{part}</Text>;
    }
    return part;
  });
}

/**
 * AIReasoningCard displays the detailed reasoning provided by the AI model
 * explaining how it derived the Body Condition Score from the visual analysis.
 *
 * @param props - Component props containing the AI reasoning string.
 */
export function AIReasoningCard({ reasoning }: Props) {
  if (!reasoning) return null;

  return (
    <View className="bg-background border border-border rounded-2xl p-6 shadow-sm">
      <View className="flex-row items-center mb-4">
        <View className="w-8 h-8 rounded-full bg-primary-cool-light items-center justify-center mr-3">
          <Brain color="#589694" size={18} />
        </View>
        <Text className="text-text-primary text-base font-semibold">
          AI Reasoning
        </Text>
      </View>
      
      <Text className="text-text-secondary text-sm leading-relaxed">
        {renderBoldText(reasoning)}
      </Text>
    </View>
  );
}
