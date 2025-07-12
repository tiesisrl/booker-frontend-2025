export const getMessageFromError = (error: any): string => {
  let message = "Ops! Qualcosa è andato storto, riprova.";
  const data = error?.data;

  if (typeof data === "string" && !!data) message = data;

  if (typeof data === "object" && data?.errors?.[0]?.detail)
    message = data?.errors?.[0]?.detail;

  return message;
};
