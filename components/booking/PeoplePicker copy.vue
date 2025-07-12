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
  adults?: number;
  children?: number;
  infants?: number;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  disableInfants: false,
  hideInfants: false,
  disableInputs: false,
  adults: 4,
  children: 0,
  infants: 0,
});

const canIncrement = computed(
  () => cart.getTotalSeats < Math.min(props.max ?? MAX_LIMIT, MAX_LIMIT)
);

// const { adults, children, infants } = props;

const op = ref();

const toggle = (event) => {
  op.value.toggle(event);
}

const adults = defineModel<number>("adults");
const children = defineModel<number>("children");
const infants = defineModel<number>("infants");

const totalPersons = computed(() => {
  return (adults.value + children.value + infants.value);
});

const label = computed(() => {
  if (totalPersons.value === 0) {
    return "Persone";
  } else if (totalPersons.value === 1) {
    return "1 persona";
  } else {
    return `${totalPersons.value} persone`;
  }
});
</script>

<template>
  <div class="flex flex-column gap-2">
    <Button id="people-button" :label="label" @click.prevent="toggle" icon="pi pi-user"
      class="w-full block hover:bg-white font-normal" outlined severity="secondary" :disabled="disabled" />

    <OverlayPanel ref="op" id="people-overlay" :dismissable="true" class="w-full md:w-auto">
      <div class="flex flex-column gap-2 w-full">
        <div>
          <span class="font-medium text-900 block mb-2">Persone</span>
          <div class="flex flex-column gap-2 w-full">

            <div class="flex md:pt-3 justify-content-between align-content-end align-items-end"
              style="min-width: 100px">
              <label for="date" class="select-none">
                Adulti
                <span class="text-sm text-500 block">da 18 anni in su</span>
              </label>
              <div class="product-counter flex justify-content-end align-content-start align-items-start"
                style="min-width: 130px">
                <InputNumber v-model="adults" :min="0" showButtons buttonLayout="horizontal" size="small"
                  inputClass="border-round-lg text-center mx-1 w-3rem p-0 outline-none border-0 text-black-alpha-90 opacity-100 select-none text-xl"
                  :inputProps="{ disabled: true }" incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
                  decrementButtonClass="border-circle w-2rem h-2rem my-auto disable-dbl-tap-zoom"
                  incrementButtonClass="border-circle w-2rem h-2rem my-auto disable-dbl-tap-zoom" />
              </div>
            </div>

            <div class="flex md:pt-3 justify-content-between align-content-end align-items-end"
              style="min-width: 100px">
              <label for="date" class="select-none">
                Bambini
                <span class="text-sm text-500 block">da 3 a 17 anni</span>
              </label>
              <div class="product-counter flex justify-content-end align-content-start align-items-start"
                style="min-width: 130px">
                <InputNumber v-model="children" :min="0" showButtons buttonLayout="horizontal" size="small"
                  inputClass="border-round-lg text-center mx-1 w-3rem p-0 outline-none border-0 text-black-alpha-90 opacity-100 select-none text-xl"
                  :inputProps="{ disabled: true }" incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
                  decrementButtonClass="border-circle w-2rem h-2rem my-auto disable-dbl-tap-zoom"
                  incrementButtonClass="border-circle w-2rem h-2rem my-auto disable-dbl-tap-zoom" />
              </div>
            </div>

            <div class="flex md:pt-3 justify-content-between align-content-end align-items-end"
              style="min-width: 100px">
              <label for="date" class="select-none">
                Neonati – <span class="text-green-400">gratis</span>
                <span class="text-sm text-500 block">fino a 3 anni</span>
              </label>
              <div class="product-counter flex justify-content-end align-content-start align-items-start"
                style="min-width: 130px">
                <InputNumber v-model="infants" :min="0" showButtons buttonLayout="horizontal" size="small"
                  inputClass="border-round-lg text-center mx-1 w-3rem p-0 outline-none border-0 text-black-alpha-90 opacity-100 select-none text-xl"
                  :inputProps="{ disabled: true }" incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
                  decrementButtonClass="border-circle w-2rem h-2rem my-auto disable-dbl-tap-zoom"
                  incrementButtonClass="border-circle w-2rem h-2rem my-auto disable-dbl-tap-zoom" :max="maxInfants" />
              </div>
            </div>

            <Button type="button" icon="pi pi-check" label="Conferma" @click="toggle" class="w-full block mt-3" />
          </div>
        </div>
      </div>
    </OverlayPanel>
  </div>
  <!-- <div class="formgrid grid pt-2">
    <div class="field col-12 md:col flex md:flex-column gap-2 align-items-center justify-content-center">
      <div class="flex-grow-1 select-none">
        <label for="booking_date">Adulti (16+ anni)</label>
      </div>
      <InputNumber v-model="adults" :min="1" :max="299" showButtons buttonLayout="horizontal" size="small"
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
      <InputNumber v-model="children" :min="0" :max="299" showButtons buttonLayout="horizontal" size="small"
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
  </div> -->
</template>

<style scoped></style>
