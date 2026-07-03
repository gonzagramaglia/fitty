import React, { useState, useEffect } from 'react';
import { View, Text, useWindowDimensions, Platform } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Defs, LinearGradient, Stop } from "react-native-svg";
import { Activity } from "lucide-react-native";

type DataPoint = {
  date: string;
  score: number;
};

type Props = {
  data: DataPoint[];
  catName?: string;
  hasProcessing?: boolean;
};

/**
 * TrendChart component renders a line chart displaying the historical Body Condition Score (BCS) over time.
 * It visualizes the progression of the cat's health using react-native-chart-kit.
 *
 * @param props - Component props containing the chart data.
 */
export function TrendChart({ data, catName, hasProcessing }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const containerWidth = Platform.OS === 'web' ? Math.min(windowWidth, 400) : windowWidth;
  const chartWidth = containerWidth - 96;

  // Animated dots for processing state
  const [dots, setDots] = useState('');
  useEffect(() => {
    if (!hasProcessing) return;
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, [hasProcessing]);

  if (!data || data.length === 0) {
    return (
      <View className="bg-background border border-border rounded-2xl pt-6 px-6 pb-0 shadow-sm">
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
        <View style={{ position: 'relative' }}>
          <LineChart
            data={{
              labels: ["", "", "", "", "", ""],
              datasets: [
                { data: [5, 5, 5, 5, 5, 5], color: () => `rgba(26, 37, 48, 0.15)`, strokeWidth: 3, withDots: false },
                { data: [1, 1, 1, 1, 1, 1], withDots: false, color: () => 'rgba(0,0,0,0)' },
                { data: [9, 9, 9, 9, 9, 9], withDots: false, color: () => 'rgba(0,0,0,0)' },
              ],
            }}
            width={Math.max(chartWidth, 200)}
            height={180}
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(226, 232, 240, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
              style: { borderRadius: 16 },
            }}
            withInnerLines={true}
            withOuterLines={false}
            withVerticalLines={false}
            withDots={false}
            style={{
              marginVertical: 8,
              borderRadius: 16,
              marginLeft: -42,
              marginTop: 22,
              opacity: 0.5,
            }}
          />
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', marginTop: -12 }}>
            {hasProcessing ? (
              <>
                <Text className="text-3xl mb-2">⏳</Text>
                <Text className="text-text-primary font-bold text-base mb-1">Scan processing{dots}</Text>
                <Text className="text-text-muted text-center text-sm px-6">
                  Results will appear on the chart once complete.
                </Text>
              </>
            ) : (
              <>
                <View className="mb-3">
                  <Activity color="#94a3b8" size={28} />
                </View>
                <Text className="text-text-primary font-bold text-base mb-1">
                  No health checks yet
                </Text>
                <Text className="text-text-muted text-center text-sm px-6">
                  Tap <Text className="font-bold" style={{ color: '#854D0E' }}>Scan</Text> below to start tracking{'\n'}{catName ? `${catName}'s` : "your cat's"} health.
                </Text>
              </>
            )}
          </View>
        </View>
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

  const isSingle = scores.length === 1;
  const displayLabels = isSingle ? ["", labels[0], ""] : labels;
  const displayScores = isSingle ? [scores[0], scores[0], scores[0]] : scores;

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
          labels: displayLabels,
          datasets: [
            // Ideal line
            {
              data: displayScores.map(() => 5),
              color: () => `rgba(26, 37, 48, 0.3)`, // #1A2530 with more transparency
              strokeWidth: 4,
              withDots: false,
            },
            // Actual user data
            {
              data: displayScores,
              color: () => isSingle ? 'rgba(0,0,0,0)' : `url(#lineGradient)`,
              strokeWidth: 4,
            },
            // Min/max ghost data to force Y axis 1-9. Must match length of main data!
            { data: displayScores.map(() => 1), withDots: false, color: () => 'rgba(0,0,0,0)' },
            { data: displayScores.map(() => 9), withDots: false, color: () => 'rgba(0,0,0,0)' },
          ],
        }}
        width={Math.max(chartWidth, 200)} // Ensure minimum width
        height={180}
        getDotColor={(dataPoint, dataPointIndex) => {
          if (isSingle && dataPointIndex !== 1) return 'rgba(255,255,255,1)'; // blend with background
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
        bezier={!isSingle}
        hidePointsAtIndex={isSingle ? [0, 2] : []}
        decorator={({ width, paddingRight }) => {
          if (isSingle) return null;
          
          const xMax = scores.length - 1;
          const getPercent = (i: number) => (i / xMax) * 100;

          const getSegmentColor = (i: number) => {
            const score = scores[i + 1];
            if (score === 5) return 'rgba(16, 185, 129, 0.8)'; // green
            if (score <= 2 || score >= 8) return 'rgba(239, 68, 68, 0.8)'; // red
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
