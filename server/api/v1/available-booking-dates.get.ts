import authApi from "@/server/authApi";
import { getMessageFromError } from "@/server/utils";

export default defineEventHandler(async (event) => {
  return authApi("booking/available-booking-dates").catch((error) => {
    throw createError({
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      message: getMessageFromError(error),
      data: error.data,
    });
  });
});
