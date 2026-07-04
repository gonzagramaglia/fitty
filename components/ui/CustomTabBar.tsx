import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { House, Clock, User, Camera } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useActiveCat } from '../../lib/ActiveCatContext';

/**
 * CustomTabBar is a custom bottom navigation bar for the application.
 * It provides custom styling, interactive icons, and a prominent floating action button
 * for triggering the camera flow.
 *
 * @param props - The props provided by React Navigation plus custom props.
 * @param props.onScanPress - Callback invoked when the Scan FAB is pressed. Handles guest guard logic.
 * @returns The rendered React element for the custom tab bar.
 */
export function CustomTabBar({ state, descriptors, navigation, onScanPress, scanDisabled }: any) {
  const router = useRouter();
  const { setSelectedCheckId } = useActiveCat();

  return (
    <View className="flex-row bg-background border-t border-border pb-6 pt-3 px-4 items-center justify-between">
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          // If tapping the already-active History tab, clear detail view
          if (isFocused && route.name === 'history') {
            setSelectedCheckId(null);
            return;
          }

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let IconComponent: any = House;
        let title = options.title;
        let iconSize = 24;

        if (route.name === 'index') {
          IconComponent = House;
          title = 'Home';
        }
        if (route.name === 'history') {
          IconComponent = Clock;
          title = 'History';
          iconSize = 24;
        }
        if (route.name === 'profile') {
          IconComponent = User;
          title = 'Profile';
        }

        const tabButton = (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            className="items-center justify-center flex-1 mt-2"
          >
            <IconComponent 
              size={iconSize} 
              color={isFocused ? '#74B7B5' : '#94a3b8'} 
              strokeWidth={isFocused ? 2.5 : 2}
            />
            <Text className={`text-xs mt-1 font-bold ${isFocused ? 'text-primary-cool' : 'text-text-muted'}`}>
              {title}
            </Text>
          </TouchableOpacity>
        );

        if (index === 0) {
          // Render the Home tab, then the custom Scan button
          return (
            <React.Fragment key={route.key + '-wrapper'}>
              {tabButton}
              <TouchableOpacity
                key="scan-button"
                onPress={onScanPress}
                disabled={scanDisabled}
                className="items-center flex-1"
                style={{ opacity: scanDisabled ? 0.5 : 1 }}
              >
                <View className="-mt-8 items-center">
                  <View 
                    className="w-16 h-16 rounded-full items-center justify-center border-[6px] border-background shadow-sm"
                    style={{ backgroundColor: scanDisabled ? '#D1D5DB' : '#FDE047' }}
                  >
                    <Camera size={28} color={scanDisabled ? '#9CA3AF' : '#854D0E'} strokeWidth={2.5} />
                  </View>
                  <Text className="text-xs mt-1 font-bold" style={{ color: scanDisabled ? '#9CA3AF' : '#854D0E' }}>
                    Scan
                  </Text>
                </View>
              </TouchableOpacity>
            </React.Fragment>
          );
        }

        return tabButton;
      })}
    </View>
  );
}
