import React from 'react';
import { View, Text, Dimensions, Platform } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Defs, LinearGradient, Stop } from "react-native-svg";

type DataPoint = {
  date: string;
  score: number;
};

type Props = {
  data: DataPoint[];
};

/**
 * TrendChart component renders a line chart displaying the historical Body Condition Score (BCS) over time.
 * It visualizes the progression of the cat's health using react-native-chart-kit.
 *
 * @param props - Component props containing the chart data.
 */
export function TrendChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <View className="bg-background border border-border rounded-2xl p-6 shadow-sm items-center justify-center h-48">
        <Text className="text-text-muted text-sm">Not enough data for a trend chart.</Text>
      </View>
    );
  }

  // Take up to 6 most recent points, chronological order for the chart (left to right)
  const chartData = [...data]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-6);

  const labels = chartData.map((d) => {
    const date = new Date(d.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  const scores = chartData.map((d) => d.score);

  // We need the screen width to calculate chart width minus paddings
  // Container padding: px-6 (24px * 2 = 48) + card padding: p-6 (24px * 2 = 48) => 96
  const windowWidth = Dimensions.get("window").width;
  const containerWidth = Platform.OS === 'web' ? Math.min(windowWidth, 400) : windowWidth;
  const chartWidth = containerWidth - 96; // Adjust based on parent padding

  return (
    <View className="bg-background border border-border rounded-2xl p-6 shadow-sm">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-text-primary text-base font-semibold">
          BCS Trend
        </Text>
        <View className="px-2 py-1 rounded-md" style={{ backgroundColor: 'rgba(26, 37, 48, 0.6)' }}>
          <Text className="text-white text-xs font-bold uppercase tracking-wider">
            Ideal (5)
          </Text>
        </View>
      </View>
      
      <LineChart
        data={{
          labels,
          datasets: [
            // Ideal line
            {
              data: scores.map(() => 5),
              color: () => `rgba(26, 37, 48, 0.3)`, // #1A2530 with more transparency
              strokeWidth: 4,
              withDots: false,
            },
            // Actual user data
            {
              data: scores,
              color: () => `url(#lineGradient)`,
              strokeWidth: 4,
            },
            // Min/max ghost data to force Y axis 1-9. Must match length of main data!
            { data: scores.map(() => 1), withDots: false, color: () => 'rgba(0,0,0,0)' },
            { data: scores.map(() => 9), withDots: false, color: () => 'rgba(0,0,0,0)' },
          ],
        }}
        width={Math.max(chartWidth, 200)} // Ensure minimum width
        height={180}
        getDotColor={(dataPoint) => {
          if (dataPoint === 5) return '#10B981'; // green
          if (dataPoint <= 2 || dataPoint >= 8) return '#EF4444'; // red (very far)
          return '#EAB308'; // yellow (close)
        }}
        chartConfig={{
          backgroundColor: "#ffffff",
          backgroundGradientFrom: "#ffffff",
          backgroundGradientTo: "#ffffff",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(226, 232, 240, ${opacity})`, // border color for grid lines
          labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`, // text-muted
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#ffffff",
          },
        }}
        bezier
        decorator={({ width, paddingRight }) => {
          if (scores.length < 2) return null;
          
          const xMax = scores.length - 1;
          const getPercent = (i: number) => (i / xMax) * 100;

          const getSegmentColor = (i: number) => {
            if (scores[i + 1] === 5) return 'rgba(16, 185, 129, 0.8)'; // green
            return 'rgba(234, 179, 8, 0.8)'; // yellow
          };

          return (
            <Defs>
              <LinearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={getSegmentColor(0)} />
                
                {scores.slice(1, -1).map((_, i) => {
                  const ptIndex = i + 1;
                  const prevColor = getSegmentColor(ptIndex - 1);
                  const nextColor = getSegmentColor(ptIndex);
                  const percent = getPercent(ptIndex);
                  
                  return (
                    <React.Fragment key={ptIndex}>
                      <Stop offset={`${percent}%`} stopColor={prevColor} />
                      <Stop offset={`${percent}%`} stopColor={nextColor} />
                    </React.Fragment>
                  );
                })}
                
                <Stop offset="100%" stopColor={getSegmentColor(scores.length - 2)} />
              </LinearGradient>
            </Defs>
          );
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16,
          marginLeft: -16, // Shift left slightly to align better
        }}
        withInnerLines={true}
        withOuterLines={false}
        withVerticalLines={false}
      />
    </View>
  );
}
