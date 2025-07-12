<script setup lang="ts">
import { useToast } from "primevue/usetoast";
import { useCartStore } from "@/stores/cart";

const toast = useToast();

const cart = useCartStore();

// Refs
const { event, timeslot, option, adults, children, infants, associationCode } =
  storeToRefs(cart);

const loading = ref(false);

const showAssociateDialog = ref(false);
const bookType = ref("NEW");

const customerFormRef = ref(null);
const headerSectionRef = ref(null);
const guestsSectionRef = ref(null);
const bookingSectionRef = ref(null);
const timeslotSectionRef = ref(null);
const optionSectionRef = ref(null);
const packagesSectionRef = ref(null);
const checkoutSectionRef = ref(null);

const availableTimeslots = computed(() => event.value?.timeslots ?? []);
const availableProducts = computed(() => option.value?.products ?? []);

const { totalSeats, totalAmount } = storeToRefs(cart);

const eventId = computed(() => event.value?.id);
const {
  data: availableEvents,
  error,
  status,
  refresh,
} = await useFetch("/api/available-booking-dates", { server: false });

const {
  data: availableOptions,
  status: optionRequestStatus,
  error: optionRequestError,
} = await useLazyFetch("/api/booking-options", {
  query: { event: eventId },
  immediate: false,
});

const adultsAndChildrenSeats = computed(() => adults.value + children.value);
const maxInfants = computed(
  () => Math.ceil(adultsAndChildrenSeats.value / 8) * 2
);

watch(event, (value) => {
  if (!cart.isAssociated) {
    option.value = null;
    timeslot.value = null;
    associationCode.value = "";
  }

  cart.clear();
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

watch(option, async (value) => {
  if (value) {
    cart.clear();

    nextTick(() => {
      packagesSectionRef.value?.scrollIntoView({ behavior: "smooth" });
    });
  }
});

watch(bookType, async (value) => {
  if (value) {
    event.value = null;
    option.value = null;
    timeslot.value = null;
    associationCode.value = "";
    adults.value = 0;
    children.value = 0;
    infants.value = 0;
    cart.clear();
  }
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

async function makeBook() {
  try {
    loading.value = true;
    const customerFormData = await customerFormRef.value?.submit();
    // console.log("customerFormData", customerFormData);

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
        type: "P",
        event: event.value.id,
        option: option.value.id,
        timeslot: timeslot.value.id,
        adults: adults.value,
        children: children.value,
        infants: infants.value,
        total_seats: totalSeats.value,
        association_code: associationCode.value,
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
const showOptionPicker = computed(() => timeslot.value && !cart.isAssociated);
const showPeoplePicker = computed(
  () => true // bookType.value === "NEW" || cart.isAssociated
);
const availableEventList = computed(
  () => availableEvents.value?.filter((evt) => !evt.is_past) ?? []
);
const showTimeslotSection = computed(() => !!event.value);

const hasInfants = computed(() => infants.value > 0);

function handleAssociationCancel() {
  event.value = null;
  option.value = null;
  timeslot.value = null;
  associationCode.value = "";
  adults.value = 0;
  children.value = 0;
  infants.value = 0;
  bookType.value = "NEW";
  cart.clear();
  showAssociateDialog.value = false;
}

watch(showEventPicker, (value) => {
  if (value) {
    nextTick(() => {
      guestsSectionRef.value?.scrollIntoView({ behavior: "smooth" });
    });
  }
});

watch(timeslot, (value) => {
  nextTick(() => {
    optionSectionRef.value?.scrollIntoView({ behavior: "smooth" });
  });
});

watch(showCustomerForm, (value) => {
  nextTick(() => {
    checkoutSectionRef.value?.scrollIntoView({ behavior: "smooth" });
  });
});

watch(showTimeslotSection, (value) => {
  nextTick(() => {
    bookingSectionRef.value?.scrollIntoView({ behavior: "smooth" });
  });
});

const availableEventsItems = computed(() =>
  availableEventList.value?.map((e) => ({
    ...e,
    disabled: !(e.is_active && e.booking_enable && e.booking_is_allowed),
  }))
);
</script>

<template>
  <div id="booking-page" class="page page-content pb-8">
    <ClientOnly>
      <Teleport to="#navbar-content">
        <TheTopBar
          title="PRENOTA"
          :date="event?.label"
          :time="timeslot?.label"
          :area="option?.label"
          :seats="totalSeats"
          :amount="cart.totalAmount"
          :adults="adults"
          :children="children"
          :infants="infants"
        />
      </Teleport>
    </ClientOnly>

    <!-- Intestazione-->
    <div ref="headerSectionRef" class="bg-blue-dark text-white">
      <div class="container header text-center pt-8">
        <h1 class="text-3xl md:text-5xl pb-0 mb-0 font-medium">
          <span class="b-text-yellow font-bold">PRENOTA</span> IL TUO TAVOLO
        </h1>
        <h3 class="text-base md:text-xl font-medium mt-2">
          Salta la coda e prenota il tuo posto all'Oktoberfest Calabria
        </h3>
      </div>
    </div>

    <Dialog
      v-model:visible="showAssociateDialog"
      modal
      header="Associati ad una prenotazione"
      :style="{ 'max-width': '600px' }"
    >
      <BookingAssociationCodeApply
        @success="onJoinSuccess"
        @remove="handleAssociationCancel"
      />
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
            <Button
              label="Associati ad una prenotazione esistente"
              class="text-xl border-round-xl text-white"
              :pt="bookTypeButtonPT"
              @click="
                () => {
                  bookType = 'JOIN';
                  showAssociateDialog = true;
                }
              "
              :outlined="bookType != 'JOIN'"
              size="large"
            />
          </div>
        </div>
        <div
          v-if="bookType === 'JOIN' && !!associationCode"
          class="p-4 bg-yellow border-round-lg border-x1 border-whitex text-primary"
        >
          <!-- <BookingAssociationCodeApply
            @success="onJoinSuccess"
            @remove="handleAssociationCancel"
          /> -->
          <div class="flex gap-2 flex-wrap md:flex-nowrap">
            <div class="text-xl grow-1 white-space-normal">
              Ti stai associando ad una prenotazione per il giorno
              <strong>{{ event?.label }}</strong> alle ore
              <strong>{{ timeslot?.label }}</strong> in
              <strong>{{ option?.label }}</strong
              >.
            </div>
            <Button
              class="font-medium"
              label="ANNULLA ASSOCIAZIONE"
              @click="handleAssociationCancel"
            ></Button>
          </div>
        </div>
      </div>
    </section>

    <!-- Persone ***************************************************************************************** -->
    <section ref="guestsSectionRef" v-if="showPeoplePicker" class="bg-white">
      <div class="container">
        <div class="text-center">
          <h3 class="title text-3xl font-medium">In quanti siete?</h3>
          <p class="text-color-secondary">
            All’Oktoberfest Calabria, anche la sera i bambini sono i
            benvenuti.<br /><br />
            Fino ai 3 anni di età entrano gratuitamente ma, vista la tipologia
            di evento, con maggiore confusione e musica ad alto volume, al fine
            di salvaguardare la loro incolumità, per le prenotazioni con bambini
            appartenenti a quella fascia di età l’organizzazione ha previso i
            tavoli in platea.
          </p>
        </div>
        <BookingSeatPicker
          :disable-infants="cart.isAssociated && !option?.allow_infants"
          :max="cart.isAssociated ? option?.available_seats : null"
          disable-inputs
          :maxInfants="maxInfants"
        />
      </div>
    </section>

    <!-- Data / Ora ***************************************************************************************** -->
    <section ref="bookingSectionRef" v-if="showEventPicker" class="surface-100">
      <div class="container">
        <div class="text-center">
          <h3 class="title text-3xl font-medium">Quando vuoi venire?</h3>
          <p class="text-color-secondary">
            Ti ricordiamo che per le
            <span class="text-red-500 font-bold">domeniche a pranzo</span> non
            c’è bisogno di prenotare.<br /><br />Puoi venire direttamente con i
            tuoi figli e prendere posto dove desideri. È il momento dedicato
            alle famiglie e, oltre alla musica, non manca l’animazione e i
            giochi gonfiabili per far divertire anche i bambini.
          </p>
        </div>

        <EventDatePicker :events="availableEventsItems" />
        <BookingTimeslotPicker
          :timeslots="availableTimeslots"
          v-if="showTimeslotSection"
          ref="timeslotSectionRef"
        />
      </div>
    </section>

    <!-- Area ***************************************************************************************** -->
    <section
      ref="optionSectionRef"
      v-if="showOptionPicker"
      class="bg-white mb-8"
    >
      <div class="container">
        <div class="text-center">
          <h3 class="title text-3xl font-medium">Dove vuoi sederti?</h3>
          <!-- <p class="text-color-secondary">
            Scegli un pacchetto per ogni persona della prenotazione
          </p> -->
        </div>
        <BookingSeatingPlanImage class="mb-0" />
        <BookingOptionPicker :options="availableOptions" class="pb-3" />
      </div>
    </section>

    <!-- Pacchetti ***************************************************************************************** -->
    <section ref="packagesSectionRef" v-show="showPackages" class="surface-200">
      <div id="packages" class="container">
        <div class="text-center">
          <h3 class="title text-3xl font-medium">Scegli i pacchetti</h3>
          <p class="text-color-secondary">
            Scegli un pacchetto per ogni persona della prenotazione
          </p>
        </div>
        <BookingProductPicker
          :products="availableProducts"
          :max-seats="cart.getMinPackageRequired"
        />
      </div>
    </section>

    <!-- Checkout ***************************************************************************************** -->
    <section ref="checkoutSectionRef" v-if="showCustomerForm" class="bg-white">
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
                  class="flex flex-column border-0 surface-border border-round-lg px-3 surface-ground text-primary text-sm font-light mt-2"
                >
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
                <Button
                  :disabled="loading"
                  :loading="loading"
                  :label="`Conferma e paga ${totalAmount} €`"
                  icon="pi pi-credit-card"
                  iconPos="left"
                  @click="makeBook"
                  size="large"
                  class="px-6 w-full py-3"
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
:deep(.p-stepper-nav) {
  display: none;
}
:deep(.p-stepper-panels) {
  padding-left: 0;
  padding-right: 0;
}

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
