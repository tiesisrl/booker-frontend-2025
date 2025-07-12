<script setup lang="ts">
import { useToast } from "primevue/usetoast";
import { useCartStore } from "@/stores/cart";
// import PeoplePicker from "~/components/booking/PeoplePicker.vue";
import { useCartxStore } from "~/stores/cartx";

const toast = useToast();
const cartx = useCartxStore()
const { option, product, adults, children, infants, associationCode } = storeToRefs(cartx);


const loading = ref(false);

const numAdults = ref(2);
const numChildren = ref(0);
const numInfants = ref(0);

const selectedDate = ref(null);
const selectedEvent = ref(null);
const selectedShift = ref(null);
const selectedTimeslot = ref(null);
const selectedArea = ref(null);
const selectedMinConsumption = ref(null);
const availableBookingOptions = ref([]);
const showAssociateDialog = ref(false);

const selectedProduct = ref(null);
const selectedOption = ref(null);

/* Computed properties */
const selectedEventId = computed(() => selectedEvent?.value?.id);
const selectedTimeslotId = computed(() => selectedTimeslot.value?.id);

const {
    data: eventDates,
    error,
    status,
    refresh,
} = await useFetch("/api/available-booking-dates", { server: false });


const {
    data: availableBookingTimeslots,
} = await useLazyFetch("/api/available-booking-timeslots", {
    query: { event: selectedEvent },
    immediate: false,
});


const totalGuests = computed(() => {
    return numAdults.value + numChildren.value + numInfants.value;
});
const totalPayingGuests = computed(() => {
    return numAdults.value + numChildren.value;
});
const currentTotalAmount = computed(() => {
    return totalPayingGuests.value * selectedProduct.value?.net_amount || 0;
});

const maxInfants = computed(
    () => Math.ceil(totalPayingGuests.value / 8) * 2
);

const availableDates = computed(() => {
    return [...new Set(eventDates.value?.map((evt) => ({
        value: evt.date,
        label: evt.formatted_date,
    })))];
});

const availableEvents = computed(() => eventDates.value?.filter(e => e.date === selectedDate.value));


watch(maxInfants, (value) => {
    if (infants.value > value) infants.value = maxInfants.value;
});

watch([adults, children, infants], (value) => {
    if (!cartx.isAssociated) {
        option.value = null;
    }
    cartx.clear();
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

async function addToCart(cb: any) {
    if (!(selectedOption.value && selectedProduct.value)) return;

    try {
        loading.value = true;
        console.log("addToCart")

        const cart = await $fetch("http://localhost:8000/api/v1/shop/cart/", {
            // baseURL: "http://localhost:8000/api/v1",
            method: "POST",
            headers: {
                // "Optional-Forward-Content": "32tsEFrE3boTkO",
                // "X-App-ID": "BOOKTA"
                "X-Cart-ID": localStorage.getItem("CartID") || ""
            },
            body: {
                option_id: selectedOption.value?.id,
                product_id: selectedProduct.value?.id,
                adults: numAdults.value,
                children: numChildren.value,
                infants: numInfants.value,
                channel: 1,
                items: []
            },
        });
        console.log("cart", cart);
        localStorage.setItem("CartID", cart?.id);
        cb();
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

async function checkout() {
    try {
        loading.value = true;
        console.log("checkout")

        const cardId = localStorage.getItem("CartID") || ""

        const { redirect_url } = await $fetch(`http://localhost:8000/api/v1/shop/cart/${cardId}/checkout/`, {
            method: "POST",
            body: {},
        });

        await navigateTo(redirect_url, { external: true });
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

// async function onJoinSuccess({ code, event, timeslot, option }) {
//     cart.event = event;
//     await nextTick(() => {
//         cart.associationCode = code;
//         cart.option = option;
//         cart.timeslot = timeslot;
//     });
//     showAssociateDialog.value = false;
// }

// const showEventPicker = computed(() => adults.value > 0 && !cart.isAssociated);
// const showPackages = computed(() => !!option.value && totalSeats.value > 0);
// const showCustomerForm = computed(
//     () =>
//         cart.getMinPackageRequired > 0 &&
//         cart.getTotalSeatsFromItems === cart.getMinPackageRequired
// );

// watch(selectedDate, (value) => { })

watch(selectedEvent, (value) => {
    console.log("[CHANGE] Selected event:", value);
    selectedTimeslot.value = null;
})

watch(selectedTimeslot, (value) => {
    console.log("[CHANGE] Selected shift:", value);
    if (!value) {
        numAdults.value = 0;
        numChildren.value = 0;
        numInfants.value = 0;
    }
});

watch(selectedShift, (value) => {
    console.log("[CHANGE] Selected shift:", value);
});

watch(option, (value) => {
    console.log("[CHANGE] option:", value);
    // if (value) {
    //     const selectedOption = availableBookingOptions.value.find(o => o.id === value)
    //     product.value = selectedOption.value.min_consumption
    // }
});

watch(selectedArea, (value) => {
    console.log("[CHANGE] Selected area:", value);
    // if (value) {
    //     selectedMinConsumption.value = value.min_consumption?.id || null;
    // } else {
    //     selectedMinConsumption.value = null;
    // }
});

async function getAvailableBookingOptions() {
    if (!selectedEvent.value || !selectedTimeslot.value) return;

    return await $fetch("/api/available-booking-options",
        {
            query: {
                event: selectedEvent.value,
                timeslot: selectedTimeslot.value,
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

watch(option, (value) => {
    if (value) {
        product.value = option.value?.min_consumption
    }
})

</script>

<template>
    <div id="booking-page" class="page page-content pb-8">
        <div class="container grid pt-6">
            <EventCard v-for="(event, index) in eventDates" :key="index" :event="event" />
            <Stepper linear>
                <StepperPanel>
                    <template #content="{ nextCallback }">
                        <div class="flex flex-column">
                            <BookingSeatingPlanImage class="mb-0" />
                            <div class="grid w-full">
                                <!-- <div class="col-12 md:col-6 lg:col-4">
                                    <div class="flex flex-column gap-1 w-full">
                                        <label for="date">Data</label>
                                        <Dropdown id="date" v-model="selectedDate" :options="availableDates"
                                            optionLabel="label" optionValue="value" placeholder="Data" />
                                    </div>
                                </div>
                                <div class="col-12 md:col-6 lg:col-4">
                                    <div class="flex flex-column gap-1 w-full">
                                        <label for="event">Turno</label>
                                        <Dropdown id="event" v-model="selectedEvent" :options="availableEvents"
                                            optionLabel="shift.name" optionValue="id" placeholder="Turno" />
                                    </div>
                                </div> -->
                                <div class="col-12 md:col-6 lg:col-4">
                                    <div class="flex flex-column gap-1 w-full">
                                        <!-- <label for="event">Data</label> -->
                                        <Dropdown id="event" v-model="selectedEvent" :options="eventDates"
                                            optionLabel="label" optionValue="id" placeholder="Quando vuoi venire?" />
                                    </div>
                                </div>
                                <div class="col-12 md:col-4 lg:col-4">
                                    <div class="flex flex-column gap-1 w-full">
                                        <!-- <label for="timeslot">Orario di arrivo</label> -->
                                        <Dropdown id="timeslot" v-model="selectedTimeslot"
                                            :options="availableBookingTimeslots" optionLabel="label" option-value="id"
                                            placeholder="A che ora pensi di arrivare?" :disabled="!selectedEvent" />
                                    </div>
                                </div>
                                <!-- <div class="col-12 md:col-6 lg:col-2">
                                    <div class="flex flex-column gap-1 w-full">
                                        <label for="area">Area</label>
                                        <Dropdown id="area" v-model="selectedArea" :options="availableBookingOptions"
                                            optionLabel="label" placeholder="Area" />
                                    </div>
                                </div> -->
                                <div class="col-12 md:col-6 lg:col-4">
                                    <div class="flex flex-column gap-1 w-full">
                                        <!-- <label for="area">Persone</label> -->
                                        <PeoplePicker v-model:adults="numAdults" v-model:children="numChildren"
                                            v-model:infants="numInfants" :maxInfants="maxInfants" :disableInputs="true"
                                            class="w-full" :disabled="!selectedEvent || !selectedTimeslot" />
                                    </div>
                                </div>
                            </div>
                            <div class="p-card">
                                <DataView :value="availableBookingOptions">
                                    <template #list="slotProps">
                                        <div class="grid grid-nogutter">
                                            <div v-for="(item, index) in slotProps.items" :key="index" class="col-12">
                                                <div class="flex flex-column sm:flex-row sm:align-items-center p-4 gap-3"
                                                    :class="{ 'border-top-1 surface-border': index !== 0 }">
                                                    <div class="md:w-10rem relative">
                                                        {{ item.label }}
                                                        <!-- <img class="block xl:block mx-auto border-round w-full"
                                                            :src="`https://placehold.co/600x400`" :alt="item.name" /> -->
                                                        <!-- <Tag :value="item.inventoryStatus" :severity="getSeverity(item)"
                                                            class="absolute" style="left: 4px; top: 4px"></Tag> -->
                                                    </div>
                                                    <div
                                                        class="flex flex-column md:flex-row justify-content-between md:align-items-center flex-1 gap-4">
                                                        <div
                                                            class="flex flex-row md:flex-column justify-content-between align-items-start gap-2">
                                                            <div>
                                                                <span class="font-medium text-secondary text-sm">{{
                                                                    item.category }}</span>
                                                                <div class="text-lg font-medium text-900 mt-2">{{
                                                                    item.name }}</div>
                                                            </div>
                                                            <!-- <div class="surface-100 p-1" style="border-radius: 30px">
                                                                <div class="surface-0 flex align-items-center gap-2 justify-content-center py-1 px-2"
                                                                    style="border-radius: 30px; box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.04), 0px 1px 2px 0px rgba(0, 0, 0, 0.06)">
                                                                    <span class="text-900 font-medium text-sm">{{
                                                                        item.rating }}</span>
                                                                    <i class="pi pi-star-fill text-yellow-500"></i>
                                                                </div>
                                                            </div> -->
                                                        </div>
                                                        <div class="flex flex-column md:align-items-end gap-5">
                                                            <div>
                                                                <span class="text-2xl font-semibold text-900">€ {{
                                                                    item?.min_consumption?.default_price }}</span>
                                                                <span class="text-sm text-500 block text-right -mt-1">a
                                                                    persona</span>
                                                            </div>
                                                            <div class="flex flex-row-reverse md:flex-row gap-2">
                                                                <!-- <Button icon="pi pi-heart" outlined></Button> -->
                                                                <!-- <Button icon="pi pi-shopping-cart" label="Buy Now"
                                                                    :disabled="item.inventoryStatus === 'OUTOFSTOCK'"
                                                                    class="flex-auto md:flex-initial white-space-nowrap"></Button> -->
                                                                <div class="flex flex-column md:align-items-end gap-5">
                                                                    <div
                                                                        class="flex flex-row-reverse md:flex-row gap-2">
                                                                        <!-- <RadioButton v-model="selectedProduct"
                                                                            inputId="min-consumpion"
                                                                            name="min-consumption"
                                                                            :value="item.min_consumption"
                                                                            @click="selectedOption = item" />
                                                                        {{ item.label }} -->

                                                                        <Button :disabled="loading" :loading="loading"
                                                                            :label="`${totalGuests} person${totalGuests > 1 ? 'e' : 'a'}, € ${totalPayingGuests * item.min_consumption.default_price}`"
                                                                            @click="() => {
                                                                                selectedOption = item;
                                                                                selectedProduct = item.min_consumption;
                                                                                addToCart(nextCallback)
                                                                            }" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                </DataView>
                            </div>
                            <!-- <div class="grid grid-nogutter" v-if="availableBookingOptions">
                                <div v-for="(item, index) in availableBookingOptions" :key="index" class="col-12">
                                    <div class="flex flex-column sm:flex-row sm:align-items-center py-4 gap-3"
                                        :class="{ 'border-top-1 surface-border': index !== 0 }">
                                        <Card class="w-full">
                                            <template #title>
                                                <div class="text-lg">{{ item.label }}</div>
                                            </template>
                                            <template #content>
                                                <div v-for="(item, index) in availableBookingOptions" :key="index"
                                                    class="flex flex-column sm:flex-row sm:align-items-center py-4 gap-3"
                                                    :class="{ 'border-top-1 surface-border': index !== 0 }">

                                                </div>
                                                <div
                                                    class="flex flex-column md:flex-row justify-content-between md:align-items-center flex-1 gap-4 w-full">
                                                    <div
                                                        class="flex flex-row md:flex-column justify-content-between align-items-start gap-2">
                                                        <div>
                                                            <div class="mt-2 text-lg" v-html="item?.name"></div>
                                                            <div class="mt-2" v-html="item?.description_html">
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="flex flex-column md:align-items-end gap-5">
                                                        <div>
                                                            <span class="text-xl font-semibold text-900">€ {{
                                                                item?.min_consumption?.default_price }}</span>
                                                            <span class="text-sm text-500">/persona</span>
                                                        </div>
                                                    </div>
                                                    <div class="flex flex-column md:align-items-end gap-5">
                                                        <div class="flex flex-row-reverse md:flex-row gap-2">
                                                            <RadioButton v-model="option" inputId="min-consumpion"
                                                                name="min-consumption" :value="item?.id" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </template>
                                        </Card>


                                    </div>
                                </div>
                                <div class="flex justify-content-start">
                                    <div class="text-sm text-500 -mt-3">
                                        <span class="text-red-500">*</span> Il prezzo indicato è il minimo
                                        consumo richiesto per ogni persona della prenotazione.
                                    </div>
                                </div>
                            </div> -->

                            <!-- <div class="grid grid-nogutter" v-if="selectedArea">
                                <div v-for="(item, index) in [selectedArea.min_consumption]" :key="index"
                                    class="col-12">
                                    <div class="flex flex-column sm:flex-row sm:align-items-center py-4 gap-3"
                                        :class="{ 'border-top-1 surface-border': index !== 0 }">
                                        <Card class="w-full">
                                            <template #title>
                                                <div class="text-lg" v-html="item?.name"></div>
                                            </template>
                                            <template #content>
                                                <div
                                                    class="flex flex-column md:flex-row justify-content-between md:align-items-center flex-1 gap-4 w-full">
                                                    <div
                                                        class="flex flex-row md:flex-column justify-content-between align-items-start gap-2">
                                                        <div>
                                                            <div class="mt-2 text-lg" v-html="item?.name"></div>
                                                            <div class="mt-2" v-html="item?.description_html">
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="flex flex-column md:align-items-end gap-5">
                                                        <div>
                                                            <span class="text-xl font-semibold text-900">{{
                                                                item?.default_price }}€</span>
                                                            <span class="text-sm text-500">/persona</span>
                                                        </div>
                                                    </div>
                                                    <div class="flex flex-column md:align-items-end gap-5">
                                                        <div class="flex flex-row-reverse md:flex-row gap-2">
                                                            <RadioButton v-model="selectedMinConsumption"
                                                                inputId="min-consumpion" name="min-consumption"
                                                                :value="item?.id" />
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
                            </div> -->

                        </div>
                        <div class="flex pt-4 justify-content-end">
                            <Button :disabled="loading" :loading="loading"
                                :label="`${totalGuests} person${totalGuests > 1 ? 'e' : 'a'}, € ${currentTotalAmount}`"
                                icon="pi pi-credit-card" iconPos="left" size="large" class="px-6 py-3"
                                @click="addToCart(nextCallback)" />

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
                                                            <strong>{{ totalGuests }}</strong> accessi totali.
                                                            Eventuali ulteriori tentativi di accesso con il medesimo QR
                                                            code saranno respinti.
                                                        </p>
                                                        <p>
                                                            È prevista una tolleranza di massimo
                                                            <strong>20 minuti</strong> dall'orario indicato (un ritardo
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
                                                        :label="`Completa acquisto`" iconPos="left" size="large"
                                                        class="px-6 w-full py-3" @click="checkout" />
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
                    <template #content="{ nextCallback }"></template>
                </StepperPanel>
            </Stepper>
            <!-- <div>Option: {{ selectedOption }}</div>
            <div>Product: {{ selectedProduct }}</div> -->

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
