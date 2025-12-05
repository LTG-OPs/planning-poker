<script setup lang="ts">
/**
 * ParticipantList Komponente
 *
 * Zeigt alle Teilnehmer einer Session mit ihrem Voting-Status an.
 */

import type { IParticipant } from '~/types';

/**
 * Props Definition
 */
interface Props {
  /** Liste der Teilnehmer */
  participants: IParticipant[]
  /** Sind die Karten aufgedeckt? */
  revealed?: boolean
  /** ID des aktuellen Nutzers */
  currentUserId?: string
}

const props = withDefaults(defineProps<Props>(), {
  revealed: false,
  currentUserId: '',
})

/**
 * Sortiert Teilnehmer: Aktuelle zuerst, dann alphabetisch
 */
const sortedParticipants = computed(() => {
  return [...props.participants].sort((a, b) => {
    // Aktueller Nutzer zuerst
    if (a.id === props.currentUserId) return -1
    if (b.id === props.currentUserId) return 1
    // Dann alphabetisch
    return a.name.localeCompare(b.name)
  })
})

/**
 * Ermittelt das Icon für einen Teilnehmer
 */
function getStatusIcon(participant: IParticipant): string {
  if (participant.isObserver) return 'heroicons:eye'
  if (participant.selectedValue === null) return 'heroicons:ellipsis-horizontal'
  if (props.revealed) return '' // Wert wird direkt angezeigt
  return 'heroicons:check'
}

/**
 * CSS-Klassen für den Vote-Badge
 */
function getVoteBadgeClasses(participant: IParticipant): string[] {
  const base = ['min-w-8 h-8 flex items-center justify-center rounded-lg font-medium text-sm transition-colors duration-200']

  if (participant.isObserver) {
    return [...base, 'bg-secondary-100 text-secondary-500']
  }

  if (participant.selectedValue === null) {
    return [...base, 'bg-amber-50 text-amber-600 animate-pulse']
  }

  if (props.revealed) {
    return [...base, 'bg-primary-100 text-primary-700 font-bold text-lg']
  }

  return [...base, 'bg-green-100 text-green-600']
}
</script>

<template>
  <div class="participant-list bg-white rounded-xl shadow-sm border border-secondary-200 p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-secondary-700 uppercase tracking-wider">
        Teilnehmer
      </h3>
      <span class="bg-secondary-100 text-secondary-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
        {{ participants.length }}
      </span>
    </div>

    <ul class="space-y-2">
      <li
        v-for="participant in sortedParticipants"
        :key="participant.id"
        class="flex items-center justify-between p-3 rounded-lg transition-colors"
        :class="[
          participant.id === currentUserId ? 'bg-primary-50 border border-primary-100' : 'bg-secondary-50 hover:bg-secondary-100'
        ]"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm"
            :class="participant.id === currentUserId ? 'bg-primary-500 text-white' : 'bg-white text-secondary-600 border border-secondary-200'"
          >
            {{ participant.name.charAt(0).toUpperCase() }}
          </div>
          <div class="flex flex-col">
            <span class="font-medium text-sm text-secondary-900 leading-tight">
              {{ participant.name }}
            </span>
            <span v-if="participant.id === currentUserId" class="text-[10px] text-primary-600 font-medium">
              Du
            </span>
          </div>
        </div>

        <div :class="getVoteBadgeClasses(participant)">
          <template v-if="props.revealed && participant.selectedValue !== null">
            {{ participant.selectedValue }}
          </template>
          <Icon v-else :name="getStatusIcon(participant)" class="w-5 h-5" />
        </div>
      </li>
    </ul>
  </div>
</template>
