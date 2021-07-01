## Konvence Geoher

- na začátku každé stránky do komentáře napsat úplnou informaci, co musí být ve STATE, jak sepracuje s LS a jaká data v MESSAGE musí stránka mít, aby správně fungovala, co stránka dělá a na jaké stránky a při jakých akcích přesměrovává
- jako první skript je kontrola těchto proměnných a přesměrování (případně s varováním přes stránku dialog) a přesměrování na home*, pokud nějaká informace chybí (home* přesměrovávají v případě chyby na home, home ve STATE ani MESSAGE nic neočekává)
- stránka je ntice dvojic (šablona, skript), kde skript ideálně pracuje pouze se šablonou, STATE a MESSAGE a s ničím jiným; skript by neměl být delší než jedna stránka (30 řádků vč. prázdných)
- odsazování o dvě mezery, proměnné zásadně camelCase anglicky
- zakomentovaný kód musí mít na začátku napsáno, proč byl zakomentován a kdy má být odkomentován; zakomentované kódy bez této informace bez čtení mazat (důvod: zakomentovaný kód se netestuje a neaktualizuje, při první úpravě okolního skriptu se stává nepoužitelný a během pár dní na něj zapomene i jeho autor)