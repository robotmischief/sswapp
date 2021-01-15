const btn = document.getElementById('btn');
const dataDiv = document.getElementById('data');
btn.addEventListener('click', getData);

async function getData(){
    dataDiv.textContent = "DATA TEST";
    const response = await fetch('/mars');
    const data = await response.json();

    dataDiv.textContent = data;
}