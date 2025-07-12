import authApi from "@/server/authApi";
import { getMessageFromError } from "@/server/utils";

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);

  if (!id)
    throw createError({
      statusCode: 400,
      statusMessage: "Bad request",
      fatal: true,
    });

  return authApi(`/shop/cart/${id}/checkout/`, {
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
