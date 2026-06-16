type DatabaseErrorLike = {
  code?: string;
  message?: string;
};

export function isMissingSchemaError(error: DatabaseErrorLike | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";

  return (
    error?.code === "42P01" ||
    error?.code === "42703" ||
    error?.code === "PGRST204" ||
    error?.code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find the table") ||
    message.includes("could not find the column")
  );
}
