import { View, Text } from "react-native";
import { CheckCircle2 } from "lucide-react-native";

type Recommendation = {
  title: string;
  description?: string;
} | string;

type Props = {
  recommendations: Recommendation[];
};

/**
 * RecommendationsList renders a list of actionable insights provided by the AI
 * based on the health check assessment. It supports both simple string lists
 * and structured objects with a title and description.
 *
 * @param props - Component props containing an array of recommendations.
 */
export function RecommendationsList({ recommendations }: Props) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <View className="bg-background border border-border rounded-2xl p-6 shadow-sm">
      <Text className="text-text-primary text-base font-semibold mb-4">
        Recommendations
      </Text>
      
      <View className="space-y-4 gap-4">
        {recommendations.map((rec, index) => {
          const isString = typeof rec === 'string';
          const title = isString ? rec : rec.title;
          const description = isString ? null : rec.description;

          return (
            <View key={`${title}-${index}`} className="flex-row items-start">
              <View className="mt-0.5 mr-3">
                <CheckCircle2 color="#74B7B5" size={18} />
              </View>
              <View className="flex-1">
                <Text className="text-text-primary text-sm font-semibold leading-relaxed">
                  {title}
                </Text>
                {description && (
                  <Text className="text-text-secondary text-sm mt-1 leading-relaxed">
                    {description}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
