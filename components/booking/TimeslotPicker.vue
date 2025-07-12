<script lang="ts" setup>
import { useCartStore } from "~/stores/cart";

const cartStore = useCartStore();
const { timeslot } = storeToRefs(cartStore);

interface Props {
  timeslots?: object[];
  disabled?: false;
}

const props = withDefaults(defineProps<Props>(), {
  timeslots: [],
  disabled: false,
});
</script>

<template>
  <div class="booking-event-date flex flex-column gap-2">
    <h4 class="text-2xl font-medium text-center pb-0">Scegli l'orario</h4>
    <div
      class="flex flex-wrap gap-2 flex-column md:flex-row align-items-center justify-content-center"
    >
      <Button
        v-for="ts in props.timeslots"
        :key="ts.id"
        :label="ts.label"
        class="border-2 py-3 px-6 hover:shadow-4"
        @click="timeslot = ts"
        size="large"
        :outlined="!(timeslot?.id === ts.id)"
      />
    </div>
  </div>
</template>

<style scoped></style>
