// Streams dubbed into Indian languages are hidden: source labels such as "VidZee · v6:Hindi" or
// "Movie.2024.Hindi.Dubbed.720p" carry the language. Checked on the server (before media checks)
// and in the player's source list (add-on streams).
const INDIAN_LANGUAGES=/(?:^|[^a-z])(hindi|hin|tamil|tam|telugu|tel|malayalam|kannada|bengali|bangla|marathi|punjabi|gujarati|odia|urdu)(?![a-z])/i;

export function isIndianLanguageStream(...fields:(string|undefined|null)[]){
  return fields.some(field=>{
    if(!field)return false;
    // Only the readable part of a URL: hosts and tokens can contain letter runs like "tel".
    const text=/^https?:\/\//i.test(field)?decodeURIComponent(field.replace(/^https?:\/\/[^/]+/i,'').split('?')[0]):field;
    return INDIAN_LANGUAGES.test(text.replace(/[._/+-]+/g,' '));
  });
}
