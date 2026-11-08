import { useState } from "react";
import { Alert, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserRound } from "lucide-react-native";

import { errorMessage } from "@api/client";
import { claimCut, lookupVisits, startCut } from "@api/staff";
import { Button } from "@shared/components/Button";
import { Field } from "@shared/components/Field";
import { Panel } from "@shared/components/Panel";
import { Screen, ScreenHeader } from "@shared/components/Screen";
import { EmptyState, ErrorState, Loading } from "@shared/components/States";
import { Body, Figure, Heading, Muted, Strong } from "@shared/components/Text";
import type { StaffTabProps } from "@navigation/types";
import type { Appointment } from "@shared/types";
import { COLORS } from "@theme/fonts";

/**
 * One match, and the one thing to do with it.
 *
 * Claim and start are deliberately the same button. A barber who has found
 * the client standing in front of him is not deciding between two steps —
 * he is about to cut — and splitting it into "take it" then "start it" only
 * gives him a way to do half of it.
 */
function MatchCard({
  appointment,
  claimable,
  busy,
  onClaim,
  onStart,
  onOpen,
}: {
  appointment: Appointment;
  claimable: boolean;
  busy: boolean;
  onClaim: () => void;
  onStart: () => void;
  onOpen: () => void;
}) {
  const running =
    appointment.started_at !== null && appointment.status !== "completed";
  const done = appointment.status === "completed";

  return (
    <Panel className="mb-2.5 px-5 py-5" onPress={onOpen}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Heading>{appointment.client?.name ?? "Walk-in"}</Heading>
          <Muted className="mt-1.5">{appointment.reference}</Muted>
          <Muted className="mt-1.5 leading-5">
            {appointment.when_label} ·{" "}
            {appointment.services?.map((service) => service.name).join(", ")}
          </Muted>

          <View className="mt-2 flex-row items-center">
            <UserRound size={11} color={COLORS.smoke} />
            <Muted className="ml-1.5 text-[11px]">
              {appointment.staff?.name ?? "No barber yet"}
            </Muted>
          </View>
        </View>

        <View className="items-end">
          <Figure className="text-xl">{appointment.total.formatted}</Figure>
          <Muted className="mt-1.5">{appointment.status_label}</Muted>
          {appointment.is_paid_in_full ? (
            <Muted className="mt-1 text-go">Paid</Muted>
          ) : (
            <Muted className="mt-1">
              {appointment.outstanding.formatted} owing
            </Muted>
          )}
        </View>
      </View>

      {running && appointment.minutes_so_far !== null ? (
        <Strong className="mt-3 text-gold">
          In the chair {appointment.minutes_so_far} min
        </Strong>
      ) : null}

      {done ? null : claimable ? (
        <Button
          label="Take it and start"
          className="mt-4"
          loading={busy}
          onPress={onClaim}
        />
      ) : running ? (
        <Button
          label="Open the job"
          variant="secondary"
          className="mt-4"
          onPress={onOpen}
        />
      ) : (
        <Button
          label="Start the cut"
          className="mt-4"
          loading={busy}
          onPress={onStart}
        />
      )}
    </Panel>
  );
}

/**
 * The desk, on a handset.
 *
 * For the shop as it actually runs: somebody walks in, nobody is on the
 * desk, and the barber has to find them himself. Searching rather than
 * scrolling the diary, because a client who booked Thursday and turned up
 * on Wednesday is not on today's page — and because the client is standing
 * there reading their own booking reference off their phone.
 *
 * Taking the booking moves the commission with it, so the barber who gives
 * the cut is the one who gets paid for it.
 */
export function DeskScreen({ navigation }: StaffTabProps<"Desk">) {
  const queryClient = useQueryClient();

  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");

  const hits = useQuery({
    queryKey: ["desk-lookup", query],
    queryFn: () => lookupVisits(query),
    // Only once there is enough to mean something; the server refuses
    // anything shorter anyway.
    enabled: query.trim().length >= 3,
    staleTime: 1000 * 20,
  });

  const takeIt = useMutation({
    mutationFn: ({ id, claim }: { id: string; claim: boolean }) =>
      claim ? claimCut(id) : startCut(id),
    onSuccess: async (appointment) => {
      await queryClient.invalidateQueries({ queryKey: ["diary"] });
      await queryClient.invalidateQueries({ queryKey: ["desk-lookup"] });
      await queryClient.invalidateQueries({ queryKey: ["earnings"] });

      navigation.navigate("Job", { id: appointment.id });
    },
    onError: (error) => Alert.alert("Not done", errorMessage(error)),
  });

  function search() {
    const trimmed = term.trim();

    if (trimmed.length < 3) {
      Alert.alert(
        "A bit more",
        "A few digits of their number, their name, or the reference off their phone.",
      );

      return;
    }

    setQuery(trimmed);
  }

  return (
    <Screen
      topBar={{ title: "Front desk" }}
      onRefresh={query === "" ? undefined : () => void hits.refetch()}
      refreshing={hits.isRefetching}
    >
      <ScreenHeader eyebrow="Who walked in" title="Find them">
        <Muted className="mt-3 leading-6">
          A phone number, a name, or the reference off their phone. Any date,
          not just today.
        </Muted>
      </ScreenHeader>

      <Field
        label="Number, name or reference"
        value={term}
        onChangeText={setTerm}
        placeholder="0782 000 001"
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={search}
      />

      <Button label="Find them" onPress={search} />

      {query === "" ? (
        <View className="mt-10 items-center">
          <Search size={22} color={COLORS.smoke} />
          <Body className="mt-4 text-center text-smoke leading-6">
            Nothing searched yet. Your own day is on the Diary tab.
          </Body>
        </View>
      ) : hits.isPending ? (
        <Loading label="Looking them up" />
      ) : hits.isError ? (
        <ErrorState
          message={errorMessage(hits.error)}
          onRetry={() => void hits.refetch()}
        />
      ) : hits.data.data.length === 0 ? (
        <EmptyState
          title="Nothing found"
          body="They may never have booked. Reception can take them as a walk-in at the desk."
        />
      ) : (
        <View className="mt-8">
          <Heading className="mb-3">
            {hits.data.data.length} match
            {hits.data.data.length === 1 ? "" : "es"}
          </Heading>

          {hits.data.data.map((appointment) => (
            <MatchCard
              key={appointment.id}
              appointment={appointment}
              claimable={hits.data.claimable.includes(appointment.id)}
              busy={takeIt.isPending && takeIt.variables?.id === appointment.id}
              onClaim={() => takeIt.mutate({ id: appointment.id, claim: true })}
              onStart={() =>
                takeIt.mutate({ id: appointment.id, claim: false })
              }
              onOpen={() => navigation.navigate("Job", { id: appointment.id })}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
