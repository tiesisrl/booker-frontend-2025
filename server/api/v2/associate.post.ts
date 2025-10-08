import authApi from "@/server/authApi";
import { getMessageFromError } from "@/server/utils";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const { code } = body;

  if (!code)
    throw createError({
      statusCode: 400,
      statusMessage: "Codice mancante"
    })
    
    try {
      const response = await authApi("shop/join", {
        method: "POST",
        body: body,
      });

      const cleanedData = {
        ...response,
        option: {
          ...response?.option,
          available_pax: response?.option?.flag === 'SOLD_OUT' || response?.option?.flag === 'NOT_AVAILABLE' || response?.option?.flag === 'AVAILABLE_SOON' ? 0 : response?.option?.available_pax
        }
      }

      return cleanedData;
    } catch (error) {
      throw createError({
        statusCode: error.statusCode,
        statusMessage: error.data?.statusMessage,
        message: error.data?.detail ?? "Ops! Qualcosa è andato storto. Riprova più tardi.",
        data: error.data,
      });
    }
});
