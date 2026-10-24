// Records the "How to create a barter card" clip from the real app (mocked data, no real people).
const { chromium } = require('playwright');
const REF='bepchknwwdmvugpcypgt', uid='11111111-1111-1111-1111-111111111111', now=Math.floor(Date.now()/1000);
const b64=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt=`${b64({alg:'HS256'})}.${b64({sub:uid,exp:now+36000,role:'authenticated',aud:'authenticated'})}.x`;
const user={id:uid,aud:'authenticated',role:'authenticated',email:'000000@astanait.edu.kz',app_metadata:{},user_metadata:{}};
const session={access_token:jwt,refresh_token:'r',token_type:'bearer',expires_in:36000,expires_at:now+36000,user};
const S=[{id:1,code:'CALC1',name:'Calculus I',category:'Mathematics',department:'Mathematics'},{id:2,code:'ITP1',name:'Introduction to Programming 1',category:'CS & Dev',department:'Computer Science'},{id:3,code:'ENG-B1',name:'Foreign Language B1',category:'Languages',department:'Languages'},{id:4,code:'CULT',name:'Cultural Studies',category:'Humanities',department:'Humanities'},{id:5,code:'LA',name:'Linear Algebra',category:'Mathematics',department:'Mathematics'},{id:6,code:'OOP',name:'Object-Oriented Programming',category:'CS & Dev',department:'Computer Science'},{id:7,code:'HIST',name:'History of Kazakhstan',category:'Humanities',department:'Humanities'}];
const people=[['Demo Student A','Software Engineering',1],['Demo Student B','Cybersecurity',2],['Demo Student C','Big Data Analysis',1],['Demo Student D','Computer Science',3],['Demo Student E','Media Technologies',2],['Demo Student F','IT Management',1]];
const topics=[['Derivatives and limits','Basics of C++ and labs'],['Past perfect continuous','Seminar topics and essays'],['Eigenvalues','Essay structure, IELTS writing'],['Exam preparation','Java, patterns, labs'],['Graphs and proofs','Philosophy seminars'],['Dynamic programming','Grammar and speaking']];
const pairs=[[0,1],[2,3],[4,2],[6,5],[0,3],[5,2]];
let P=people.map((p,i)=>({id:'p'+i,description:topics[i][0],offered_description:topics[i][1],contact_method:'telegram',created_at:'2026-10-20T06:45:00Z',needed:S[pairs[i][0]],offered:S[pairs[i][1]],author:{id:'u'+i,full_name:p[0],major:p[1],study_year:p[2],avatar_path:null}}));
const me={id:uid,full_name:'Demo You',email:'000000@astanait.edu.kz',telegram_handle:'@demo_you',major:'Software Engineering',study_year:1,degree_level:'Undergraduate',avatar_path:null};
async function mock(ctx){
  await ctx.addInitScript(([k,v])=>{localStorage.setItem(k,v);localStorage.setItem('studyswap-language','en');},[`sb-${REF}-auth-token`,JSON.stringify(session)]);
  await ctx.route(/fonts\.(googleapis|gstatic)/, r=>r.abort());
  await ctx.route(`https://${REF}.supabase.co/**`, async r=>{
    const req=r.request(); const p=new URL(req.url()).pathname; let body=[]; const single=(req.headers()['accept']||'').includes('vnd.pgrst.object');
    if(p.startsWith('/auth/v1/user')) body=user;
    else if(p==='/rest/v1/users') body=single?{id:uid}:[{id:uid}];
    else if(p==='/rest/v1/barter_posts' && req.method()==='POST'){ const row=JSON.parse(req.postData())[0]; P=[{id:'new',description:row.description,offered_description:row.offered_description,contact_method:'telegram',created_at:new Date().toISOString(),needed:S.find(s=>s.id===row.needed_subject_id),offered:S.find(s=>s.id===row.offered_subject_id),author:{id:uid,full_name:me.full_name,major:me.major,study_year:1,avatar_path:null}},...P]; return r.fulfill({status:201,body:''}); }
    else if(p==='/rest/v1/barter_posts') body=P;
    else if(p==='/rest/v1/subjects') body=S;
    else if(p.endsWith('/get_post_contacts')) body=P.map(x=>({post_id:x.id,method:'telegram',contact:'@demo'}));
    else if(p.endsWith('/get_my_profile')) body=me;
    else if(p.endsWith('/get_favorites')) body=[{post_id:'p1'}];
    await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
}
// Fake cursor + click ripple + step caption, drawn into every page.
const OVERLAY=`(() => {
  const css=document.createElement('style'); css.textContent=\`
  #rc{position:fixed;left:0;top:0;width:28px;height:28px;z-index:2147483647;pointer-events:none;transition:transform .05s linear;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))}
  .rr{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid #AD46FF;z-index:2147483646;pointer-events:none;animation:rr .6s ease-out forwards}
  @keyframes rr{from{transform:scale(.3);opacity:1}to{transform:scale(1.4);opacity:0}}
  #cap{position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:2147483647;pointer-events:none;background:rgba(27,21,48,.88);color:#fff;font:700 22px/1.3 Montserrat,Arial,sans-serif;padding:12px 22px;border-radius:999px;box-shadow:0 10px 30px rgba(0,0,0,.25);transition:opacity .3s, transform .3s;white-space:nowrap}
  #cap b{background:linear-gradient(90deg,#AD46FF,#F6339A);padding:2px 10px;border-radius:999px;margin-right:10px}\`;
  const add=()=>{ if(document.getElementById('rc')) return; document.head.appendChild(css);
    const c=document.createElement('div'); c.id='rc'; c.innerHTML='<svg viewBox="0 0 24 24" width="28" height="28"><path d="M4 2l15 9-6.5 1.6L9.6 19z" fill="#1B1530" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>'; document.body.appendChild(c);
    const cap=document.createElement('div'); cap.id='cap'; cap.style.opacity='0'; document.body.appendChild(cap);
    const pos=JSON.parse(sessionStorage.getItem('rcpos')||'[640,360]'); c.style.transform='translate('+pos[0]+'px,'+pos[1]+'px)';
    const cs=sessionStorage.getItem('rccap'); if(cs){cap.innerHTML=cs;cap.style.opacity='1';}
  };
  window.__cursor=(x,y)=>{add();document.getElementById('rc').style.transform='translate('+x+'px,'+y+'px)';sessionStorage.setItem('rcpos',JSON.stringify([x,y]));};
  window.__ripple=(x,y)=>{const r=document.createElement('div');r.className='rr';r.style.left=x+'px';r.style.top=y+'px';document.body.appendChild(r);setTimeout(()=>r.remove(),700);};
  window.__cap=(h)=>{add();const c=document.getElementById('cap');if(!h){c.style.opacity='0';sessionStorage.removeItem('rccap');return;}c.innerHTML=h;c.style.opacity='1';sessionStorage.setItem('rccap',h);};
  if(document.readyState!=='loading') add(); else document.addEventListener('DOMContentLoaded',add);
})();`;
async function main(){
  const [,, out, lang='en'] = process.argv;
  const b=await chromium.launch(); const W=1000,H=563;
  const t0=Date.now();
  const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:1,recordVideo:{dir:out,size:{width:1000,height:563}}});
  await mock(ctx); await ctx.addInitScript(OVERLAY);
  const pg=await ctx.newPage(); let cur=[500,280];
  const move=async(x,y,ms=700)=>{const steps=Math.round(ms/16);const [x0,y0]=cur;for(let i=1;i<=steps;i++){const k=i/steps;const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;const px=x0+(x-x0)*e,py=y0+(y-y0)*e;await pg.evaluate(([a,b])=>window.__cursor(a,b),[px,py]);await pg.mouse.move(px,py);await pg.waitForTimeout(16);}cur=[x,y];};
  const center=async(sel)=>{const loc=pg.locator(sel).first(); const before=await loc.boundingBox(); if(before.y<0||before.y+before.height>563){await pg.evaluate(y=>window.scrollBy({top:y,behavior:'smooth'}),before.y-180); await pg.waitForTimeout(700);} const bb=await loc.boundingBox();return [bb.x+bb.width/2,bb.y+bb.height/2];};
  const click=async(sel,ms=700)=>{const [x,y]=await center(sel);await move(x,y,ms);await pg.evaluate(([a,b])=>window.__ripple(a,b),[x,y]);await pg.mouse.click(x,y);};
  const cap=(n,t)=>pg.evaluate(h=>window.__cap(h),n?`<b>${n}</b>${t}`:null);
  await pg.goto('http://localhost:3123/'); await pg.waitForSelector('text=Matches for you'); await pg.waitForTimeout(900); console.log('START', (Date.now()-t0)/1000);
  await pg.evaluate(([a,b])=>window.__cursor(a,b),cur);
  await cap('1','Press + to create your barter card'); await pg.waitForTimeout(900);
  await click('nav[data-hotbar] a[href="/create"]',1100); await pg.waitForTimeout(1300);
  await cap('2','Choose the subject you need help with');
  await click('select >> nth=0',900); await pg.selectOption('select >> nth=0','5'); await pg.waitForTimeout(700);
  await cap('3','Describe what exactly you need');
  await click('textarea >> nth=0',700); await pg.keyboard.type('Eigenvalues and RREF for the midterm',{delay:32}); await pg.waitForTimeout(400);
  await cap('4','Choose what you can teach in return');
  await click('select >> nth=1',800); await pg.selectOption('select >> nth=1','6'); await pg.waitForTimeout(500);
  await click('textarea >> nth=1',600); await pg.keyboard.type('Java, OOP principles and labs',{delay:32}); await pg.waitForTimeout(300);
  await cap('5','Check the preview and publish');
  await move(...(await center('text=Preview in feed')),900); await pg.waitForTimeout(900);
  await click('button:has-text("Publish Barter Offer")',900); await pg.waitForTimeout(2200);
  await cap('✓','Your card is in the Feed. Students write to you directly');
  await pg.waitForTimeout(2600);
  await ctx.close(); await b.close();
}
main();
