window.onTurnstileSuccess = () => {};

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const btn = form.querySelector('button[type="submit"]');
  const status = document.getElementById("form-status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const message = form.message.value.trim();
    const turnstileToken = form.querySelector('[name="cf-turnstile-response"]')?.value;

    btn.disabled = true;
    btn.textContent = "Verzenden...";
    status.textContent = "";
    status.className = "";

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message, turnstileToken }),
      });

      const data = await res.json();

      if (res.ok) {
        status.textContent =
          "Uw bericht is verzonden. Wij nemen zo snel mogelijk contact met u op.";
        status.className = "form-success";
        form.reset();
        if (typeof turnstile !== "undefined") turnstile.reset();
      } else {
        status.textContent =
          data.error || "Er is iets misgegaan. Probeer het later opnieuw.";
        status.className = "form-error";
        if (typeof turnstile !== "undefined") turnstile.reset();
      }
    } catch {
      status.textContent = "Er is iets misgegaan. Probeer het later opnieuw.";
      status.className = "form-error";
      if (typeof turnstile !== "undefined") turnstile.reset();
    } finally {
      btn.disabled = false;
      btn.innerHTML = "Verstuur &rarr;";
    }
  });
});
