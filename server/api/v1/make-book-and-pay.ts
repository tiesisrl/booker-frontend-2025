import authApi from "@/server/authApi";
import { getMessageFromError } from "@/server/utils";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const cart = await authApi("/shop/cart/", {
    method: "POST",
    body,
  }).catch((error) => {
    console.log("ERROR", error.data);
    console.log("error.statusCode", error.statusCode);
    console.log("error.statusMessage", error.statusMessage);
    console.log("error.statusMessage", getMessageFromError(error));

    throw createError({
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      message: getMessageFromError(error),
      data: error.data,
    });
  });

  // console.log(cart);

  if (!cart.uuid) {
    console.log("CART UUID Non presente");
    throw createError({
      statusCode: 400,
      statusMessage: "Bad request",
      message: getMessageFromError(null),
      data: {},
      fatal: true,
    });
  }

  return authApi(`/shop/cart/${cart.uuid}/checkout/`, {
    method: "POST",
  }).catch((error) => {
    throw createError({
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      message: getMessageFromError(error),
      data: error.data,
    });
  });
});
