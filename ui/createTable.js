function createScoreTable(tableTemplate) {

    const tr = () => document.createElement('tr');

    const tableData = tableTemplate.data;
    const rowSpan = tableTemplate.rowSpan;
    const table = ElemFromText(`<table class="score-table"></table>`);
    const headerTr = tr();

    for (const header of tableTemplate.headers) {

        headerTr.appendChild(
            ElemFromText(`<th>${ header }</th>`)
        );

    }

    table.appendChild(headerTr);

    let currTr;
    tableData.forEach((currData, i, a) => {

        table.appendChild(currTr = tr());

        currData.forEach((piece, index, dataArr) => {
            if(piece !== null) {
                currTr.appendChild(
                    ElemFromText(`<td rowspan=${ rowSpan[index] }>${ piece }</td>`)
                );
            }
        });

    });

    return table;
}