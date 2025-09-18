<script setup lang="ts">
interface Props {
  cart: any;
  hideFeeSummary?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  hideFeeSummary: false,
});
const toast = useToast();
import { useToast } from "primevue/usetoast";
const { hideFeeSummary, cart } = toRefs(props);

const loading = ref(false);

defineEmits(['removeDiscountCode'])

async function applyDiscountCode() {
  try {
    loading.value = true;

    if (!discountCode.value) return;
    if (discountCode.value.length < 3) return;

    const cartId = localStorage.getItem("CartID") || "";

    const response = await $fetch(`http://localhost:8000/api/v1/shop/cart/${cartId}/apply-discount/`, {
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

    // console.log("response", response);

    cart.value = {
      ...cart.value,
      ...response,
    }

    toast.add({
      severity: "success",
      detail: response?.detail || "Codice applicato!",
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


</script>

<template>
  <Card>
    <template #title>
      <div class="title text-2xl font-medium uppercase text-primary">
        RIEPILOGO
      </div>
    </template>
    <template #content>
      <div class="flex flex-column gap-3 select-none">
        <!-- <Divider class="py-0 my-0 border-1 surface-border" /> -->

        <!-- Prodotti -->
        <div class="flex flex-column gap-3">
          <div>
            <div class="uppercase font-medium pb-2">{{ cart.option_type_display }} {{ cart.section_display }}</div>
            <div class="pb-1"><span class="pi pi-calendar pr-1"></span> {{ cart.event_display }}</div>
            <div class="pb-1">
              <span class="pi pi-user pr-1"></span> <strong>{{ cart.adults }}</strong> adulti e bambini dai 6 anni in
              su<span v-if="cart.children > 0">,
                {{
                  cart.children }}
                bambini</span><span v-if="cart.infants > 0">, <strong>{{ cart.infants }}</strong> bambini piccoli fino a
                5 anni</span>
            </div>
          </div>
          <div v-for="item in cart?.items ?? []" :key="item.id" class="gap-3">
            <!-- <div v-for="(line, index) in item.lines" :key="index" class="flex flex-column pl-2 pt-2">
              <div class="flex justify-content-between">
                <div>{{ line.quantity }} x {{ line.name }}</div>
                <div>€ {{ line.quantity * line.price }}</div>
              </div>
              <div class="flex justify-content-between">
                <div>{{ line.quantity }} x Commissioni {{ cart.fee_per_person }}€</div>
                <div>€ {{ line.quantity * line.fee }}</div>
              </div>
            </div> -->

            <div v-for="(line, index) in item.lines" class="flex justify-content-between">
              <div>
                <div class="mb-1">
                  {{ line.quantity }} x {{ line.name }}
                </div>
                <div class="text-gray-500 text- line-height-2">
                  {{ line.price }}€
                </div>
              </div>
              <div class="w-4 text-right">€ {{ line.total * 1 }}</div>
            </div>
            <div v-for="(line, index) in item.lines" class="flex justify-content-between pt-3">
              <div>
                <div class="mb-1">
                  {{ cart.total_paying_guests }} x Commissioni
                </div>
                <div class="text-gray-500 text- line-height-2">
                  {{ cart.fee_per_person * 1 }}€
                </div>
              </div>
              <div class="w-4 text-right">€ {{ cart.total_fee_amount * 1 }}</div>
            </div>
          </div>
        </div>

        <!-- <Divider class="py-0 my-0 border-1 surface-border" /> -->

        <Divider class="py-0 my-0 border-1 surface-border" />
        <!-- Totali -->
        <div class="flex flex-column gap-2 mt-3">
          <div class="flex justify-content-between">
            <div>Subtotale</div>
            <div>€ {{ cart.subtotal_amount * 1 }}</div>
          </div>
        </div>
        <div class="flex flex-column gap-2" v-if="cart.discount_amount * 1 > 0">
          <div class="flex justify-content-between">
            <div>Sconto <Button label="rimuovi" link class="p-0 m-0 px-2 mx-0"
                :pt="{ 'label': { 'class': 'font-normal text-red-500	' } }" @click="$emit('removeDiscountCode')" />
            </div>
            <div>-€ {{ cart?.discount_amount * 1 }}</div>
          </div>
          <div class="text-gray-500 text-sm -mt-2">
            {{ cart.discount_description }}
          </div>
        </div>

        <!-- Totali -->
        <div class="flex flex-column gap-2">
          <div class="flex justify-content-between text-2xl font-bold mt-4">
            <div>Totale</div>
            <div> € {{ cart?.total_amount * 1 }}</div>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped></style>
