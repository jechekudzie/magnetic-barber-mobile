import { Alert, Linking, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

// Type only, so nothing is pulled in at runtime by this line.
import type * as ImagePickerTypes from 'expo-image-picker';

/**
 * Picking a photo, on either platform, without taking the app down when the
 * native side is missing.
 *
 * expo-image-picker is a native module, so it only exists in a build made
 * after it was added. Two things make this worse than it sounds:
 *
 * Its entry file calls requireNativeModule at module scope and throws there,
 * so importing it at the top of a file would crash the whole app at startup
 * on an older build — not just this screen.
 *
 * And wrapping a dynamic import in try/catch is not enough either: Metro
 * reports the rejection globally before the catch runs, so the red box
 * appears anyway, behind whatever the catch decided to show.
 *
 * So the module is asked for before it is loaded. requireOptionalNativeModule
 * returns null instead of throwing, and the import only happens once that has
 * confirmed the native side is really there.
 */
export function isPickerAvailable(): boolean {
    return requireOptionalNativeModule('ExponentImagePicker') !== null;
}

/**
 * Load the library, but only when the native module behind it exists.
 */
async function loadPicker(): Promise<typeof ImagePickerTypes | null> {
    if (!isPickerAvailable()) {
        return null;
    }

    return import('expo-image-picker');
}

type PickResult = { uri: string } | null;

/**
 * Explain a refused permission once, and offer the one thing that fixes it.
 */
function explainDenied(what: 'camera' | 'photos'): void {
    const subject = what === 'camera' ? 'the camera' : 'your photos';

    Alert.alert(
        `Magnetic cannot reach ${subject}`,
        'Allow access in Settings, or send the reference on its own — the shop can check that against the statement.',
        [
            { text: 'Not now', style: 'cancel' },
            { text: 'Open settings', onPress: () => void Linking.openSettings() },
        ],
    );
}

/**
 * Offer the camera or the library, and return what was picked.
 *
 * The choice is an Alert rather than an iOS action sheet so Android gets the
 * same two options instead of a silent jump into the gallery. Returns null
 * whenever nothing was picked, for any reason, so callers have one case to
 * handle rather than five.
 */
export async function pickPhoto(): Promise<PickResult> {
    const picker = await loadPicker();

    if (picker === null) {
        Alert.alert(
            'Photos are not in this build yet',
            'Send the reference on its own — the shop will check it against the statement. The next build of the app will let you attach a screenshot.',
        );

        return null;
    }

    const choice = await new Promise<'camera' | 'library' | null>((resolve) => {
        Alert.alert(
            'Add a screenshot',
            'Where should we get it from?',
            [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
                { text: 'Take a photo', onPress: () => resolve('camera') },
                { text: 'Choose from photos', onPress: () => resolve('library') },
            ],
            // Android dismisses on back; iOS cannot, so both end up resolved.
            { cancelable: true, onDismiss: () => resolve(null) },
        );
    });

    if (choice === null) {
        return null;
    }

    try {
        if (choice === 'camera') {
            const permission = await picker.requestCameraPermissionsAsync();

            if (!permission.granted) {
                explainDenied('camera');

                return null;
            }

            const shot = await picker.launchCameraAsync({ quality: 0.7 });

            return shot.canceled ? null : { uri: shot.assets[0].uri };
        }

        const permission = await picker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            explainDenied('photos');

            return null;
        }

        // A payment confirmation is read, not admired. Smaller uploads matter
        // more than detail on a shop's connection.
        const chosen = await picker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
        });

        return chosen.canceled ? null : { uri: chosen.assets[0].uri };
    } catch {
        // A picker that fails on the device is not worth a crash: the
        // reference alone is what the desk reconciles against.
        Alert.alert(
            'That did not work',
            `We could not open ${Platform.OS === 'ios' ? 'Photos' : 'your gallery'}. Send the reference on its own and the shop will check it.`,
        );

        return null;
    }
}
