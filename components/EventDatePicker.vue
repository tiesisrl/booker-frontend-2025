<script lang="ts" setup>
// import { format, parse } from "date-fns";
import { it } from "date-fns/locale/index.js";

import { useCartStore } from "~/stores/cart";
const cart = useCartStore();

interface Props {
  events?: object[];
  disabled?: false;
}

const props = withDefaults(defineProps<Props>(), {
  events: [],
  disabled: false,
});

function frmt(date: string, formatStr = "PP") {
  return useFormat(useParse(date, "y-MM-dd", new Date()), formatStr, {
    locale: it,
  });
}

const dayName = computed(() => (date: string) => frmt(date, "EEEE"));
const dayNumber = computed(() => (date: string) => frmt(date, "d"));
const monthName = computed(() => (date: string) => frmt(date, "MMMM"));
</script>

<template>
  <div class="booking-event-date flex flex-column gap-2">
    <slot name="header"></slot>
    <div class="p-2 overflow-x-auto" style="white-space: nowrap">
      <div
        class="flexx flex-nowrapx gap-2 p-0 m-0 inline-block"
        style="width: 100px"
      >
        <Button
          v-for="evt in props.events"
          :key="evt.id"
          class="w-5rem md:w-6rem text-center py-4 px-1 mr-2 border-2 hover:shadow-4"
          size="small"
          :disabled="evt.disabled"
          @click="cart.event = evt"
          :outlined="!(cart.event?.id === evt.id)"
        >
          <div class="text-center flex flex-1 flex-column gap-1 font-medium">
            <div
              class="uppercase text-center text-xs"
              v-text="dayName(evt.date)"
            />
            <div class="text-5xl font-bold pt-1" v-text="dayNumber(evt.date)" />
            <div class="uppercase text-xs" v-text="monthName(evt.date)" />
          </div>
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
