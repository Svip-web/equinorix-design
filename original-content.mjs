const lineBreaks = {
  en: { heroTitle: [2, 5, 10], heroText: [9], firstServiceText: [2, 5], secondServiceTitle: [2], contactTitle: [3] },
  es: { heroTitle: [3, 6, 13], heroText: [11], firstServiceText: [2, 8], secondServiceTitle: [2], contactTitle: [4], contactText: [8] },
  uk: { contactTitle: [2] },
  ru: { contactTitle: [2] },
};

const servicesArrow = '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M21.6533 21.6533L10.3467 10.3467" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.8667 21.6534H21.6533V14.8667" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/** Return the original four content sections; the caller owns main, header and footer. */
export function renderOriginalMain(lang, t, u, escape) {
  const breaks = lineBreaks[lang] || {};
  const text = (value, positions = []) => String(value).split(/\s+/).map((word, index) => `${index === 0 ? '' : positions.includes(index) ? ' <br>' : ' '}${escape(word)}`).join('');
  const lines = values => values.map(escape).join(' <br>');
  const ctaWords = t.servicesCta.split(/\s+/);
  const servicesCta = lines([ctaWords.slice(0, -2).join(' '), ctaWords.slice(-2).join(' ')]);
  const input = (name, type, autocomplete) => `<label class="form__field"><span class="form__label">${escape(t.fields[name])}</span><input type="${type}" name="${name}" placeholder="${escape(t.fields[name])}" aria-label="${escape(t.fields[name])}" autocomplete="${autocomplete}" maxlength="${name === 'email' ? 254 : 160}" required></label>`;

  return `<section class="first" aria-labelledby="hero-title">
  <div class="container">
    <div class="first__block">
      <div class="first__content">
        <h1 id="hero-title" class="first__title">${text(t.heroTitle, breaks.heroTitle)}</h1>
        <div class="first__text">${text(t.heroText, breaks.heroText)}</div>
        <div class="first__btn"><a href="#contact" class="btn btn_main js-scroll" aria-label="${escape(t.cta)}">${escape(t.cta)}</a></div>
      </div>
    </div>
  </div>
</section>
<section class="services" aria-labelledby="services-title">
  <div class="container">
    <div id="services" class="services__anchor anchor"></div>
    <div class="services__block">
      <h2 id="services-title" class="services__title title">${escape(t.servicesTitle)}</h2>
      <div class="services__text text">${escape(t.servicesText)}</div>
      <div class="services__btn"><a href="#contact" class="btn btn_main"><div>${servicesArrow}<span>${servicesCta}</span></div></a></div>
      <div class="services__list">${t.services.map((service, index) => `
        <div class="services__column">
          <article class="services__item">
            <div class="services__item-number"><span>${String(index + 1).padStart(2, '0')}</span></div>
            <h3 class="services__item-title">${text(service.title, index === 1 ? breaks.secondServiceTitle : undefined)}</h3>
            <div class="services__item-text">${text(service.text, index === 0 ? breaks.firstServiceText : undefined)}</div>
          </article>
        </div>`).join('')}
      </div>
    </div>
  </div>
</section>
<section class="about" aria-label="${escape(u.hrTitleSr)}">
  <div class="container">
    <div class="about__block">
      <div class="about__jpg"><img src="/assets/img/about.jpg" width="1352" height="467" loading="lazy" alt="${escape(u.hrTitleSr)}"></div>
      <div class="about__list">
        <ul>${t.hrItems.slice(0, 4).map(item => `<li>${escape(item)}</li>`).join('')}</ul>
        <ul>${t.hrItems.slice(4, 8).map(item => `<li>${escape(item)}</li>`).join('')}</ul>
      </div>
    </div>
  </div>
</section>
<section id="founder-message" class="founder-message" aria-labelledby="founder-message-title">
  <div class="container">
    <div class="founder-message__grid">
      <div class="founder-message__copy">
        <h2 id="founder-message-title" class="title">${escape(t.videoTitle)}</h2>
        ${t.brandStory ? '<p class="founder-message__intro">'+escape(t.brandStory)+'</p>' : ''}
      </div>
      <figure class="founder-message__figure">
        <div class="founder-message__media"><video class="founder-message__video" controls playsinline preload="metadata" poster="/assets/img/marbella-la-concha.webp" aria-label="${escape(u.videoAlt)}"></video></div>
      </figure>
    </div>
  </div>
</section>
<section id="contact" class="form" aria-labelledby="contact-title">
  <div class="container">
    <div class="form__block">
      <div class="form__column">
        <h2 id="contact-title" class="form__title title">${text(t.contactTitle, breaks.contactTitle)}</h2>
        <div class="form__text text">${text(t.contactText, breaks.contactText)}</div>
        <form id="contact-form" class="form__main" action="/api/contact" method="post">
          <div id="form-fields">
            <div class="form__line col-2">
              <div class="form__col">${input('name', 'text', 'name')}</div>
              <div class="form__col">${input('company', 'text', 'organization')}</div>
            </div>
            <div class="form__line">${input('email', 'email', 'email')}</div>
            <div class="form__line"><label class="form__field"><span class="form__label">${escape(t.fields.message)}</span><textarea name="message" placeholder="${escape(t.fields.message)}" aria-label="${escape(t.fields.message)}" maxlength="5000"></textarea></label></div>
            <div hidden aria-hidden="true"><input type="text" name="website" tabindex="-1" autocomplete="off"></div>
            <div class="form__btn"><button type="submit" class="btn btn_main">${escape(t.submit)}</button></div>
          </div>
          <div id="form-result" class="form__success" role="status" aria-live="polite" hidden>
            <h2 id="result-title" class="form__title title" tabindex="-1"></h2>
            <div id="result-text" class="form__text text"></div>
            <div class="form__btn"><button id="return-form" type="button" class="btn btn_main">${escape(t.returnForm)}</button></div>
          </div>
        </form>
      </div>
      <div class="form__column"><div class="form__img"><img src="/assets/img/form.jpg" width="572" height="717" loading="lazy" alt="${escape(t.contactTitle)}"></div></div>
    </div>
  </div>
</section>`;
}
