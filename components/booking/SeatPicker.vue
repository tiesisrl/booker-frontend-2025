<script setup lang="ts">
import { useCartStore } from "@/stores/cart";
const cart = useCartStore();
const MAX_LIMIT = 96;

interface Props {
  disableInfants?: boolean;
  hideInfants?: boolean;
  max?: number | null;
  disabled?: boolean;
  disableInputs?: boolean;
  maxInfants: number;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  disableInfants: false,
  hideInfants: false,
  disableInputs: false,
});

const canIncrement = computed(
  () => cart.getTotalSeats < Math.min(props.max ?? MAX_LIMIT, MAX_LIMIT)
);

const { adults, children, infants } = storeToRefs(cart);
</script>

<template>
  <div class="formgrid grid pt-2">
    <div class="field col-12 md:col flex md:flex-column gap-2 align-items-center justify-content-center">
      <div class="flex-grow-1 select-none">
        <label for="booking_date">Adulti (16+ anni)</label>
      </div>
      <InputNumber v-model="adults" :min="1" :max="96" showButtons buttonLayout="horizontal" size="small"
        inputClass="border-round-lg text-center mx-1 w-3rem p-0 outline-none border-0 text-black-alpha-90 opacity-100 select-none text-xl"
        :inputProps="{ disabled: disableInputs }" incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
        decrementButtonClass="border-circle w-2rem h-2rem my-auto disable-dbl-tap-zoom"
        incrementButtonClass="border-circle w-2rem h-2rem my-auto disable-dbl-tap-zoom"
        style="max-width: 150px; min-width: 150px" class="border-round border-round-3xl border-2 p-1"
        :incrementButtonProps="{
          disabled: !canIncrement,
        }" />
    </div>

    <div class="field col-12 md:col flex md:flex-column gap-2 align-items-center justify-content-center">
      <div class="flex-grow-1 select-none">
        <label for="booking_date">Bambini (4-15 anni)</label>
      </div>
      <InputNumber v-model="children" :min="0" :max="96" showButtons buttonLayout="horizontal" size="small"
        :inputProps="{ disabled: disableInputs }"
        inputClass="border-round-lg text-center mx-1 w-3rem p-0 outline-none border-0 text-black-alpha-90 opacity-100 select-none text-xl"
        incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
        decrementButtonClass="border-circle w-2rem h-2rem my-auto disable-dbl-tap-zoom"
        incrementButtonClass="border-circle w-2rem h-2rem my-auto disable-dbl-tap-zoom"
        style="max-width: 150px; min-width: 150px" class="border-round border-round-3xl border-2 p-1"
        :disabled="adults < 1" :incrementButtonProps="{
          disabled: !canIncrement,
        }" />
    </div>

    <div v-if="!hideInfants"
      class="field col-12 md:col flex md:flex-column gap-2 align-items-center justify-content-center">
      <div class="flex-grow-1 select-none">
        <label for="booking_date">Bambini fino a 3 anni (gratuito)</label>
      </div>
      <InputNumber v-model="infants" :min="0" :max="maxInfants" showButtons buttonLayout="horizontal" size="small"
        inputClass="border-round-lg text-center mx-1 w-3rem p-0 outline-none border-0 text-black-alpha-90 opacity-100 select-none text-xl"
        :inputProps="{ disabled: disableInputs || props.disableInfants }" incrementButtonIcon="pi pi-plus"
        decrementButtonIcon="pi pi-minus"
        decrementButtonClass="border-circle w-2rem h-2rem my-auto disable-dbl-tap-zoom"
        incrementButtonClass="border-circle w-2rem h-2rem my-auto disable-dbl-tap-zoom"
        style="max-width: 150px; min-width: 150px" class="border-round border-round-3xl border-2 p-1"
        :disabled="adults < 0 || props.disableInfants" :incrementButtonProps="{
          disabled:
            !canIncrement || props.disableInfants || infants === maxInfants,
        }" />
    </div>
  </div>
</template>

<style scoped></style>
