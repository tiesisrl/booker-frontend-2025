<script lang="ts" setup>
import { useCartStore } from "~/stores/cart";

const cart = useCartStore();

interface Option {
  id: number;
  label: string;
  available_seats: number;
  is_active: boolean;
  flag: string;
}

interface Props {
  options?: Option[];
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  options: [],
  disabled: false,
});

const isSoldOut = computed(
  () => (opt: any) => opt.available_seats <= 0 || opt.flag === "SOLD_OUT"
);

const isAvailableOption = computed(() => (opt: any) => {
  if (!opt) return false;
  if (props.disabled) return false;
  if (!opt.is_active) return false;
  if (opt.available_seats <= 0) return false;
  if (!!opt.flag) return false;
  if (opt.available_seats < cart.totalSeats) return false;
  if (!opt.allow_infants && cart.infants > 0) return false;

  return true;
});

const disabledClass = ref(
  "text-400 shadow-none border-solid border-200 border-1"
);

const isSelected = computed(() => (opt) => opt?.id === cart.option?.id);
</script>

<template>
  <div class="flex flex-column gap-2">
    <div class="grid">
      <div
        class="col-12 md:col sm:col-12 relative"
        v-for="opt in options"
        :key="opt.id"
      >
        <div style="height: 30px" class="text-center" v-if="false">
          {{ cart.totalSeats }} / {{ opt.available_seats }} posti disponibili
        </div>
        <div class="relative">
          <div class="absolute top-50 right-0 select-none -my-3 mx-3 z-1">
            <Badge
              v-if="opt.flag === 'SOLD_OUT' || opt.available_seats <= 0"
              value="SOLD OUT"
              severity="danger"
              size="large"
              style="transform: rotate(-20deg)"
              class="select-none px-2"
            ></Badge>
          </div>
          <Button
            class="w-full flex flex-column flex-nowrap align-items-center justify-content-center border-2 hover:shadow-4"
            :class="{
              'bg-gray-200 border-gray-400': !isAvailableOption(opt),
            }"
            :outlined="!isSelected(opt)"
            @click="cart.option = opt"
            :disabled="!isAvailableOption(opt)"
          >
            <template #default>
              <div
                class="flex flex-column flex-nowrap align-items-center justify-content-center"
              >
                <div
                  class="font-bold text-xl p-2"
                  :class="{
                    'text-yellow-600': opt.label === 'Palco VIP',
                    'text-red-700': opt.label === 'Red Zone',
                  }"
                >
                  {{ opt.label }}
                </div>
              </div>
            </template>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
