<script setup lang="ts">
/**
 * SessionInfo Komponente
 *
 * Zeigt Session-Informationen inkl. Join-Code an.
 * Ermöglicht das Kopieren des Join-Codes.
 */

/**
 * Props Definition
 */
interface Props {
  /** Name der Session */
  sessionName: string
  /** Join-Code zum Teilen */
  joinCode: string | null
  /** Anzahl der Teilnehmer */
  participantCount: number
}

const props = defineProps<Props>()

/**
 * Events Definition
 */
const emit = defineEmits<{
  /** Session verlassen */
  leave: []
}>()

/**
 * Status für Kopier-Feedback
 */
const copied = ref(false)

/**
 * Kopiert den Join-Code in die Zwischenablage
 */
async function copyJoinCode(): Promise<void> {
  if (!props.joinCode) return

  try {
    await navigator.clipboard.writeText(props.joinCode)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
  catch {
    // Fallback für ältere Browser
    console.warn('Clipboard API nicht verfügbar')
  }
}

/**
 * Generiert einen Share-Link
 */
const shareLink = computed(() => {
  if (!props.joinCode) return ''

  if (import.meta.client) {
    return `${window.location.origin}?join=${props.joinCode}`
  }
  return ''
})

/**
 * Teilt die Session (Web Share API)
 */
async function shareSession(): Promise<void> {
  if (!import.meta.client || !navigator.share) {
    await copyJoinCode()
    return
  }

  try {
    await navigator.share({
      title: `Planning Poker: ${props.sessionName}`,
      text: `Tritt meiner Planning Poker Session bei! Code: ${props.joinCode}`,
      url: shareLink.value,
    })
  }
  catch {
    // Benutzer hat abgebrochen
  }
}
</script>

<template>
  <div class="card-container bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-bold text-secondary-900">
          {{ sessionName }}
        </h3>
        <div class="flex items-center gap-2 mt-1">
          <span class="flex h-2 w-2 rounded-full bg-green-500"></span>
          <span class="text-sm text-secondary-500 font-medium">
            {{ participantCount }} Teilnehmer online
          </span>
        </div>
      </div>

      <button
        type="button"
        class="text-secondary-400 hover:text-error-600 transition-colors p-2 rounded-lg hover:bg-error-50"
        title="Session verlassen"
        @click="emit('leave')"
      >
        <Icon name="heroicons:arrow-left-on-rectangle" class="w-5 h-5" />
      </button>
    </div>

    <!-- Join-Code -->
    <div v-if="joinCode" class="bg-secondary-50 rounded-xl p-4 border border-secondary-200">
      <p class="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">
        Join Code
      </p>
      <div class="flex items-center gap-3">
        <code class="flex-1 text-3xl font-mono font-bold text-primary-600 tracking-widest">
          {{ joinCode }}
        </code>

        <div class="flex gap-2">
          <button
            type="button"
            class="p-2 rounded-lg transition-all duration-200 flex items-center justify-center"
            :class="copied ? 'bg-green-100 text-green-700' : 'bg-white text-secondary-600 hover:text-primary-600 hover:bg-primary-50 shadow-sm border border-secondary-200'"
            :title="copied ? 'Kopiert!' : 'Code kopieren'"
            @click="copyJoinCode"
          >
            <Icon
              :name="copied ? 'heroicons:check' : 'heroicons:clipboard-document'"
              class="w-5 h-5"
            />
          </button>

          <button
            v-if="shareLink"
            type="button"
            class="p-2 rounded-lg bg-white text-secondary-600 hover:text-primary-600 hover:bg-primary-50 shadow-sm border border-secondary-200 transition-all duration-200 flex items-center justify-center"
            title="Link teilen"
            @click="shareSession"
          >
            <Icon name="heroicons:share" class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
