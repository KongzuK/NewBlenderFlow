const ITEMS_PER_PAGE = 12;

let resourceData = {
  services: [],
  backgrounds: [],
  weapons: [],
  head: [],
  cloth: [],
  shoes: []
};

let filteredData = {
  weapons: [],
  head: [],
  cloth: [],
  shoes: []
};

let currentPage = {
  weapons: 1,
  head: 1,
  cloth: 1,
  shoes: 1
};

const state = {
  service: null,
  background: 'none',
  weapon: null,
  head: null,
  cloth: null,
  shoes: null,
  payment: '微信支付',
  notes: '',
  uploads: [],
};

let showcaseImages = [];

// DOM elements
const serviceCards = document.getElementById('serviceCards');
const backgroundCards = document.getElementById('backgroundCards');
const weaponCards = document.getElementById('weaponCards');
const headCards = document.getElementById('headCards');
const clothCards = document.getElementById('clothCards');
const shoeCards = document.getElementById('shoeCards');
const notesInput = document.getElementById('notesInput');
const imageUpload = document.getElementById('imageUpload');
const dropzone = document.getElementById('dropzone');
const imagePreview = document.getElementById('imagePreview');
const summaryService = document.getElementById('summaryService');
const summaryBackground = document.getElementById('summaryBackground');
const summaryWeapon = document.getElementById('summaryWeapon');
const summaryHead = document.getElementById('summaryHead');
const summaryCloth = document.getElementById('summaryCloth');
const summaryShoes = document.getElementById('summaryShoes');
const summaryTotal = document.getElementById('summaryTotal');
const generateButton = document.getElementById('generateButton');
const canvasPreviewWrapper = document.getElementById('canvasPreviewWrapper');
const downloadButton = document.getElementById('downloadButton');
const themeToggle = document.getElementById('themeToggle');
const carouselTrack = document.getElementById('carouselTrack');
const carouselPrev = document.getElementById('carouselPrev');
const carouselNext = document.getElementById('carouselNext');

// Search inputs
const weaponSearch = document.getElementById('weaponSearch');
const headSearch = document.getElementById('headSearch');
const clothSearch = document.getElementById('clothSearch');
const shoeSearch = document.getElementById('shoeSearch');

// Pagination containers
const weaponPagination = document.getElementById('weaponPagination');
const headPagination = document.getElementById('headPagination');
const clothPagination = document.getElementById('clothPagination');
const shoePagination = document.getElementById('shoePagination');

let carouselIndex = 0;
let carouselInterval = null;

// Load resources from JSON
async function loadResources() {
  try {
    const [services, backgrounds, weapons, head, cloth, shoes, showcase] = await Promise.all([
      fetch('data/services.json').then(r => r.json()),
      fetch('data/backgrounds.json').then(r => r.json()),
      fetch('data/weapons.json').then(r => r.json()),
      fetch('data/head.json').then(r => r.json()),
      fetch('data/cloth.json').then(r => r.json()),
      fetch('data/shoes.json').then(r => r.json()),
      fetch('data/showcase.json').then(r => r.json())
    ]);

    resourceData = { services, backgrounds, weapons, head, cloth, shoes };
    filteredData = { weapons, head, cloth, shoes };
    showcaseImages = showcase;
    
    renderServices();
    renderBackgrounds();
    renderWeapons();
    renderHead();
    renderCloth();
    renderShoes();
  } catch (error) {
    console.error('加载资源失败:', error);
  }
}

function createCard(item, category, showPrice = false) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'card-item';
  card.dataset.category = category;
  card.dataset.id = item.id;
  card.setAttribute('aria-pressed', 'false');

  card.innerHTML = `
    <div class="card-image" style="background-image: url('${item.image}')"></div>
    <div class="card-badge">✓</div>
    <div>
      <h4 class="card-title">${item.name}</h4>
      ${item.desc ? `<p class="card-copy">${item.desc}</p>` : ''}
    </div>
    <div class="card-price"><span>${showPrice && item.price ? '$' + item.price : ''}</span></div>
  `;

  card.addEventListener('click', () => {
    toggleSelection(category, item.id);
  });

  return card;
}

function toggleSelection(category, id) {
  if (state[category] === id) {
    state[category] = category === 'background' ? 'none' : null;
  } else {
    state[category] = id;
  }
  if (category === 'background' && state.background === null) {
    state.background = 'none';
  }
  refreshActiveStates();
  saveState();
  updateSummary();
}

function refreshActiveStates() {
  document.querySelectorAll('.card-item').forEach((card) => {
    const category = card.dataset.category;
    const id = card.dataset.id;
    const isActive = state[category] === id;
    card.classList.toggle('active', isActive);
    card.setAttribute('aria-pressed', String(isActive));
  });
}

function renderServices() {
  serviceCards.innerHTML = '';
  resourceData.services.forEach((service) => {
    serviceCards.appendChild(createCard(service, 'service', true));
  });
  refreshActiveStates();
}

function renderBackgrounds() {
  backgroundCards.innerHTML = '';
  resourceData.backgrounds.forEach((bg) => {
    backgroundCards.appendChild(createCard(bg, 'background', bg.price > 0));
  });
  refreshActiveStates();
}

function renderPaginatedCategory(category, container, paginationContainer) {
  const items = filteredData[category];
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const currentPageNum = currentPage[category];
  const start = (currentPageNum - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageItems = items.slice(start, end);

  container.innerHTML = '';
  pageItems.forEach((item) => {
    container.appendChild(createCard(item, category, false));
  });

  // Render pagination
  paginationContainer.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = i === currentPageNum ? 'active' : '';
    btn.addEventListener('click', () => {
      currentPage[category] = i;
      renderPaginatedCategory(category, container, paginationContainer);
    });
    paginationContainer.appendChild(btn);
  }

  refreshActiveStates();
}

function renderWeapons() {
  renderPaginatedCategory('weapons', weaponCards, weaponPagination);
}

function renderHead() {
  renderPaginatedCategory('head', headCards, headPagination);
}

function renderCloth() {
  renderPaginatedCategory('cloth', clothCards, clothPagination);
}

function renderShoes() {
  renderPaginatedCategory('shoes', shoeCards, shoePagination);
}

function filterCategory(category, searchText) {
  const allItems = resourceData[category];
  filteredData[category] = allItems.filter((item) => {
    const text = searchText.toLowerCase();
    return item.name.toLowerCase().includes(text) || item.id.toLowerCase().includes(text);
  });
  currentPage[category] = 1;
}

function getSelectedItem(category, id) {
  const list = resourceData[category];
  return list.find((item) => item.id === id) || null;
}

function updateSummary() {
  const service = getSelectedItem('services', state.service);
  const background = getSelectedItem('backgrounds', state.background);
  const weapon = getSelectedItem('weapons', state.weapon);
  const head = getSelectedItem('head', state.head);
  const cloth = getSelectedItem('cloth', state.cloth);
  const shoesItem = getSelectedItem('shoes', state.shoes);

  summaryService.textContent = service ? `${service.name} ($${service.price})` : '无';
  summaryBackground.textContent = background ? `${background.name}${background.price ? ` (+$${background.price})` : ''}` : '无';
  summaryWeapon.textContent = weapon ? `${weapon.name} (+$${weapon.price})` : '无';
  summaryHead.textContent = head ? head.name : '无';
  summaryCloth.textContent = cloth ? cloth.name : '无';
  summaryShoes.textContent = shoesItem ? shoesItem.name : '无';

  const total = calculateTotal();
  summaryTotal.textContent = `$${total}`;
}

function calculateTotal() {
  let total = 0;
  const service = getSelectedItem('services', state.service);
  const background = getSelectedItem('backgrounds', state.background);
  const weapon = getSelectedItem('weapons', state.weapon);
  if (service) total += service.price;
  if (background) total += background.price || 0;
  if (weapon) total += weapon.price || 0;
  return total;
}

function validateUploads(files) {
  const accepted = ['image/png', 'image/jpeg', 'image/webp'];
  const validFiles = [];
  for (const file of files) {
    if (validFiles.length >= 6) break;
    if (accepted.includes(file.type)) validFiles.push(file);
  }
  return validFiles;
}

function renderUploads() {
  imagePreview.innerHTML = '';
  state.uploads.forEach((upload, index) => {
    const item = document.createElement('div');
    item.className = 'thumbnail-item';
    item.innerHTML = `
      <img src="${upload.url}" alt="参考图 ${index + 1}" />
      <button type="button" aria-label="移除图片">×</button>
    `;
    item.querySelector('button').addEventListener('click', () => {
      state.uploads.splice(index, 1);
      renderUploads();
      saveState();
    });
    imagePreview.appendChild(item);
  });
}

function addFiles(files) {
  const valid = validateUploads(files);
  valid.forEach((file) => {
    if (state.uploads.length >= 6) return;
    const url = URL.createObjectURL(file);
    state.uploads.push({ file, url });
  });
  renderUploads();
  saveState();
}

function createShowcase() {
  carouselTrack.innerHTML = '';
  showcaseImages.forEach((src) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    slide.style.backgroundImage = `url('${src}')`;
    carouselTrack.appendChild(slide);
  });
  updateCarousel();
}

function updateCarousel() {
  const offset = carouselIndex * -100;
  carouselTrack.style.transform = `translateX(${offset}%)`;
}

function nextSlide() {
  carouselIndex = (carouselIndex + 1) % showcaseImages.length;
  updateCarousel();
}

function prevSlide() {
  carouselIndex = (carouselIndex - 1 + showcaseImages.length) % showcaseImages.length;
  updateCarousel();
}

function startCarousel() {
  carouselInterval = setInterval(nextSlide, 3800);
}

function stopCarousel() {
  if (carouselInterval) clearInterval(carouselInterval);
}

function updatePaymentMethod(event) {
  state.payment = event.target.value;
  saveState();
}

function saveState() {
  const saved = {
    service: state.service,
    background: state.background,
    weapon: state.weapon,
    head: state.head,
    cloth: state.cloth,
    shoes: state.shoes,
    payment: state.payment,
    notes: state.notes,
  };
  localStorage.setItem('splatoonCommissionState', JSON.stringify(saved));
  localStorage.setItem('splatoonCommissionTheme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

function loadState() {
  const saved = JSON.parse(localStorage.getItem('splatoonCommissionState') || '{}');
  if (saved.service) state.service = saved.service;
  if (saved.background) state.background = saved.background;
  if (saved.weapon) state.weapon = saved.weapon;
  if (saved.head) state.head = saved.head;
  if (saved.cloth) state.cloth = saved.cloth;
  if (saved.shoes) state.shoes = saved.shoes;
  if (saved.payment) state.payment = saved.payment;
  if (saved.notes) {
    state.notes = saved.notes;
    notesInput.value = saved.notes;
  }
  const theme = localStorage.getItem('splatoonCommissionTheme');
  if (theme === 'dark') document.body.classList.add('dark');
  themeToggle.textContent = document.body.classList.contains('dark') ? '浅色模式' : '深色模式';
}

function setTheme() {
  document.body.classList.toggle('dark');
  themeToggle.textContent = document.body.classList.contains('dark') ? '浅色模式' : '深色模式';
  saveState();
}

function generateCanvasImage() {
  const canvas = document.createElement('canvas');
  const width = 1200;
  const padding = 56;
  const lineHeight = 44;
  const headerHeight = 120;
  const rows = [];

  const service = getSelectedItem('services', state.service);
  const background = getSelectedItem('backgrounds', state.background);
  const weapon = getSelectedItem('weapons', state.weapon);
  const head = getSelectedItem('head', state.head);
  const cloth = getSelectedItem('cloth', state.cloth);
  const shoesItem = getSelectedItem('shoes', state.shoes);

  rows.push({ title: '委托类型', content: service ? `${service.name} ($${service.price})` : '无' });
  rows.push({ title: '背景', content: background ? `${background.name}${background.price ? ` (+$${background.price})` : ''}` : '无' });
  rows.push({ title: '武器', content: weapon ? `${weapon.name} (+$${weapon.price})` : '无' });
  rows.push({ title: '头饰', content: head ? head.name : '无' });
  rows.push({ title: '衣服', content: cloth ? cloth.name : '无' });
  rows.push({ title: '鞋子', content: shoesItem ? shoesItem.name : '无' });
  rows.push({ title: '支付方式', content: state.payment });

  const notesLines = state.notes ? state.notes.split('\n') : ['无额外说明'];
  const uploadCount = state.uploads.length;

  const contentHeight = rows.length * lineHeight + notesLines.length * lineHeight + 300 + Math.min(uploadCount, 6) * 140;
  const height = padding * 2 + headerHeight + contentHeight;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = document.body.classList.contains('dark') ? '#142a2e' : '#f7fcff';
  ctx.fillRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, '#00b8b8');
  gradient.addColorStop(1, '#ffc43d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, headerHeight);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 42px Inter';
  ctx.fillText('斯普拉顿 Blender 委托订单', padding, 72);
  ctx.font = '500 26px Inter';
  ctx.fillText('根据你的定制内容生成的订单摘要', padding, 112);

  ctx.fillStyle = document.body.classList.contains('dark') ? '#d9f7ff' : '#0b2b33';
  ctx.font = '700 32px Inter';
  ctx.fillText('订单详情', padding, headerHeight + 50);

  ctx.font = '500 24px Inter';
  let y = headerHeight + 100;

  rows.forEach((row) => {
    ctx.fillStyle = document.body.classList.contains('dark') ? '#a8e3ee' : '#1f363b';
    ctx.fillText(row.title, padding, y);
    ctx.fillStyle = document.body.classList.contains('dark') ? '#ffffff' : '#0a1e24';
    ctx.fillText(row.content, padding + 380, y);
    y += lineHeight;
  });

  ctx.fillStyle = '#ffeb9d';
  ctx.fillRect(padding, y + 18, width - padding * 2, 4);

  ctx.fillStyle = document.body.classList.contains('dark') ? '#d9f7ff' : '#0b2b33';
  ctx.font = '700 34px Inter';
  ctx.fillText('备注', padding, y + 76);
  ctx.font = '500 22px Inter';
  let noteLineY = y + 110;
  notesLines.forEach((line) => {
    ctx.fillText(line, padding, noteLineY);
    noteLineY += lineHeight;
  });

  ctx.fillStyle = document.body.classList.contains('dark') ? '#d9f7ff' : '#0b2b33';
  ctx.font = '700 38px Inter';
  ctx.fillText(`总价：$${calculateTotal()}`, padding, noteLineY + 60);

  if (uploadCount) {
    const thumbWidth = 200;
    const thumbHeight = 130;
    let x = padding;
    let thumbY = noteLineY + 110;
    ctx.font = '700 28px Inter';
    ctx.fillText('参考图片', padding, thumbY - 24);
    state.uploads.slice(0, 6).forEach((upload, index) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, x, thumbY, thumbWidth, thumbHeight);
        if (index === Math.min(uploadCount, 6) - 1) {
          finalizeCanvas(canvas);
        }
      };
      img.onerror = () => {
        ctx.fillStyle = '#0b2b33';
        ctx.fillRect(x, thumbY, thumbWidth, thumbHeight);
        ctx.fillStyle = '#fff';
        ctx.font = '700 18px Inter';
        ctx.fillText('图片加载失败', x + 10, thumbY + thumbHeight / 2);
        if (index === Math.min(uploadCount, 6) - 1) finalizeCanvas(canvas);
      };
      img.src = upload.url;
      x += thumbWidth + 20;
      if (x + thumbWidth > width - padding) {
        x = padding;
        thumbY += thumbHeight + 20;
      }
    });
    if (uploadCount === 0) finalizeCanvas(canvas);
  } else {
    finalizeCanvas(canvas);
  }
}

function finalizeCanvas(canvas) {
  const previewImage = new Image();
  previewImage.src = canvas.toDataURL('image/png');
  previewImage.alt = '订单摘要预览';

  canvasPreviewWrapper.innerHTML = '';
  canvasPreviewWrapper.appendChild(previewImage);
  downloadButton.href = previewImage.src;
  downloadButton.classList.remove('disabled');
}

function init() {
  loadState();
  loadResources().then(() => {
    updateSummary();
    refreshActiveStates();
    createShowcase();
    startCarousel();
  });
  renderUploads();

  notesInput.addEventListener('input', (event) => {
    state.notes = event.target.value;
    saveState();
  });

  imageUpload.addEventListener('change', (event) => {
    addFiles(Array.from(event.target.files));
    imageUpload.value = '';
  });

  dropzone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropzone.classList.add('drag-over');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('drag-over');
  });

  dropzone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropzone.classList.remove('drag-over');
    addFiles(Array.from(event.dataTransfer.files));
  });

  document.querySelectorAll('input[name="payment"]').forEach((input) => {
    input.checked = input.value === state.payment;
    input.addEventListener('change', updatePaymentMethod);
  });

  // Search listeners
  weaponSearch.addEventListener('input', (e) => {
    filterCategory('weapons', e.target.value);
    renderWeapons();
  });

  headSearch.addEventListener('input', (e) => {
    filterCategory('head', e.target.value);
    renderHead();
  });

  clothSearch.addEventListener('input', (e) => {
    filterCategory('cloth', e.target.value);
    renderCloth();
  });

  shoeSearch.addEventListener('input', (e) => {
    filterCategory('shoes', e.target.value);
    renderShoes();
  });

  generateButton.addEventListener('click', generateCanvasImage);
  themeToggle.addEventListener('click', setTheme);
  carouselNext.addEventListener('click', () => {
    stopCarousel();
    nextSlide();
    startCarousel();
  });
  carouselPrev.addEventListener('click', () => {
    stopCarousel();
    prevSlide();
    startCarousel();
  });
}

init();
