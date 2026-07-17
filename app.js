const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });
const checkout = document.querySelector('#checkout');

document.querySelector('#promo button').addEventListener('click', () => document.querySelector('#promo').remove());

document.querySelector('.menu-toggle').addEventListener('click', (event) => {
  const nav = document.querySelector('.main-nav');
  const open = nav.classList.toggle('open');
  event.currentTarget.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('.quantity-grid').forEach((grid) => {
  grid.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    grid.querySelectorAll('button').forEach((item) => item.classList.remove('selected'));
    button.classList.add('selected');
    const card = grid.closest('.product-card');
    const price = Number(button.dataset.price);
    const previous = Math.ceil(price * 1.38);
    card.querySelector('.current-price').innerHTML = `${mxn.format(price)} <i>MXN</i>`;
    card.querySelector('.old-price').textContent = mxn.format(previous);
    card.querySelector('.discount').textContent = `${Math.round((1 - price / previous) * 100)}% OFF`;
  });
});

document.querySelectorAll('.info-link').forEach((button) => button.addEventListener('click', () => {
  const notice = button.nextElementSibling;
  notice.hidden = !notice.hidden;
}));

document.querySelectorAll('.buy-button[data-title]').forEach((button) => button.addEventListener('click', () => {
  const card = button.closest('.product-card');
  const selected = card.querySelector('.quantity-grid .selected');
  document.querySelector('#modal-product').textContent = button.dataset.title;
  document.querySelector('#modal-quantity').textContent = `${selected.dataset.qty} seguidores`;
  document.querySelector('#modal-price').textContent = `${mxn.format(Number(selected.dataset.price))} MXN`;
  checkout.showModal();
}));

document.querySelector('.modal-close').addEventListener('click', () => checkout.close());
checkout.addEventListener('click', (event) => { if (event.target === checkout) checkout.close(); });
document.querySelector('#checkout-form').addEventListener('submit', (event) => {
  event.preventDefault();
  alert('Flujo de demostración completado. Conecta tu pasarela de pago para recibir pedidos reales.');
  checkout.close();
});

document.querySelectorAll('.faq-list article button').forEach((button) => button.addEventListener('click', () => {
  const article = button.closest('article');
  const open = article.classList.toggle('open');
  button.querySelector('b').textContent = open ? '−' : '+';
}));
