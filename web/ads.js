// Native policy owns counting, age/consent eligibility and monotonic cooldowns.
export function createAds({native=false,invoke,timeout=125000}={}){
  let tail=Promise.resolve(),busy=false;
  const fallback={mode:'disabled',age:'',familiesReady:false,privacyOptions:false};
  async function call(method,data={},limit=3000){
    if(!native||!invoke)return method==='getState'?fallback:{};
    let timer;
    try{const value=await Promise.race([invoke(method,data),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Ad bridge timeout')),limit);})]);const result=value&&typeof value==='object'?value:{};return method==='getState'?{...fallback,...result}:result;}
    catch{return method==='getState'?fallback:{};}
    finally{clearTimeout(timer);}
  }
  return {
    state:()=>call('getState'),
    age:age=>call('setAge',{age}),
    privacy:()=>call('privacyOptions',{},timeout),
    reset:()=>call('reset'),
    completeRound(roundId){tail=tail.then(()=>call('completeRound',{roundId}));return tail;},
    async betweenRounds(roundId){
      if(busy||!native)return false;
      busy=true;
      try{await tail;const boundary=await call('beginBoundary',{roundId});if(!boundary.boundaryToken)return false;const result=await call('showBetweenRounds',{roundId,boundaryToken:boundary.boundaryToken},timeout);return result.shown===true;}
      finally{busy=false;}
    }
  };
}
