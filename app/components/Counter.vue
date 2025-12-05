<script setup lang="ts">
/**
 * Counter Komponente
 *
 * Einfache Demo-Komponente für Content-Integration.
 * Zeigt einen Zähler mit Increment/Decrement-Buttons.
 */

/**
 * Reaktiver Zählerwert
 */
const count = ref(0)

/**
 * Erhöht den Zähler um 1
 */
function increment(): void {
  count.value++
}

/**
 * Verringert den Zähler um 1
 */
function decrement(): void {
  count.value--
}
</script>

<template>
  <div class="inline-flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-secondary-200">
    <button
      class="w-10 h-10 rounded-lg bg-secondary-100 hover:bg-secondary-200 text-secondary-700 font-bold transition-colors"
      aria-label="Verringern"
      @click="decrement"
    >
      −
    </button>

    <span class="text-xl font-bold text-secondary-800 min-w-12 text-center">
      {{ count }}
    </span>

    <button
      class="w-10 h-10 rounded-lg bg-primary-100 hover:bg-primary-200 text-primary-700 font-bold transition-colors"
      aria-label="Erhöhen"
      @click="increment"
    >
      +
    </button>
  </div>
</template>
