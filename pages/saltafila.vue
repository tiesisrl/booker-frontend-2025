<script setup lang="ts">
import { useToast } from "primevue/usetoast";

const toast = useToast();
const loading = ref(false);
const active = ref(0);


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
const _computedSelectedOption = computed(() => _availableOptions.value?.find((o: any) => o.id === _selectedOptionId.value));
const _computedSelectedProduct = computed(() => _computedSelectedOption.value?.min_consumption);

const _computedTotalGuests = computed(() => _adultsCount.value + _childredCount.value + _infantsCount.value);
const _computedPayingGuests = computed(() => _adultsCount.value + _childredCount.value);
const _computedTotalAmount = computed(() => _computedSelectedProduct.value?.price * _computedPayingGuests.value);
const _availableActiveEvents = computed(() => _availableEvents.value?.filter(e => !e.is_ended) ?? [])

const discountCode = ref("");
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

    const result = await $fetch("/api/v2/available-skiptheline-options",
        {
            query: {
                event: eventId,
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

    reset();
    if (!eventId) return;


    try {
        loading.value = true;
        _availableOptions.value = await _getAvailableBookingOptions(_selectedEventId.value, eventId) || [];
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
    } catch (error) {
        console.error(error);
        toast.add({
            severity: "error",
            detail:
                error?.data?.data?.errors?.[0]?.detail ||
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
    return "Acquista"
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
    <div id="skiptheline-page" class="page page-content pb-3">
        <div ref="headerSectionRef" class="bg-blue-dark text-white">
            <div class="container header text-center pt-8 pb-4">
                <h1 class="text-3xl md:text-5xl pb-0 mb-0 font-medium">
                    <span class="b-text-yellow font-bold">SALTA</span> LA FILA
                </h1>
                <h3 class="text-base md:text-xl font-medium mt-2">
                    Salta la coda ed entra subito all'Oktoberfest Calabria
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

        <div class="container grid pt-6">
            <Stepper linear v-model:activeStep="active">
                <StepperPanel #content="{ nextCallback }">
                    <div class="grid gap-2">
                        <div v-for="(event, index) in _availableActiveEvents" :key="index" class="w-full">
                            <BEventSkipthelineCard :event="event" list button-label="Acquista" @clicked="{
                                _selectedEventId = event?.id;
                                nextCallback(event);
                            }" />
                        </div>
                    </div>
                </StepperPanel>
                <StepperPanel>
                    <template #content="{ prevCallback, nextCallback }">
                        <div class="flex flex-column gap-1">
                            <div>
                                <Button icon="pi pi-angle-left" label="Torna alla selezione delle date" link
                                    @click="(e) => { _selectedEventId = null; prevCallback(e); }" />
                            </div>
                            <div class="p-card p-component border-round-2xl p-3 shadow-none border-1 surface-border shadow-1"
                                v-if="_availableOptions.length > 0">
                                <BookingSeatingPlanImage />
                                <div
                                    class="flex flex-column md:flex-row gap-3 align-items-center justify-center justify-items-center">
                                    <div v-for="(item, index) in _availableOptions" :key="index"
                                        class="md:w-6 w-full p-card p-component border-1 surface-border relative mx-auto"
                                        :class="`${_selectedOptionId === item?.id ? 'shadow-3 bg-gray-200' : 'shadow-none'}`">
                                        <div v-if="item.available_pax === 0"
                                            class="absolute text-red bottom-0	 font-bold -mt-2 w-full"
                                            style="z-index: 1200 !important;">
                                            <div
                                                class="mx-auto border-round-sm p-3 text-red-600 bg-white-alpha-90 text-center text-4xl py-4 select-none	">
                                                SOLD
                                                OUT</div>
                                        </div>
                                        <BlockUI>
                                            <div
                                                class="flex flex-column align-items-center justify-center p-4 gap-3 w-full my-auto">
                                                <div class="text-lg uppercase text-500 text-center">
                                                    {{ item.type_display }}
                                                </div>
                                                <div class="font-medium text-3xl uppercase text-900 text-center">
                                                    {{ item.section_display }}
                                                </div>
                                                <div class="flex flex-column gap-3 pt-4 text-center">
                                                    <div v-html="item.description_html">
                                                    </div>
                                                </div>
                                                <div class="text-center pt-1">
                                                    <div class="text-6xl font-medium text-900 text-center mt-4">
                                                        € {{ item?.min_consumption?.price * 1 }}
                                                    </div>
                                                    <div class="text-sm text-500 -mt-1">
                                                        +{{ item.fees_amount * 1 }}€ di commissioni
                                                    </div>
                                                </div>
                                                <div class="text-center-4rem mt-4">
                                                    <Button :label="_buttonLabel" size="large" class="w-full md:w-auto"
                                                        :outlined="_selectedOptionId !== item?.id" @click="async () => {
                                                            _selectedOptionId = item?.id;
                                                            _selectedProductId = item?.min_consumption?.id;
                                                            addToCart(nextCallback);
                                                        }" :disabled="!item.is_active" />
                                                </div>
                                            </div>
                                        </BlockUI>
                                    </div>
                                </div>
                            </div>
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

                                            <CustomerForm ref="customerFormRef" hideInvoice>
                                                <template #terms>
                                                    <div
                                                        class="flex flex-column border-0 surface-border border-round-lg px-3 surface-ground text-primary text-sm font-light mt-2">
                                                        <p>
                                                            Il biglietto che verrà generato è l’unico che certifichi
                                                            l’avvenuto acquisto e che ti consentirà di accedere
                                                            all’Oktoberfest Calabria entrando dall’ingresso riservato ai
                                                            Saltafila.
                                                        </p>
                                                        <p>
                                                            Eventuali ulteriori tentativi di accesso con il medesimo
                                                            biglietto saranno respinti.
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
                                                        @remove-discount-code="removeDiscountCode"
                                                        adultLabel="ingresso" />
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
