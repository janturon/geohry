## Struktura Geoher

Index načítá main.js, main.css, inicializuje cache pro práci offline a zajišťuje instalaci stránky jako aplikace. Do tagu main metoda setContent načítá obsah stránek z adresáře pages. Po celou dobu pobytu uživatele na stránce je tedy zobrazen index, formuláře ani odkazy nenačítají novou stránku, javascript metodou setContent načítá obsah.

Zdroje, knihovny a funkce jsou ve složce ui. Je žádoucí mít zde co nejméně věcí, všechny knihovny musí být snadno nahraditelné.

Soubor clear.html obnoví cache, resetuje globální stav, vymaže localStorage a přesměruje na hlavní stránku, která by se měla chovat až na instalaci aplikace stejně jako při prvním načtení.

Perzistentní data ukládáme do localStorage pomocí objektu LS. Objekty se ukládají přes JSON.stringify a načítají přes JSON.parse. (IndexedDB je komplikovaně asynchronní a WebSQL je opuštěný standard).

Po dobu běhu stránky existují na straně klienta proměnné STATE a message (TODO: refaktorovat message na MESSAGE). STATE obsahuje stavové proměnné, která stránka musí mít, aby správně fungovala (viz 02-conventions.md), MESSAGE obsahuje data předávaná volané stránce (alternativa parametru). setContent MESSAGE vynuluje, jakmile jsou všechny skripty stránky načteny, tj. nastavení MESSAGE se musí dít asynchronně (setTimeout nebo událost). TODO: vyřešit spuštění setContent podstránky po naštení všech skriptů.

Tato struktura odpovídá konečnému automatu s pamětí: stav je stránka, STATE je paměť stavu, setContent je přechodová funkce, MESSAGE je parametr této funkce.

Jako controller (architektura MVC - jediný, žádné MVP jako Nette) slouží api.php, kde se požadavek ošetřuje blokem

```
case "foo": fGET("prom1"); fPOST("prom2","prom3");
	// ošetření vstupu
	echo $DB->metoda($prom1, $prom2, $prom3);
break;
```

`"foo"` se zadává přes url `api.php?req=foo`. funkce `fGET` a `fPOST` načtou do globálního kontextu data z http metody GET a POST (null, pokud nebyly poslány). Controller ošetří vstup a zavolá metodu modelu uloženého v proměnné `$DB`, metody se zapisují do souboru geohry.php - to je vše, co server dělá.

Na straně klienta se api volá příkazem `API("foo")`. GET proměnné se přidávají do prvního parametru, POST proměnné jako objekt FormData do druhého parametru. Výšeuvedený dotaz pro server vytvoří tento požadavek na straně klienta

```
<form id="fooForm" method="POST" onsubmit="event.preventDefault();doFoo()">
	<input name="prom2">
	<input name="prom3">
	<button>Odeslat</button>
</form>

<script>
// zavolá fooForm = document.getElementById("fooForm");
// je nutné na stránce explicitně zavolat, jelikož jiná stránka může definovat jiný element s id="fooForm"
id(["fooForm"]);

async function doFoo() {
	var data = await API("foo&prom1=hello", new FormData(fooForm);
	if(data.status==200) {
		var response = JSON.parse(data.response);
		// zde je načtený objekt odpovědi API
	}
}
</script>
```

Mnoho kódu ušetří výšezmíněná globální funkce `id()`, která akceptuje jako parametr pole řetězců. K aktuálním hodnotám formuláře lze přistupovat přes `name` atribut, v kódu výše např. `fooForm.prom2.value`.

Bez formuláře lze proměnné `prom2` a `prom3` poslat vytvořením vlastního objektu FormData:

```
var fd = new FormData();
fd.set("prom2", "hello");
fd.set("prom3", "world");
API("foo&prom1=hello", fd).then(data => data.status==200 && doSomething(JSON.parse(data.response)));

function doSomething(obj) {
  // zde je načtený objekt po odpovědi API
}
```
