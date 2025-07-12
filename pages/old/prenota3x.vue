<script setup lang="ts">
import { useToast } from "primevue/usetoast";
import { useCartStore } from "@/stores/cart";
// import PeoplePicker from "~/components/booking/PeoplePicker.vue";
import { useCartxStore } from "~/stores/cartx";
import { da } from "date-fns/locale";


const route = useRoute()
const toast = useToast();
const cartx = useCartxStore();

onMounted(async () => {
    if (route.query.checkout) {
        const cart = await $fetch(`http://localhost:8000/api/v1/shop/cart/${localStorage.getItem("CartID")}`, {
            // baseURL: "http://localhost:8000/api/v1",
            method: "GET",
        });
        cartData.value = cart;
    }
})

const loading = ref(false);
const active = ref(0);

const { option, product, adults, children, infants, associationCode } = storeToRefs(cartx);

// const _availableEvents = ref([]); -> useFetch al primo acesso alla pagina
const _availableTimeslots = ref<any[]>([]);
const _availableOptions = ref<any[]>([]);
const _availableProducts = ref<any[]>([]);

const _adultsCount = ref(2);
const _childredCount = ref(0);
const _infantsCount = ref(0);

const _associationCode = ref("");
const _isAssociated = ref(false);
const _associationData = ref(null);

const _selectedEventId = ref(null);
const _selectedTimeslotId = ref(null);
const _selectedOptionId = ref(null);
const _selectedProductId = ref(null);


const _computedSelectedEvent = computed(() => _availableEvents.value?.find((o: any) => o.id === _selectedEventId.value));
const _computedSelectedTimeslot = computed(() => _availableTimeslots.value?.find((o: any) => o.id === _selectedTimeslotId.value));
const _computedSelectedOption = computed(() => _availableOptions.value?.find((o: any) => o.id === _selectedOptionId.value));
const _computedSelectedProduct = computed(() => _computedSelectedOption.value?.min_consumption);

const _computedTotalGuests = computed(() => _adultsCount.value + _childredCount.value + _infantsCount.value);
const _computedPayingGuests = computed(() => _adultsCount.value + _childredCount.value);
const _computedTotalAmount = computed(() => _computedSelectedProduct.value?.price * _computedPayingGuests.value);

const _maxInfants = computed(
    () => Math.ceil(_computedPayingGuests.value / 8) * 2
);



const numAdults = ref(2);
const numChildren = ref(0);
const numInfants = ref(0);

const selectedDate = ref(null);
const selectedEvent = ref(null);
const selectedTimeslot = ref(null);
const selectedArea = ref(null);
const selectedMinConsumption = ref(null);
const availableBookingOptions = ref([]);
const showAssociateDialog = ref(false);

const selectedProduct = ref(null);
const selectedOption = ref(null);

const customerFormRef = ref(null);
const cartData = ref<any | null>(null);


const {
    data: _availableEvents,
} = await useFetch("/api/available-booking-dates", { server: false });


const {
    data: eventDates,
    error,
    status,
    refresh,
} = await useFetch("/api/available-booking-dates", { server: false });


async function _getAvailableTimeslots(eventId: any) {
    /* Recupera le fascie orarie disponibili per l'evento con id=eventId */

    if (!eventId) return;

    const result = await $fetch("/api/available-booking-timeslots",
        {
            query: {
                event: eventId,
            },
        }
    );
    return Array.isArray(result) ? result : [];
}


async function _getAvailableBookingOptions(eventId: any, timeslotId: any) {
    /* 
    Recupera le opzioni di acquisto disponibili 
    per l'evento con id=eventId e fascia oraria con id=timeslotId
    */

    if (!eventId || !timeslotId) return;

    const result = await $fetch("/api/available-booking-options",
        {
            query: {
                event: eventId,
                timeslot: timeslotId,
            },
        }
    );
    return Array.isArray(result) ? result : [];
}

async function _onJoinSuccess(data: any) {
    _associationCode.value = data?.code;
    _isAssociated.value = true;
    _selectedEventId.value = data?.event_id;
    _selectedTimeslotId.value = data?.timeslot_id;
    _availableOptions.value = [data?.option];
    _selectedOptionId.value = data?.option_id;
    _selectedProductId.value = data?.option?.min_consumption?.id;
    _associationData.value = data;
    showAssociateDialog.value = false;
    active.value = active.value + 1;

    await nextTick(() => { });
}

watch(_selectedEventId, async (value) => {
    /* Quando cambia l'evento selezionato recupero le fascie orarie disponibili */

    if (_isAssociated.value) return;

    _selectedOptionId.value = null;
    _availableOptions.value = [];
    _selectedTimeslotId.value = null;
    _availableTimeslots.value = [];

    if (!value) return;

    try {
        loading.value = true;
        _availableTimeslots.value = await _getAvailableTimeslots(value) || [];
    } catch (error) {
        console.error(error);
    } finally {
        loading.value = false;
    }
});

watch(_selectedTimeslotId, async (value) => {
    /* */
    if (_isAssociated.value) return;
    if (!value) {
        _selectedOptionId.value = null;
        _availableOptions.value = [];
        return;
    };

    try {
        loading.value = true;
        _availableOptions.value = await _getAvailableBookingOptions(_selectedEventId.value, value) || [];
    } catch (error) {
        console.error(error);
    } finally {
        loading.value = false;
    }
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
    if (!(_selectedOptionId.value && _selectedProductId.value)) return;

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
                option_id: _selectedOptionId.value,
                product_id: _selectedProductId.value,
                adults: _adultsCount.value,
                children: _childredCount.value,
                infants: _infantsCount.value,
                channel: 1,
                items: [],
                join_code: _associationCode.value,
            },
        });
        cartData.value = cart;
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

        const cartId = localStorage.getItem("CartID") || ""

        const { redirect_url } = await $fetch(`http://localhost:8000/api/v1/shop/cart/${cartId}/checkout/`, {
            method: "POST",
            body: {
                ...customerFormData
            },
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

const discountCode = ref("");

async function applyDiscountCode() {
    try {
        loading.value = true;

        if (!discountCode.value) return;
        if (discountCode.value.length < 3) return;

        const cartId = localStorage.getItem("CartID") || "";

        const { data, detail } = await $fetch(`http://localhost:8000/api/v1/shop/cart/${cartId}/apply-discount/`, {
            // baseURL: "http://localhost:8000/api/v1",
            method: "POST",
            headers: {
                // "Optional-Forward-Content": "32tsEFrE3boTkO",
                // "X-App-ID": "BOOKTA"
                "X-Cart-ID": localStorage.getItem("CartID") || ""
            },
            body: {
                code: discountCode.value?.trim()
            },
        });

        discountCode.value = "";

        cartData.value = {
            ...cartData.value,
            ...data,
        }

        toast.add({
            severity: "success",
            detail: detail || "Codice applicato!",
            // summary: "summary",
            life: 4000,
        });


    } catch (error) {
        console.error(error);
        toast.add({
            severity: "error",
            detail:
                error?.data?.detail ||
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

async function removeDiscountCode() {
    try {
        loading.value = true;

        const cartId = localStorage.getItem("CartID") || "";

        const { data, detail } = await $fetch(`http://localhost:8000/api/v1/shop/cart/${cartId}/remove-discount/`, {
            // baseURL: "http://localhost:8000/api/v1",
            method: "POST",
            headers: {
                // "Optional-Forward-Content": "32tsEFrE3boTkO",
                // "X-App-ID": "BOOKTA"
                "X-Cart-ID": localStorage.getItem("CartID") || ""
            },
            body: {
                code: discountCode.value?.trim()
            },
        });

        cartData.value = {
            ...cartData.value,
            ...data,
        }

        toast.add({
            severity: "success",
            detail: detail || "Codice rimosso",
            // summary: "summary",
            life: 4000,
        });


    } catch (error) {
        console.error(error);
        toast.add({
            severity: "error",
            detail:
                error?.data?.detail ||
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


async function onJoinSuccess(data: any) {
    associationCode.value = data?.code;
    selectedEvent.value = data?.event_id;
    selectedTimeslot.value = data?.timeslot_id;
    // selectedOption.value = data?.option_id;

    await nextTick(() => {

    });
    showAssociateDialog.value = false;
}

function handleAssociationCancel() {
    // event.value = null;
    // option.value = null;
    // timeslot.value = null;
    // associationCode.value = "";
    // adults.value = 0;
    // children.value = 0;
    // infants.value = 0;
    // bookType.value = "NEW";
    // cart.clear();
    // showAssociateDialog.value = false;
}
</script>

<template>
    <div id="booking-page" class="page page-content pb-3 bg-gray-100">
        <!-- Intestazione-->
        <div ref="headerSectionRef" class="bg-blue-dark text-white">
            <div class="container header text-center pt-8 pb-4">
                <h1 class="text-3xl md:text-5xl pb-0 mb-0 font-medium">
                    <span class="b-text-yellow font-bold">PRENOTA</span> IL TUO TAVOLO
                </h1>
                <h3 class="text-base md:text-xl font-medium mt-2">
                    Salta la coda e prenota il tuo posto all'Oktoberfest Calabria
                </h3>
            </div>
        </div>

        <Dialog v-model:visible="showAssociateDialog" modal header="Associati ad una prenotazione"
            :style="{ 'max-width': '600px' }">
            <BookingAssociationCodeApply @success="_onJoinSuccess" @remove="handleAssociationCancel" />
        </Dialog>

        <div class="container grid pt-6">
            <Stepper linear v-model:activeStep="active">
                <StepperPanel #content="{ nextCallback }">
                    <!-- Eventi -->
                    <div class="grid">
                        <div class="col text-center flex align-content-center align-items-center flex-wrap">
                            Hai uno codice associazione?
                            <Button label="Clicca qui" :pt="bookTypeButtonPT" @click="showAssociateDialog = true;" link
                                class="p-1" />
                        </div>
                    </div>
                    <div class="grid gap-2">
                        <div v-for="(event, index) in _availableEvents" :key="index" class="w-full">
                            <BEventCard :event="event" list @clicked="{
                                _selectedEventId = event?.id;
                                nextCallback(event);
                            }" />
                        </div>
                    </div>
                </StepperPanel>
                <StepperPanel>
                    <template #content="{ prevCallback, nextCallback }">
                        <div>
                            <Button icon="pi pi-angle-left" label="Torna alla selezione delle date" link
                                @click="prevCallback" />
                        </div>
                        <div class="flex flex-column gap-1">
                            <div v-if="_isAssociated"
                                class="p-card p-component border-round-2xl p-3 shadow-none border-0 bg-green-100 border-green-200">
                                <div class="flex align-items-center justify-content-start py-2">
                                    Ti stai associando alla prenotazione per &nbsp;<b>{{
                                        _associationData?.event_date
                                    }},
                                        {{
                                            _associationData?.timeslot }} – {{ _associationData?.area_name }}</b>&nbsp;
                                    di&nbsp;
                                    <i>"{{ _associationData?.display_name }}"</i>.
                                </div>
                            </div>
                            <!-- Evento -->
                            <div v-if="!_isAssociated"
                                class="p-card p-component border-round-2xl p-3 shadow-none border-1 surface-border">
                                <div class="flex align-items-center justify-content-start py-2">
                                    <div class="w-3">Data</div>
                                    <div class="flex gap-3 font-medium text-lg">
                                        {{ _computedSelectedEvent?.formatted_date }}
                                    </div>
                                </div>
                            </div>

                            <!-- Timeslots -->
                            <div v-if="!_isAssociated"
                                class="p-card p-component border-round-2xl p-3 shadow-none border-1 surface-border">
                                <div class="flex align-items-center justify-content-start">
                                    <div class="w-3">Orario</div>
                                    <div class="flex gap-3">
                                        <div v-for="(ts, index) in _availableTimeslots" :key="index">
                                            <Button :label="ts.name" @click="_selectedTimeslotId = ts.id"
                                                :outlined="_selectedTimeslotId !== ts.id" />
                                        </div>
                                    </div>
                                </div>
                            </div>



                            <div class="p-card p-component border-round-2xl p-3 shadow-none border-1 surface-border"
                                v-if="_availableOptions.length > 0">
                                <BookingSeatingPlanImage />
                                <div class="grid grid-nogutter">
                                    <div v-for="(item, index) in _availableOptions" :key="index" class="col-12">
                                        <div class="flex flex-column sm:flex-row sm:align-items-center p-4 gap-3"
                                            :class="{ 'border-top-1 surface-border': index !== 0 }">
                                            <div class="font-medium text-lg uppercase w-14rem">
                                                {{ item.section_display }}
                                            </div>
                                            <div class="flex-grow-1">
                                                Include:
                                                <div v-html="item?.min_consumption?.description_html" />
                                            </div>
                                            <div class="text-right">
                                                <div class="text-xl font-medium text-900">
                                                    € {{ item?.min_consumption?.price }}
                                                </div>
                                                <div class="text-xs text-500 -mt-1">
                                                    +{{ item.fees_amount }}€ di commissioni
                                                </div>
                                                <div class="text-sm text-700 block mt-1">a
                                                    persona
                                                </div>
                                            </div>
                                            <div class="text-right w-4rem" v-if="!_isAssociated">
                                                <RadioButton v-model="selectedOption" inputId="option" name="option"
                                                    active :value="item" @click="() => {
                                                        _selectedProductId = item?.min_consumption?.id;
                                                        _selectedOptionId = item?.id;
                                                    }" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Persone -->
                            <div class="p-card p-component border-round-2xl p-3 shadow-none border-1 surface-border"
                                v-if="_selectedOptionId">
                                <div class="flex align-items-center justify-content-start">
                                    <div class="w-3">In quanti siete?</div>
                                    <div class="flex gap-3 w-20rem">
                                        <PeoplePicker v-model:adults="_adultsCount" v-model:children="_childredCount"
                                            v-model:infants="_infantsCount" :maxInfants="_maxInfants"
                                            :disableInputs="true" class="w-full" />
                                        <!-- <BookingSeatPicker /> -->
                                    </div>
                                </div>
                            </div>

                            <!-- Actions -->
                            <div class="pt-4" v-if="_selectedOptionId">
                                <div class="flex align-items-center justify-content-end">
                                    <Button :disabled="loading" :loading="loading"
                                        :pt="{ label: { class: 'font-normal text-xl' } }" :label="`Procedi ${_computedTotalGuests} person${totalGuests > 1 ? 'e' : 'a'}, €
                                        ${_computedTotalAmount}`" @click="() => addToCart(nextCallback)" />
                                </div>
                            </div>




                            <div class="grid w-full" v-if="false">
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
                            <template v-if="availableBookingOptions.length > 0">
                                <div class="p-card">
                                    <DataView :value="availableBookingOptions">
                                        <template #list="slotProps">
                                            <div class="grid grid-nogutter">
                                                <div v-for="(item, index) in slotProps.items" :key="index"
                                                    class="col-12">
                                                    <div class="flex flex-column sm:flex-row sm:align-items-center p-4 gap-3"
                                                        :class="{ 'border-top-1 surface-border': index !== 0 }">
                                                        <div class="font-medium text-lg uppercase w-14rem">
                                                            {{ item.section_display }}
                                                        </div>
                                                        <div class="flex-grow-1">
                                                            Include:
                                                            <div v-html="item?.min_consumption?.description_html" />
                                                        </div>
                                                        <div class="text-right">
                                                            <div class="text-xl font-medium text-900">
                                                                € {{ item?.min_consumption?.price }}
                                                            </div>
                                                            <div class="text-xs text-500 -mt-1">
                                                                +{{ item.fees_amount }}€ di commissioni
                                                            </div>
                                                            <div class="text-sm text-700 block mt-1">a
                                                                persona
                                                            </div>
                                                        </div>
                                                        <div class="text-right w-4rem">
                                                            <RadioButton v-model="selectedOption" inputId="option"
                                                                name="option" :value="item" @click="() => {
                                                                    selectedProduct = item?.min_consumption;
                                                                    selectedOption = item;
                                                                }" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </template>
                                    </DataView>
                                </div>
                                <div class="flex justify-content-start mt-2">
                                    <div class="text-sm text-500">
                                        <!-- <span class="text-red-500">*</span>  -->
                                        Il prezzo indicato è il minimo
                                        consumo richiesto per ogni persona. I coupon sono validi per food, beverage e
                                        gadget (esclusi i bretzel). Il
                                        credito
                                        residuo potrà essere usato in
                                        altre date dell’evento, ma non garantisce accesso né posto a sedere.

                                    </div>
                                </div>
                                <div class="flex justify-content-end mt-2">
                                    <Button :disabled="loading" :loading="loading"
                                        :pt="{ label: { class: 'font-normal text-xl' } }" :label="`Procedi ${totalGuests} person${totalGuests > 1 ? 'e' : 'a'}, €
                                        ${totalPayingGuests * selectedProduct?.price}`"
                                        @click="() => addToCart(nextCallback)" />
                                </div>

                            </template>
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
                                        <div class="md:col-7">
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
                                                    <!-- <CheckoutSummary /> -->
                                                    <CartCheckoutSummary :cart="cartData" v-if="cartData"
                                                        @remove-discount-code="removeDiscountCode" />
                                                </div>
                                                <div class="pt-3">
                                                    <Button :disabled="loading" :loading="loading"
                                                        :label="`Completa acquisto`" iconPos="left" size="large"
                                                        class="px-6 w-full py-3" @click="checkout" />
                                                </div>
                                                <div class="pt-4">
                                                    <div class="flex gap-3" v-if="!cartData?.has_discount_code">
                                                        <InputText type="text" v-model="discountCode"
                                                            placeholder="Usa il tuo codice sconto" />
                                                        <Button icon="pi pi-check" aria-label="Submit"
                                                            @click="applyDiscountCode" :loading="loading" />
                                                    </div>
                                                    <div class="bg-gray-100 p-3 flex justify-content-between align-items-center flex-wrap border-round-sm"
                                                        v-else>
                                                        <div class="flex-grow-1">Codice sconto <kbd>{{
                                                            cartData.discount_code }}</kbd>
                                                        </div>
                                                        <Button label="Rimuovi" severity="danger" outlined
                                                            @click="removeDiscountCode" text />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                        <!-- <div class="flex pt-4 justify-content-between">
                            <Button label="Back" severity="secondary" icon="pi pi-arrow-left" @click="prevCallback" />
                            <Button label="Next" icon="pi pi-arrow-right" iconPos="right" @click="nextCallback" />
                        </div> -->
                    </template>
                </StepperPanel>
                <StepperPanel>
                    <template #content="{ nextCallback }"></template>
                </StepperPanel>
            </Stepper>

            <div>
                <div><b>_selectedEventId</b>: {{ _selectedEventId }}</div>
                <div><b>_selectedTimeslotId</b>: {{ _selectedTimeslotId }}</div>
                <div><b>_selectedOptionId</b>: {{ _selectedOptionId }}</div>
                <div><b>_selectedProductId</b>: {{ _selectedProductId }}</div>
            </div>

            <!-- <div class="w-20rem text-right">
                <span class="text-2xl font-semibold text-900">€
                    {{
                        `30,00`
                    }}</span>
                <span class="text-sm text-500 block text-right -mt-1">a
                    persona</span>
            </div> -->

        </div>
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

:deep(.p-stepper-panels) {
    background-color: transparent !important;
}
</style>
