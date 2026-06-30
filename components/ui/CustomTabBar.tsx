import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { House, Clock, User, Camera } from 'lucide-react-native';

/**
 * CustomTabBar is a custom bottom navigation bar for the application.
 * It provides custom styling, interactive icons, and a prominent floating action button
 * for triggering the camera flow.
 *
 * @param props - The props provided by React Navigation.
 * @returns The rendered React element for the custom tab bar.
 */
export function CustomTabBar({ state, descriptors, navigation }: any) {
  const { useRouter } = require('expo-router');
  const router = useRouter();

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
                onPress={() => router.push('/camera')}
                className="items-center flex-1"
              >
                <View className="-mt-8 items-center">
                  <View className="bg-[#FDE047] w-16 h-16 rounded-full items-center justify-center border-[6px] border-background shadow-sm">
                    <Camera size={28} color="#854D0E" strokeWidth={2.5} />
                  </View>
                  <Text className={`text-xs mt-1 font-bold text-[#854D0E]`}>
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
