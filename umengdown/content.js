const form = document.getElementById("control-row");
const input = document.getElementById('input');

form.addEventListener('submit', handleDownload)

function handleDownload(event) {
    event.preventDefault();
    const pages = parseInt(input.value, 10);
    if (pages) {
        console.log(pages)
    }
}