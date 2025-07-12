<script lang="ts" setup>
const config = useRuntimeConfig();
const baseURL = config.public.apiBaseUrl;

const route = useRoute();

const {
  data: booking,
  pending,
  error,
} = useFetch<any>("/shop/orders/get-info", {
  headers: {
    Authorization: config.public.authRequestHeaderValue,
  },
  baseURL,
  query: {
    i: route.params.id,
    o: route.query.o,
  },
});

const tableRows = computed(() =>
  [
    ["Tipo", booking.value?.type === "P" ? "PRENOTAZIONE" : "SALTAFILA"],
    [
      "Data e ora ingresso",
      `${booking.value?.booking_date} ${booking.value?.booking_time}`,
    ],
    ["Posizione", booking.value?.booking_section],
    ["Posti", booking.value?.booking_seats],
    ["Rif. ordine", booking.value?.id],
    ["Data acquisto", booking.value.created_at],
    ["Importo", `${booking.value?.total_amount} €`],
    ["Codice associazione", `${route.params.id}`],
  ].map(([title, content], index) => ({ id: index, title, content }))
);

onMounted(() => {});
</script>

<template>
  <div class="px-2">
    <div
      class="flex flex-column gap-2 justify-content-center align-items-center b-text-blue"
    >
      <h1 class="text-5xl">LA TUA PRENOTAZIONE</h1>
    </div>
    <div
      v-if="pending"
      class="flex justify-content-center align-items-center pt-8 mt-4"
    >
      <ProgressSpinner
        :pt="{
          spinner: { style: { animationDuration: '1s' } },
          circle: {
            style: { stroke: '#ffb100', strokeWidth: 3, animation: 'none' },
          },
        }"
      />
    </div>
    <div v-else>
      <div v-if="error">
        <Message
          severity="error"
          :closable="false"
          :pt="{
            icon: { class: 'hidden' },
            text: { class: 'text-4xl text-center' },
          }"
        >
          Ci dispiace, non riusciamo a trovare la tua prenotazione
        </Message>
      </div>
      <Card
        v-else
        class="b-text-blue"
        :pt="{
          body: { class: 'p-0' },
          footer: { class: 'mx-0 my-0 pt-0 text-right p-3' },
        }"
      >
        <template #content>
          <DataTable
            :value="tableRows"
            :pt="{
              thead: { class: 'hidden' },
            }"
          >
            <Column
              field="title"
              class="w-4 md:3 text-color-secondary select-none"
            ></Column>
            <Column field="content" class="font-medium select-none"></Column>
          </DataTable>
        </template>
        <template #footer>
          <NuxtLink
            v-if="booking?.ticket_download_url"
            external
            :href="booking?.ticket_download_url"
          >
            <Button
              icon="pi pi-download"
              label="Scarica il biglietto"
              outlined
            />
          </NuxtLink>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
*:focus {
  outline: none;
  box-shadow: none;
}
</style>
