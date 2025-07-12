import authApi from "@/server/authApi";
import { getMessageFromError } from "@/server/utils";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  return authApi("/shop/cart/", {
    method: "POST",
    body,
  }).catch((error) => {
    throw createError({
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      message: getMessageFromError(error),
      data: error.data,
    });
  });
});
