<template>
  <div v-if="remaining > 0">
    <!-- <div class="text-green-600 text-sm mb-2">
      I tuoi biglietti sono ancora disponibili
    </div> -->

    <div
      class="flex flex-wrap align-self-center align-items-center justify-content-start items-center gap-2 text-green-800 bg-green-100 border border-green-400 rounded-lg px-3 py-2 w-full border-round-lg">
      <span>⏰</span>
      <span class="pt-1">Tempo residuo: {{ formattedTime }} Min.</span>
    </div>
  </div>
  <div v-else>
    <div class="text-gray-500 text-sm">
      Il carrello è scaduto.
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  expiresAt: {
    type: [String, Number, Date],
    required: true,
  },
})

const emit = defineEmits(['expired'])

const remaining = ref(0)
let intervalId = null
let expiredEmitted = false

const calculateRemainingSeconds = () => {
  const now = Date.now()
  const expires = new Date(props.expiresAt).getTime()
  return Math.max(Math.floor((expires - now) / 1000), 0)
}

const updateRemaining = () => {
  const secondsLeft = calculateRemainingSeconds()
  remaining.value = secondsLeft

  if (secondsLeft <= 0 && !expiredEmitted) {
    expiredEmitted = true
    emit('expired')
    clearInterval(intervalId)
  }
}

const formattedTime = computed(() => {
  const minutes = Math.floor(remaining.value / 60).toString().padStart(2, '0')
  const seconds = (remaining.value % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
})

const startInterval = () => {
  clearInterval(intervalId)
  updateRemaining()
  if (remaining.value > 0) {
    intervalId = setInterval(updateRemaining, 1000)
  }
}

onMounted(() => {
  startInterval()
})

onBeforeUnmount(() => {
  clearInterval(intervalId)
})

// 🔁 Se expiresAt cambia, aggiorna il timer
watch(
  () => props.expiresAt,
  () => {
    expiredEmitted = false
    startInterval()
  }
)
</script>
