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
  const { activeCatId, showGuestModal, showProcessingModal, setSelectedCheckId } = useActiveCat();

  const handleScanPress = useCallback(async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      showGuestModal();
      return;
    }

    // Check if there's already a scan in progress
    if (activeCatId) {
      const { data: processingCheck } = await supabase
        .from('health_checks')
        .select('id')
        .eq('cat_id', activeCatId)
        .eq('user_id', user.id)
        .eq('status', 'processing')
        .limit(1)
        .maybeSingle();

      if (processingCheck?.id) {
        // Navigate to history tab and select the processing check
        setSelectedCheckId(processingCheck.id);
        router.push('/history');
        showProcessingModal();
        return;
      }
    }

    if (!user.is_anonymous) {
      router.push('/camera');
      return;
    }

    if (activeCatId) {
      const { count, error: countError } = await supabase
        .from('health_checks')
        .select('id', { count: 'exact', head: true })
        .eq('cat_id', activeCatId)
        .eq('user_id', user.id);

      if (countError || (count && count > 0)) {
        showGuestModal();
        return;
      }
    }

    router.push('/camera');
  }, [activeCatId, showGuestModal, showProcessingModal, router]);

  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} onScanPress={handleScanPress} scanDisabled={!activeCatId} />}
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
