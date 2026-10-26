// Opens the payment dialog for a pricing plan and shows the right QR code.
(function () {
  var dlg = document.getElementById('payDialog');
  if (!dlg || typeof dlg.showModal !== 'function') return; // old browsers keep the email link
  var sel = dlg.querySelector('#payFrom');
  var after = dlg.querySelector('.pay-after');
  var mail = dlg.querySelector('[data-slot="mail"]');
  var current = null;

  function slot(name, value) {
    dlg.querySelectorAll('[data-slot="' + name + '"]').forEach(function (el) { el.innerHTML = value; });
  }

  function show(where) {
    dlg.querySelectorAll('.pay-panel').forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== where; });
    after.hidden = !where;
    if (where && current) {
      var amount = where === 'india' ? 'Rs ' + current.inr : 'USD ' + current.usd;
      var subject = 'Paid ' + amount + ' for ' + current.planText;
      var body = 'Payment screenshot attached.%0A%0AWorkflows I picked:%0A%0ATools we use:%0A';
      mail.href = 'mailto:soumik@cosmik.work?subject=' + encodeURIComponent(subject) + '&body=' + body;
    }
  }

  document.querySelectorAll('[data-pay]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      current = {
        plan: btn.getAttribute('data-plan'),
        planText: btn.getAttribute('data-plan').replace(/&rsquo;/g, "'"),
        inr: btn.getAttribute('data-inr'),
        usd: btn.getAttribute('data-usd'),
        amt: btn.getAttribute('data-amt')
      };
      var upiImg = dlg.querySelector('[data-slot-src="upi"]');
      upiImg.src = '/img/qr-upi-' + current.amt + '.png';
      var upiLink = dlg.querySelector('[data-slot-href="upi"]');
      upiLink.href = 'upi://pay?pa=soumik2808@okhdfcbank&pn=Soumik%20Chatterjee&cu=INR&am=' + current.amt + '&tn=' + encodeURIComponent('CosmikWork ' + current.planText);
      slot('plan', current.plan);
      slot('inr', current.inr);
      slot('usd', current.usd);
      sel.value = '';
      show('');
      dlg.showModal();
    });
  });

  sel.addEventListener('change', function () { show(sel.value); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
})();
