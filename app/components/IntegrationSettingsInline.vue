<script setup lang="ts">
/**
 * IntegrationSettingsInline Component
 *
 * Inline settings for Jira and GitHub integrations.
 * All settings are stored locally in browser storage.
 * No OAuth required - just configuration.
 */

import type { IGitHubConfig, IJiraConfig } from '~/types/integration'
import { isValidGitHubRepo, isValidJiraFieldId } from '~/types/integration'
import {
  loadIntegrationConfig,
  saveIntegrationConfig,
} from '~/utils/externalStorage'

const { t } = useI18n()

/**
 * Props Definition
 */
interface Props {
  /** Show in expanded state */
  expanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  expanded: false,
})

/**
 * Local state
 */
const isExpanded = ref(props.expanded)
const config = ref(loadIntegrationConfig())

/**
 * Jira form data
 */
const jiraForm = ref<IJiraConfig>({
  cloudUrl: config.value.jira?.cloudUrl || '',
  storyPointsFieldId: config.value.jira?.storyPointsFieldId || 'customfield_10016',
  defaultJql: config.value.jira?.defaultJql || '',
  projectKey: config.value.jira?.projectKey || '',
})

/**
 * GitHub form data
 */
const githubForm = ref<IGitHubConfig>({
  owner: config.value.github?.owner || '',
  repo: config.value.github?.repo || '',
  projectNumber: config.value.github?.projectNumber,
  storyPointsFieldId: config.value.github?.storyPointsFieldId || '',
  defaultLabels: [...(config.value.github?.defaultLabels || [])],
})

/**
 * General settings
 */
const autoSyncOnNext = ref(config.value.autoSyncOnNext)

/**
 * Validation
 */
const jiraUrlValid = computed(() => {
  if (!jiraForm.value.cloudUrl) return true
  try {
    new URL(jiraForm.value.cloudUrl)
    return jiraForm.value.cloudUrl.includes('atlassian.net')
  }
  catch {
    return false
  }
})

const jiraFieldIdValid = computed(() => {
  if (!jiraForm.value.storyPointsFieldId) return true
  return isValidJiraFieldId(jiraForm.value.storyPointsFieldId)
})

const githubRepoValid = computed(() => {
  if (!githubForm.value.owner || !githubForm.value.repo) return true
  return isValidGitHubRepo(`${githubForm.value.owner}/${githubForm.value.repo}`)
})

/**
 * Has any integration configured
 */
const hasJiraConfig = computed(() => !!jiraForm.value.cloudUrl && !!jiraForm.value.storyPointsFieldId)
const hasGitHubConfig = computed(() => !!githubForm.value.owner && !!githubForm.value.repo)
const hasAnyConfig = computed(() => hasJiraConfig.value || hasGitHubConfig.value)

/**
 * Save settings to local storage
 */
function saveSettings(): void {
  const newConfig = {
    ...config.value,
    autoSyncOnNext: autoSyncOnNext.value,
    showExternalLinks: true,
  }

  // Only save Jira config if valid
  if (jiraForm.value.cloudUrl && jiraUrlValid.value && jiraFieldIdValid.value) {
    newConfig.jira = { ...jiraForm.value }
  }
  else {
    newConfig.jira = undefined
  }

  // Only save GitHub config if valid
  if (githubForm.value.owner && githubForm.value.repo && githubRepoValid.value) {
    newConfig.github = { ...githubForm.value }
  }
  else {
    newConfig.github = undefined
  }

  saveIntegrationConfig(newConfig)
  config.value = newConfig
}

/**
 * Auto-save on change
 */
watch([jiraForm, githubForm, autoSyncOnNext], () => {
  saveSettings()
}, { deep: true })

/**
 * Toggle expansion
 */
function toggle(): void {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div class="border border-secondary-200 rounded-lg overflow-hidden">
    <!-- Header -->
    <button
      type="button"
      class="w-full flex items-center justify-between p-3 bg-secondary-50 hover:bg-secondary-100 transition-colors text-left"
      @click="toggle"
    >
      <div class="flex items-center gap-2">
        <Icon name="heroicons:link" class="w-4 h-4 text-secondary-500" />
        <span class="text-sm font-medium text-secondary-700">
          {{ t('integration.settings') }}
        </span>
        <span
          v-if="hasAnyConfig"
          class="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded"
        >
          {{ t('integration.configured') }}
        </span>
      </div>
      <Icon
        :name="isExpanded ? 'heroicons:chevron-up' : 'heroicons:chevron-down'"
        class="w-4 h-4 text-secondary-400"
      />
    </button>

    <!-- Content -->
    <Transition name="slide-up">
      <div v-if="isExpanded" class="p-4 space-y-4 border-t border-secondary-200">
        <p class="text-xs text-secondary-500">
          {{ t('integration.localStorageHint') }}
        </p>

        <!-- Jira Section -->
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <Icon name="simple-icons:jira" class="w-4 h-4 text-blue-600" />
            <span class="text-sm font-medium text-secondary-800">Jira Cloud</span>
          </div>

          <div class="grid gap-3">
            <div>
              <label for="jira-url-inline" class="block text-xs font-medium text-secondary-600 mb-1">
                {{ t('integration.jira.cloudUrl') }}
              </label>
              <input
                id="jira-url-inline"
                v-model="jiraForm.cloudUrl"
                type="url"
                class="input text-sm"
                :class="{ 'border-red-400': jiraForm.cloudUrl && !jiraUrlValid }"
                placeholder="https://company.atlassian.net"
              >
            </div>

            <div>
              <label for="jira-field-inline" class="block text-xs font-medium text-secondary-600 mb-1">
                {{ t('integration.jira.storyPointsField') }}
              </label>
              <input
                id="jira-field-inline"
                v-model="jiraForm.storyPointsFieldId"
                type="text"
                class="input text-sm"
                :class="{ 'border-red-400': jiraForm.storyPointsFieldId && !jiraFieldIdValid }"
                placeholder="customfield_10016"
              >
              <p class="mt-1 text-xs text-secondary-400">
                {{ t('integration.jira.fieldIdHint') }}
              </p>
            </div>

            <div>
              <label for="jira-project-inline" class="block text-xs font-medium text-secondary-600 mb-1">
                {{ t('integration.jira.projectKey') }}
                <span class="text-secondary-400">({{ t('storyQueue.optional') }})</span>
              </label>
              <input
                id="jira-project-inline"
                v-model="jiraForm.projectKey"
                type="text"
                class="input text-sm"
                placeholder="PROJ"
              >
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="border-t border-secondary-100" />

        <!-- GitHub Section -->
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <Icon name="simple-icons:github" class="w-4 h-4 text-secondary-800" />
            <span class="text-sm font-medium text-secondary-800">GitHub</span>
          </div>

          <div class="grid gap-3">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label for="gh-owner-inline" class="block text-xs font-medium text-secondary-600 mb-1">
                  {{ t('integration.github.owner') }}
                </label>
                <input
                  id="gh-owner-inline"
                  v-model="githubForm.owner"
                  type="text"
                  class="input text-sm"
                  placeholder="org"
                >
              </div>
              <div>
                <label for="gh-repo-inline" class="block text-xs font-medium text-secondary-600 mb-1">
                  {{ t('integration.github.repo') }}
                </label>
                <input
                  id="gh-repo-inline"
                  v-model="githubForm.repo"
                  type="text"
                  class="input text-sm"
                  :class="{ 'border-red-400': githubForm.owner && githubForm.repo && !githubRepoValid }"
                  placeholder="repo"
                >
              </div>
            </div>

            <div>
              <label for="gh-project-inline" class="block text-xs font-medium text-secondary-600 mb-1">
                {{ t('integration.github.projectNumber') }}
                <span class="text-secondary-400">({{ t('storyQueue.optional') }})</span>
              </label>
              <input
                id="gh-project-inline"
                v-model.number="githubForm.projectNumber"
                type="number"
                class="input text-sm"
                placeholder="1"
              >
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="border-t border-secondary-100" />

        <!-- Auto-sync toggle -->
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium text-secondary-700">{{ t('integration.autoSyncOnNext') }}</div>
            <div class="text-xs text-secondary-500">{{ t('integration.autoSyncOnNextHint') }}</div>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="autoSyncOnNext" type="checkbox" class="sr-only peer">
            <div class="w-9 h-5 bg-secondary-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600" />
          </label>
        </div>

        <!-- Status -->
        <div v-if="hasAnyConfig" class="text-xs text-green-600 flex items-center gap-1">
          <Icon name="heroicons:check-circle" class="w-4 h-4" />
          {{ t('integration.settingsSaved') }}
        </div>
      </div>
    </Transition>
  </div>
</template>
