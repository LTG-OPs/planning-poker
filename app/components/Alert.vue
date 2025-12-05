<script setup lang="ts">
/**
 * Alert Komponente
 *
 * Wiederverwendbare Alert-Box für Benachrichtigungen.
 * Verwendet für Content-Integration.
 */

/**
 * Verfügbare Alert-Varianten
 */
type AlertVariant = 'info' | 'success' | 'warning' | 'error'

/**
 * Props Definition
 */
interface Props {
  /** Farbe/Variante des Alerts */
  color?: AlertVariant | string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'info',
})

/**
 * Mapping von Varianten zu Tailwind-Klassen
 */
const variantClasses: Record<AlertVariant, string> = {
  info: 'border-primary-500 bg-primary-50 text-primary-800',
  success: 'border-green-500 bg-green-50 text-green-800',
  warning: 'border-amber-500 bg-amber-50 text-amber-800',
  error: 'border-error-500 bg-error-50 text-error-800',
}

/**
 * Berechnet CSS-Klassen basierend auf der Variante
 */
const alertClasses = computed(() => {
  const variant = props.color as AlertVariant
  if (variantClasses[variant]) {
    return variantClasses[variant]
  }
  // Fallback für benutzerdefinierte Farben
  return 'bg-white'
})

/**
 * Inline-Style für benutzerdefinierte Farben
 */
const customStyle = computed(() => {
  const variant = props.color as AlertVariant
  if (!variantClasses[variant]) {
    return { borderColor: props.color }
  }
  return {}
})
</script>

<template>
  <div
    class="flex items-center p-4 border-2 rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    :class="alertClasses"
    :style="customStyle"
    role="alert"
  >
    <slot />
  </div>
</template>
