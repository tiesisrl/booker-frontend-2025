<script lang="ts" setup>
import { useToast } from "primevue/usetoast";
import { useCartStore } from "@/stores/cart";

const emit = defineEmits(["success", "remove", "cancel"]);
const cart = useCartStore();
const toast = useToast();
const loading = ref(false);
const code = ref("");
const errorMessage = ref("");

const { event, timeslot, option } = storeToRefs(cart);

async function join() {
  if (!code.value) return;

  try {
    loading.value = true;

    const response = await $fetch("/api/v2/associate", {
      method: "POST",
      body: {
        code: code.value,
      },
    });
    toast.add({
      severity: "success",
      summary: "Associazione riuscita",
      life: 3000,
    });
    emit("success", response);
    errorMessage.value = ""
    code.value = "";
  } catch (error) {
    errorMessage.value = error?.data?.message
  } finally {
    loading.value = false;
  }
}

function cancelAssociation() {
  emit("cancel");
}
</script>

<template>
  <div id="p-associate-apply" class="p-associate-apply">
    <template v-if="!cart.isAssociated">
      <div>
        Se vuoi unirti ad una prenotazione già esistente, chiedi il numero
        assegnato alla prima prenotazione effettuata in precedenza dai tuoi
        amici ed inseriscilo qui.
      </div>
      <p class="text-sm pb-3">
        <i class="pi pi-info-circle text-sm mr-1"></i> Il codice si trova sul
        biglietto inviato via mail subito dopo la prenotazione.
      </p>
      <Message severity="error" v-if="errorMessage" class="scalein text-sm" :closable="false">{{ errorMessage }}
      </Message>
      <div class="flex md:flex-row flex-column gap-3">
        <InputText v-model="code" id="code" placeholder="Es: TBc0s16" required aria-describedby="code-help"
          :disabled="loading" class="md:w-14rem" size="large" />
        <Button icon="pi pi-check" :disabled="!code || loading" @click="join" label="Associa" :loading="loading"
          size="large" />
        <Button class="font-medium" label="Annulla" @click="cancelAssociation" outlined size="large"></Button>
      </div>
    </template>
    <template v-else>
      <div class="flex gap-2 flex-wrap md:flex-nowrap">
        <div class="text-xl grow-1 white-space-normal">
          Ti stai associando ad una prenotazione per il giorno
          <strong>{{ event?.label }}</strong> alle ore
          <strong>{{ timeslot?.label }}</strong> in
          <strong>{{ option?.label }}</strong>.
        </div>
        <Button class="font-medium" label="ANNULLA ASSOCIAZIONE" @click="cancelAssociation"></Button>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* :deep(.p-button.p-component.p-disabled.p-button-loading) {
  justify-content: center !important;
  align-content: center !important;
  background-color: red !important;
} */
</style>
