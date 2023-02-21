console.log('content_script running');

function getCellWidth(value) {
    // 判断是否为null或undefined
    if (value == null) {
        return 10;
    } else if (/.*[\u4e00-\u9fa5]+.*$/.test(value)) {
        // 中文的长度
        const chineseLength = value.match(/[\u4e00-\u9fa5]/g).length;
        // 其他不是中文的长度
        const otherLength = value.length - chineseLength;
        return chineseLength * 2.1 + otherLength * 1.1;
    } else {
        return value.toString().length * 1.1;
    }
}

async function handleDownloadXls(startPage = 1, endPage = 2, size = 60) {
    const maxPage = 10;
    const maxSize = 90;
    let sp = startPage;
    let ep = endPage;
    if (ep - sp > maxPage || sp >= ep) {
        ep = sp + maxPage;
    } else if (sp < 0 || ep < 0) {
        return;
    }
    
    let loadSize = size > maxSize ? maxSize : size;

    const downloadBtn = document.getElementById('down_report');
    const searchParams = downloadBtn.getAttribute('searchcondition');
    const dateString = downloadBtn.getAttribute('url').match(/&st=([^&]*)/)[1];

    const requests = [];
    for (let page = sp; page <= ep; page++) {
        const fetchUrl = `/main.php?c=eanalysis&a=edetail&ajax=module%3DgetList_currentPage%3D${page}_pageType%3D${loadSize}&siteid=1281203450&st=${dateString}&et=${dateString}` + searchParams;
        requests.push(fetchList(fetchUrl))
    }

    const list = await Promise.all(requests).then((datas) => {
        return datas.flat(1);
    });

    var wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(list);

    let colWidths = [],
        colNames = Object.keys(list[0]) // 所有列的名称数组

    // 计算每一列的所有单元格宽度
    // 先遍历行
    list.forEach((row) => {
        // 列序号
        let index = 0
        // 遍历列
        for (const key in row) {
            if (colWidths[index] == null) colWidths[index] = []

            switch (typeof row[key]) {
                case 'string':
                case 'number':
                case 'boolean':
                    colWidths[index].push(getCellWidth(row[key]))
                    break
                case 'object':
                case 'function':
                    colWidths[index].push(0)
                    break
            }
            index++
        }
    })

    ws['!cols'] = []
    // 每一列取最大值最为列宽
    colWidths.forEach((widths, index) => {
        // 计算列头的宽度
        widths.push(getCellWidth(colNames[index]))
        // 设置最大值为列宽
        ws['!cols'].push({wch: Math.max(...widths)})
    })

    XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
    XLSX.writeFile(wb, `事件明细数据_${dateString}_${sp}-${ep}页.xlsx`);
}

const fetchList = async (fetchUrl) => {
    const list = await fetch(fetchUrl, {method: 'GET'})
        .then(async (response) => {
            const {data} = await response.json();
            if (data.getList && data.getList.items) {
                return data.getList.items;
            }
            return [];
        })
    return list;
}

const extensionContainer = document.createElement('div');
extensionContainer.className = 'download-extension-container';

const switchBtn = document.createElement("button");
switchBtn.className = "switch-btn";
switchBtn.onclick = function () {
    clickSwitchBtn();
}
switchBtn.innerHTML = "<";
extensionContainer.appendChild(switchBtn);

const renderContent = document.createElement('div')
renderContent.className = 'download-extension-content'
renderContent.insertAdjacentHTML('afterbegin', `
    <div id="control-row">
        <p>默认前两页，页数60</p>
        <label class="page-label" for="extensionInput">开始页:</label>
        <input type="text" id="extensionInput">
        <label class="page-label" for="endPage">结束页:</label>
        <input type="text" id="endPage">
        <label class="page-label" for="pageSize">页数:</label>
        <select id="pageSize">
            <option value="30">30</option>
            <option value="60" selected>60</option>
            <option value="90">90</option>
        </select>
        <br>
        <button id="extensionDownload">Download</button>
    </div>
`)

function handleExtensionDownload(event) {
    event.preventDefault();
    const input = document.getElementById('extensionInput');
    const endInput = document.getElementById('endPage');
    const pagesize = document.getElementById('pageSize');
    const sp = parseInt(input.value, 10) || undefined;
    const ep = parseInt(endInput.value, 10) || undefined;
    const ps = parseInt(pagesize.value, 10) || undefined;
    handleDownloadXls(sp, ep, ps)
}

let open = false;
function clickSwitchBtn() {
    if (open) {
        renderContent.remove();
        switchBtn.innerHTML = ">";
    } else {
        extensionContainer.appendChild(renderContent);

        const eDownloadBtn = document.getElementById('extensionDownload');
        if (eDownloadBtn) {
            eDownloadBtn.addEventListener('click', handleExtensionDownload)
        }

        switchBtn.innerHTML = "<";
    }
    open = !open;
}

function extensionInit() {
    document.body.appendChild(extensionContainer);
}

extensionInit();