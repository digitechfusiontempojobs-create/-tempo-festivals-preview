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
  let activeSlide = 0;

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
    function getFieldValue(formData, name) {
      return String(formData.get(name) || "").trim();
    }

    function buildMailFallbackUrl(formData, festivalSlug) {
      const festivalName = getFieldValue(formData, "festival") || "Festival Tempo Jobs";
      const firstName = getFieldValue(formData, "first_name");
      const lastName = getFieldValue(formData, "last_name");
      const email = getFieldValue(formData, "email");
      const phone = getFieldValue(formData, "phone");
      const availability = getFieldValue(formData, "availability");
      const preferredSlots = getFieldValue(formData, "preferred_slots");
      const preferredMission = getFieldValue(formData, "preferred_mission");
      const message = getFieldValue(formData, "message");
      const attachmentCount = fileInput && fileInput.files ? fileInput.files.length : 0;
      const partnerEmail = getFieldValue(formData, "recipient_email");
      const tempoEmail = getFieldValue(formData, "cc_email") || "contact@tempojobs.fr";

      const recipients = [tempoEmail];
      const cc = partnerEmail ? [partnerEmail] : [];
      const subject = "Candidature benevole - " + festivalName + " - " + firstName + " " + lastName;
      const bodyLines = [
        "Bonjour,",
        "",
        "Je souhaite proposer ma candidature pour " + festivalName + ".",
        "",
        "Prenom : " + firstName,
        "Nom : " + lastName,
        "Email : " + email,
        "Telephone : " + phone,
        "Disponibilites : " + availability,
        "Creneaux souhaites / contraintes horaires : " + (preferredSlots || "Non precise"),
        "Mission souhaitee : " + preferredMission,
        "",
        "Motivation / experience / contraintes :",
        message || "A completer",
        "",
        attachmentCount
          ? "Piece(s) a joindre : " + attachmentCount + " fichier(s) selectionne(s) sur le formulaire. Merci de les ajouter en piece jointe avant d'envoyer cet email."
          : "Piece(s) jointe(s) : aucune pour le moment.",
        "",
        "J'accepte que mes informations soient transmises a l'organisation du festival pour etre recontacte au sujet des missions proposees.",
        "",
        "Merci.",
      ];

      return (
        "mailto:" +
        encodeURIComponent(recipients.join(",")) +
        "?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(bodyLines.join("\n")) +
        (cc.length ? "&cc=" + encodeURIComponent(cc.join(",")) : "")
      );
    }

    function completeApplicationFormData(formData, festivalSlug) {
      if (!formData.has("cc_email")) {
        formData.append("cc_email", "contact@tempojobs.fr");
      }
      if (festivalSlug === "do-you-remember" && !formData.has("recipient_email")) {
        formData.append("recipient_email", "adn.reseau.france@gmail.com");
      }
    }

    function openMailFallback(formData, festivalSlug) {
      const mailtoUrl = buildMailFallbackUrl(formData, festivalSlug);
      window.location.href = mailtoUrl;

      if (formMessage) {
        const attachmentCount = fileInput && fileInput.files ? fileInput.files.length : 0;
        formMessage.textContent = attachmentCount
          ? "Votre email est prêt. Ajoutez le fichier sélectionné en pièce jointe avant de l'envoyer."
          : "Votre email est prêt. Envoyez-le pour transmettre votre candidature.";
        formMessage.classList.add("is-visible");
      }
    }

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
      const mailFallbackOnly = form.hasAttribute("data-mail-fallback-only");

      const fallbackFormData = new FormData(form);
      completeApplicationFormData(fallbackFormData, festivalSlug);

      if (mailFallbackOnly) {
        openMailFallback(fallbackFormData, festivalSlug);
        return;
      }

      try {
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = "Envoi en cours...";
        }

        const formData = new FormData(form);
        completeApplicationFormData(formData, festivalSlug);

        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Request failed");

        const payload = await response
          .clone()
          .json()
          .catch(() => null);

        form.reset();
        if (missionConfirmation) missionConfirmation.classList.remove("is-visible");
        missionCards.forEach((card) => card.classList.remove("is-selected"));
        if (formMessage) {
          formMessage.textContent = "Candidature envoyée. L'équipe pourra te recontacter rapidement.";
          formMessage.classList.add("is-visible");
        }
      } catch (error) {
        const errorFallbackFormData = new FormData(form);
        completeApplicationFormData(errorFallbackFormData, festivalSlug);
        openMailFallback(errorFallbackFormData, festivalSlug);
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalLabel;
        }
      }
    });
  }
})();
