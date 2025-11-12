// app.js (간결한 CRUD 예제)
const API = 'https://jsonplaceholder.typicode.com/posts';
const postsEl = document.getElementById('posts');
const form = document.getElementById('postForm');
const titleInput = document.getElementById('title');
const bodyInput = document.getElementById('body');
const postIdInput = document.getElementById('postId');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const refreshBtn = document.getElementById('refreshBtn');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const listLoader = document.getElementById('listLoader');
const formLoader = document.getElementById('formLoader');

let page = 1;
const LIMIT = 10;
let loading = false;

function setLoading(el, on){
  if(on) el.classList.remove('hidden'); else el.classList.add('hidden');
}

function escapeHtml(s){ return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''; }

async function fetchPosts(){
  if(loading) return;
  loading = true; setLoading(listLoader, true);
  try{
    const res = await fetch(`${API}?_page=${page}&_limit=${LIMIT}`);
    if(!res.ok) throw new Error('목록 불러오기 실패');
    const data = await res.json();
    renderPosts(data);
    page++;
  }catch(err){
    console.error(err); alert('목록을 불러오는 중 오류가 발생했다');
  }finally{
    loading = false; setLoading(listLoader, false);
  }
}

function renderPosts(items){
  if(page === 1) postsEl.innerHTML = '';
  if(items.length === 0){
    postsEl.insertAdjacentHTML('beforeend', `<li class="item"><div class="meta muted">더 이상 게시물이 없습니다</div></li>`);
    loadMoreBtn.disabled = true;
    return;
  }
  for(const p of items){
    const li = document.createElement('li');
    li.className = 'item';
    li.innerHTML = `
      <div style="width:36px;height:36px;border-radius:6px;background:#eef8ff;display:flex;align-items:center;justify-content:center;color:var(--accent);font-weight:700">${p.id}</div>
      <div style="flex:1">
        <div class="meta">작성자: ${p.userId} · ID: ${p.id}</div>
        <div class="title">${escapeHtml(p.title)}</div>
        <div class="body" style="white-space:pre-wrap">${escapeHtml(p.body)}</div>
      </div>
      <div class="actions">
        <button data-id="${p.id}" class="editBtn muted">수정</button>
        <button data-id="${p.id}" class="delBtn" style="background:#fee2e2;color:#7f1d1d">삭제</button>
      </div>
    `;
    postsEl.appendChild(li);
  }
  // 이벤트 위임보다 간단히 버튼 바인딩
  document.querySelectorAll('.editBtn').forEach(b => b.onclick = onEdit);
  document.querySelectorAll('.delBtn').forEach(b => b.onclick = onDelete);
}

// 작성/수정
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = postIdInput.value;
  const payload = { title: titleInput.value.trim(), body: bodyInput.value.trim(), userId: 1 };
  if(!payload.title || !payload.body){ alert('제목과 내용을 입력하세요'); return; }

  try{
    setLoading(formLoader, true);
    submitBtn.disabled = true;
    if(id){ // 수정
      const res = await fetch(`${API}/${id}`, { method: 'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if(!res.ok) throw new Error('수정 실패');
      alert('수정 응답을 받았다 (테스트 API는 실제로 저장하지 않음)');
      // 간단하게 목록 다시 로드
      page = 1; postsEl.innerHTML = ''; await fetchPosts();
      resetForm();
    } else { // 생성
      const res = await fetch(API, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if(!res.ok) throw new Error('작성 실패');
      const data = await res.json();
      alert('작성 완료, 생성 ID: ' + data.id);
      page = 1; postsEl.innerHTML = ''; await fetchPosts();
      resetForm();
    }
  }catch(err){
    console.error(err); alert('요청 중 오류가 발생했다');
  }finally{
    setLoading(formLoader, false);
    submitBtn.disabled = false;
  }
});

function resetForm(){
  postIdInput.value = ''; titleInput.value = ''; bodyInput.value = '';
  submitBtn.textContent = '작성'; cancelBtn.classList.add('hidden');
}

async function onEdit(e){
  const id = e.currentTarget.dataset.id;
  try{
    setLoading(formLoader, true);
    const res = await fetch(`${API}/${id}`);
    if(!res.ok) throw new Error('불러오기 실패');
    const p = await res.json();
    postIdInput.value = p.id;
    titleInput.value = p.title;
    bodyInput.value = p.body;
    submitBtn.textContent = '수정';
    cancelBtn.classList.remove('hidden');
    window.scrollTo({top:0, behavior:'smooth'});
  }catch(err){
    console.error(err); alert('게시글을 불러오는 중 오류');
  }finally{
    setLoading(formLoader, false);
  }
}

async function onDelete(e){
  const id = e.currentTarget.dataset.id;
  if(!confirm('정말 삭제하시겠습니까?')) return;
  try{
    setLoading(listLoader, true);
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    if(!res.ok) throw new Error('삭제 실패');
    alert('삭제 요청 전송됨 (테스트 API는 실제 삭제를 수행하지 않음)');
    page = 1; postsEl.innerHTML = ''; await fetchPosts();
  }catch(err){
    console.error(err); alert('삭제 중 오류가 발생했다');
  }finally{
    setLoading(listLoader, false);
  }
}

cancelBtn.addEventListener('click', resetForm);
refreshBtn.addEventListener('click', () => { page = 1; postsEl.innerHTML = ''; fetchPosts(); });
loadMoreBtn.addEventListener('click', fetchPosts);

// 초기 로드
fetchPosts();
