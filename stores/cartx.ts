import { acceptHMRUpdate } from "pinia";

export const useCartxStore = defineStore("cartx", () => {
  // State
  const option = ref(null);
  const product = ref(null);
  const adults = ref(0);
  const children = ref(0);
  const infants = ref(0);
  const associationCode = ref("");

  // Getters
  const isAssociated = computed(() => !!associationCode.value);
  const optionId = computed(() => option.value?.id);
  const productId = computed(() => product.value?.id);
  const hasInfants = computed(() => infants.value > 0);

  const totalGuests = computed(() => adults.value + children.value + infants.value)
  const totalPayingGuests = computed(() => adults.value + children.value)
  const totalNetAmount = computed(() => product.value?.net_amount * totalPayingGuests.value)

  // actions
  function clear() {
    option.value = null;
    product.value = null;
    adults.value = 0;
    children.value = 0;
    infants.value = 0;
    associationCode.value = "";
  }

  return {
    option,
    product,
    adults,
    children,
    infants,
    associationCode,
    // Getters
    optionId,
    productId,
    isAssociated,
    hasInfants,
    totalNetAmount,
    totalGuests,
    clear
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCartxStore, import.meta.hot));
}
