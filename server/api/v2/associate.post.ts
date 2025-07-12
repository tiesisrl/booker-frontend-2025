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
  
    return authApi("shop/join", {
      method: "POST",
      body: body,
    }).catch((error) => {
      throw createError({
        statusCode: error.statusCode,
        statusMessage: error.data?.statusMessage,
        message: error.data?.detail ?? "Ops! Qualcosa è andato storto. Riprova più tardi.",
        data: error.data,
      });
    });
});
