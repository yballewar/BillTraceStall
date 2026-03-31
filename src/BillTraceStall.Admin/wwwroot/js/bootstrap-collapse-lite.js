(() => {
  function resolveTarget(el) {
    const selector = el.getAttribute("data-target") || el.getAttribute("href");
    if (!selector) return null;
    if (!selector.startsWith("#") && !selector.startsWith(".")) return null;
    return document.querySelector(selector);
  }

  function isShown(target) {
    return target.classList.contains("show");
  }

  function setExpanded(el, expanded) {
    el.setAttribute("aria-expanded", expanded ? "true" : "false");
  }

  function toggleCollapse(target, trigger) {
    const expanded = !isShown(target);
    target.classList.toggle("show", expanded);
    if (trigger) setExpanded(trigger, expanded);
  }

  document.addEventListener(
    "click",
    (e) => {
      const trigger = e.target.closest('[data-toggle="collapse"]');
      if (!trigger) return;

      const target = resolveTarget(trigger);
      if (!target) return;

      e.preventDefault();
      toggleCollapse(target, trigger);
    },
    true
  );
})();

