console.log('content_script running');

function handleDownloadXls(pages) {
    const downloadBtn = document.getElementById('down_report');
    if (downloadBtn) {
        console.log('fetching')
        const fetchUrl = downloadBtn.getAttribute('url') + downloadBtn.getAttribute('searchcondition') + '&downloadType=xls';
        fetch(fetchUrl, {method: 'GET'})
            // 转码有问题，猜测response使用gbk编码，浏览器的js使用utf-8解码
            // 如下是两种解码（gbk -> utf-8）方式，但是结果只能拿到string结果，后续导出为xlsx不知道怎么解了
            // 一
            // .then((res) => res.arrayBuffer())
            // .then((res) => console.log(new TextDecoder('gbk').decode(res)))
            // 二
            // .then((res) => res.blob()).then((res) => {
            //     const reader = new FileReader();
            //     reader.onload = (res) => {console.log(reader.result)}
            //     reader.readAsText(res, 'gbk');
            // })
            .then(async (response) => {
                // XLSX 内置的codepage参数 未生效（设置了没有拿到正确效果）
                const ab = await response.arrayBuffer();
                const wb = XLSX.read(ab, {type: 'array', codepage: 936});
                console.log(wb)
                XLSX.writeFile(wb, "Empoyees.xlsx");
            })
    }
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
    const pages = parseInt(input.value, 10);
    if (pages) {
        console.log('pages:', pages)
        handleDownloadXls(pages)
    }
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