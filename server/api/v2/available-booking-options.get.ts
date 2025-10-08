import authApi from "@/server/authApi";
import { getMessageFromError } from "@/server/utils";

export default defineEventHandler(async (event) => {
  const { event: eventId, timeslot: timeslotId } = getQuery(event);

  if (!eventId)
    throw createError({
      statusCode: 400,
      statusMessage: "Bad request",
      fatal: true,
    });

  try {
    const response = await authApi(`/booking/available-booking-options`, {
      method: "GET",
      query: { event: eventId, timeslot: timeslotId, type: "reservation" },
    })
    const cleanData = response?.map(o => ({
      ...o,
      available_pax: o?.flag === 'SOLD_OUT' || o?.flag === 'NOT_AVAILABLE' || o?.flag === 'AVAILABLE_SOON' ? 0 : o.available_pax
    }))

    return cleanData
  } catch (error) {
    throw createError({
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      message: getMessageFromError(error),
      data: error.data,
    });
  }
  
  // return authApi(`/booking/available-booking-options`, {
  //   method: "GET",
  //   query: { event: eventId, timeslot: timeslotId, type: "reservation" },
  // }).catch((error) => {
  //   throw createError({
  //     statusCode: error.statusCode,
  //     statusMessage: error.statusMessage,
  //     message: getMessageFromError(error),
  //     data: error.data,
  //   });
  // });
});
