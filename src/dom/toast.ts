export function toast(text: string, ms = 2000) {
  const atoast = document.createElement('div');
  atoast.classList.add("toast");
  atoast.innerText = text;
  document.body.appendChild(atoast);
  setTimeout(() => {
    document.body.removeChild(atoast);
  }, ms);
}
