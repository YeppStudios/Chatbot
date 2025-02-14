export const getISO639Language = (
  languageName: string | null | undefined
): string => {
  if (!languageName) return "en";

  const languageMapping: { [key: string]: string } = {
    English: "en",
    Spanish: "es",
    French: "fr",
    German: "de",
    Polish: "pl",
    Ukrainian: "uk",
    Arabic: "ar",
  };

  const normalizedLanguageName =
    languageName.charAt(0).toUpperCase() + languageName.slice(1).toLowerCase();
  return languageMapping[normalizedLanguageName] || "en";
};
