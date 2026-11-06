import { View } from 'react-native';

import { Button } from '@shared/components/Button';
import { Screen } from '@shared/components/Screen';
import { Gold, Muted, Title } from '@shared/components/Text';
import type { AuthScreenProps } from '@navigation/types';

/**
 * The front door. Clients are the overwhelming majority of people opening
 * this app, so booking is the big button and the staff door is a quiet link
 * underneath rather than an equal choice.
 */
export function WelcomeScreen({ navigation }: AuthScreenProps<'Welcome'>) {
    return (
        <Screen scroll={false}>
            <View className="flex-1 justify-center">
                <Gold className="text-sm uppercase tracking-[3px]">Magnetic Barbershop</Gold>
                <Title className="mt-3">Look good.{'\n'}Feel good.{'\n'}Be you.</Title>
                <Muted className="mt-4 leading-6">
                    Book a chair at the Avenues shop, keep your cuts in one place and earn points
                    every visit.
                </Muted>
            </View>

            <View className="pb-10">
                <Button label="Book a chair" onPress={() => navigation.navigate('ClientLogin')} />
                <Button
                    label="I work here"
                    variant="ghost"
                    onPress={() => navigation.navigate('StaffLogin')}
                    className="mt-2"
                />
            </View>
        </Screen>
    );
}
