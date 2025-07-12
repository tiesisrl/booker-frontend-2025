<script setup lang="ts">
import { useCartStore } from "@/stores/cart";
const cart = useCartStore();

interface Props {
  hideFeeSummary?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  hideFeeSummary: false,
});

const { hideFeeSummary } = toRefs(props);

const {
  event,
  timeslot,
  option,
  adults,
  children,
  infants,
  associationCode,
  getTotatFeesAmount,
} = storeToRefs(cart);

const orderTypeLabel = computed(() => "Prenotazione");

const cartEventDisplay = computed(() => event.value?.label ?? "");
const cartTimeslotDisplay = computed(() => timeslot.value?.label ?? "");
const cartAreaDisplay = computed(() => option.value?.label ?? "");
const cartSeatsDisplay = computed(
  () =>
    `${adults.value} adulti, ${children.value} bambini, ${infants.value} neonati`
);
</script>

<template>
  <Card>
    <template #title>
      <div class="title text-2xl font-medium uppercase text-primary">
        RIEPILOGO
      </div>
    </template>
    <template #content>
      <div class="flex flex-column gap-3 select-none">
        <div class="flex gap-1 flex-wrap -ml-2">
          <Chip
            :label="cartEventDisplay"
            icon="pi pi-calendar"
            class="font-bold bg-white select-none"
          />
          <Chip
            v-if="timeslot"
            :label="cartTimeslotDisplay"
            icon="pi pi-clock"
            class="font-bold bg-white select-none"
          />
          <Chip
            :label="cartAreaDisplay"
            icon="pi pi-map-marker"
            class="font-bold bg-white w-full select-none"
          />
          <Chip
            v-if="adults > 0"
            :label="cartSeatsDisplay"
            icon="pi pi-users"
            class="font-bold bg-white w-full select-none"
          />
        </div>

        <Divider class="py-0 my-0 border-1 surface-border" />

        <!-- Prodotti -->
        <div class="flex flex-column gap-3">
          <div
            v-for="item in cart?.items ?? []"
            :key="item.id"
            class="flex justify-content-between"
          >
            <div>
              <div class="mb-1">
                {{ item.quantity }} x {{ item.product.name }}
              </div>
              <div class="text-gray-500 text- line-height-2">
                {{ item.price }}€
              </div>
            </div>
            <div class="w-4 text-right">{{ item.amount }}€</div>
          </div>

          <div v-if="!hideFeeSummary">
            Di cui <strong>{{ cart.getTotatFeesAmount }}</strong
            >€ di diritti di prenotazione.
          </div>
        </div>

        <Divider class="py-0 my-0 border-1 surface-border" />

        <!-- Totali -->
        <div class="flex flex-column gap-2">
          <div class="flex justify-content-between text-xl font-bold mt-3">
            <div>Totale</div>
            <div>{{ cart.totalAmount }} €</div>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped></style>
