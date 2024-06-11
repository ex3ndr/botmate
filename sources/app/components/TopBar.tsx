import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '@/app/theme';
import { Image } from 'expo-image';
import { router } from 'expo-router';

export const TopBar = React.memo(() => {
    return (
        <View style={{ height: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', alignSelf: 'stretch' }}>
            <View style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 16, gap: 16 }}>
                
            </View>
            <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: Theme.text, fontSize: 20, fontWeight: '600' }}>Botmate</Text>
                <View style={{ flexDirection: 'row' }}>
                    {/* {subtitleStyle === 'warning' && <Ionicons name="warning-outline" size={14} color="red" style={{ transform: [{ translateY: 2 }], paddingRight: 3 }} />}
                    <Text style={[{ color: Theme.text, fontSize: 14, fontWeight: '500' }, styles[subtitleStyle]]}>
                        {subtitle}
                    </Text> */}
                </View>
            </View>
            <View style={{ flexGrow: 1, flexBasis: 0, flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16 }}>
                <Pressable onPress={() => router.navigate('settings')} hitSlop={16}>
                    <Image source={require('../../assets/gear_3d.png')} style={{ width: 24, height: 24 }} />
                </Pressable>
            </View>
        </View>
    )
});

const styles = StyleSheet.create({
    active: {
        color: Theme.accent
    },
    warning: {
        color: Theme.warninig
    },
    secondary: {
        opacity: 0.5
    }
});