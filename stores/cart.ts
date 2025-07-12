import { acceptHMRUpdate } from "pinia";

interface ICartContent {
  [key: number]: any;
}

export const useCartStore = defineStore("cart", () => {
  // State
  const cartId = ref("");
  const cartContent = ref<ICartContent>({});

  const event = ref(null);
  const timeslot = ref(null);
  const option = ref(null);
  const adults = ref(0);
  const children = ref(0);
  const infants = ref(0);

  const associationCode = ref("");

  // Getters
  const cartItems = computed(() =>
    Object.values(cartContent.value).filter((item) => item.quantity > 0)
  );

  const getItemQuantity = computed(
    () => (item: any) => cartContent.value?.[item.id]?.quantity ?? 0
  );

  const getItemAmount = computed(
    () => (item: any) => cartContent.value?.[item.id]?.amount ?? 0
  );

  const getTotalAmount = computed(() =>
    cartItems.value.reduce((acc, item) => acc + item.amount, 0)
  );

  const getTotalSeats = computed(
    () => adults.value + children.value + infants.value
  );

  const getTotatFeesAmount = computed(() =>
    cartItems.value.reduce(
      (acc, item) => acc + item.quantity * item.product.fees_amount,
      0
    )
  );

  const getMinPackageRequired = computed(() => adults.value + children.value);

  const getTotalSeatsFromItems = computed(() =>
    cartItems.value.reduce(
      (acc, item) => acc + item.quantity * item.product.seats,
      0
    )
  );

  const getTotalAdultsFromItems = computed(() =>
    cartItems.value.reduce(
      (acc, item) => acc + item.quantity * item.product.num_adults,
      0
    )
  );

  const getTotalChildrenFromItems = computed(() =>
    cartItems.value.reduce(
      (acc, item) => acc + item.quantity * item.product.num_children,
      0
    )
  );

  const getTotalInfantsFromItems = computed(() =>
    cartItems.value.reduce(
      (acc, item) => acc + item.quantity * item.product.num_infants,
      0
    )
  );

  const isAssociated = computed(() => !!associationCode.value);

  // actions
  function removeAllItems() {
    cartContent.value = {};
  }

  function setItemQuantity(item: any, quantity: number) {
    const qty = Math.floor(Math.abs(quantity));

    cartContent.value = {
      ...cartContent.value,
      [item.id]: {
        product: item,
        quantity: qty,
        price: item.price,
        amount: item.price * qty,
      },
    };
  }

  return {
    cartId,
    content: readonly(cartContent),
    cartItems,
    event,
    timeslot,
    option,
    adults,
    children,
    infants,
    associationCode,
    isAssociated,
    items: cartItems,
    // Getters
    getTotalSeats,
    getItemQuantity,
    getTotalSeatsFromItems,
    getTotalAdultsFromItems,
    getTotalChildrenFromItems,
    getTotalInfantsFromItems,
    totalSeats: readonly(getTotalSeats),
    totalAmount: readonly(getTotalAmount),
    getMinPackageRequired,
    // Actions
    removeAllItems,
    clear: removeAllItems,
    setItemQuantity,
    getItemAmount,
    getTotalAmount,
    getTotatFeesAmount,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCartStore, import.meta.hot));
}
