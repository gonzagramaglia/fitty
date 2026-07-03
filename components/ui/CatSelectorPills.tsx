import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Plus } from 'lucide-react-native';
import type { CatProfile } from '../../lib/types';

type Props = {
  /** All cat profiles for the current user. */
  cats: CatProfile[];
  /** The currently active cat ID. */
  activeCatId: string | null;
  /** Callback to change the active cat. */
  onSelectCat: (id: string) => void;
  /** Callback when "Add Cat" is pressed. */
  onAddCat: () => void;
  /** Whether the "creating new" pill should appear selected. */
  isCreatingNew?: boolean;
  /** Section title override (default: "Your Cats"). */
  title?: string;
  /** Whether to show the Add Cat button. */
  showAdd?: boolean;
};

/**
 * Horizontal scrollable cat selector pills used in the Dark Header.
 * Shared between Dashboard and Profile screens.
 */
export function CatSelectorPills({
  cats,
  activeCatId,
  onSelectCat,
  onAddCat,
  isCreatingNew = false,
  title = 'Your Cats',
  showAdd = true,
}: Props) {
  const sortedCats = [...cats].sort((a, b) =>
    a.id === activeCatId ? -1 : b.id === activeCatId ? 1 : 0
  );

  return (
    <View className="mb-2">
      <Text className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">
        {title}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
        {sortedCats.map(c => {
          const isActive = c.id === activeCatId && !isCreatingNew;
          return (
            <TouchableOpacity
              key={c.id}
              onPress={() => onSelectCat(c.id)}
              className={`flex-row items-center px-4 py-2 rounded-full mr-3 ${isActive ? 'bg-[#74B7B5]' : 'bg-[#2A3B4C]'}`}
            >
              {c.avatar_url ? (
                <Image
                  source={{ uri: c.avatar_url }}
                  style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }}
                  className="bg-surface-tertiary"
                />
              ) : (
                <Image
                  source={require('../../assets/images/coding-kitty.jpg')}
                  style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }}
                  className="bg-surface-tertiary"
                />
              )}
              <Text className={`font-semibold ${isActive ? 'text-white' : 'text-white/80'}`}>
                {c.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        {showAdd && (
          <TouchableOpacity
            onPress={onAddCat}
            className={`flex-row items-center px-4 py-2 rounded-full ${isCreatingNew ? 'bg-[#74B7B5]' : 'border border-dashed border-[#74B7B5] bg-transparent'}`}
          >
            <Plus size={18} color={isCreatingNew ? 'white' : '#74B7B5'} />
            <Text className={`font-semibold ml-1 ${isCreatingNew ? 'text-white' : 'text-[#74B7B5]'}`}>
              {isCreatingNew ? 'Add Cat' : 'Add'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
