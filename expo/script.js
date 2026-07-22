const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzVMFwmkW6ne9UzflQgHLYGJyX9f6EME9xqKLvdK3Hwhd6X2N02riuoxJxpRHYdQt6hhQ/exec';

const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });
reveals.forEach((item) => observer.observe(item));

const form = document.getElementById('signupForm');
const status = form.querySelector('.form-status');
const field = (id) => document.getElementById(id);

function setError(input, message) {
  input.classList.toggle('invalid', Boolean(message));
  const error = input.closest('.field')?.querySelector('.error');
  if (error) error.textContent = message;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = field('name');
  const email = field('email');
  const phone = field('phone');
  const consent = form.elements.consent;
  const contactError = form.querySelector('.contact-error');
  let valid = true;

  [name, email, phone].forEach((input) => setError(input, ''));
  contactError.textContent = '';
  status.textContent = '';
  status.className = 'form-status';

  if (!name.value.trim()) {
    setError(name, 'Please enter your name.');
    valid = false;
  }
  if (!email.value.trim() && !phone.value.trim()) {
    contactError.textContent = 'Please add an email address or phone number.';
    valid = false;
  }
  if (email.value.trim() && !email.validity.valid) {
    setError(email, 'Please enter a valid email address.');
    valid = false;
  }
  if (phone.value.trim() && !/^[+\d][\d\s()-]{6,}$/.test(phone.value.trim())) {
    setError(phone, 'Please enter a valid phone number.');
    valid = false;
  }
  if (!consent.checked) {
    status.textContent = 'Please confirm that we may contact you.';
    status.classList.add('error-status');
    valid = false;
  }
  if (!valid) {
    form.querySelector('.invalid')?.focus();
    return;
  }

  if (!GOOGLE_SCRIPT_URL.startsWith('https://script.google.com/macros/s/')) {
    status.textContent = 'The registration backend has not been configured yet.';
    status.classList.add('error-status');
    return;
  }

  const button = form.querySelector('.submit-button');
  const buttonLabel = button.querySelector('span');
  const originalLabel = buttonLabel.textContent;
  button.disabled = true;
  buttonLabel.textContent = 'Saving registration…';

  const payload = new URLSearchParams({
    name: name.value.trim(),
    email: email.value.trim(),
    phone: phone.value.trim(),
    city: field('city').value.trim(),
    profession: field('profession').value.trim(),
    interest: field('interest').value,
    consent: String(consent.checked)
  });

  try {
    // Apps Script Web Apps do not return browser CORS headers. `no-cors` safely
    // sends the form while server-side validation protects the Sheet.
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: payload.toString()
    });

    const firstName = name.value.trim().split(/\s+/)[0];
    status.textContent = `Thanks, ${firstName}. Your interest has been registered.`;
    form.reset();
  } catch (error) {
    status.textContent = 'We could not save your registration. Please check your connection and try again.';
    status.classList.add('error-status');
  } finally {
    button.disabled = false;
    buttonLabel.textContent = originalLabel;
  }
});
