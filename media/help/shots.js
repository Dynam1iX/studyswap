const {mock,chromium}=require('/tmp/rec/mock.js');
(async()=>{
  const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:430,height:600},deviceScaleFactor:2}); await mock(ctx);
  const pg=await ctx.newPage(); await pg.goto('http://localhost:3123/'); await pg.waitForSelector('text=Matches for you'); await pg.waitForTimeout(1500);
  await pg.screenshot({path:'/tmp/rec/enc/step-1-find.png'});
  await pg.click('[aria-label^="Show details"] >> nth=1'); await pg.waitForTimeout(1200);
  await pg.screenshot({path:'/tmp/rec/enc/step-3-write.png'});
  await pg.goto('http://localhost:3123/create'); await pg.waitForSelector('select'); await pg.waitForTimeout(800);
  await pg.selectOption('select >> nth=0','5'); await pg.fill('textarea >> nth=0','Eigenvalues and RREF for the midterm'); await pg.selectOption('select >> nth=1','6'); await pg.fill('textarea >> nth=1','Java, OOP principles and labs');
  await pg.evaluate(()=>window.scrollTo(0,120)); await pg.waitForTimeout(900);
  await pg.screenshot({path:'/tmp/rec/enc/step-2-create.png'});
  await b.close();
})();
