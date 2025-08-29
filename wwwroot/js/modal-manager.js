// Modal Manager: binds to bottom-nav buttons and shows an apple-style top sliding card
(function(){
  const ids = [
    {id: 'vehiclesBtn', title: 'Járművek'},
    {id: 'planBtn', title: 'Tervezés'},
    {id: 'settingsBtn', title: 'Beállítások'}
  ];

  // Create DOM structure once
  const backdrop = document.createElement('div');
  backdrop.className = 'mm-backdrop';

  const card = document.createElement('section');
  card.className = 'mm-card';
  card.setAttribute('role','dialog');
  card.setAttribute('aria-modal','true');
  card.setAttribute('aria-hidden','true');

  const handle = document.createElement('div');
  handle.className = 'mm-handle';

  const header = document.createElement('header');
  header.className = 'mm-header';

  const title = document.createElement('div');
  title.className = 'mm-title';
  title.textContent = '';

  const close = document.createElement('button');
  close.className = 'mm-close';
  close.setAttribute('aria-label','Bezárás');
  close.innerHTML = '&times;';

  const content = document.createElement('div');
  content.className = 'mm-content';
  content.innerHTML = '<p style="color:#666;">Tartalom betöltése…</p>';

  header.appendChild(title);
  header.appendChild(close);
  card.appendChild(handle);
  card.appendChild(header);
  card.appendChild(content);

  document.body.appendChild(backdrop);
  document.body.appendChild(card);

  let currentOpen = null;

  function openCard(key){
    const cfg = ids.find(x=>x.id===key);
    if(!cfg) return;
    title.textContent = cfg.title;
    // show loading state then fetch partial view from server
    // show spinner and mark busy for accessibility
    content.setAttribute('aria-busy','true');
    content.innerHTML = `
      <div class="mm-loading" role="status" aria-live="polite">
        <div class="mm-spinner" aria-hidden="true"></div>
        <div class="mm-loading-text">Töltés…</div>
      </div>
    `;
    fetchPartialFor(cfg.id).then(async html=>{
      content.removeAttribute('aria-busy');
      content.innerHTML = html;
      // Execute any scripts included in the fetched HTML (preserve order)
      try {
        const scripts = Array.from(content.querySelectorAll('script'));
        for (const old of scripts) {
          const s = document.createElement('script');
          // copy attributes
          for (let i = 0; i < old.attributes.length; i++) {
            const attr = old.attributes[i];
            s.setAttribute(attr.name, attr.value);
          }
          if (old.src) {
            // external script: load and await
            await new Promise((resolve, reject) => {
              s.onload = resolve;
              s.onerror = reject;
              // ensure relative URLs resolve correctly by using same base
              document.head.appendChild(s);
            }).catch(e => console.error('Failed to load script', old.src, e));
          } else {
            // inline script: set text and append (executes immediately)
            s.text = old.textContent;
            document.head.appendChild(s);
            // remove after execution to keep DOM clean
            document.head.removeChild(s);
          }
        }
      } catch (ex) {
        console.error('Error executing inline scripts', ex);
      }
    }).catch(err=>{
      content.removeAttribute('aria-busy');
      content.innerHTML = '<p style="color:#c00">Hiba a tartalom betöltésekor.</p>';
      console.error(err);
    });
    backdrop.classList.add('visible');
    card.classList.add('open');
    card.setAttribute('aria-hidden','false');
    currentOpen = key;
    // trap focus minimally
    close.focus();
  }

  function closeCard(){
    backdrop.classList.remove('visible');
    card.classList.remove('open');
    card.setAttribute('aria-hidden','true');
    currentOpen = null;
  }

  function renderContent(id){
    // simple placeholder content per panel; users can extend
    switch(id){
      case 'vehiclesBtn':
        return `<h3>Járművek</h3><p>Lista és állapotok itt jelennek meg.</p>`;
      case 'planBtn':
        return `<h3>Tervezés</h3><p>Útvonal- és céllista kezelése.</p>`;
      case 'settingsBtn':
        return `<h3>Beállítások</h3><p>Alapértelmezett preferenciák.</p>`;
      default:
        return `<p>Nincs tartalom.</p>`;
    }
  }

  async function fetchPartialFor(id){
    // map id -> controller endpoint
    const map = {
      vehiclesBtn: '/Home/VehiclesCard',
      planBtn: '/Home/PlanCard',
      settingsBtn: '/Home/SettingsCard'
    };
    const url = map[id];
    if(!url) return '<p>Nincs tartalom.</p>';
    const resp = await fetch(url, { headers: { 'X-Requested-With':'XMLHttpRequest' }});
    if(!resp.ok) throw new Error('fetch failed: '+resp.status);
    return await resp.text();
  }

  // click handlers
  ids.forEach(item=>{
    const el = document.getElementById(item.id);
    if(!el) return;
    el.addEventListener('click', function(ev){
      ev.preventDefault();
      // toggle if same
      if(currentOpen===item.id){
        closeCard();
      } else {
        openCard(item.id);
      }
    });
  });

  backdrop.addEventListener('click', closeCard);
  close.addEventListener('click', closeCard);

  // keyboard: Esc closes
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape' && currentOpen) closeCard();
  });

  // touch drag to dismiss (small swipe up to close)
  let startY = null;
  card.addEventListener('touchstart', (e)=>{ startY = e.touches[0].clientY; },{passive:true});
  card.addEventListener('touchmove', (e)=>{
    if(startY===null) return;
    const dy = e.touches[0].clientY - startY;
    if(dy < 0) return; // only allow pulling down (closing)
    card.style.transform = `translateX(-50%) translateY(${Math.min(dy, window.innerHeight)}px)`;
  },{passive:true});
  card.addEventListener('touchend', (e)=>{
    if(startY===null) return;
    const endY = e.changedTouches[0].clientY;
    const dy = endY - startY;
    card.style.transform = '';
    if(dy > 80) closeCard();
    startY = null;
  });

})();
