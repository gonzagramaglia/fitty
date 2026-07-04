import { Platform, Modal, View, TouchableOpacity } from 'react-native';
import { createPortal } from 'react-dom';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

/**
 * Modal that renders as a React portal on web (covers the WebFrame correctly)
 * and as a native Modal on iOS/Android.
 */
export function InlineModal({ visible, onClose, children }: Props) {
  if (!visible) return null;

  const content = (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onClose}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, zIndex: 99999 }}
    >
      {children}
    </TouchableOpacity>
  );

  if (Platform.OS === 'web') {
    // Find the WebFrame inner container to portal into
    const portalTarget = typeof document !== 'undefined' 
      ? document.getElementById('fitty-app-container') || document.body
      : null;
    if (portalTarget) {
      return createPortal(content, portalTarget) as unknown as React.ReactElement;
    }
    return content;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="flex-1 bg-black/60 items-center justify-center px-6"
      >
        {children}
      </TouchableOpacity>
    </Modal>
  );
}
