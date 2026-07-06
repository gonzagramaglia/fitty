import { Link, Stack } from 'expo-router';
import { View, Text, Platform, TouchableOpacity } from 'react-native';

const neoShadow = (x: number = 6, y: number = 6) => Platform.OS === 'web' 
  ? { boxShadow: `${x}px ${y}px 0px #000` } as any 
  : { elevation: 10 };

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!', headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 64, fontWeight: '900', color: '#000', textAlign: 'center', marginBottom: 24 }}>
          404.
        </Text>
        <View style={[{ backgroundColor: '#f4f9f9', padding: 24, borderWidth: 4, borderColor: '#000', marginBottom: 40, borderRadius: 16, maxWidth: 350 }, neoShadow(8, 8)]}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#000', textAlign: 'center', lineHeight: 28 }}>
            This page doesn't exist.
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#475569', textAlign: 'center', marginTop: 12, lineHeight: 24 }}>
            The cat probably knocked this route off the table. Let's get you back home.
          </Text>
        </View>
        <Link href="/" asChild>
          <TouchableOpacity 
            style={{ backgroundColor: '#74B7B5', paddingHorizontal: 24, paddingVertical: 18, borderWidth: 4, borderColor: '#000', borderRadius: 16, alignItems: 'center', justifyContent: 'center', ...neoShadow(6, 6) }}
          >
            <Text style={{ fontSize: 18, fontWeight: '900', textTransform: 'uppercase', color: '#000', textAlign: 'center' }}>
              Go to Home
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}
