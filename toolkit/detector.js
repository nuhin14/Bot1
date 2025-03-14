const chokidar = "chokidar".import()
const chalk = "chalk".import()
const path = "path".import()
const fs = "fs".import()
      
const conf = fol[3] + 'config.json'
const db = fol[5]
let config = JSON.parse(fs.readFileSync(conf))
let keys = Object.keys(config)

let onreload = false;
Data.notify = Data.notify || { every: 60, h: 0, first: !1 }

export default 
async function detector({ Exp, store }) {
    const { func } = Exp
    const reloadData = async (files) => {
        try {
            for (const [key, filePath] of Object.entries(files)) {
                Data[key] = (await filePath.r()).default;
            }
            Data.initialize({ Exp, store })
            console.log(chalk.green(`Helpers reloaded successfully!`))
        } catch (error) {
            console.error(chalk.red('Error reloading helpers:', error))
        }
    }
    
    const setupWatcher = (path, delay, onChangeCallback, onUnlinkCallback) => {
        const watcher = chokidar.watch(path, { ignored: /(^|[\/\\])\../, persistent: true })

        watcher.on('change', async (filePath) => {
            if (onreload) return;
            onreload = true;

            console.log(chalk.yellow(`File changed: ${filePath}`))
            setTimeout(async () => {
                await onChangeCallback(filePath)
                onreload = false;
            }, delay)
        })

        if (onUnlinkCallback) {
            watcher.on('unlink', async (filePath) => {
                console.log(chalk.yellow(`File deleted: ${filePath}`))
                await onUnlinkCallback(filePath)
            })
        }
    };

    /*!-======[ Helpers Update detector ]======-!*/
    setupWatcher(fol[1] + '**/*.js', 1000, async (filePath) => {
        const files = {
            helper: `${fol[1]}client.js`,
            In: `${fol[1]}interactive.js`,
            utils: `${fol[1]}utils.js`,
            reaction: `${fol[1]}reaction.js`,
            EventEmitter: `${fol[1]}events.js`,
            stubTypeMsg: `${fol[1]}stubTypeMsg.js`,
            eventGame: `${fol[1]}eventGame.js`,
            initialize: `${fol[1]}initialize.js`,
        };
        await reloadData(files)
    })

    /*!-======[ Events Update Detector ]======-!*/
    setupWatcher(fol[7], 2000, async () => {
        try {
            await Data?.ev?.reloadEventHandlers()
            console.log(chalk.green('Event handlers reloaded successfully!'))
        } catch (error) {
            console.error(chalk.red('Error reloading event handlers:', error))
        }
    }, async (filePath) => {
        const fileName = path.basename(filePath)
        const eventKeys = Object.keys(Data.events)

        for (const key of eventKeys) {
            const { eventFile } = Data.events[key];
            if (eventFile.includes(fileName)) {
                delete Data.events[key];
                console.log(chalk.red(`[ EVENT DELETED ] => ${key}`))
            }
        }
    })
    
    /*!-======[ Locale Update detector ]======-!*/
    setupWatcher(fol[9] + locale + '/**/*.js', 500, async (filePath) => {
        await filePath.r()
        console.log(chalk.yellow(`Locale file reloaded: ${filePath}`))
    })
    
    /*!-======[ Toolkit Update detector ]======-!*/
    setupWatcher(fol[0] + '**/*.js', 1000, async (filePath) => {
        try {
            Exp.func = new (await `${fol[0]}func.js`.r()).func({ Exp, store })
            console.log(chalk.green('Toolkit reloaded successfully!'))
        } catch (error) {
            console.error(chalk.red('Error reloading toolkit:', error))
        }
    })
    
    /*!-======[ Auto Update ]======-!*/
    async function keyChecker(url,key){
        Data.notify.h++
        if(Data.notify.h == 1 && Exp.authState){
          let own = owner[0].split("@")[0]+from.sender
          let res = await fetch(`${api.xterm.url}/api/tools/key-checker?key=${api.xterm.key}`)
          if(!res.ok) return Exp.sendMessage(own, { text: `*[❗Notice ]*\n\`SERVER API ERROR\`\n Response status: ${res.status}` })
          let { status, data, msg } = await res.json()
          if(!status) {
           await Exp.sendMessage(own, { text: `*[❗Notice ]*\n\`API KEY STATUS IS FALSE\`

*Key*: ${api.xterm.key}
Msg: ${msg} ` })
  
          } else {
            let { limit, usage, totalHit, remaining, resetEvery, reset, expired, isExpired, features } = data
            let interval = resetEvery.hours > 0 ?  (String(new Date().getHours()) == String(Data.notify.reset)) : (String(new Date().getDate()) == String(Data.notify.reset))
            if(usage >= limit && (!Data.notify?.reset||interval)) {
              Data.notify.reset = resetEvery.hours > 0 ? reset.split(' ')[1]?.split(':')[0] : reset.split('/')[0] 
              await Exp.sendMessage(own, { text: `*[❗Notice ]*\n\`LIMIT GLOBAL HARIAN API KEY TELAH TERCAPAI\`

*Today:* ${usage}
*Total Hit*: ${totalHit}

*Reset*: ${reset}
` })
            } else if(isExpired){
              await Exp.sendMessage(own, { text: `*[❗Notice ]*\n\`API KEY EXPIRED\`

*Key*: ${api.xterm.key}
*Expired on*: ${expired}
` }) 
            } else { 
              let kfeatures = Object.keys(features)
              for(let i of kfeatures){
                let { ms, max, use, hit, lastReset } = features[i]
                if(use >= max && (!Data.notify?.[i]||Date.now() >= Data.notify[i])){
                  Data.notify[i] = lastReset ? parseInt(lastReset) + parseInt(ms) : Date.now() + parseInt(ms)
                  let msg = i.includes('elevenlabs') ? '> _Fitur text2speech *.elevenlabs* tidak dapat digunakan sebelum limit di reset!_'
                    :i.includes('filters') ? '> _Fitur *.filters* seperti *.toanime* dan *.toreal* tidak dapat digunakan sebelum limit di reset!_'
                    :i.includes('luma') ? '> _Fitur *.i2v* atau *.img2video* tidak dapat digunakan sebelum limit di reset!_'
                    :i.includes('logic-bell') ? '_Auto ai chat tidak akan merespon/tidak dapat digunakan sebelum limit di reset!_'
                    :i.includes('enlarger') ? '_Fitur *.enlarger* tidak dapat digunakan sebelum limit di reset!_'
                    :''
                  await Exp.sendMessage(own, { text: `*[❗Notice ]*\n\`LIMIT FEATURE API KEY TELAH TERCAPAI\`

*Feature*: \`${i.slice(1)}\`
*Now*: ${use}
*Max*: ${max}
*Reset*: ${func.dateFormatter(Data.notify[i], 'Asia/Jakarta')}

${msg}
` })
                  await sleep(3000+Math.floor(Math.random() * 2000))
                }
              }
            }
            
          }
        } else
        if(Data.notify.h >= Data.notify.every){
          Data.notify.h = 0
        }
        
    }

    setInterval(async () => {
      for (let i of keys) {
        config[i] = global[i];
      }

     const files = [
        { path: conf, data: config },
        { path: fol[6] + 'users.json', data: Data.users },
        { path: db + 'preferences.json', data: Data.preferences },
        { path: db + 'badwords.json', data: Data.badwords },
        { path: db + 'links.json', data: Data.links },
        { path: db + 'audio.json', data: Data.audio },
        { path: db + 'fquoted.json', data: Data.fquoted }
      ];

      try {
        for (const file of files) {
          await fs.writeFileSync(file.path, JSON.stringify(file.data, null, 2))
          await sleep(100)
        }

        await keyChecker()
      } catch (error) {
        console.error("Terjadi kesalahan dalam penulisan file atau keyChecker:", error.message);
      }
    }, 15000);

}
