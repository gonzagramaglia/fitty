import { View, Text } from "react-native";

type Props = {
  score: number;
};

/**
 * BCSGauge renders a visual slider indicating where the cat's score
 * falls on the 1-9 Body Condition Score scale. It highlights Ideal (5)
 * versus Underweight (<5) and Overweight (>5) segments.
 *
 * @param props - Component props containing the numeric BCS score.
 */
export function BCSGauge({ score }: Props) {
  // Normalize score between 1 and 9
  const safeScore = Math.max(1, Math.min(9, Math.round(score)));
  
  // Calculate width percentage
  const widthPercent = ((safeScore - 1) / 8) * 100;
  
  let fillClass = "bg-error";
  let label = "Severely Underweight";
  let labelColor = "text-error-dark";

  if (safeScore >= 3 && safeScore <= 4) {
    fillClass = "bg-primary-cool";
    label = "Slightly Underweight";
    labelColor = "text-primary-cool-dark";
  } else if (safeScore === 5) {
    fillClass = "bg-success";
    label = "Ideal Weight";
    labelColor = "text-success-dark";
  } else if (safeScore >= 6 && safeScore <= 7) {
    fillClass = "bg-warning";
    label = "Slightly Overweight";
    labelColor = "text-warning";
  } else if (safeScore >= 8) {
    fillClass = "bg-error";
    label = "Severely Overweight";
    labelColor = "text-error-dark";
  }

  return (
    <View className="w-full">
      <View className="flex-row justify-between items-end mb-2">
        <View className="flex-row items-baseline gap-1">
          <Text className={`text-3xl font-bold ${labelColor}`}>{safeScore}</Text>
          <Text className="text-text-muted text-base font-normal">/ 9</Text>
        </View>
        <View className={`px-2 py-0.5 rounded-sm bg-surface-secondary`}>
          <Text className={`text-xs font-semibold uppercase tracking-wider ${labelColor}`}>
            {label}
          </Text>
        </View>
      </View>
      
      {/* The Gauge */}
      <View className="h-2 w-full bg-border rounded-full overflow-hidden relative">
        {/* Background track is handled by bg-border on parent */}
        <View 
          className={`absolute top-0 bottom-0 left-0 ${fillClass} rounded-full`} 
          style={{ width: `${Math.max(5, widthPercent)}%` }} 
        />
      </View>

      <View className="flex-row justify-between mt-2">
        <Text className="text-text-muted text-xs">1</Text>
        <Text className="text-text-muted text-xs">5</Text>
        <Text className="text-text-muted text-xs">9</Text>
      </View>
    </View>
  );
}
