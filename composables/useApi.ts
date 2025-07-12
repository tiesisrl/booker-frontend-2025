export const useApi = () => {
  const config = useRuntimeConfig();

  const baseURL = config.public.apiBaseUrl;

  const applyVoucher = async (orderId: string, voucherCode: string) => {
    if (!orderId) return;
    if (!voucherCode) return;

    const { data, error } = await useFetch(
      `/shop/orders/${orderId}/apply-voucher/`,
      {
        method: "POST",
        headers: {
          Authorization: config.public.authRequestHeaderValue,
        },
        baseURL,
        body: {
          code: voucherCode,
        },
      }
    );
    if (error.value) throw new Error(error.value?.data?.detail);
    if (data.value) return data.value;
  };

  const removeVoucher = async (orderId: string) => {
    if (!orderId) return;

    const { data, error } = await useFetch(
      `/shop/orders/${orderId}/remove-voucher/`,
      {
        method: "POST",
        headers: {
          Authorization: config.public.authRequestHeaderValue,
        },
        baseURL,
        body: {},
      }
    );

    if (error.value) throw new Error(error.value?.data?.detail);
    if (data.value) return data.value;
  };

  const applyAssociationCode = async (code: string) => {
    if (!code) return;

    const { data, error } = await useFetch("/shop/cart/associate", {
      method: "POST",
      baseURL,
      headers: {
        Authorization: config.public.authRequestHeaderValue,
      },
      body: {
        code,
      },
    });
    if (error.value) throw new Error(error.value?.data?.detail);
    if (data.value) return data.value;
  };

  const getOrderPaymentConfig = async (orderId: string) => {
    if (!orderId) return;

    const { data, error } = await useFetch(
      `/shop/orders/${orderId}/payment-config/`,
      {
        method: "GET",
        headers: {
          Authorization: config.public.authRequestHeaderValue,
        },
        baseURL,
      }
    );

    if (error.value) throw new Error(error.value?.data?.detail);
    if (data.value) return data.value;
  };

  const getErrorMessage = (error: any): string => {
    let message = "Ops! Qualcosa é andato storto!";
    const data = error.value?.data;

    if (typeof data === "object") return Object.values(data)?.[0] ?? message;
    if (typeof data === "string") return data || message;

    return message;
  };

  const validateCart = async (orderData: any) => {
    const { data, error } = await useFetch("/shop/cart/validate", {
      method: "POST",
      baseURL,
      headers: {
        Authorization: config.public.authRequestHeaderValue,
      },
      body: {
        ...orderData,
      },
    });
    if (error.value) throw new Error(getErrorMessage(error));
    if (data.value) return data.value;
  };

  const checkoutCart = async (orderData: any) => {
    const { data, error } = await useFetch("/shop/cart/checkout", {
      method: "POST",
      baseURL,
      headers: {
        Authorization: config.public.authRequestHeaderValue,
      },
      body: {
        ...orderData,
      },
    });
    if (error.value) throw new Error(getErrorMessage(error));
    if (data.value) return data.value;
  };

  const createStripeCheckoutSession = async (orderId: string) => {
    const { data, error } = await useFetch("shop/orders/checkout-session", {
      method: "POST",
      baseURL,
      headers: {
        Authorization: config.public.authRequestHeaderValue,
      },
      body: {
        id: orderId,
      },
    });
    if (error.value) throw new Error(getErrorMessage(error));
    if (data.value) return data.value;
  };

  const getSpecialBarrelRemaining = async () => {
    const { data, error } = await useFetch(
      `shop/orders/special-barrell-remaining`,
      {
        method: "GET",
        headers: {
          Authorization: config.public.authRequestHeaderValue,
        },
        baseURL,
      }
    );

    if (error.value) throw new Error(error.value?.data?.detail);
    if (data.value) return data.value;
  };

  async function createCart2(cartData: any) {
    const { data, error } = await useFetch("/shop/cart/", {
      method: "POST",
      baseURL,
      headers: {
        Authorization: config.public.authRequestHeaderValue,
      },
      body: {
        ...cartData,
      },
    });
    if (error.value) throw new Error(getErrorMessage(error));
    if (data.value) return data.value;
  }

  async function createCart(cartData: any) {
    const { data, error } = await useFetch("/shop/cart/", {
      method: "POST",
      baseURL,
      headers: {
        Authorization: config.public.authRequestHeaderValue,
      },
      body: {
        ...cartData,
      },
    });
    if (error.value) throw new Error(getErrorMessage(error));
    if (data.value) return data.value;
  }

  async function updateCostumer(cartId: string, costumerData: object = {}) {
    const { data, error } = await useFetch(`/shop/cart/${cartId}/`, {
      method: "PATCH",
      baseURL,
      headers: {
        Authorization: config.public.authRequestHeaderValue,
      },
      body: {
        ...costumerData,
      },
    });
    if (error.value) throw new Error(getErrorMessage(error));
    if (data.value) return data.value;
  }

  async function getCart(cartId: string | null = null) {
    // console.log("@@@@", cartId);
    const { data, error } = await useFetch(`/shop/cart/${cartId}/`, {
      method: "GET",
      baseURL,
      headers: {
        Authorization: config.public.authRequestHeaderValue,
      },
    });
    console.error(error.value);
    if (error.value) throw new Error(getErrorMessage(error));
    if (data.value) return data.value;
  }

  async function pay(cartId: string | null = null) {
    const { data, error } = await useFetch(`/shop/cart/${cartId}/pay/`, {
      method: "POST",
      baseURL,
      headers: {
        Authorization: config.public.authRequestHeaderValue,
      },
      body: {},
    });
    if (error.value) throw new Error(getErrorMessage(error));
    if (data.value) return data.value;
  }

  async function checkout(cartId: string | null = null) {
    const { data, error } = await useFetch(`/shop/cart/${cartId}/checkout/`, {
      method: "POST",
      baseURL,
      headers: {
        Authorization: config.public.authRequestHeaderValue,
      },
      body: {},
    });
    if (error.value) throw new Error(getErrorMessage(error));
    if (data.value) return data.value;
  }

  return {
    pay,
    createCart2,
    checkout,
    getCart,
    baseURL,
    removeVoucher,
    applyVoucher,
    applyAssociationCode,
    getOrderPaymentConfig,
    validateCart,
    checkoutCart,
    createCart,
    updateCostumer,
    createStripeCheckoutSession,
    getSpecialBarrelRemaining,
  };
};
