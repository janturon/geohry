## Stavová informace STATE

- string page: aktuálně načtená stránka (nastavováno v setContent)
- string prevPage: předcházející stránka
- bool loading: true = probíhá načítání skriptů
- string phase: viz níže
- Array[function] load: pole funkcí, které se spustí poté, co je načten obsah: `STATE.load.push(_=>console.log("test"))` vypíše "test" do konzole po načtení stránky. Pole se vyčistí po vykonání funkcí.
- Array[function] unload: pole funkcí, které se spustí bezprostředně před načtením další stránky. Pole se vyčistí po vykonání funkcí.
- Set[string] abort: množina stránek, u kterých se nemají vykonávat další skripty: `STATE.abort.set("stranka")` zamezí načítání dalších tagů `<script>` v stranka.html (právě vykonávaný skript se dokončí). Po načtení stránky se "stranka" odstraní z abort.

## STATE.phase

0: **init** žádná stránka dosud nebyla načtena
1: **unloading** STATE.unload funkce předchozí stránky
2: **html** načítání HTML obsahu
3: **scripts** zpracovávání skriptů načtené stránky
    1: **sub html** načítání HTML obsahu vnořené stránky (se specifikovaným target atributem)
    2: **sub scripts** zpracovávání skriptů načtené vnořené stránky
    3: **sub dynhtml** generování dynamického obsahu HTML vnořené stránky
4: **dynhtml** generování dynamického obsahu HTML stránky (atribut data-html)
5: **loading** zpracovávání STATE.load funkcí
6: **ready** stránka byla načtena