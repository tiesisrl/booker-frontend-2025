<script lang="ts" setup>
import { useCartStore } from "~/stores/cart";

const cartStore = useCartStore();

interface Product {
  id: string;
  name: string;
  description_plaintext: string;
  description_html: string;
  price: string;
}

interface Props {
  products?: Product[];
  disabled?: boolean;
  maxSeats?: number;
}

const MAX_SEATS_AVAILABLE = 96;

const props = withDefaults(defineProps<Props>(), {
  products: [],
  disabled: false,
  maxSeats: 2000, // TODO: sistemare il numero massimo di posti a sedere
});

const { disabled, maxSeats } = toRefs(props);
const { getTotalSeatsFromItems } = storeToRefs(cartStore);

const productList = computed(() => props.products);

const availableSeats = computed(() =>
  Math.min(maxSeats.value, MAX_SEATS_AVAILABLE)
);

const hasMaxSeatsAvailableBeenReached = computed(
  () => getTotalSeatsFromItems.value >= MAX_SEATS_AVAILABLE
);

const hasAvailableSeatsLimitBeenReached = computed(
  () => getTotalSeatsFromItems.value >= availableSeats.value
);

const canIncrementItem = computed(() => (item) => {
  if (disabled.value) return false;
  if (!item?.is_enable) return false;
  if (hasAvailableSeatsLimitBeenReached.value) return false;

  return cartStore.getTotalSeatsFromItems + item.seats <= availableSeats.value;
});

const isDisabledItem = computed(() => (item) => {
  if (disabled.value) return true;
  if (!item?.is_enable) return true;
  if (!maxSeats.value) return false;

  return cartStore.totalSeats + item.seats > availableSeats.value;
});
</script>

<template>
  <div class="booking-products flex flex-column gap-2 text-primary">
    <div class="flex flex-auto align-items-center justify-content-center flex-nowrap mt-3">
      <div class="flex-grow-1 mx-auto">
        <ProgressBar :pt="{
          root: {
            style: {
              height: '15px',
            },
          },
          value: {
            class: {
              'bg-yellow': getTotalSeatsFromItems < maxSeats,
              'bg-green-600': getTotalSeatsFromItems === maxSeats,
            },
          },
        }" :value="(getTotalSeatsFromItems / maxSeats) * 100" :show-value="false" class="-mt-1"></ProgressBar>
      </div>
      <div class="text-right p-2 mt-auto">
        <i class="pi pi-chevron-circle-down text-500 pr-3"
          :class="{ 'text-teal-600': getTotalSeatsFromItems === maxSeats }"></i>
        <strong>{{ getTotalSeatsFromItems }}</strong> di
        <strong>{{ maxSeats }}</strong>
      </div>
    </div>

    <div class="flex flex-column md:flex-row gap-2">
      <div v-for="(item, index) in productList" :key="index"
        class="product-list-item py-3 px-3 flex flex-grow-1 border-2 surface-border bg-white border-round border-200 border-blue shadow-1 hover:shadow-4">
        <div class="flex flex-row md:flex-column flex-1">
          <div class="product-detail flex-grow-1 select-none">
            <div class="text-lg md:text-2xl md:text-center font-medium md:py-3">
              {{ item.name }}
            </div>
            <div class="text-800 select-none pl-2 py-2">
              <div v-html="item.description_html"></div>
              <div v-if="item.fees_amount && item.fees_amount > 0">
                Diritti di prenotazione {{ item.fees_amount }}€
              </div>
            </div>
          </div>
          <div class="flex flex-column md:flex-row md:pt-3 justify-content-between align-content-end align-items-end"
            style="min-width: 150px">
            <div class="product-price md:text-2xl text-xl select-none">
              € {{ item.price * 1 }}
            </div>
            <div class="product-counter flex justify-content-end align-content-start align-items-start"
              style="min-width: 130px">
              <InputNumber :modelValue="cartStore.getItemQuantity(item)" @update:modelValue="
                (qty) => cartStore.setItemQuantity(item, qty)
              " :min="0" showButtons buttonLayout="horizontal" size="small"
                inputClass="border-round-lg text-center mx-1 w-3rem p-0 outline-none border-0 text-black-alpha-90 opacity-100 select-none text-xl"
                :inputProps="{ disabled: true }" incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
                decrementButtonClass="border-circle w-2rem h-2rem my-auto disable-dbl-tap-zoom"
                incrementButtonClass="border-circle w-2rem h-2rem my-auto disable-dbl-tap-zoom" :incrementButtonProps="{
                  disabled: !canIncrementItem(item),
                }" :decrementButtonProps="{
                  disabled: disabled,
                }" :disabled="disabled" style="min-width: 130px" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
b {
  font-weight: 600;
}

.disable-dbl-tap-zoom {
  touch-action: manipulation;
}

* {
  touch-action: manipulation;
}
</style>
