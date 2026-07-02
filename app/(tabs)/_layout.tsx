import { useCallback } from "react";
import { Tabs, useRouter } from "expo-router";
import { CustomTabBar } from "../../components/ui/CustomTabBar";
import { supabase } from "../../lib/supabase";
import { useActiveCat } from "../../lib/ActiveCatContext";

/**
 * TabsLayout is the root layout for the main tab navigation.
 * It provides the scan button handler that guards guest users from performing
 * multiple scans and passes it to the CustomTabBar via prop.
 *
 * @returns The rendered Tabs navigator with a custom tab bar.
 */
export default function TabsLayout() {
  const router = useRouter();
  const { activeCatId, showGuestModal } = useActiveCat();

  const handleScanPress = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.is_anonymous) {
      router.push('/camera');
      return;
    }

    if (activeCatId) {
      const { count } = await supabase
        .from('health_checks')
        .select('id', { count: 'exact', head: true })
        .eq('cat_id', activeCatId)
        .eq('user_id', user.id);

      if (count && count > 0) {
        showGuestModal();
        return;
      }
    }

    router.push('/camera');
  }, [activeCatId, showGuestModal]);

  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} onScanPress={handleScanPress} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="history" options={{ title: "History" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
