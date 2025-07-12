import authApi from "@/server/authApi";
import { getMessageFromError } from "@/server/utils";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const cartId = getRequestHeader(event, "x-cart-id");

  
  return authApi(`/shop/cart/${cartId}/apply-discount/`, {
    method: "POST",
    body: body,
    headers: {
      "X-Cart-ID": cartId
    }
  }).catch((error) => {
    throw createError({
      statusCode: error.statusCode,
      statusMessage: error.data?.statusMessage,
      message: error.data?.detail ?? "Ops! Qualcosa è andato storto. Riprova più tardi.",
      data: error.data,
    });
  });
});
