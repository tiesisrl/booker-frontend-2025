import authApi from "@/server/authApi";
import { getMessageFromError } from "@/server/utils";

export default defineEventHandler(async (event) => {
  const { event: eventId } = getQuery(event);

  if (!eventId)
    throw createError({
      statusCode: 400,
      statusMessage: "Bad request",
      fatal: true,
    });
  
  return authApi("/booking/available-booking-timeslots", {
    method: "GET",
    query: { event: eventId },
  }).catch((error) => {
    throw createError({
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      message: getMessageFromError(error),
      data: error.data,
    });
  });
});
