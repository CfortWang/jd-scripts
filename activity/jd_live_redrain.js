/*
直播红包雨
每天0,9,11,13,15,17,19,20,21,23可领，每日上限未知
活动时间：2020-12-14 到 2020-12-31
更新地址：https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_live_redrain.js
已支持IOS双京东账号, Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, 小火箭，JSBox, Node.js
============Quantumultx===============
[task_local]
#直播红包雨
0 0,9,11,13,15,17,19,20,21,23 * * * https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_live_redrain.js, tag=直播红包雨, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jd_redPacket.png, enabled=true

================Loon==============
[Script]
cron "0 0,9,11,13,15,17,19,20,21,23 * * *" script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_live_redrain.js, tag=直播红包雨

===============Surge=================
直播红包雨 = type=cron,cronexp="0 0,9,11,13,15,17,19,20,21,23 * * *",wake-system=1,timeout=20,script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_live_redrain.js

============小火箭=========
直播红包雨 = type=cron,script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_live_redrain.js, cronexpr="0 0,9,11,13,15,17,19,20,21,23 * * *", timeout=200, enable=true
 */
const $ = new Env('直播红包雨');
let ids = {
  '0': 'RRA3S6TRRbnNNuGN43oHMA5okbcXmRY',
  '9': 'RRA3vyGH4MRwCJELDwV7p24mNAByiSk',
  '11': 'RRAnabmRSnpzSSZicXUhSFGBvFXs5c',
  '13': 'RRA4RhWMc159kA62qLbaEa88evE7owb',
  '15': 'RRA2CnovS9KVTTwBD9NV7o4kc3P8PTN',
  '17': 'RRA2nFXT2oSQM3KaYX9uhBC1hBijDey',
  '19': 'RRA3SQpuSAAJq1ckoPr4TXaxwbLG73k',
  '20': 'RRA2cHV3KXqvHAZGboTTryr8JMYZd5j',
  '21': 'RRA3SPs4XrDEXXwQjEFGrBLtMpjtkMV',
  '23': 'RRA3dFHoZXGThSnctvtAf69dmVyEDfm',
}
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = true;//是否关闭通知，false打开通知推送，true关闭通知推送
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', message;
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {
  };
  process.env.TZ = "Asia/Shanghai";
  Date.prototype.TimeZone = new Map([
    ['Asia/Shanghai',+8],
  ])
  Date.prototype.zoneDate = function(){
    if(process.env.TZ === undefined){
      return new Date();
    }else{
      for (let item of this.TimeZone.entries()) {
        if(item[0] === process.env.TZ){
          let d = new Date();
          d.setHours(d.getHours()+item[1]);
          return d;
        }
      }
      return new Date();
    }
  }
} else {
  let cookiesData = $.getdata('CookiesJD') || "[]";
  cookiesData = jsonParse(cookiesData);
  cookiesArr = cookiesData.map(item => item.cookie);
  cookiesArr.reverse();
  cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')]);
  cookiesArr.reverse();
  cookiesArr = cookiesArr.filter(item => item !== "" && item !== null && item !== undefined);
}
const JD_API_HOST = 'https://api.m.jd.com/api';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
    return;
  }
  $.log(`=====远程红包雨信息=====`)
  await getRedRain();
	if(!$.activityId) return
  let nowTs = new Date().getTime()
  if (!($.st <= nowTs && nowTs < $.ed)) {
    $.log(`远程红包雨配置获取错误，从本地读取配置`)
    $.log(`\n`)
    let hour = (new Date().getUTCHours() + 8) %24
    if (ids[hour]){
      $.activityId = ids[hour]
      $.log(`本地红包雨配置获取成功`)
    } else{
      $.log(`无法从本地读取配置，请检查运行时间`)
      return
    }
  } else{
    $.log(`远程红包雨配置获取成功`)
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      message = `【${new Date().getUTCHours()+8}点${$.name}】`
      await TotalBean();
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue
      }
      await receiveRedRain();
      await showMsg();
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done();
  })

async function showMsg() {
  if ($.isNode() && !jdNotify) {
    await notify.sendNotify(`【京东账号${$.index}】${$.nickName}`, message)
  }
  return new Promise(resolve => {
    $.msg($.name, '', `【京东账号${$.index}】${$.nickName}\n${message}`);
    resolve()
  })
}

function getRedRain() {
  return new Promise(resolve => {
    $.get({
      url: "http://ql4kk90rw.hb-bkt.clouddn.com/jd_live_redRain.json?" + Date.now(),
      }, (err, resp, data) => {
      try {
        if (err) {
          console.log(`1111${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            $.activityId = data.activityId
            $.st = data.startTime
            $.ed = data.endTime
            console.log(`下一场红包雨开始时间：${new Date(data.startTime)}`)
            console.log(`下一场红包雨结束时间：${new Date(data.endTime)}`)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function receiveRedRain() {
  return new Promise(resolve => {
    const body = {"actId": $.activityId};
    $.get(taskUrl('noahRedRainLottery', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.subCode === '0') {
              console.log(`领取成功，获得${JSON.stringify(data.lotteryResult)}`)
              // message+= `领取成功，获得${JSON.stringify(data.lotteryResult)}\n`
              message += `领取成功，获得 ${(data.lotteryResult.jPeasList[0].quantity)} 京豆\n`

            } else if (data.subCode === '8') {
              console.log(`领取失败，已领过`)
              message += `领取失败，已领过\n`;
            } else {
              console.log(`异常：${JSON.stringify(data)}`)
              message += `暂无红包雨\n`;
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function taskUrl(function_id, body = {}) {
  return {
    url: `${JD_API_HOST}?functionId=${function_id}&body=${escape(JSON.stringify(body))}&client=wh5&clientVersion=1.0.0&_=${new Date().getTime()}`,
    headers: {
      "Accept": "*/*",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "zh-cn",
      "Connection": "keep-alive",
      "Content-Type": "application/x-www-form-urlencoded",
      "Host": "api.m.jd.com",
      "Referer": "https://h5.m.jd.com/active/redrain/index.html",
      "Cookie": cookie,
      "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0"),
    }
  }
}

function TotalBean() {
  return new Promise(async resolve => {
    const options = {
      "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
      "headers": {
        "Accept": "application/json,text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Cookie": cookie,
        "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
        "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0")
      }
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['retcode'] === 13) {
              $.isLogin = false; //cookie过期
              return
            }
            $.nickName = data['base'].nickname;
          } else {
            console.log(`京东服务器返回空数据`)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function safeGet(data) {
  try {
    if (typeof JSON.parse(data) == "object") {
      return true;
    }
  } catch (e) {
    console.log(e);
    console.log(`京东服务器访问数据为空，请检查自身设备网络情况`);
    return false;
  }
}
function jsonParse(str) {
  if (typeof str == "string") {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
      return [];
    }
  }
}
// prettier-ignore