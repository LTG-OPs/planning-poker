<script setup lang="ts">
/**
 * SessionControls Komponente
 *
 * Steuerelemente für den Host der Session.
 */

/**
 * Props Definition
 */
interface Props {
  /** Ist der Nutzer der Host? */
  isHost: boolean
  /** Aktueller Session-Status */
  status: 'waiting' | 'voting' | 'revealed' | 'completed'
  /** Sind alle Votes abgegeben? */
  allVotesIn: boolean
  /** Aktuelle Story */
  currentStory?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  currentStory: null,
})

/**
 * Events Definition
 */
const emit = defineEmits<{
  /** Startet eine neue Abstimmungsrunde */
  startVoting: [story: string, description?: string]
  /** Deckt die Karten auf */
  reveal: []
  /** Setzt die Runde zurück */
  reset: []
}>()

/**
 * Story-Input Wert
 */
const storyInput = ref('')
const descriptionInput = ref('')

/**
 * Startet die Abstimmung
 */
function handleStartVoting(): void {
  if (storyInput.value.trim()) {
    emit('startVoting', storyInput.value.trim(), descriptionInput.value.trim())
    storyInput.value = ''
    descriptionInput.value = ''
  }
}
</script>

<template>
  <div v-if="props.isHost" class="session-controls bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
    <div class="flex items-center gap-2 mb-4">
      <div class="p-2 bg-primary-100 rounded-lg text-primary-600">
        <Icon name="heroicons:adjustments-horizontal" class="w-5 h-5" />
      </div>
      <h3 class="text-lg font-bold text-secondary-900">
        Steuerung
      </h3>
    </div>

    <!-- Neue Runde starten -->
    <div v-if="props.status === 'waiting' || props.status === 'revealed'" class="space-y-3">
      <div>
        <label for="story-input" class="block text-sm font-medium text-secondary-700 mb-1">
          Story / Task
        </label>
        <input
          id="story-input"
          v-model="storyInput"
          type="text"
          class="input"
          placeholder="z.B. User Story #123"
          @keyup.enter="handleStartVoting"
        >
      </div>

      <div>
        <label for="story-desc" class="block text-sm font-medium text-secondary-700 mb-1">
          Beschreibung (Markdown)
        </label>
        <textarea
          id="story-desc"
          v-model="descriptionInput"
          class="input min-h-[100px] resize-y"
          placeholder="Details zur Story..."
        />
      </div>

      <button
        type="button"
        class="btn-primary w-full"
        :disabled="!storyInput.trim()"
        @click="handleStartVoting"
      >
        <Icon name="heroicons:play" class="w-5 h-5 mr-2" />
        Neue Runde starten
      </button>
    </div>

    <!-- Aktive Abstimmung -->
    <div v-else-if="props.status === 'voting'" class="space-y-3">
      <div class="p-3 bg-primary-50 rounded-lg">
        <div class="text-xs text-primary-600 mb-1">Aktuelle Story</div>
        <div class="font-medium text-primary-800">{{ props.currentStory }}</div>
      </div>

      <button
        type="button"
        class="btn-primary w-full"
        :class="{ 'animate-pulse': props.allVotesIn }"
        @click="emit('reveal')"
      >
        <Icon name="heroicons:eye" class="w-5 h-5 mr-2" />
        Karten aufdecken
        <span v-if="props.allVotesIn" class="ml-2 text-xs">(Alle haben gewählt!)</span>
      </button>

      <button
        type="button"
        class="btn-secondary w-full"
        @click="emit('reset')"
      >
        <Icon name="heroicons:arrow-path" class="w-5 h-5 mr-2" />
        Zurücksetzen
      </button>
    </div>
  </div>
</template>
