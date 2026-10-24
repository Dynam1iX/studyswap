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

module.exports={mock,chromium};
