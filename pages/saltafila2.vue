<script lang="ts" setup>
import { useToast } from "primevue/usetoast";
import { useCartStore } from "@/stores/cart";

const toast = useToast();
const cart = useCartStore();

// Refs
const { event, option } = storeToRefs(cart);
const loading = ref(false);

const customerFormRef = ref(null);

const availableProduct = computed(() => (cart.option?.products ?? []).shift());
const availableEventList = computed(
  () => availableEvents.value?.filter((evt) => !evt.is_past) ?? []
);
const eventId = computed(() => cart.event?.id);

const {
  data: availableEvents,
  error,
  status,
  refresh,
} = await useFetch("/api/available-booking-dates", { server: true });

const {
  data: availableOptions,
  status: optionRequestStatus,
  error: optionRequestError,
} = await useLazyFetch("/api/skiptheline-options", {
  query: { event: eventId },
  immediate: false,
});

watch(availableOptions, async (value) => {
  if (value) {
    if (Array.isArray(value) && value.length > 0) {
      option.value = value.shift();

      const product = (option.value?.products ?? [])[0];
      if (product) {
        cart.clear();
        cart.setItemQuantity(product, 1);
      }
    }
  }
});

async function makeBook() {
  try {
    loading.value = true;
    const customerFormData = await customerFormRef.value?.submit();

    if (!customerFormData) {
      toast.add({
        severity: "error",
        detail: "Compila tutti i campi richiesti",
        summary: "Errore",
        life: 4000,
      });
      return;
    }

    const { payment_url } = await $fetch("/api/make-book-and-pay", {
      method: "POST",
      body: {
        type: "S",
        event: event.value.id,
        option: option.value.id,
        adults: 1,
        total_seats: 1,
        items: cart.items.map((item) => ({
          price: item.price,
          product: item.product.id,
          quantity: item.quantity,
        })),
        ...customerFormData,
      },
    });

    // console.log("PaymentRediretUrl", payment_url);

    await navigateTo(payment_url, {
      external: true,
    });
  } catch (error) {
    console.error(error);
    toast.add({
      severity: "error",
      detail:
        error?.data?.message ||
        error?.message ||
        "Ops! Qualcosa è andato storto! Riprova.",
      summary: "Errore",
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
}

const availableEventsItems = computed(() =>
  availableEventList.value?.map((e) => ({
    ...e,
    disabled: !(
      e.is_active &&
      e.skiptheline_enable &&
      e.skiptheline_is_allowed
    ),
  }))
);
</script>

<template>
  <div id="skiptheline-page" class="page page-content pb-8">
    <!-- Intestazione-->
    <section class="bg-blue-dark text-white">
      <div class="container header text-center pt-8">
        <h1 class="text-3xl md:text-5xl pb-0 mb-0 font-medium">
          <span class="b-text-yellow font-bold">SALTA</span> LA FILA
        </h1>
        <h3 class="text-base md:text-xl font-medium mt-2">
          Salta la coda ed entra subito all'Oktoberfest Calabria
        </h3>
      </div>
    </section>

    <!-- Data ***************************************************************************************** -->
    <section ref="bookingSectionRef" class="p-3">
      <div class="container">
        <div class="text-center">
          <h3 class="title text-3xl font-medium">Scegli la data</h3>
        </div>

        <EventDatePicker :events="availableEventsItems" />
      </div>
    </section>

    <section class="py-1">
      <div class="container">
        <Card v-if="option" class="border-3">
          <template #content>
            <div class="flex flex-row flex-1 gap-5 text-primary">
              <div class="px-3">
                <i
                  class="pi pi-ticket text-8xl"
                  style="transform: rotate(-45deg)"
                ></i>
              </div>
              <div class="product-detail flex-grow-1 select-none">
                <div class="text-3xl font-medium uppercase">
                  {{ availableProduct.name }}
                </div>
                <div class="text-800 text-lg select-none pl-2 py-2">
                  <div v-html="availableProduct.description_html"></div>
                </div>
              </div>
              <div
                class="flex flex-column justify-content-between align-content-end align-items-end"
                style="min-width: 150px"
              >
                <div class="product-price text-5xl select-none font-medium">
                  € {{ availableProduct.price * 1 }}
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </section>

    <section ref="checkoutSectionRef" class="bg-white" v-if="option">
      <div class="container pt-6">
        <div class="grid gap-2">
          <div class="md:col-8">
            <div class="text-left pb-3 w-full px-2 md:px-0">
              <h3 class="title text-2xl font-medium text-primary">
                Inserisci i tuoi dati
              </h3>
              <p class="text-color-secondary">
                Compila tutti i campi richiesti, verranno utilizzati per
                inviarti la conferma dell'operazione ed eventuali comunicazioni.
              </p>
            </div>

            <CustomerForm ref="customerFormRef" hide-invoice>
              <template #terms>
                <div
                  class="flex flex-column border-0 surface-border border-round-lg px-3 surface-ground text-primary text-sm font-light mt-2"
                >
                  <!-- <p class="">
                    Stai per confermare l'acquisto di 1 "Saltafila", per il
                    giorno
                    <strong>{{ cart.event?.label }}</strong> per un totale di
                    <strong>{{ cart.totalAmount }}</strong> €.
                  </p> -->
                  <p class="text-xs">
                    Il documento che verrà generato è l’unico che certifichi
                    l’avvenuto acquisto e che ti consentirà di accedere
                    all’Oktoberfest Calabria entrando dall’ingresso riservato
                    agli acquirenti del "Saltafila".
                  </p>
                </div>
              </template>
            </CustomerForm>
          </div>
          <div class="col">
            <div class="w-full">
              <div>
                <CheckoutSummary hide-fee-summary />
              </div>
              <div class="pt-3">
                <Button
                  :disabled="loading"
                  :loading="loading"
                  :label="`Conferma e paga`"
                  icon="pi pi-credit-card text-3xl -mt-2"
                  iconPos="left"
                  @click="makeBook"
                  size="large"
                  class="px-6 w-full pb-3 pt-4 text-2xl"
                  severity="secondary"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.disable-dbl-tap-zoom {
  touch-action: manipulation;
}

* {
  touch-action: manipulation;
}

section {
  padding-top: 3.5rem;
  padding-bottom: 4.75rem;
}

h3 {
  font-weight: 500 !important;
  text-transform: uppercase;
  font-size: 1.5rem !important;
}
</style>
