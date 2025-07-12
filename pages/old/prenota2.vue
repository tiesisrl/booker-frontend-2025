<script setup lang="ts">
import { useToast } from "primevue/usetoast";
import { useCartStore } from "@/stores/cart";
// import PeoplePicker from "~/components/booking/PeoplePicker.vue";
import { useCartxStore } from "~/stores/cartx";

const toast = useToast();

const cart = useCartStore();
const cartx = useCartxStore()

// Refs
// const { event, timeslot, option, adults, children, infants, associationCode } =
//   storeToRefs(cart);

const { option, product, adults, children, infants, associationCode } = storeToRefs(cartx);


const loading = ref(false);

const numAdults = ref(1);
const numChildren = ref(0);
const numInfants = ref(0);

const selectedEvent = ref(null);
const selectedShift = ref(null);
const selectedTimeslot = ref(null);
const selectedArea = ref(null);
const selectedMinConsumption = ref(null);


const availableBookingOptions = ref([]);
const showAssociateDialog = ref(false);

/* Computed properties */
const selectedEventId = computed(() => selectedEvent?.value?.id);
const selectedTimeslotId = computed(() => selectedTimeslot.value?.id);
const { totalSeats, totalAmount } = storeToRefs(cart);


const {
  data: availableEvents,
  error,
  status,
  refresh,
} = await useFetch("/api/available-booking-dates", { server: false });


const {
  data: availableBookingTimeslots,
} = await useLazyFetch("/api/available-booking-timeslots", {
  query: { event: selectedEventId },
  immediate: false,
});



const totalPersons = computed(() => {
  return numAdults.value + numChildren.value + numInfants.value;
});
const currentTotalAmount = computed(() => {
  return (numAdults.value + numChildren.value) * selectedArea.value?.min_consumption?.default_price || 0;
});
const totalPayablePersons = computed(() => {
  return numAdults.value + numChildren.value;
});

const adultsAndChildrenSeats = computed(() => adults.value + children.value);
const maxInfants = computed(
  () => Math.ceil(adultsAndChildrenSeats.value / 8) * 2
);

const eventDates = computed(() => {
  return [...new Set(availableEvents.value?.map((evt) => ({
    value: evt.date,
    label: evt.formatted_date,
  })))];
});

watch(selectedEvent, async (value) => {
  if (value) {
    selectedTimeslot.value = null;
    availableBookingTimeslots.value = [];

  }
});


watch(maxInfants, (value) => {
  if (infants.value > value) infants.value = maxInfants.value;
});

watch([adults, children, infants], (value) => {
  if (!cart.isAssociated) {
    option.value = null;
  }
  cart.clear();
});


// Config components
const bookTypeButtonPT = {
  root: {
    // class: "border-round-xl px-5 py-3",
  },
  label: {
    class: "font-bold",
  },
};

async function addToCart() {
  try {
    loading.value = true;
    console.log("addToCart")

    const cart = await $fetch("http://localhost:8000/api/v1/shop/cartx/", {
      // baseURL: "http://localhost:8000/api/v1",
      method: "POST",
      headers: {
        // "Optional-Forward-Content": "32tsEFrE3boTkO",
        // "X-App-ID": "BOOKTA"
        "X-Cart-ID": localStorage.getItem("CartID") || ""
      },
      body: {
        option_id: selectedArea.value?.id,
        product_id: selectedMinConsumption.value,
        adults: numAdults.value,
        children: numChildren.value,
        infants: numInfants.value,
        channel: 1,
        items: []
      },
    });
    console.log("cart", cart);
    localStorage.setItem("CartID", cart?.id);
  } catch (e) {
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


async function onJoinSuccess({ code, event, timeslot, option }) {
  cart.event = event;
  await nextTick(() => {
    cart.associationCode = code;
    cart.option = option;
    cart.timeslot = timeslot;
  });
  showAssociateDialog.value = false;
}

const showEventPicker = computed(() => adults.value > 0 && !cart.isAssociated);
const showPackages = computed(() => !!option.value && totalSeats.value > 0);
const showCustomerForm = computed(
  () =>
    cart.getMinPackageRequired > 0 &&
    cart.getTotalSeatsFromItems === cart.getMinPackageRequired
);

const showPeoplePicker = computed(
  () => true // bookType.value === "NEW" || cart.isAssociated
);
// const showTimeslotSection = computed(() => !!event.value);

const hasInfants = computed(() => infants.value > 0);

// function handleAssociationCancel() {
//   event.value = null;
//   option.value = null;
//   timeslot.value = null;
//   associationCode.value = "";
//   adults.value = 0;
//   children.value = 0;
//   infants.value = 0;
//   bookType.value = "NEW";
//   cart.clear();
//   showAssociateDialog.value = false;
// }


const availableEventsItems = computed(() =>
  availableEventList.value?.map((e) => ({
    ...e,
    disabled: !(e.is_active && e.booking_enable && e.booking_is_allowed),
  }))
);

watch(selectedEvent, (value) => {
  console.log("[CHANGE] Selected event:", value);
})

watch(selectedShift, (value) => {
  console.log("[CHANGE] Selected shift:", value);
});

watch(selectedArea, (value) => {
  console.log("[CHANGE] Selected area:", value);
  if (value) {
    selectedMinConsumption.value = value.min_consumption?.id || null;
  } else {
    selectedMinConsumption.value = null;
  }
});

async function getAvailableBookingOptions() {
  if (!selectedEventId.value || !selectedTimeslotId.value) return;

  return await $fetch("/api/available-booking-options",
    {
      query: {
        event: selectedEventId.value,
        timeslot: selectedTimeslotId.value,
      }
    }
  );
}

watch(selectedTimeslot, async (value) => {
  console.log("[CHANGE] Selected timeslot:", value);
  if (value) {
    const options = await getAvailableBookingOptions();
    console.log("Available booking options:", options);
    availableBookingOptions.value = options || [];
  }
});


</script>

<template>
  <div id="booking-page" class="page page-content pb-8">
    <ClientOnly>
      <Teleport to="#navbar-content">
        <TheTopBar title="PRENOTA" :date="event?.label" :time="timeslot?.label" :area="option?.label"
          :seats="totalSeats" :amount="cart.totalAmount" :adults="adults" :children="children" :infants="infants" />
      </Teleport>
    </ClientOnly>

    <Dialog v-model:visible="showAssociateDialog" modal header="Associati ad una prenotazione"
      :style="{ 'max-width': '600px' }">
      <BookingAssociationCodeApply @success="onJoinSuccess" @remove="handleAssociationCancel" />
    </Dialog>


    <!-- Nuova prenotazione / Associa ***************************************************************************************** -->
    <section class="surface-100 bg-blue-dark text-white">
      <div class="container grid pt-6">
        <div class="grid" v-if="!cart.isAssociated">
          <!-- <div class="col text-center">
            <Button
              label="Nuova prenotazione"
              class="text-xl border-round-xl px-4"
              :pt="bookTypeButtonPT"
              @click="bookType = 'NEW'"
              severity="secondary"
              :outlined="bookType != 'NEW'"
              size="large"
            />
          </div> -->
          <div class="col text-center">
            <Button label="Associati ad una prenotazione esistente" class="text-xl border-round-xl text-white"
              :pt="bookTypeButtonPT" @click="
                () => {
                  showAssociateDialog = true;
                }
              " :outlined="bookType != 'JOIN'" size="large" />
          </div>
        </div>
        <div v-if="bookType === 'JOIN' && !!associationCode"
          class="p-4 bg-yellow border-round-lg border-x1 border-whitex text-primary">
          <!-- <BookingAssociationCodeApply
            @success="onJoinSuccess"
            @remove="handleAssociationCancel"
          /> -->
          <div class="flex gap-2 flex-wrap md:flex-nowrap">
            <div class="text-xl grow-1 white-space-normal">
              Ti stai associando ad una prenotazione per il giorno
            </div>
            <Button class="font-medium" label="ANNULLA ASSOCIAZIONE" @click="handleAssociationCancel"></Button>
          </div>
        </div>
      </div>
    </section>


    <!-- ################################################## -->
    <div class="container grid pt-6">
      <Stepper linear>
        <StepperPanel>
          <template #content="{ nextCallback }">
            <div class="flex flex-column">
              <BookingSeatingPlanImage class="mb-0" />
              <div class="grid w-full">
                <div class="col-12 md:col-6 lg:col-4">
                  <div class="flex flex-column gap-1 w-full">
                    <label for="date">Data</label>
                    <Dropdown id="date" v-model="selectedEvent" :options="availableEventsItems" optionLabel="label"
                      placeholder="Data" />
                  </div>
                </div>
                <div class="col-12 md:col-4 lg:col-3">
                  <div class="flex flex-column gap-1 w-full">
                    <label for="date">Orario di arrivo</label>
                    <Dropdown id="date" v-model="selectedTimeslot" :options="availableBookingTimeslots"
                      optionLabel="label" placeholder="Orario" />
                  </div>
                </div>
                <div class="col-12 md:col-6 lg:col-2">
                  <div class="flex flex-column gap-1 w-full">
                    <label for="area">Area</label>
                    <Dropdown id="area" v-model="selectedArea" :options="availableBookingOptions" optionLabel="label"
                      placeholder="Area" />
                  </div>
                </div>
                <div class="col-12 md:col-6 lg:col-3">
                  <div class="flex flex-column gap-1 w-full">
                    <label for="area">Persone</label>
                    <PeoplePicker v-model:adults="numAdults" v-model:children="numChildren" v-model:infants="numInfants"
                      :maxInfants="maxInfants" :disableInputs="true" class="w-full" />
                  </div>
                </div>
              </div>
              <div class="grid grid-nogutter" v-if="selectedArea">
                <div v-for="(item, index) in [selectedArea.min_consumption]" :key="index" class="col-12">
                  <div class="flex flex-column sm:flex-row sm:align-items-center py-4 gap-3"
                    :class="{ 'border-top-1 surface-border': index !== 0 }">
                    <Card class="w-full">
                      <template #title>
                        <div class="text-lg" v-html="item?.name"></div>
                      </template>
                      <template #content>
                        <div
                          class="flex flex-column md:flex-row justify-content-between md:align-items-center flex-1 gap-4 w-full">
                          <div class="flex flex-row md:flex-column justify-content-between align-items-start gap-2">
                            <div>
                              <div class="mt-2 text-lg" v-html="item?.name"></div>
                              <div class="mt-2" v-html="item?.description_html">
                              </div>
                            </div>
                          </div>
                          <div class="flex flex-column md:align-items-end gap-5">
                            <div>
                              <span class="text-xl font-semibold text-900">{{ item?.default_price }}€</span>
                              <span class="text-sm text-500">/persona</span>
                            </div>
                          </div>
                          <div class="flex flex-column md:align-items-end gap-5">
                            <div class="flex flex-row-reverse md:flex-row gap-2">
                              <RadioButton v-model="selectedMinConsumption" inputId="min-consumpion"
                                name="min-consumption" :value="item?.id" />
                            </div>
                          </div>
                        </div>
                      </template>
                    </Card>


                  </div>
                  <div class="flex justify-content-start">
                    <div class="text-sm text-500 -mt-3">
                      <span class="text-red-500">*</span> Il prezzo indicato è il minimo
                      consumo richiesto per ogni persona della prenotazione.
                    </div>
                  </div>
                </div>
              </div>

            </div>
            <div class="flex pt-4 justify-content-end">
              <Button :disabled="loading" :loading="loading"
                :label="`*** ${totalPersons} person${totalPersons > 1 ? 'e' : 'a'}, € ${currentTotalAmount}`"
                icon="pi pi-credit-card" iconPos="left" size="large" class="px-6 py-3" @click="addToCart" />

            </div>
          </template>
        </StepperPanel>
        <StepperPanel>
          <template #content="{ prevCallback, nextCallback }">
            <div class="flex flex-column">
              <!-- Checkout ***************************************************************************************** -->
              <section ref="checkoutSectionRef" class="bg-white">
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

                      <CustomerForm ref="customerFormRef">
                        <template #terms>
                          <div
                            class="flex flex-column border-0 surface-border border-round-lg px-3 surface-ground text-primary text-sm font-light mt-2">
                            <p>
                              Il documento che verrà generato è l’unico che certifichi
                              l’avvenuta prenotazione e che ti consentirà di accedere
                              all’Oktoberfest Calabria entrando dall’ingresso riservato ai
                              prenotati.
                            </p>
                            <p>
                              Una copia potrà essere consegnata solo ed esclusivamente
                              agli altri componenti interessati a questa prenotazione,
                              fino al raggiungimento di numero
                              <strong>{{ cart.totalSeats }}</strong> accessi totali.
                              Eventuali ulteriori tentativi di accesso con il medesimo QR
                              code saranno respinti.
                            </p>
                            <p>
                              È prevista una tolleranza di massimo
                              <strong>20 minuti</strong> dalle ore
                              <strong>{{ cart.timeslot?.label }}</strong> (un ritardo
                              oltre l’orario limite comporterà la perdita del diritto alla
                              presente prenotazione. Rimane la possibilità di recuperare
                              tale diritto nelle serate successive – previa disponibilità
                              dei posti – contattando l’organizzazione al numero
                              telefonico 0984.40.64.63).
                            </p>
                          </div>
                        </template>
                      </CustomerForm>
                    </div>
                    <div class="col">
                      <div class="w-full">
                        <div>
                          <CheckoutSummary />
                        </div>
                        <div class="pt-3">
                          <Button :disabled="loading" :loading="loading"
                            :label="`${totalPersons} person${totalPersons > 1 ? 'e' : 'a'}, € ${totalAmount}`"
                            icon="pi pi-credit-card" iconPos="left" @click="makeBook" size="large"
                            class="px-6 w-full py-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            <div class="flex pt-4 justify-content-between">
              <Button label="Back" severity="secondary" icon="pi pi-arrow-left" @click="prevCallback" />
              <Button label="Next" icon="pi pi-arrow-right" iconPos="right" @click="nextCallback" />
            </div>
          </template>
        </StepperPanel>
        <StepperPanel>
        </StepperPanel>
      </Stepper>
    </div>
  </div>
</template>

<style scoped>
.disable-dbl-tap-zoom {
  touch-action: manipulation;
}

* {
  touch-action: manipulation;
}
</style>
