<script setup lang="ts">
interface Props {
  title?: string;
  date?: string;
  time?: string;
  area?: string;
  seats?: number;
  amount?: number;
  adults?: number;
  children?: number;
  infants?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  date: "",
  time: "",
  area: "",
  seats: 0,
  amount: 0,
  adults: 0,
  children: 0,
  infants: 0,
});
</script>

<template>
  <div
    class="absolute top-auto py-2 w-full bg-white shadow-1x border-1 surface-border z-4"
  >
    <div class="container">
      <div
        class="flex flex-column flex-initial w-full text-primary font-medium"
      >
        <div class="flex justify-content-between align-content-center gap-1">
          <div class="text-4xl font-bold pl-1 my-auto flex-grow-0" v-if="title">
            {{ title }}
          </div>
          <div class="hidden md:block">
            <div><i class="pi pi-calendar"></i> {{ props.date }}</div>
            <div><i class="pi pi-clock"></i> {{ props.time }}</div>
            <!-- <div><i class="pi pi-map-marker"></i> {{ option?.label }}</div> -->
          </div>
          <div class="hidden md:block">
            <div><i class="pi pi-map-marker"></i> {{ props.area }}</div>
            <!-- <div><i class="pi pi-users"></i> {{ props.seats }} posti</div> -->
            <div>
              <i class="pi pi-users"></i> {{ props.adults }} Adulti,
              {{ props.children }} bambini, {{ props.infants }} neonati
            </div>
          </div>
          <div class="text-right mr-1 md:block w-full md:w-auto">
            <div><i class="pi pi-shopping-cart mr-1"></i>Totale</div>
            <div class="text-xl font-bold">{{ props.amount }} €</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
