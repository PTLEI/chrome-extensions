console.log('content_script running');

async function handleDownloadXls(pages = 1, size = 30) {
    const maxPage = 10;
    const maxSize = 90;
    let totalPages = pages > maxPage ? maxPage : pages;
    let loadSize = size > maxSize ? maxSize : size;

    const requests = [];
    for (let i = 1; i <= totalPages; i++) {
        requests.push(fetchList(i, loadSize))
    }

    const list = await Promise.all(requests).then((datas) => {
        return datas.flat(1);
    });

    var wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(list);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
    XLSX.writeFile(wb, `表格_${new Date().valueOf()}.xlsx`);
}

const fetchList = async (page, size, date) => {
    let dateString = date;
    if (!dateString) {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const dateDay = now.getDate();
        dateString = `${year}-${month > 9 ? month : '0' + month}-${dateDay > 9 ? dateDay : '0' + dateDay}`
    }
    const fetchUrl = `/main.php?c=eanalysis&a=edetail&ajax=module%3DgetList_currentPage%3D${page}_pageType%3D${size}&siteid=1281203450&st=${dateString}&et=${dateString}&visitorType=&location=&ip=&referer=&cnzz_eid=&eventname=`;
    const list = await fetch(fetchUrl, {method: 'GET'})
        .then(async (response) => {
            const {data} = await response.json();
            return data.getList.items;
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
        <label class="page-label" for="extensionInput">Pages:</label>
        <input type="text" id="extensionInput">
        <br>
        <button id="extensionDownload">Download</button>
    </div>
`)

function handleExtensionDownload(event) {
    event.preventDefault();
    const input = document.getElementById('extensionInput');
    const pages = parseInt(input.value, 10) || undefined;
    handleDownloadXls(pages)
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