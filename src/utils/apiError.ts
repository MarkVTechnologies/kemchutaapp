// Turns a failed API call into text a person can act on. axios puts the
// server's explanation in response.data; its own error.message is only
// "Request failed with status code 400".
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const response = (err as { response?: { data?: { message?: unknown } } })
    ?.response;
  const serverMessage = response?.data?.message;
  if (typeof serverMessage === "string" && serverMessage.trim()) {
    return serverMessage;
  }
  // A reply with no usable message: the axios text would mean nothing here.
  if (response) return fallback;
  if ((err as { code?: string })?.code === "ECONNABORTED") {
    return "The request timed out. Check your connection and try again.";
  }
  if ((err as { message?: string })?.message === "Network Error") {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  return err instanceof Error && err.message ? err.message : fallback;
}
