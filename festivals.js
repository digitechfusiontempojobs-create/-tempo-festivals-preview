(function () {
  const missionSelect = document.querySelector("[data-mission-select]");
  const missionConfirmation = document.querySelector("[data-mission-confirmation]");
  const missionCards = Array.from(document.querySelectorAll("[data-mission-card]"));
  const form = document.querySelector("[data-application-form]");
  const formMessage = document.querySelector("[data-form-message]");
  const fileInput = document.querySelector("[data-file-input]");
  const uploadHint = document.querySelector("[data-upload-hint]");
  const slides = Array.from(document.querySelectorAll("[data-gallery-slide]"));
  const dots = Array.from(document.querySelectorAll("[data-gallery-dot]"));
  const galleryLabel = document.querySelector("[data-gallery-label]");
  const galleryCaption = document.querySelector("[data-gallery-caption]");
  const previousButton = document.querySelector("[data-gallery-previous]");
  const nextButton = document.querySelector("[data-gallery-next]");
  const counters = Array.from(document.querySelectorAll("[data-application-counter]"));
  let activeSlide = 0;

  function getCountLabel(count) {
    return count === 1 ? "candidature envoyée" : "candidatures envoyées";
  }

  function setCounter(slug, count) {
    const safeCount = Number.isFinite(Number(count)) ? Math.max(0, Number(count)) : 0;

    counters
      .filter((counter) => counter.getAttribute("data-application-counter") === slug)
      .forEach((counter) => {
        const value = counter.querySelector("[data-counter-value]");
        const label = counter.querySelector("[data-counter-label]");

        counter.setAttribute("data-count", String(safeCount));
        if (value) value.textContent = String(safeCount);
        if (label) label.textContent = getCountLabel(safeCount);
      });
  }

  function incrementCounter(slug) {
    const current = counters.find((counter) => counter.getAttribute("data-application-counter") === slug);
    const currentCount = current ? Number(current.getAttribute("data-count") || 0) : 0;
    setCounter(slug, currentCount + 1);
  }

  function applyStatsPayload(payload) {
    const stats = payload && payload.counts ? payload.counts : payload;
    if (!stats) return;

    if (Array.isArray(stats)) {
      stats.forEach((item) => {
        if (item && item.slug) setCounter(item.slug, item.count);
      });
      return;
    }

    Object.keys(stats).forEach((slug) => setCounter(slug, stats[slug]));
  }

  counters.forEach((counter) => {
    setCounter(counter.getAttribute("data-application-counter"), counter.getAttribute("data-count") || 0);
  });

  const statsEndpoint =
    window.TEMPO_FESTIVAL_STATS_ENDPOINT || "/.netlify/functions/festival-application-counts";
  if (statsEndpoint && counters.length) {
    fetch(statsEndpoint)
      .then((response) => (response.ok ? response.json() : null))
      .then(applyStatsPayload)
      .catch(() => {});
  }

  function scrollToTarget(selector) {
    const target = document.querySelector(selector);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.querySelectorAll("[data-scroll-target]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      scrollToTarget(trigger.getAttribute("data-scroll-target"));
    });
  });

  function setSelectedMission(value) {
    if (!value) return;

    if (missionSelect) {
      missionSelect.value = value;
    }

    if (missionConfirmation) {
      missionConfirmation.textContent = "Mission sélectionnée : " + value;
      missionConfirmation.classList.add("is-visible");
    }

    missionCards.forEach((card) => {
      card.classList.toggle("is-selected", card.getAttribute("data-mission-card") === value);
    });
  }

  missionCards.forEach((card) => {
    const button = card.querySelector("button");
    if (!button) return;

    button.addEventListener("click", () => {
      setSelectedMission(card.getAttribute("data-mission-card"));
      scrollToTarget("#formulaire");
    });
  });

  if (missionSelect) {
    missionSelect.addEventListener("change", () => {
      if (!missionSelect.value) {
        if (missionConfirmation) missionConfirmation.classList.remove("is-visible");
        missionCards.forEach((card) => card.classList.remove("is-selected"));
        return;
      }
      setSelectedMission(missionSelect.value);
    });
  }

  function updateGallery(index) {
    if (!slides.length) return;
    activeSlide = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeSlide;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", isActive ? "false" : "true");
    });

    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === activeSlide;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });

    const active = slides[activeSlide];
    if (galleryLabel) galleryLabel.textContent = active.getAttribute("data-label") || "";
    if (galleryCaption) galleryCaption.textContent = active.getAttribute("data-caption") || "";
  }

  if (previousButton) {
    previousButton.addEventListener("click", () => updateGallery(activeSlide - 1));
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => updateGallery(activeSlide + 1));
  }

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => updateGallery(index));
  });

  updateGallery(0);

  if (fileInput && uploadHint) {
    fileInput.addEventListener("change", () => {
      const count = fileInput.files.length;
      if (!count) {
        uploadHint.textContent = "Facultatif - PDF, JPG, PNG, MP4...";
        return;
      }
      uploadHint.textContent = count === 1 ? "1 fichier ajouté" : count + " fichiers ajoutés";
    });
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      const endpoint =
        window.TEMPO_FESTIVAL_APPLICATION_ENDPOINT ||
        form.getAttribute("data-endpoint") ||
        "/.netlify/functions/festival-applications";
      const festivalSlug = form.getAttribute("data-festival-slug");
      const submitButton = form.querySelector("[type='submit']");
      const originalLabel = submitButton ? submitButton.textContent : "";

      try {
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = "Envoi en cours...";
        }

        const response = await fetch(endpoint, {
          method: "POST",
          body: new FormData(form),
        });

        if (!response.ok) throw new Error("Request failed");

        const payload = await response
          .clone()
          .json()
          .catch(() => null);

        form.reset();
        if (missionConfirmation) missionConfirmation.classList.remove("is-visible");
        missionCards.forEach((card) => card.classList.remove("is-selected"));
        if (payload && payload.count !== undefined && festivalSlug) {
          setCounter(festivalSlug, payload.count);
        } else if (festivalSlug) {
          incrementCounter(festivalSlug);
        }
        if (formMessage) {
          formMessage.textContent = "Candidature envoyée. L'équipe pourra te recontacter rapidement.";
          formMessage.classList.add("is-visible");
        }
      } catch (error) {
        if (formMessage) {
          formMessage.textContent =
            "L'envoi n'a pas abouti. Vérifiez l'endpoint de candidature ou réessayez.";
          formMessage.classList.add("is-visible");
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalLabel;
        }
      }
    });
  }
})();
