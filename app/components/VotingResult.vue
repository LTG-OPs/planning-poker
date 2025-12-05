<script setup lang="ts">
/**
 * VotingResult Komponente
 *
 * Zeigt die Ergebnisse einer Abstimmungsrunde an.
 */

import type { IParticipant, PokerValue } from '~/types';

/**
 * Props Definition
 */
interface Props {
  /** Liste der Teilnehmer mit ihren Votes */
  participants: IParticipant[]
}

const props = defineProps<Props>()

/**
 * Nur Teilnehmer die abgestimmt haben (keine Beobachter)
 */
const voters = computed(() =>
  props.participants.filter(p => !p.isObserver && p.selectedValue !== null)
)

/**
 * Berechnet den Durchschnitt der numerischen Votes
 */
const average = computed(() => {
  const numericVotes = voters.value
    .map(p => Number.parseFloat(p.selectedValue as string))
    .filter(v => !Number.isNaN(v))

  if (numericVotes.length === 0) return null

  const sum = numericVotes.reduce((a, b) => a + b, 0)
  return (sum / numericVotes.length).toFixed(1)
})

/**
 * Berechnet den Median der numerischen Votes
 */
const median = computed(() => {
  const numericVotes = voters.value
    .map(p => Number.parseFloat(p.selectedValue as string))
    .filter(v => !Number.isNaN(v))
    .sort((a, b) => a - b)

  if (numericVotes.length === 0) return null

  const mid = Math.floor(numericVotes.length / 2)
  if (numericVotes.length % 2 !== 0) {
    return numericVotes[mid]?.toFixed(1) ?? null
  }

  const left = numericVotes[mid - 1]
  const right = numericVotes[mid]
  if (left === undefined || right === undefined) return null
  return ((left + right) / 2).toFixed(1)
})

/**
 * Gruppiert Votes nach Wert für die Anzeige
 */
const voteDistribution = computed(() => {
  const distribution = new Map<PokerValue, number>()

  voters.value.forEach((p) => {
    const value = p.selectedValue as PokerValue
    distribution.set(value, (distribution.get(value) || 0) + 1)
  })

  return Array.from(distribution.entries())
    .sort((a, b) => b[1] - a[1])
})

/**
 * Prüft ob Konsens besteht (alle gleich)
 */
const hasConsensus = computed(() => {
  if (voters.value.length < 2) return false
  const firstVoter = voters.value[0]
  if (!firstVoter) return false
  const firstVote = firstVoter.selectedValue
  return voters.value.every(p => p.selectedValue === firstVote)
})
</script>

<template>
  <div class="voting-result bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
    <div class="flex items-center gap-2 mb-6">
      <div class="p-2 bg-accent-100 rounded-lg text-accent-600">
        <Icon name="heroicons:chart-bar" class="w-5 h-5" />
      </div>
      <h3 class="text-lg font-bold text-secondary-900">
        Ergebnis
      </h3>
    </div>

    <!-- Konsens-Anzeige -->
    <div
      v-if="hasConsensus"
      class="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-center shadow-sm"
    >
      <div class="text-3xl mb-2">🎉</div>
      <span class="text-green-800 font-bold text-lg">
        Konsens erreicht!
      </span>
    </div>

    <!-- Statistiken -->
    <div class="grid grid-cols-3 gap-3 mb-6">
      <div class="text-center p-3 bg-primary-50 rounded-xl border border-primary-100">
        <div class="text-2xl font-bold text-primary-600 mb-0.5">
          {{ average ?? '-' }}
        </div>
        <div class="text-[10px] font-medium text-primary-500 uppercase tracking-wider">Durchschnitt</div>
      </div>

      <div class="text-center p-3 bg-accent-50 rounded-xl border border-accent-100">
        <div class="text-2xl font-bold text-accent-600 mb-0.5">
          {{ median ?? '-' }}
        </div>
        <div class="text-[10px] font-medium text-accent-500 uppercase tracking-wider">Median</div>
      </div>

      <div class="text-center p-3 bg-secondary-50 rounded-xl border border-secondary-100">
        <div class="text-2xl font-bold text-secondary-700 mb-0.5">
          {{ voters.length }}
        </div>
        <div class="text-[10px] font-medium text-secondary-500 uppercase tracking-wider">Stimmen</div>
      </div>
    </div>

    <!-- Vote-Verteilung -->
    <div class="space-y-2">
      <h4 class="text-sm font-medium text-secondary-600">Verteilung</h4>

      <div
        v-for="[value, count] in voteDistribution"
        :key="value"
        class="flex items-center gap-2"
      >
        <PokerCard :value="value" :small="true" :revealed="true" />

        <div class="flex-1 h-6 bg-secondary-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-primary-500 rounded-full transition-all duration-500"
            :style="{ width: `${(count / voters.length) * 100}%` }"
          />
        </div>

        <span class="text-sm font-medium text-secondary-600 w-8 text-right">
          {{ count }}×
        </span>
      </div>
    </div>
  </div>
</template>
