# AI w Medycynie — dr Radosław Litwinowicz

Strona z komentarzami i analizami o sztucznej inteligencji w kardiologii, kardiochirurgii i medycynie ogólnej. W języku polskim, z perspektywy klinicznej.

## Struktura

- `index.html` — strona główna z listą artykułów
- `articles/*.html` — pojedyncze artykuły
- `articles.json` — indeks artykułów (slug, tytuł, data, tagi, excerpt) używany przez stronę główną
- `assets/styles.css`, `assets/main.js` — wspólne style i logika

## Jak agent dodaje nowy artykuł

1. Generuje plik `articles/YYYY-MM-DD-slug.html` z treścią po akceptacji człowieka
2. Dopisuje wpis do `articles.json`
3. Commituje do tego repo
4. Vercel automatycznie przebudowuje stronę

## Status

Faza 1: szkielet strony + przykładowy artykuł.
Następne: integracja z Telegram bot (akceptacja draftów), automatyczne pobieranie publikacji ze źródeł medycznych (NEJM AI, Lancet Digital Health, JACC, Circulation, EHJ, npj Digital Medicine i inne).
