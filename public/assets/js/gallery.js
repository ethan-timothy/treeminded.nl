(function () {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const dotsContainer = document.querySelector(".slide-dots");
  const counterCurrent = document.querySelector(".slide-counter .current");
  const counterTotal = document.querySelector(".slide-counter .total");
  const frame = document.querySelector(".slideshow-frame");
  const total = slides.length;
  let current = 0;
  let timer;

  counterTotal.textContent = total;

  slides.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.addEventListener("click", () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  function goTo(index) {
    slides[current].classList.remove("active");
    dotsContainer.children[current].classList.remove("active");
    current = (index + total) % total;
    slides[current].classList.add("active");
    dotsContainer.children[current].classList.add("active");
    counterCurrent.textContent = current + 1;
  }

  function next() {
    goTo(current + 1);
    resetTimer();
  }
  function prev() {
    goTo(current - 1);
    resetTimer();
  }

  function startTimer() {
    timer = setInterval(() => goTo(current + 1), 7000);
  }

  function resetTimer() {
    clearInterval(timer);
    startTimer();
  }

  document.querySelector(".slide-btn.prev").addEventListener("click", prev);
  document.querySelector(".slide-btn.next").addEventListener("click", next);

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });

  let touchStartX = 0;
  frame.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].clientX;
    },
    { passive: true },
  );
  frame.addEventListener("touchend", (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
  });

  frame.addEventListener("mouseenter", () => clearInterval(timer));
  frame.addEventListener("mouseleave", startTimer);

  goTo(0);
  startTimer();
})();
