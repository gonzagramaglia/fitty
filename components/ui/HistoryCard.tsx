import { View, Text, Image, TouchableOpacity } from "react-native";
import { ChevronRight, FileText, Mic } from "lucide-react-native";

type Props = {
  dateString: string;
  bcsScore: number;
  thumbnailUrl?: string | any;
  hasTextNote?: boolean;
  hasVoiceNote?: boolean;
  onPress: () => void;
};

/**
 * HistoryCard displays a single past health check entry in a list.
 * It shows the date, a thumbnail of the top-down scan, the calculated BCS score,
 * and icons indicating if the user attached a voice or text note.
 *
 * @param props - Component props containing the health check summary details.
 */
export function HistoryCard({ dateString, bcsScore, thumbnailUrl, hasTextNote, hasVoiceNote, onPress }: Props) {
  const date = new Date(dateString);
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

  const isIdeal = bcsScore === 5;
  const isExtreme = bcsScore <= 2 || bcsScore >= 8;
  
  let scoreColorClass = "text-warning-dark";
  let scoreBgClass = "bg-warning-light";

  if (isIdeal) {
    scoreColorClass = "text-success-dark";
    scoreBgClass = "bg-success-light";
  } else if (isExtreme) {
    scoreColorClass = "text-error-dark";
    scoreBgClass = "bg-error-light";
  }

  return (
    <TouchableOpacity
      className="bg-background border border-border rounded-2xl p-4 flex-row items-center shadow-sm mb-3"
      onPress={onPress}
      activeOpacity={0.7}
    >
      {thumbnailUrl ? (
        <Image
          source={typeof thumbnailUrl === 'string' ? { uri: thumbnailUrl } : thumbnailUrl}
          className="w-12 h-12 rounded-xl bg-surface-secondary mr-4"
          style={{ width: 48, height: 48 }}
        />
      ) : (
        <View className="w-12 h-12 rounded-xl bg-surface-secondary mr-4 items-center justify-center">
          <Text className="text-text-muted text-xs">No img</Text>
        </View>
      )}

      <View className="flex-1">
        <Text className="text-text-primary text-base font-semibold mb-1">
          {formattedDate}
        </Text>
        <View className="flex-row items-center gap-1.5">
          {(hasVoiceNote || hasTextNote) && (
            hasVoiceNote ? <Mic size={14} color="#64748b" /> : <FileText size={14} color="#64748b" />
          )}
          <Text className="text-text-muted text-sm">
            Health Check
          </Text>
        </View>
      </View>

      <View className="items-end justify-center mr-3">
        <View className={`${scoreBgClass} px-2 py-1 rounded-md mb-1`}>
          <Text className={`${scoreColorClass} text-xs font-bold`}>
            BCS {bcsScore}
          </Text>
        </View>
      </View>

      <ChevronRight color="#cbd5e1" size={20} />
    </TouchableOpacity>
  );
}
