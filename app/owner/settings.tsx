import { View } from 'react-native';
import SettingsScreen from '../manager/settings';

export default function OwnerSettingsScreen() {
    return <SettingsScreen showHeader={true} isOwner={true} />;
}
