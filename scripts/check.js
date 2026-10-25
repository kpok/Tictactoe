import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
async function check(directory){
  for(const item of await readdir(directory,{withFileTypes:true})){
    const filename=`${directory}/${item.name}`;
    if(item.isDirectory())await check(filename);
    else if(item.name.endsWith('.js')){
      const result=spawnSync(process.execPath,['--check',filename],{stdio:'inherit'});
      if(result.status!==0)process.exit(result.status||1);
    }
  }
}
for(const directory of ['web','server','scripts','test','e2e'])await check(directory);
const config=spawnSync(process.execPath,['--check','playwright.config.js'],{stdio:'inherit'});
if(config.status!==0)process.exit(config.status||1);
console.log('All JavaScript files passed syntax checks.');
