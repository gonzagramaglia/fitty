import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { House, Clock, User, Camera } from 'lucide-react-native';

export function CustomTabBar({ state, descriptors, navigation }: any) {
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

        // Scan button is special
        if (route.name === 'camera') {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              className="items-center flex-1"
            >
              <View className="-mt-8 items-center">
                <View className="bg-primary-cool w-16 h-16 rounded-full items-center justify-center border-[6px] border-background">
                  <Camera size={28} color="white" strokeWidth={2.5} />
                </View>
                <Text className={`text-xs mt-1 font-bold ${isFocused ? 'text-primary-cool' : 'text-primary-cool'}`}>
                  Scan
                </Text>
              </View>
            </TouchableOpacity>
          );
        }

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
          iconSize = 26;
        }
        if (route.name === 'profile') {
          IconComponent = User;
          title = 'Profile';
        }

        return (
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
      })}
    </View>
  );
}
