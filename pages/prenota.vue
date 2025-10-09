<script setup lang="ts">
import { useToast } from "primevue/usetoast";

const toast = useToast();
const loading = ref(false);
const active = ref(0);


// const _availableEvents = ref([]); -> useFetch al primo acesso alla pagina
const _availableTimeslots = ref<any[]>([]);
const _availableOptions = ref<any[]>([]);
const _availableProducts = ref<any[]>([]);

const _adultsCount = ref(1);
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

const _computedAvailableSeats = computed(() => {
    if (!_computedSelectedOption.value) return 0;
    return _computedSelectedOption.value.available_pax;
});

const _maxInfants = computed(
    () => Math.ceil(_computedPayingGuests.value / 8) * 2
);

const discountCode = ref("");

const showAssociateDialog = ref(false);
const sessionExpiredDialog = ref(false);

const customerFormRef = ref(null);
const cartData = ref<any | null>(null);



const {
    data: _availableEvents,
    refresh: _refreshavailableEvents,
} = await useFetch("/api/v2/available-booking-dates", { server: true });


async function _getAvailableTimeslots(eventId: any) {
    /* Recupera le fascie orarie disponibili per l'evento con id=eventId */

    if (!eventId) return;

    const result = await $fetch("/api/v2/available-booking-timeslots",
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

    const result = await $fetch("/api/v2/available-booking-options",
        {
            query: {
                event: eventId,
                timeslot: timeslotId,
            },
        }
    );
    return Array.isArray(result) ? result : [];
}

function reset() {
    _associationCode.value = "";
    _isAssociated.value = false;
    _associationData.value = null;

    discountCode.value = "";

    _selectedTimeslotId.value = null;
    _selectedOptionId.value = null;
    _selectedProductId.value = null;

    _availableOptions.value = [];
    _availableTimeslots.value = [];

    _adultsCount.value = 1;
    _childredCount.value = 0;
    _infantsCount.value = 0;
}

watch(() => _selectedEventId.value, async (eventId, oldValue) => {
    /* Quando cambia l'evento selezionato recupero le fascie orarie disponibili */
    // console.log("[CHANGED] _selectedEventId", eventId)
    if (_isAssociated.value) return;

    reset();
    if (!eventId) return;


    try {
        loading.value = true;
        _availableTimeslots.value = await _getAvailableTimeslots(eventId) || [];
    } catch (error) {
        console.error(error);
    } finally {
        loading.value = false;
    }
}, { deep: true });

watch(_selectedTimeslotId, async (value) => {
    /* */
    if (_isAssociated.value) return;
    if (!value) {
        _selectedOptionId.value = null;
        _availableOptions.value = [];
        _selectedProductId.value = null;
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


async function addToCart(cb: any) {
    if (!(_selectedOptionId.value && _selectedProductId.value)) return;

    try {
        loading.value = true;

        const cart = await $fetch("api/v2/cart", {
            method: "POST",
            headers: {
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

        const { redirect_url } = await $fetch(`/api/v2/checkout/`, {
            method: "POST",
            headers: {
                "X-Cart-ID": localStorage.getItem("CartID") || ""
            },
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


async function applyDiscountCode() {
    try {
        loading.value = true;

        if (!discountCode.value) return;
        if (discountCode.value.length < 3) return;

        const { data, detail } = await $fetch(`/api/v2/cart/apply-discount`, {
            method: "POST",
            headers: {
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

        const { data, detail } = await $fetch(`/api/v2/cart/remove-discount`, {
            method: "POST",
            headers: {
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

    await nextTick(() => {
        active.value = active.value + 1;
    });
}


async function handleAssociationCancel() {
    _associationCode.value = "";
    _isAssociated.value = false;
    _selectedEventId.value = null;

    await nextTick(() => {
        active.value = 0;
    });
}

// Config components
const bookTypeButtonPT = {
    root: {
        // class: "border-round-xl px-5 py-3",
    },
    label: {
        class: "font-bold",
    },
};

const _buttonLabel = computed(() => {
    let label = `Procedi ${_computedTotalGuests.value} person${_computedTotalGuests.value > 1 ? 'e' : 'a'}`
    if (_computedTotalAmount.value > 0)
        label += ` , € ${_computedTotalAmount.value}`
    return label
})

function handleExpiration() {
    if (active.value === 2) {
        sessionExpiredDialog.value = true;
    }
    active.value = 0;
    _refreshavailableEvents();
    reset();
    _selectedEventId.value = null;
}
</script>

<template>
    <div id="booking-page" class="page page-content pb-3">
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

        <Dialog v-model:visible="sessionExpiredDialog" modal :draggable="false" :closeOnEscape="false" :closable="false"
            :pt="{
                root: 'border-none',
                mask: {
                    style: 'backdrop-filter: blur(2px)'
                }
            }" header="Tempo scaduto" :style="{ width: '25rem' }">
            <span class="p-text-secondary block mb-5">Il tempo a disposizione per completare l'acquisto è
                terminato.</span>
            <div class="flex align-items-center gap-3 mb-3">
            </div>
            <div class="flex justify-content-end gap-2">
                <Button type="button" label="OK" @click="sessionExpiredDialog = false" class="w-full"></Button>
            </div>
        </Dialog>

        <Dialog v-model:visible="showAssociateDialog" modal header="Associati ad una prenotazione"
            :style="{ 'max-width': '600px' }">
            <BookingAssociationCodeApply @success="_onJoinSuccess" @cancel="showAssociateDialog = false" />
        </Dialog>

        <div class="container grid pt-6">
            <Stepper linear v-model:activeStep="active">
                <StepperPanel #content="{ nextCallback }">
                    <!-- Eventi -->
                    <div class="grid">
                        <div
                            class="col text-center text-xl flex align-content-center align-items-center flex-wrap bg-yellow mb-4 border-round-lg p-4 gap-2">
                            <i class="pi pi-user-plus ml-2 mr-3" style="font-size: 2.1rem"></i> <span class="pt-2">Hai
                                uno
                                codice associazione?</span>
                            <!-- <Button label="Clicca qui" :pt="bookTypeButtonPT" @click="showAssociateDialog = true;" link
                                class="p-1 text-xl mt-2" :disabled /> -->
                            <div class="text-red-500 pt-2">
                                Associazione <u>temporanemente</u> sospesa per problemi tecnici, riprova più tardi. Ci
                                scusiamo per il disagio.
                            </div>
                        </div>
                        <div>
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
                                @click="(e) => { _selectedEventId = null; handleAssociationCancel(); prevCallback(e); }" />
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
                                    <Button class="font-medium ml-3" label="Annulla"
                                        @click="handleAssociationCancel"></Button>
                                </div>
                            </div>
                            <!-- Evento -->
                            <div v-if="!_isAssociated"
                                class="p-card p-component border-round-2xl p-3 shadow-none border-1 surface-border shadow-1">
                                <div class="flex align-items-center justify-content-start py-2">
                                    <div class="w-3 white-space-nowrap"><i class="pi pi-calendar mr-1"></i> Data</div>
                                    <div class="flex gap-3 font-medium text-lg">
                                        {{ _computedSelectedEvent?.formatted_date }}
                                    </div>
                                </div>
                            </div>

                            <!-- Timeslots -->
                            <div v-if="!_isAssociated"
                                class="p-card p-component border-round-2xl p-3 shadow-none border-1 surface-border  shadow-1">
                                <div class="flex align-items-center justify-content-start">
                                    <div class="w-3 white-space-nowrap"><i class="pi pi-clock mr-1"></i> Orario</div>
                                    <div>
                                        <div class="flex gap-3">
                                            <div v-for="(ts, index) in _availableTimeslots" :key="index">
                                                <Button :label="ts.name" @click="_selectedTimeslotId = ts.id"
                                                    :outlined="_selectedTimeslotId !== ts.id" />
                                            </div>
                                        </div>
                                        <div class="text-sm py-2 -mb-3 text-500">Gli orari hanno il solo scopo di
                                            regolare i
                                            flussi di
                                            accesso. Il posto si
                                            considera prenotato per l’intera durata della serata</div>
                                    </div>
                                </div>
                            </div>



                            <div class="p-card p-component border-round-2xl p-3 shadow-none border-1 surface-border shadow-1"
                                v-if="_availableOptions.length > 0">
                                <BookingSeatingPlanImage />
                                <div class="flex flex-column md:flex-row gap-3">
                                    <div v-for="(item, index) in _availableOptions" :key="index"
                                        class="md:w-6 w-full p-card p-component border-1 surface-border relative"
                                        :class="`${_selectedOptionId === item?.id ? 'shadow-3 bg-gray-200' : 'shadow-none'}`">
                                        <div v-if="item.available_pax === 0 || item.flag === 'SOLD_OUT'"
                                            class="absolute text-red bottom-0	 font-bold -mt-2 w-full"
                                            style="z-index: 1200 !important;">
                                            <div
                                                class="mx-auto border-round-sm p-3 text-red-600 bg-white-alpha-90 text-center text-4xl py-4 select-none	">
                                                SOLD
                                                OUT</div>
                                        </div>
                                        <BlockUI :blocked="item.available_pax === 0 || item.flag === 'SOLD_OUT'">
                                            <div class="flex flex-column sm:align-items-center p-4 gap-3 w-full">

                                                <div class="text-lg uppercase text-500 text-center">
                                                    {{ item.type_display }}
                                                </div>
                                                <div class="font-medium text-3xl uppercase text-900 text-center">
                                                    {{ item.section_display }}
                                                </div>
                                                <div class="flex flex-column gap-3 pt-4 text-center">
                                                    <div class="text-center">
                                                        <span class="pi pi-user mr-1"></span> Posto a sedere riservato
                                                    </div>
                                                    <div class="font-medium text-center">
                                                        <span class="pi pi-bolt mr-1"></span> Ingresso prioritario
                                                    </div>
                                                    <div class="text-center pt-5">
                                                        <span class="pi pi-euro mr-1"></span> Valore
                                                        spendibile<span class="text-red-500">*</span>
                                                        <!-- <div v-html="item?.min_consumption?.description_html" /> -->
                                                    </div>
                                                </div>
                                                <div class="text-center pt-1">
                                                    <div class="text-6xl font-medium text-900 text-center">
                                                        € {{ item?.min_consumption?.price * 1 }}
                                                    </div>
                                                    <div class="text-sm text-500 -mt-1">
                                                        +{{ item.fees_amount * 1 }}€ di commissioni
                                                    </div>
                                                    <div class="text-sm text-700 block mt-1 text-center">a
                                                        persona
                                                    </div>
                                                </div>
                                                <div class="text-center-4rem mt-4" v-if="!_isAssociated">
                                                    <!-- <RadioButton v-model="_selectedOptionId" inputId="option" name="option"
                                                    active :value="item?.id" @click="() => {
                                                        _selectedOptionId = item?.id;
                                                        _selectedProductId = item?.min_consumption?.id;
                                                    }" /> -->
                                                    <Button label="Seleziona" size="large" class="w-full md:w-auto"
                                                        :outlined="_selectedOptionId !== item?.id" @click="() => {
                                                            _selectedOptionId = item?.id;
                                                            _selectedProductId = item?.min_consumption?.id;
                                                        }" :disabled="item.available_pax === 0" />
                                                </div>
                                                <div v-if="item.available_pax <= 100 && item.available_pax > 0" class="text-center -mb-2 mt-2 text-red-500
 font-bold">
                                                    <i class="pi pi-exclamation-circle"></i>
                                                    Ancora pochi posti!
                                                </div>
                                            </div>
                                        </BlockUI>
                                    </div>
                                </div>
                                <!-- <div class="grid grid-nogutter">
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
                                                <RadioButton v-model="_selectedOptionId" inputId="option" name="option"
                                                    active :value="item?.id" @click="() => {
                                                        _selectedOptionId = item?.id;
                                                        _selectedProductId = item?.min_consumption?.id;
                                                    }" />
                                            </div>
                                        </div>
                                    </div>
                                </div> -->
                            </div>

                            <!-- Persone -->
                            <template v-if="_isAssociated && _computedSelectedOption && _computedAvailableSeats <= 0">
                                <div
                                    class="p-card p-component border-round-2xl p-3 shadow-none border-1 surface-border shadow-1">
                                    <div class="text-red-600 text-xl font-bold text-center">
                                        <i class="pi pi-exclamation-triangle mr-2"></i>
                                        Non ci sono più posti disponibili per l'area selezionata.
                                    </div>
                                </div>
                            </template>
                            <template v-else>
                                <div class="p-card p-component border-round-2xl p-3 shadow-none border-1 surface-border shadow-1"
                                    v-if="_selectedOptionId">
                                    <div class="flex flex-column md:flex-row align-items-center justify-content-start">
                                        <div
                                            class="md:w-3 w-full md:text-left text-center p-2 md:p-0 white-space-nowrap">
                                            <i class="pi pi-users mr-1"></i>In quanti siete?
                                        </div>
                                        <div class="flex gap-3 w-full">
                                            <BookingHorizontalPeoplePicker v-model:adults="_adultsCount"
                                                v-model:children="_childredCount" v-model:infants="_infantsCount"
                                                :maxInfants="_maxInfants" :hide-children="true"
                                                :max="_computedAvailableSeats" class="w-full" />
                                            <!-- <BookingSeatPicker /> -->
                                        </div>
                                    </div>
                                    <Message severity="error"
                                        v-if="_computedSelectedOption && (_computedTotalGuests > _computedAvailableSeats)">
                                        Hai
                                        superato il numero di posti di disponibili per l'area
                                        selezionata. Riduci il numero di persone per proseguire.</Message>
                                </div>
                                <div class="flex justify-content-start mt-2 px-2 pb-2"
                                    v-if="_availableOptions.length > 0">
                                    <div class="text-sm text-500">
                                        <span class="text-red-500">*</span>
                                        Il prezzo indicato è il valore minimo di consumo per ogni persona. I coupon
                                        valore
                                        sono spendibili per food, beverage (esclusi bretzel) e gadgets. Eventuale
                                        credito
                                        residuo potrà essere speso in altre date dell’evento, ma non garantisce accesso
                                        né
                                        posto a sedere.
                                    </div>
                                </div>
                                <!-- Actions -->
                                <div class="pt-4" v-if="_selectedOptionId">
                                    <div class="flex align-items-center justify-content-end">
                                        <Button
                                            :disabled="loading || !_computedSelectedProduct || _computedTotalGuests < 1 || _computedTotalGuests > _computedAvailableSeats"
                                            :loading="loading" :pt="{ label: { class: 'font-normal text-xl' } }"
                                            :label="_buttonLabel" @click="() => addToCart(nextCallback)"
                                            class="w-full md:w-auto" />
                                    </div>
                                </div>
                            </template>
                        </div>
                    </template>
                </StepperPanel>
                <StepperPanel>
                    <template #content="{ prevCallback, nextCallback }">
                        <div class="flex flex-column">
                            <div>
                                <Button icon="pi pi-angle-left" label="Indietro" link @click="prevCallback" />
                            </div>
                            <!-- Checkout ***************************************************************************************** -->
                            <section ref="checkoutSectionRef" class="bg-whitex">
                                <div class="container pt-1">
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
                                                            <strong>{{ _computedTotalGuests }}</strong> accessi totali.
                                                            Eventuali ulteriori tentativi di accesso con il medesimo QR
                                                            code saranno respinti.
                                                        </p>
                                                        <p>
                                                            È prevista una tolleranza di massimo
                                                            <strong>20 minuti</strong> dall'orario indicato (un ritardo
                                                            oltre l’orario limite comporterà la perdita del diritto alla
                                                            presente prenotazione. Rimane la possibilità di recuperare
                                                            tale diritto nelle serate successive – previa disponibilità
                                                            dei posti – contattando l’organizzazione.
                                                        </p>
                                                    </div>
                                                </template>
                                            </CustomerForm>
                                        </div>
                                        <div class="col">
                                            <div class="w-full">
                                                <div class="py-2">
                                                    <CartCountdown :expiresAt="cartData.expires_at"
                                                        @expired="handleExpiration" v-if="cartData" />
                                                </div>
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
            </Stepper>
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

/* section {
    padding-top: 3.5rem;
    padding-bottom: 4.75rem;
} */

h3 {
    font-weight: 500 !important;
    text-transform: uppercase;
    font-size: 1.5rem !important;
}

:deep(.p-stepper-panels) {
    background-color: transparent !important;
}
</style>
